// SYNKING 100% Free & Unlimited Central Backend & Real-Time Engine
// Full Profiles, Requests, Chats REST API + WebSocket Signaling
// Zero Firestore Dependency • Zero Quota Limits • Zero Cost

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8082;
const DB_FILE = path.join(__dirname, 'synking_local_db.json');

// Initialize Local Database
let db = {
  profiles: {},
  requests: {},
  chats: []
};

// Load DB from Disk
try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
    console.log(`[DATABASE_LOADED] Loaded ${Object.keys(db.profiles).length} profiles, ${Object.keys(db.requests).length} requests.`);
  }
} catch (e) {
  console.warn('[DATABASE_INIT] Creating fresh local database.');
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {}
}

const clients = new Set();

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. GET /api/profiles
  if (req.method === 'GET' && pathname === '/api/profiles') {
    const excludeId = url.searchParams.get('excludeId');
    const list = Object.values(db.profiles).filter(p => !excludeId || p.id !== excludeId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // 2. POST /api/profiles
  if (req.method === 'POST' && pathname === '/api/profiles') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(body);
        if (profile && profile.id) {
          db.profiles[profile.id] = { ...profile, updatedAt: new Date().toISOString() };
          saveDb();
          console.log(`[PROFILE_SAVED] User: ${profile.name} (${profile.id}) in ${profile.location}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, profile: db.profiles[profile.id] }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid profile data' }));
    });
    return;
  }

  // 3. GET /api/requests
  if (req.method === 'GET' && pathname === '/api/requests') {
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type') || 'incoming'; // incoming or sent

    const allRequests = Object.values(db.requests);
    let filtered = [];
    if (type === 'incoming') {
      filtered = allRequests.filter(r => r.toUserId === userId && r.status === 'pending');
    } else {
      filtered = allRequests.filter(r => r.fromUser?.id === userId || r.fromUserId === userId);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(filtered));
    return;
  }

  // 4. POST /api/requests (Swipe Right / Like)
  if (req.method === 'POST' && pathname === '/api/requests') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newReq = JSON.parse(body);
        if (newReq && newReq.id) {
          db.requests[newReq.id] = newReq;
          saveDb();
          console.log(`[REQUEST_SAVED] ${newReq.fromUser?.name} ➔ ${newReq.toUserId}`);
          
          // Broadcast to connected WebSocket clients in 0ms
          broadcastToWebSockets({ type: 'SYNK_REQUEST', payload: newReq });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 5. PATCH /api/requests (Accept / Decline)
  if (req.method === 'PATCH' && pathname.startsWith('/api/requests')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { requestId, status, acceptedBy } = JSON.parse(body);
        if (requestId && db.requests[requestId]) {
          db.requests[requestId].status = status;
          saveDb();
          console.log(`[REQUEST_STATUS_UPDATED] ${requestId} ➔ ${status}`);

          if (status === 'accepted') {
            broadcastToWebSockets({
              type: 'REQUEST_ACCEPTED',
              payload: {
                requestId,
                fromUserId: db.requests[requestId].fromUser?.id,
                acceptedBy,
              }
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 6. GET /api/chats
  if (req.method === 'GET' && pathname === '/api/chats') {
    const u1 = url.searchParams.get('user1');
    const u2 = url.searchParams.get('user2');
    const thread = db.chats.filter(
      m => (m.senderId === u1 && m.receiverId === u2) || (m.senderId === u2 && m.receiverId === u1)
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(thread));
    return;
  }

  // 7. POST /api/chats
  if (req.method === 'POST' && pathname === '/api/chats') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        if (msg && msg.id) {
          db.chats.push(msg);
          saveDb();
          console.log(`[CHAT_MESSAGE_SAVED] ${msg.senderId} ➔ ${msg.receiverId}: "${msg.text || msg.plainText}"`);

          // Broadcast over WebSocket in 0ms
          broadcastToWebSockets({ type: 'NEW_MESSAGE', payload: msg });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 8. POST /api/debug-log (Auto-collect WebRTC Diagnostics)
  if (req.method === 'POST' && pathname === '/api/debug-log') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('\n================== INCOMING CLIENT DEBUG REPORT ==================');
      console.log(body);
      console.log('==================================================================\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, logged: true }));
    });
    return;
  }

  // Fallback
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'active', service: 'SYNKING Free Backend Engine' }));
});

// WebSocket Server Implementation
server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  clients.add(socket);
  console.log(`[WEBSOCKET_CLIENT_JOINED] Total connected devices: ${clients.size}`);

  socket.on('data', buffer => {
    try {
      const message = decodeWebSocketFrame(buffer);
      if (message) {
        const parsed = JSON.parse(message);
        // Relay to other connected devices
        broadcastToWebSockets(parsed, socket);
      }
    } catch (e) {}
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WEBSOCKET_CLIENT_LEFT] Total connected devices: ${clients.size}`);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

function decodeWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;
  const isMasked = (buffer[1] & 0x80) === 0x80;
  let length = buffer[1] & 0x7f;
  let maskStart = 2;

  if (length === 126) maskStart = 4;
  else if (length === 127) maskStart = 10;

  let dataStart = maskStart + (isMasked ? 4 : 0);
  if (buffer.length < dataStart) return null;

  if (!isMasked) return buffer.slice(dataStart).toString('utf8');

  const mask = buffer.slice(maskStart, maskStart + 4);
  const data = buffer.slice(dataStart);
  const decoded = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) decoded[i] = data[i] ^ mask[i % 4];
  return decoded.toString('utf8');
}

function encodeWebSocketFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.from([0x81, length]);
  } else if (length < 65536) {
    header = Buffer.from([0x81, 126, (length >> 8) & 0xff, length & 0xff]);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  return Buffer.concat([header, payload]);
}

function broadcastToWebSockets(obj, senderSocket = null) {
  const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const frame = encodeWebSocketFrame(text);
  for (const client of clients) {
    if (client !== senderSocket && client.writable) {
      try {
        client.write(frame);
      } catch (e) {
        clients.delete(client);
      }
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`⚡ SYNKING 100% FREE CENTRAL BACKEND & WEBSOCKET ENGINE`);
  console.log(`🌐 REST API: http://0.0.0.0:${PORT}/api/profiles`);
  console.log(`🌐 WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`💸 ₹0 Cost • 0 Firestore Dependency • Unlimited Reads/Writes`);
  console.log(`======================================================\n`);
});
