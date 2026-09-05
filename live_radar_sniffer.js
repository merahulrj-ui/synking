const WebSocket = require('ws');

const wsUrl = 'ws://3.108.217.155:8082';

function connect() {
    console.log('>>> [DUAL-RADAR] Connecting to Cloud Signaling Relay: ' + wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('>>> [DUAL-RADAR] CLOUD RELAY CONNECTED! Listening to all live call signaling packets...');
        ws.send(JSON.stringify({ type: 'REGISTER_USER', userId: 'live_radar_inspector' }));
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            const ts = new Date().toLocaleTimeString();
            console.log(`[${ts}] 📡 SIGNAL: ${msg.type} | from: ${msg.senderId || 'unknown'} -> to: ${msg.targetUserId || 'ALL'} | callId: ${msg.payload?.callId || 'N/A'}`);
        } catch(e) {
            console.log('[RADAR_RAW]: ' + data.toString().substring(0, 100));
        }
    });

    ws.on('error', (err) => {
        console.log('>>> [DUAL-RADAR] WebSocket error: ' + err.message);
    });

    ws.on('close', () => {
        console.log('>>> [DUAL-RADAR] WebSocket closed. Reconnecting in 2s...');
        setTimeout(connect, 2000);
    });
}

connect();
setInterval(() => {}, 1000);
