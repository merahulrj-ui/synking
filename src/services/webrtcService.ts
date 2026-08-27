// Native WebRTC & Targeted Real-Time Streaming Engine for Synking
// STUN + OpenRelay TURN Pool • 1-on-1 Targeted Signaling • Real Hardware Camera Capture

import { CallSession, UserProfile } from '../types';
import { RealtimeBridge } from './realtimeBridge';
import { MediaDevices, PeerConnection, SessionDescription, IceCandidate } from './webrtcCore';
import { Platform, PermissionsAndroid } from 'react-native';

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    }
  ],
  iceCandidatePoolSize: 10,
};

type CallStateListener = (session: CallSession | null) => void;
type FrameListener = (frame: string | null) => void;

class WebRTCManager {
  private currentSession: CallSession | null = null;
  private listeners: Set<CallStateListener> = new Set();
  private logListeners: Set<(msg: string) => void> = new Set();
  private frameListeners: Set<FrameListener> = new Set();
  private durationTimer: any = null;
  private localStream: any = null;
  private remoteStream: any = null;
  private remoteVideoFrame: string | null = null;
  private peerConnection: any = null;
  private pendingOffer: any = null;
  private iceCandidateQueue: any[] = [];
  public localVideoElementRef: any = null;
  public iceStatus: string = 'disconnected';

  constructor() {
    // Listen for Targeted Real-Time Call Signaling from peer
    RealtimeBridge.subscribe(async ({ type, payload, targetUserId }) => {
      // We rely on the WebSocket server and AppContext to route messages correctly.
      // If a WebRTC signaling message reaches here with a targetUserId, it was meant for us.

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
        this.log('⚡ WEBRTC_OFFER received from peer. Generating SDP Answer...');
        this.pendingOffer = payload.offer;
        if (this.currentSession && this.currentSession.status === 'connected') {
          this.handleIncomingOffer(payload.offer);
        }
      } else if (type === 'WEBRTC_ANSWER' && payload) {
        if (this.peerConnection) {
          if (this.peerConnection.signalingState === 'have-local-offer') {
            try {
              await this.peerConnection.setRemoteDescription(new SessionDescription(payload.answer));
              this.log('✅ WEBRTC_ANSWER applied. P2P Direct Relay Established via STUN/TURN!');
              await this.drainIceCandidates();
            } catch (e) {
              this.log(`❌ WEBRTC_ANSWER error: ${e}`);
            }
          } else {
            this.log(`⚠️ Dropped WEBRTC_ANSWER. State was: ${this.peerConnection.signalingState}`);
          }
        } else {
          this.log(`⚠️ Dropped WEBRTC_ANSWER. peerConnection is null.`);
        }
      } else if (type === 'WEBRTC_ICE' && payload) {
        if (payload.candidate) {
          this.log(`📥 Received ICE candidate from peer: ${payload.candidate.candidate}`);
          if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            try {
              await this.peerConnection.addIceCandidate(new IceCandidate(payload.candidate));
              this.log('🌐 ICE Candidate added to active connection.');
            } catch (e) {}
          } else {
            this.log('⏳ Queuing ICE candidate (remoteDescription not set yet).');
            this.iceCandidateQueue.push(payload.candidate);
          }
        }
      } else if (type === 'LIVE_VIDEO_FRAME' && payload) {
        if (this.currentSession && payload.callId === this.currentSession.id && payload.frame) {
          this.remoteVideoFrame = payload.frame;
          this.frameListeners.forEach(cb => {
            try { cb(payload.frame); } catch (e) {}
          });
        }
      } else if (type === 'CALL_REJECTED' || type === 'CALL_ENDED') {
        if (this.currentSession) {
          this.log('🛑 Peer ended or rejected the call session.');
          this.cleanup();
        }
      }
    });
  }

  private getPeerUserId(): string {
    if (!this.currentSession) return '';
    // If I am the receiver (incoming call), the peer is the caller.
    // We can identify if I am the receiver by checking if receiverId is the placeholder 'my_user_id' 
    // or if the session is an incoming session (ringing).
    if (this.currentSession.receiverId === 'my_user_id' || this.currentSession.status === 'ringing') {
      return this.currentSession.callerId;
    }
    // If I am the caller, the peer is the receiver.
    return this.currentSession.receiverId;
  }

  public onLog(listener: (msg: string) => void): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public onRemoteFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    listener(this.remoteVideoFrame);
    return () => this.frameListeners.delete(listener);
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

    // Send Targeted INCOMING_CALL to recipient device
    RealtimeBridge.broadcast(
      'INCOMING_CALL',
      {
        callId: newSession.id,
        callerUser: params.callerUser,
        receiverId: params.targetUser.id,
        type: params.type,
      },
      params.targetUser.id
    );

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

    const peerId = this.getPeerUserId();
    RealtimeBridge.broadcast(
      'CALL_ACCEPTED',
      {
        callId: this.currentSession.id,
      },
      peerId
    );

    if (this.pendingOffer) {
      await this.handleIncomingOffer(this.pendingOffer);
    }
  }

  // 4. Reject Incoming Call
  public rejectCall() {
    const callId = this.currentSession?.id;
    const peerId = this.getPeerUserId();
    this.log('❌ Rejecting incoming call.');
    this.cleanup();
    RealtimeBridge.broadcast('CALL_REJECTED', { callId }, peerId);
  }

  // 5. End Ongoing Call
  public endCall(): { session: CallSession; durationFormatted: string } | null {
    if (!this.currentSession) return null;
    const sessionCopy = { ...this.currentSession };
    const durationFormatted = this.formatDuration(sessionCopy.durationSeconds);
    const callId = sessionCopy.id;
    const peerId = this.getPeerUserId();
    this.log(`🛑 Ending ongoing call (${durationFormatted}).`);
    this.cleanup();
    RealtimeBridge.broadcast('CALL_ENDED', { callId }, peerId);
    return { session: sessionCopy, durationFormatted };
  }

  private async initLocalStream(includeVideo: boolean) {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          this.log('❌ Camera or Microphone permission denied by user.');
          return;
        }
      }

      if (MediaDevices && MediaDevices.getUserMedia) {
        // HACK: Always request video! If we don't request video, mobile Chrome/Safari routes audio to the EARPIECE and sometimes uses the wrong muted mic!
        this.localStream = await MediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: includeVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
        });

        const audioTracks = this.localStream?.getAudioTracks?.() || [];
        this.log(`🎙️ AUDIO TRACK COUNT: ${audioTracks.length}`);
        audioTracks.forEach((track: any) => {
          this.log(`🎙️ AUDIO TRACK: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}, kind=${track.kind}`);
        });

        this.log(`🟢 Hardware stream captured: Audio (${this.localStream.getAudioTracks().length}), Video (${this.localStream.getVideoTracks().length})`);
        return;
      }
    } catch (err) {
      this.log(`⚠️ Hardware stream capture error: ${err}`);
    }
  }

  private setupPeerConnection() {
    try {
      if (!PeerConnection) {
        this.log('❌ WebRTC PeerConnection API not available.');
        return;
      }

      this.peerConnection = new PeerConnection(ICE_SERVERS);
      this.iceStatus = 'connecting';
      this.log('🌐 RTCPeerConnection initialized with Google STUN + OpenRelay TURN.');

      // Attach Local Media Tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track: any) => {
          this.peerConnection.addTrack(track, this.localStream);
          if (track.kind === 'audio') {
            this.log(`📤 AUDIO SENT: enabled=${track.enabled}, readyState=${track.readyState}`);
          }
        });
        this.log(`📤 Attached ${this.localStream.getTracks().length} local media tracks to PeerConnection.`);
      }

        // Handle Remote Incoming Media Stream (Audio/Video from Peer)
        this.peerConnection.ontrack = (event: any) => {
          const track = event.track;
          this.log(`📥 REMOTE TRACK: kind=${track?.kind}, enabled=${track?.enabled}, muted=${track?.muted}, readyState=${track?.readyState}, audioTracks=${event.streams?.[0]?.getAudioTracks()?.length || 0}`);
          
          if (track) {
            track.onunmute = () => this.log(`🔊 REMOTE TRACK UNMUTED! RTP Packets are arriving for ${track.kind}!`);
            track.onmute = () => this.log(`🔇 REMOTE TRACK MUTED! RTP Packets stopped for ${track.kind}!`);
          }

          let stream = event.streams && event.streams[0];
          
          if (!stream) {
            this.log(`⚠️ event.streams is empty! Manually binding track to remote stream.`);
            if (!this.remoteStream) {
              // @ts-ignore - Handle web vs native MediaStream
              this.remoteStream = typeof MediaStream !== 'undefined' ? new MediaStream() : null;
            }
            if (this.remoteStream && event.track) {
              // @ts-ignore
              this.remoteStream.addTrack(event.track);
            }
          } else {
            this.remoteStream = stream;
          }

          if (this.remoteStream) {
            this.log(`🎥 REMOTE STREAM READY! Audio: ${this.remoteStream.getAudioTracks().length}, Video: ${this.remoteStream.getVideoTracks().length}`);
            this.notify();
          }
        };

        // Fallback for older react-native-webrtc or specific web polyfills
        // @ts-ignore
        this.peerConnection.onaddstream = (event: any) => {
          this.log(`📡 onaddstream fired!`);
          if (event.stream) {
            this.remoteStream = event.stream;
            this.log(`🎥 REMOTE STREAM READY (Legacy)! Audio: ${this.remoteStream.getAudioTracks().length}, Video: ${this.remoteStream.getVideoTracks().length}`);
            this.notify();
          }
        };

      // ICE Candidate Relay (Strictly targeted to peer)
      const peerId = this.getPeerUserId();
        
      this.peerConnection.onicegatheringstatechange = () => {
        this.log(`🧊 ICE gathering: ${this.peerConnection.iceGatheringState}`);
      };

      this.peerConnection.onconnectionstatechange = () => {
        this.log(`🔌 Connection state: ${this.peerConnection.connectionState}`);
      };

      this.peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          this.log(`🧊 ICE candidate generated: ${event.candidate.candidate}`);
          RealtimeBridge.broadcast('WEBRTC_ICE', { candidate: event.candidate, callId: this.currentSession?.id }, peerId);
        } else {
          this.log(`🧊 ICE candidate gathering complete.`);
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection) {
          this.iceStatus = this.peerConnection.iceConnectionState;
          this.log(`🌐 ICE RELAY STATE: ${this.iceStatus}`);
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
      const peerId = this.getPeerUserId();
      RealtimeBridge.broadcast('WEBRTC_OFFER', { offer, callId: this.currentSession?.id }, peerId);
      this.log(`📤 Targeted SDP Offer sent strictly to peer (${peerId}).`);
    } catch (e) {
      this.log(`❌ createOffer error: ${e}`);
    }
  }

  private async handleIncomingOffer(offer: any) {
    this.setupPeerConnection();
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new SessionDescription(offer));
      this.log('📥 Remote SDP Offer set. Creating Targeted SDP Answer...');
      await this.drainIceCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      const peerId = this.getPeerUserId();
      RealtimeBridge.broadcast('WEBRTC_ANSWER', { answer, callId: this.currentSession?.id }, peerId);
      this.log(`📤 Targeted SDP Answer sent back strictly to caller (${peerId}).`);
    } catch (e) {
      this.log(`❌ handleIncomingOffer error: ${e}`);
    }
  }

  private async drainIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(new IceCandidate(candidate));
        this.log('🌐 Queued ICE Candidate flushed to PeerConnection.');
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

  public getRemoteVideoFrame(): string | null {
    return this.remoteVideoFrame;
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
    this.log(isMuted ? '🔇 MUTE ON: Mic track disabled' : '🎙️ MUTE OFF: Mic track active');
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
    this.log(isVideo ? '📹 CAMERA ON: Video track enabled' : '📷 CAMERA OFF: Video track disabled');
    this.notify();
    return this.currentSession.isVideoEnabled;
  }

  public async toggleSpeaker(): Promise<boolean> {
    if (!this.currentSession) return false;
    this.currentSession.isSpeakerOn = !this.currentSession.isSpeakerOn;
    const isSpeaker = this.currentSession.isSpeakerOn;
    
    // Note: react-native-webrtc routes audio directly on Android. We removed expo-av due to JSI crashes.
    // In a real app we'd use react-native-incall-manager or equivalent native module built for RN 0.86.

    this.log(isSpeaker ? '🔊 SPEAKER ON: Loudspeaker active' : '🔈 EARPIECE: Internal receiver active');
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
    this.remoteVideoFrame = null;

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
