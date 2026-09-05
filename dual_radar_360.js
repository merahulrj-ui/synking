const WebSocket = require('ws');
const { spawn } = require('child_process');

console.log("===============================================================================");
console.log("🛰️ [360° DUAL RADAR ACTIVE] Monitoring Phone (Realme) + Laptop Web + Cloud Relay");
console.log("===============================================================================");

// 1. CLOUD SIGNALING RADAR (Laptop WebRTC Relay)
const wsUrl = 'ws://3.108.217.155:8082';
function connectWS() {
    try {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
            console.log(`[${new Date().toLocaleTimeString()}] 🌐 CLOUD WEBRTC RELAY: Connected (${wsUrl})`);
            ws.send(JSON.stringify({ type: 'REGISTER_USER', userId: 'dual_radar_360_inspector' }));
        });
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                const ts = new Date().toLocaleTimeString();
                console.log(`[${ts}] 📡 [LAPTOP/CLOUD SIGNAL] Type: ${msg.type} | Sender: ${msg.senderId || 'N/A'} ➔ Target: ${msg.targetUserId || 'ALL'} | CallId: ${msg.payload?.callId || msg.callId || 'N/A'}`);
            } catch(e) {}
        });
        ws.on('error', (err) => {
            console.log(`[${new Date().toLocaleTimeString()}] ⚠️ WebSocket Warning: ${err.message}`);
        });
        ws.on('close', () => {
            setTimeout(connectWS, 2500);
        });
    } catch(e) {}
}
connectWS();

// 2. REALME PHONE LOGCAT RADAR
const adbPath = "C:\\Users\\merah\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe";
const adbLogcat = spawn(adbPath, ['logcat', '-v', 'time', '-s', 'SYNKING_DEBUG', 'SYNKING_FCM', 'SYNKING_TELECOM', 'SYNKING_SIGNALING', 'SYNKING_AUDIO', 'ReactNativeJS']);

adbLogcat.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
            console.log(`📱 [PHONE EVENT] ${trimmed}`);
        }
    }
});

adbLogcat.stderr.on('data', (data) => {});

process.on('SIGINT', () => {
    adbLogcat.kill();
    process.exit();
});

setInterval(() => {}, 5000);
