// Native WebRTC P2P & Media Engine for Synking
// Full RTCPeerConnection SDP Offer/Answer Exchange, ICE Candidate Relay & Live Hardware Streaming

import { CallSession, UserProfile } from '../types';
import { RealtimeBridge } from './realtimeBridge';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

type CallStateListener = (session: CallSession | null) => void;

class WebRTCManager {
  private currentSession: CallSession | null = null;
  private listeners: Set<CallStateListener> = new Set();
  private logListeners: Set<(msg: string) => void> = new Set();
  private durationTimer: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private peerConnection: any = null;
  private pendingOffer: any = null;
  private iceCandidateQueue: any[] = [];
  public iceStatus: string = 'disconnected';

  constructor() {
    // Listen for Real-Time Call Signaling from other device
    RealtimeBridge.subscribe(async ({ type, payload }) => {
      if (type === 'CALL_ACCEPTED' && payload) {
        if (this.currentSession && (this.currentSession.status === 'calling' || this.currentSession.status === 'ringing')) {
          this.currentSession.status = 'connected';
          this.log('📞 CALL_ACCEPTED received from peer. Initiating WebRTC SDP offer handshake...');
          this.notify();
          this.startTimer();

          // Create SDP Offer if I am caller
          if (this.currentSession.id.startsWith('call_')) {
            this.createAndSendOffer();
          }
        }
      } else if (type === 'WEBRTC_OFFER' && payload) {
        if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
          return;
        }
        this.log('⚡ WEBRTC_OFFER received from caller. Preparing SDP Answer...');
        this.pendingOffer = payload.offer;
        if (this.currentSession && this.currentSession.status === 'connected') {
          this.handleIncomingOffer(payload.offer);
        }
      } else if (type === 'WEBRTC_ANSWER' && payload) {
        if (this.peerConnection && this.peerConnection.signalingState === 'have-local-offer') {
          try {
            // @ts-ignore
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
            this.log('✅ WEBRTC_ANSWER applied. P2P Direct Tunnel established!');
            await this.drainIceCandidates();
          } catch (e) {
            this.log(`❌ WEBRTC_ANSWER error: ${e}`);
          }
        }
      } else if (type === 'WEBRTC_ICE' && payload) {
        if (payload.candidate) {
          if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            try {
              // @ts-ignore
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
              this.log('🌐 ICE Candidate added to active peer connection.');
            } catch (e) {}
          } else {
            this.iceCandidateQueue.push(payload.candidate);
          }
        }
      } else if (type === 'CALL_REJECTED' || type === 'CALL_ENDED') {
        if (this.currentSession) {
          this.log('🛑 Peer ended or rejected the call session.');
          this.cleanup();
        }
      }
    });
  }

  public onLog(listener: (msg: string) => void): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public log(msg: string) {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    console.log(`[WEBRTC_DEBUG] ${entry}`);
    this.logListeners.forEach(cb => {
      try { cb(entry); } catch (e) {}
    });
  }

  public subscribe(listener: CallStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentSession);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentSession ? { ...this.currentSession } : null));
  }

  // 1. Start Outgoing Audio or Video Call
  public async startCall(params: {
    callerUser: UserProfile;
    targetUser: UserProfile;
    type: 'audio' | 'video';
  }): Promise<CallSession> {
    this.cleanup();

    const newSession: CallSession = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      callerId: params.callerUser.id,
      receiverId: params.targetUser.id,
      callerName: params.targetUser.name,
      callerPhoto: params.targetUser.photo || params.targetUser.photos?.[0] || '',
      type: params.type,
      status: 'calling',
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      isVideoEnabled: params.type === 'video',
    };

    this.currentSession = newSession;
    this.log(`🚀 Starting outgoing ${params.type} call to ${params.targetUser.name}...`);
    this.notify();

    // Capture Local Hardware Microphone & Camera
    await this.initLocalStream(params.type === 'video');

    // Broadcast INCOMING_CALL to recipient device
    RealtimeBridge.broadcast('INCOMING_CALL', {
      callId: newSession.id,
      callerUser: params.callerUser,
      receiverId: params.targetUser.id,
      type: params.type,
    });

    return newSession;
  }

  // 2. Receive Incoming Call
  public receiveIncomingCall(callerUser: UserProfile, type: 'audio' | 'video' = 'audio', callId?: string): CallSession {
    this.cleanup();

    const incomingSession: CallSession = {
      id: callId || `incoming_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      callerId: callerUser.id,
      receiverId: 'my_user_id',
      callerName: callerUser.name,
      callerPhoto: callerUser.photo || callerUser.photos?.[0] || '',
      type,
      status: 'ringing',
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      isVideoEnabled: type === 'video',
    };

    this.currentSession = incomingSession;
    this.log(`📲 Incoming ${type} call ringing from ${callerUser.name}...`);
    this.notify();
    return incomingSession;
  }

  // 3. Accept Incoming Call
  public async acceptCall() {
    if (!this.currentSession) return;
    this.cleanupTimers();

    this.log('📞 Answering call: Capturing local audio/video media stream...');
    await this.initLocalStream(this.currentSession.type === 'video');

    this.currentSession.status = 'connected';
    this.notify();
    this.startTimer();

    RealtimeBridge.broadcast('CALL_ACCEPTED', {
      callId: this.currentSession.id,
    });

    if (this.pendingOffer) {
      await this.handleIncomingOffer(this.pendingOffer);
    }
  }

  // 4. Reject Incoming Call
  public rejectCall() {
    const callId = this.currentSession?.id;
    this.log('❌ Rejecting incoming call.');
    this.cleanup();
    RealtimeBridge.broadcast('CALL_REJECTED', { callId });
  }

  // 5. End Ongoing Call
  public endCall(): { session: CallSession; durationFormatted: string } | null {
    if (!this.currentSession) return null;
    const sessionCopy = { ...this.currentSession };
    const durationFormatted = this.formatDuration(sessionCopy.durationSeconds);
    const callId = sessionCopy.id;
    this.log(`🛑 Ending ongoing call (${durationFormatted}).`);
    this.cleanup();
    RealtimeBridge.broadcast('CALL_ENDED', { callId });
    return { session: sessionCopy, durationFormatted };
  }

  private async initLocalStream(includeVideo: boolean) {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: includeVideo ? true : false,
        });
        this.log(`🟢 Hardware stream captured: Audio (${this.localStream.getAudioTracks().length}), Video (${this.localStream.getVideoTracks().length})`);
        return;
      }
    } catch (err) {
      this.log(`⚠️ Hardware stream error (${err}). Initializing synthetic video/voice channel.`);
    }

    // Universal Web Audio & Canvas Stream Fallback
    try {
      if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        let audioTrack: any = null;
        let videoTrack: any = null;

        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const dest = ctx.createMediaStreamDestination();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          audioTrack = dest.stream.getAudioTracks()[0];
        }

        if (includeVideo && typeof document !== 'undefined') {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            let hue = 0;
            const draw = () => {
              hue = (hue + 2) % 360;
              ctx.fillStyle = `hsl(${hue}, 80%, 20%)`;
              ctx.fillRect(0, 0, 480, 480);
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('SYNKING Live Stream 📹', 240, 220);
              ctx.font = '16px sans-serif';
              ctx.fillStyle = '#00E5FF';
              ctx.fillText(new Date().toLocaleTimeString(), 240, 260);
              requestAnimationFrame(draw);
            };
            draw();
            // @ts-ignore
            if (canvas.captureStream) {
              // @ts-ignore
              const vStream = canvas.captureStream(30);
              videoTrack = vStream.getVideoTracks()[0];
            }
          }
        }

        // @ts-ignore
        if (typeof MediaStream !== 'undefined') {
          // @ts-ignore
          const fallbackStream = new MediaStream();
          if (audioTrack) fallbackStream.addTrack(audioTrack);
          if (videoTrack) fallbackStream.addTrack(videoTrack);
          this.localStream = fallbackStream;
          this.log('🟢 Synthetic audio/video streaming tracks generated and active.');
        }
      }
    } catch (e) {
      this.log(`❌ Stream fallback error: ${e}`);
    }
  }

  private setupPeerConnection() {
    try {
      // @ts-ignore
      if (typeof RTCPeerConnection === 'undefined') return;

      // @ts-ignore
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      this.iceStatus = 'connecting';
      this.log('🌐 RTCPeerConnection initialized with Google STUN servers.');

      // Attach Local Media Tracks to PeerConnection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track: any) => {
          this.peerConnection.addTrack(track, this.localStream);
        });
        this.log(`📤 Attached ${this.localStream.getTracks().length} local media tracks to PeerConnection.`);
      }

      // Handle Remote Incoming Media Stream (Audio/Video from Partner)
      this.peerConnection.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.log(`📥 REMOTE STREAM ARRIVED! Tracks: ${this.remoteStream.getTracks().length}`);
          this.notify();
        }
      };

      // ICE Candidates Relay
      this.peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          RealtimeBridge.broadcast('WEBRTC_ICE', { candidate: event.candidate });
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection) {
          this.iceStatus = this.peerConnection.iceConnectionState;
          this.log(`🌐 ICE STATE: ${this.iceStatus}`);
          this.notify();
        }
      };
    } catch (e) {
      this.log(`❌ setupPeerConnection error: ${e}`);
    }
  }

  private async createAndSendOffer() {
    this.setupPeerConnection();
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      RealtimeBridge.broadcast('WEBRTC_OFFER', { offer });
      this.log('📤 SDP Offer created & broadcasted to peer.');
    } catch (e) {
      this.log(`❌ createOffer error: ${e}`);
    }
  }

  private async handleIncomingOffer(offer: any) {
    this.setupPeerConnection();
    if (!this.peerConnection) return;

    try {
      // @ts-ignore
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      this.log('📥 Remote SDP Offer set. Creating SDP Answer...');
      await this.drainIceCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      RealtimeBridge.broadcast('WEBRTC_ANSWER', { answer });
      this.log('📤 SDP Answer sent back to caller.');
    } catch (e) {
      this.log(`❌ handleIncomingOffer error: ${e}`);
    }
  }

  private async drainIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        // @ts-ignore
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        this.log('🌐 Queued ICE Candidate flushed & added to PeerConnection.');
      } catch (e) {}
    }
  }

  public getSession(): CallSession | null {
    return this.currentSession;
  }

  public getLocalStream(): any {
    return this.localStream;
  }

  public getRemoteStream(): any {
    return this.remoteStream;
  }

  public toggleMute(): boolean {
    if (!this.currentSession) return false;
    this.currentSession.isMuted = !this.currentSession.isMuted;
    const isMuted = this.currentSession.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !isMuted;
      });
    }
    this.log(isMuted ? '🔇 MUTE ON: Mic track disabled (audio muted to peer)' : '🎙️ MUTE OFF: Mic track enabled (voice transmitting live)');
    this.notify();
    return this.currentSession.isMuted;
  }

  public toggleVideo(): boolean {
    if (!this.currentSession) return false;
    this.currentSession.isVideoEnabled = !this.currentSession.isVideoEnabled;
    const isVideo = this.currentSession.isVideoEnabled;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = isVideo;
      });
    }
    this.log(isVideo ? '📹 CAMERA ON: Video track enabled (stream visible)' : '📷 CAMERA OFF: Video track disabled (avatar shown)');
    this.notify();
    return this.currentSession.isVideoEnabled;
  }

  public toggleSpeaker(): boolean {
    if (!this.currentSession) return false;
    this.currentSession.isSpeakerOn = !this.currentSession.isSpeakerOn;
    const isSpeaker = this.currentSession.isSpeakerOn;
    this.log(isSpeaker ? '🔊 SPEAKER ON: Audio routed to main loudspeaker' : '🔈 EARPIECE: Audio routed to internal earpiece');
    this.notify();
    return this.currentSession.isSpeakerOn;
  }

  public formatDuration(sec: number): string {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }

  private startTimer() {
    this.cleanupTimers();
    this.durationTimer = setInterval(() => {
      if (this.currentSession && this.currentSession.status === 'connected') {
        this.currentSession.durationSeconds += 1;
        this.notify();
      }
    }, 1000);
  }

  private cleanupTimers() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  private cleanup() {
    this.cleanupTimers();
    this.iceStatus = 'disconnected';
    this.pendingOffer = null;
    this.iceCandidateQueue = [];

    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach((track: any) => track.stop());
      } catch (e) {}
      this.localStream = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.currentSession = null;
    this.notify();
  }
}

export const WebRTCService = new WebRTCManager();
