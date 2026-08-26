// Native Zero-Latency Real-Time Signaling Bridge & WebSocket Client
// Connects to local/network WebSocket server for 100% FREE Unlimited Real-Time Delivery

type RealtimeListener = (event: { type: string; payload: any; targetUserId?: string }) => void;

class RealtimeBridgeManager {
  private channel: any = null;
  private socket: any = null;
  private listeners: Set<RealtimeListener> = new Set();
  private isConnected = false;
  private registeredUserId: string | null = null;

  constructor() {
    // 1. Local Browser BroadcastChannel (0ms intra-device sync)
    try {
      if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
        this.channel = new (window as any).BroadcastChannel('synking_realtime_network');
        this.channel.onmessage = (event: any) => {
          if (event.data) {
            this.notify(event.data);
          }
        };
      }
    } catch (e) {}

    // 2. Connect to Free Unlimited WebSocket Server
    this.connectWebSocket();
  }

  public registerUser(userId: string) {
    this.registeredUserId = userId;
    if (this.socket && this.socket.readyState === WebSocket.OPEN && userId) {
      try {
        this.socket.send(JSON.stringify({ type: 'REGISTER_SOCKET', userId }));
      } catch (e) {}
    }
  }

  private connectWebSocket() {
    try {
      // Connect to Live Production Render Cloud WebSocket
      const wsUrl = 'wss://synking-9my2.onrender.com';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[WEBSOCKET_CONNECTED] Live Cloud Realtime Signaling Engine Active');
        if (this.registeredUserId) {
          this.registerUser(this.registeredUserId);
        }
      };

      this.socket.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.notify(data);
          }
        } catch (e) {}
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        // Auto reconnect after 2 seconds
        setTimeout(() => this.connectWebSocket(), 2000);
      };

      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {}
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(data: { type: string; payload: any; targetUserId?: string }) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) {}
    });
  }

  // Instant 0ms broadcast across all devices via WebSocket & BroadcastChannel
  public broadcast(
    type:
      | 'NEW_MESSAGE'
      | 'INCOMING_CALL'
      | 'CALL_ACCEPTED'
      | 'CALL_REJECTED'
      | 'CALL_ENDED'
      | 'SYNK_REQUEST'
      | 'TYPING'
      | 'REQUEST_ACCEPTED'
      | 'WEBRTC_OFFER'
      | 'WEBRTC_ANSWER'
      | 'WEBRTC_ICE'
      | 'LIVE_VIDEO_FRAME'
      | 'LIVE_AUDIO_PULSE',
    payload: any,
    targetUserId?: string
  ) {
    const data = { type, payload, targetUserId };

    // 1. Notify local window
    this.notify(data);

    // 2. Broadcast to other browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }

    // 3. Broadcast or Send Directly to Targeted Device
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (e) {}
    }
  }
}

export const RealtimeBridge = new RealtimeBridgeManager();
