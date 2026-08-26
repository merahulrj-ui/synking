// Native Zero-Latency Real-Time Signaling Bridge & WebSocket Client
// Connects to local/network WebSocket server for 100% FREE Unlimited Real-Time Delivery

type RealtimeListener = (event: { type: string; payload: any }) => void;

class RealtimeBridgeManager {
  private channel: any = null;
  private socket: any = null;
  private listeners: Set<RealtimeListener> = new Set();
  private isConnected = false;

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

    // 2. Connect to Free Unlimited WebSocket Server on Port 8082
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      let host = '127.0.0.1';
      if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        host = window.location.hostname;
      }

      const wsUrl = `ws://${host}:8082`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[WEBSOCKET_CONNECTED] 100% Free Unlimited Realtime Engine Active');
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

  private notify(data: { type: string; payload: any }) {
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
      | 'WEBRTC_ICE',
    payload: any
  ) {
    const data = { type, payload };

    // 1. Notify local window
    this.notify(data);

    // 2. Broadcast to other browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }

    // 3. Broadcast to other devices (Phone ⇋ Laptop) via Free WebSocket Server
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (e) {}
    }
  }
}

export const RealtimeBridge = new RealtimeBridgeManager();
