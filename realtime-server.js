// SYNKING 100% Free & Unlimited Central Backend & Real-Time Engine
// Full Profiles, Requests, Chats REST API + WebSocket Signaling + Admin Portal
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
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(raw);
    console.log(`[DATABASE_LOADED] Loaded ${Object.keys(db.profiles || {}).length} profiles, ${Object.keys(db.requests || {}).length} requests.`);
  }
} catch (e) {
  console.warn('[DB_INIT_WARN] Creating fresh in-memory database');
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {}
}

const clients = new Set();

// HTML Admin Portal Template
function renderAdminHtml() {
  const profileList = Object.values(db.profiles || {});
  const requestList = Object.values(db.requests || {});
  const chatList = db.chats || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SYNKING Cloud Admin Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #08090F; color: #FFFFFF; padding: 24px; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #FD3A73, #FF7B00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { background: #13141F; padding: 6px 12px; border-radius: 20px; font-size: 12px; border: 1px solid #22C55E; color: #22C55E; font-weight: 700; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #13141F; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); }
    .stat-val { font-size: 28px; font-weight: 800; color: #00E5FF; margin-top: 4px; }
    .stat-lbl { color: #94A3B8; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    
    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px; }
    .user-card { background: #13141F; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; display: flex; flex-direction: column; }
    .user-img { width: 100%; height: 180px; object-fit: cover; background: #1E293B; }
    .user-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .user-name { font-size: 18px; font-weight: 800; }
    .user-meta { color: #00E5FF; font-size: 12px; font-weight: 600; }
    .user-bio { color: #94A3B8; font-size: 13px; margin-top: 4px; line-height: 1.4; flex: 1; }
    .del-btn { background: #EF4444; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; margin-top: 10px; width: 100%; }
    .del-btn:hover { background: #DC2626; }
    
    .table-box { background: #13141F; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 12px 16px; background: rgba(255,255,255,0.03); color: #94A3B8; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SYNKING ADMIN CONSOLE</div>
      <div style="color: #94A3B8; font-size: 12px; margin-top: 2px;">Live Cloud Backend • 24/7 Zero Cost Production</div>
    </div>
    <div class="badge">● 100% ONLINE (Render Cloud)</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-lbl">Registered Users</div>
      <div class="stat-val">${profileList.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">Swipes & Requests</div>
      <div class="stat-val">${requestList.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">Total Chats Sent</div>
      <div class="stat-val">${chatList.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-lbl">Active WebSockets</div>
      <div class="stat-val">${clients.size}</div>
    </div>
  </div>

  <div class="section-title">
    <span>👥 User Profiles Directory (${profileList.length})</span>
    <button onclick="location.reload()" style="background: #1E293B; color: #00E5FF; border: 1px solid #00E5FF; padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: pointer;">🔄 Refresh</button>
  </div>

  <div class="user-grid">
    ${profileList.length === 0 ? '<div style="color: #94A3B8; padding: 20px;">No registered profiles yet. Create a profile in the app!</div>' : ''}
    ${profileList.map(u => `
      <div class="user-card">
        <img class="user-img" src="${u.photo || u.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}" alt="${u.name}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'" />
        <div class="user-body">
          <div class="user-name">${u.name}, ${u.age || 21} ${u.verified ? '✅' : ''}</div>
          <div class="user-meta">📍 ${u.city || 'Roorkee'} • ${u.college || 'IIT Roorkee'}</div>
          <div class="user-bio">${u.bio || 'Active on Synking'}</div>
          <button class="del-btn" onclick="deleteUser('${u.id}')">🗑️ Delete Profile</button>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section-title">
    <span>💖 Live Swipes & Match Requests (${requestList.length})</span>
    <button onclick="clearAllRequests()" style="background: #EF4444; color: #FFF; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px;">🧹 Clear All Requests</button>
  </div>
  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th>From User</th>
          <th>To User ID</th>
          <th>Status</th>
          <th>Pass Plan</th>
          <th>Time</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${requestList.length === 0 ? '<tr><td colspan="6" style="color: #94A3B8; text-align: center; padding: 20px;">No match requests yet.</td></tr>' : ''}
        ${requestList.map(r => {
          const timeStr = r.timestamp && !isNaN(new Date(r.timestamp).getTime())
            ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'Just now';
          return `
          <tr>
            <td><strong>${r.fromUser?.name || 'Unknown'}</strong></td>
            <td>${r.toUserId}</td>
            <td><span style="color: ${r.status === 'accepted' ? '#22C55E' : '#EAB308'}; font-weight: 700;">${r.status.toUpperCase()}</span></td>
            <td>${r.passType || 'Standard'}</td>
            <td>${timeStr}</td>
            <td>
              <button onclick="deleteRequest('${r.id}')" style="background: #EF4444; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px;">🗑️ Delete</button>
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <script>
    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete user ' + id + '?')) return;
      try {
        const res = await fetch('/api/profiles/' + id, { method: 'DELETE' });
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to delete user.');
        }
      } catch (e) {
        alert('Error: ' + e);
      }
    }

    async function deleteRequest(id) {
      if (!confirm('Delete this swipe request?')) return;
      try {
        const res = await fetch('/api/requests/' + id, { method: 'DELETE' });
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to delete request.');
        }
      } catch (e) {
        alert('Error: ' + e);
      }
    }

    async function clearAllRequests() {
      if (!confirm('Are you sure you want to clear ALL swipe requests?')) return;
      try {
        const res = await fetch('/api/requests', { method: 'DELETE' });
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to clear requests.');
        }
      } catch (e) {
        alert('Error: ' + e);
      }
    }
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 0. GET / or /admin (Web Admin Dashboard)
  if (req.method === 'GET' && (pathname === '/' || pathname === '/admin')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderAdminHtml());
    return;
  }

  // 1. GET /api/profiles
  if (req.method === 'GET' && pathname === '/api/profiles') {
    const excludeId = url.searchParams.get('excludeId');
    const list = Object.values(db.profiles).filter(p => !excludeId || p.id !== excludeId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // 2. POST /api/profiles (Save / Update User Profile)
  if (req.method === 'POST' && pathname === '/api/profiles') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const profile = JSON.parse(body);
        if (profile && profile.id) {
          db.profiles[profile.id] = {
            ...profile,
            updatedAt: new Date().toISOString()
          };
          saveDb();
          console.log(`[PROFILE_SAVED] ${profile.name} (${profile.id})`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, profile: db.profiles[profile.id] }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid profile payload' }));
    });
    return;
  }

  // 2.1 DELETE /api/profiles/:id
  if (req.method === 'DELETE' && pathname.startsWith('/api/profiles/')) {
    const id = pathname.replace('/api/profiles/', '');
    if (id && db.profiles[id]) {
      delete db.profiles[id];
      saveDb();
      console.log(`[PROFILE_DELETED] ${id}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Profile not found' }));
    return;
  }

  // MASTER DATABASE WIPE (Wipe all users, requests, chats 100%)
  if (pathname === '/api/reset-all' || pathname === '/api/wipe-database') {
    db.profiles = {};
    db.requests = {};
    db.chats = [];
    saveDb();
    console.log('🚨 [MASTER_DATABASE_WIPED] All users, requests, and chats permanently deleted.');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'All users, requests, and chats deleted completely. 0 remaining.' }));
    return;
  }

  // 3. GET /api/requests
  if (req.method === 'GET' && pathname === '/api/requests') {
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    let list = Object.values(db.requests || {});
    if (userId) {
      if (type === 'incoming') {
        list = list.filter(r => r.toUserId === userId && (!status || r.status === status));
      } else if (type === 'sent') {
        list = list.filter(r => r.fromUser?.id === userId && (!status || r.status === status));
      } else {
        list = list.filter(r => r.toUserId === userId || r.fromUser?.id === userId);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
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
          // STRICT GUARD: Block sending request to yourself!
          if (newReq.fromUser?.id === newReq.toUserId || (newReq.fromUser?.name && newReq.fromUser.name === newReq.toUserName)) {
            console.log('⚠️ [SELF_REQUEST_BLOCKED] User cannot send request to self');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Self matching is not allowed' }));
            return;
          }

          db.requests[newReq.id] = newReq;
          saveDb();
          console.log(`[REQUEST_SAVED] ${newReq.fromUser?.name} ➔ ${newReq.toUserId}`);
          
          // Targeted send to recipient only
          broadcastToWebSockets({ type: 'SYNK_REQUEST', targetUserId: newReq.toUserId, payload: newReq });

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
            const fromUserId = db.requests[requestId].fromUser?.id;
            broadcastToWebSockets({
              type: 'REQUEST_ACCEPTED',
              targetUserId: fromUserId,
              payload: {
                requestId,
                fromUserId,
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

  // 5.1 DELETE /api/requests/:id or DELETE /api/requests (Clear All)
  if (req.method === 'DELETE' && pathname.startsWith('/api/requests')) {
    if (pathname === '/api/requests') {
      db.requests = {};
      saveDb();
      console.log('[ALL_REQUESTS_CLEARED]');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    const id = pathname.replace('/api/requests/', '');
    if (id && db.requests[id]) {
      delete db.requests[id];
      saveDb();
      console.log(`[REQUEST_DELETED] ${id}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Request not found' }));
    return;
  }

  // 6. GET /api/chats (Strictly bifurcate 1-on-1 messages between u1 and u2)
  if (req.method === 'GET' && pathname === '/api/chats') {
    const u1 = url.searchParams.get('u1') || url.searchParams.get('user1');
    const u2 = url.searchParams.get('u2') || url.searchParams.get('user2');

    let matched = db.chats || [];
    if (u1 && u2) {
      matched = (db.chats || []).filter(c =>
        (c.senderId === u1 && c.receiverId === u2) ||
        (c.senderId === u2 && c.receiverId === u1)
      );
    } else if (u1) {
      matched = (db.chats || []).filter(c => c.senderId === u1 || c.receiverId === u1);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(matched));
    return;
  }

  // 7. POST /api/chats (Save Message & Broadcast in 0ms)
  if (req.method === 'POST' && pathname === '/api/chats') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        if (msg && msg.id) {
          db.chats.push(msg);
          saveDb();
          console.log(`[CHAT_SAVED] ${msg.senderName} ➔ ${msg.receiverId}: ${msg.content ? msg.content.substring(0, 20) : 'E2EE'}`);

          // Instant 0ms WebSocket Broadcast to Recipient Device
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

  // 8. GET /api/version (Zomato-Style Live In-App OTA Update Engine)
  if (req.method === 'GET' && pathname === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: '1.0.2',
      buildNumber: 102,
      releaseDate: new Date().toISOString(),
      title: 'Zomato-Speed Live Update',
      notes: 'Strict 1-on-1 private chat bifurcation & universal live audio/video streaming!',
      forceRefresh: true,
    }));
    return;
  }

  // 9. POST /api/debug-log (In-Call Diagnostics Upload)
  if (req.method === 'POST' && pathname === '/api/debug-log') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('\n📥 [IN-CALL DEBUG REPORT RECEIVED]\n' + body + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// WebSocket Protocol Handshake
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
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  clients.add(socket);
  console.log(`[WS_CONNECTED] Client connected. Total active clients: ${clients.size}`);
  socket.buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    socket.buffer = Buffer.concat([socket.buffer, chunk]);

    while (true) {
      if (socket.buffer.length < 2) break;
      
      let length = socket.buffer[1] & 0x7f;
      let offset = 2;
      
      if (length === 126) {
        if (socket.buffer.length < 4) break;
        length = socket.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (socket.buffer.length < 10) break;
        // Note: readBigUInt64BE requires Node v12+
        length = Number(socket.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const isMasked = (socket.buffer[1] & 0x80) === 0x80;
      const totalFrameSize = offset + (isMasked ? 4 : 0) + length;

      if (socket.buffer.length < totalFrameSize) {
        // Incomplete frame, wait for more data from TCP stream
        break;
      }

      const frameBuffer = socket.buffer.slice(0, totalFrameSize);
      socket.buffer = socket.buffer.slice(totalFrameSize);

      try {
        const decoded = decodeWebSocketFrame(frameBuffer);
        if (decoded) {
          const parsed = JSON.parse(decoded);

          // 1. Socket User Registration
          if (parsed.type === 'REGISTER_SOCKET' && parsed.userId) {
            socket.userId = parsed.userId;
            console.log(`[WS_REGISTERED] Socket bound to userId: ${parsed.userId}`);
            continue; // Use continue since we are in a while loop now
          }

          // 2. Targeted 1-on-1 Signaling Relay (WebRTC Offer, Answer, ICE, Call Signals)
          const targetUserId =
            parsed.targetUserId ||
            parsed.payload?.receiverId ||
            parsed.payload?.targetUserId ||
            parsed.payload?.toUserId;

          if (targetUserId) {
            let delivered = false;
            const jsonStr = JSON.stringify(parsed);
            const frame = encodeWebSocketFrame(jsonStr);

            for (const client of clients) {
              if (client !== socket && client.writable && client.userId === targetUserId) {
                try {
                  client.write(frame);
                  delivered = true;
                } catch (e) {
                  clients.delete(client);
                }
              }
            }

            if (delivered) {
              console.log(`[WS_TARGETED_SIGNAL] ${parsed.type} → Delivered strictly to ${targetUserId}`);
            } else {
              console.log(`[WS_TARGETED_SIGNAL] ${parsed.type} → Target ${targetUserId} not bound yet. Broadcasting fallback to all peers.`);
              broadcastToWebSockets(parsed, socket);
            }
            continue;
          }

          // 3. True Broadcast (Only if no target specified)
          broadcastToWebSockets(parsed, socket);
        }
      } catch (e) {
         console.error("Frame processing error:", e);
      }
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log(`[WS_DISCONNECTED] Client (${socket.userId || 'anon'}) disconnected. Active clients: ${clients.size}`);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });
});

function broadcastToWebSockets(data, senderSocket = null) {
  const jsonStr = JSON.stringify(data);
  const frame = encodeWebSocketFrame(jsonStr);
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

function decodeWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;
  const isMasked = (buffer[1] & 0x80) === 0x80;
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    return null;
  }

  let maskingKey = null;
  if (isMasked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  const payload = buffer.slice(offset, offset + length);
  if (isMasked && maskingKey) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return payload.toString('utf8');
}

function encodeWebSocketFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;
  let header;

  if (length <= 125) {
    header = Buffer.from([0x81, length]);
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================================`);
  console.log(`⚡ SYNKING 100% FREE CENTRAL BACKEND & WEBSOCKET ENGINE`);
  console.log(`🌐 Admin Portal: http://0.0.0.0:${PORT}/admin`);
  console.log(`🌐 REST API: http://0.0.0.0:${PORT}/api/profiles`);
  console.log(`🌐 WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`💸 ₹0 Cost • 0 Firestore Dependency • Unlimited Reads/Writes`);
  console.log(`======================================================`);
});
