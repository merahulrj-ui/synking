import sys, re
with open('realtime-server.js', 'r', encoding='utf-8') as f:
    content = f.read()

admin_init_code = """
const admin = require('firebase-admin');
let firebaseAdminReady = false;
try {
  const serviceAccountPath = require('path').join(__dirname, 'firebase-service-account.json');
  if (require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(require('fs').readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseAdminReady = true;
    console.log('[FCM_NATIVE] Firebase Admin initialized');
  } else {
    console.warn('[FCM_NATIVE] firebase-service-account.json not found');
  }
} catch (e) {
  console.error('[FCM_NATIVE_INIT_ERROR]', e?.message || String(e));
}
"""
content = re.sub(r'(const\s+path\s*=\s*require\([\'"]path[\'"]\);)', r'\1\n' + admin_init_code, content)

token_endpoint_pattern = r"(if\s*\(\s*req\.method\s*===\s*'POST'\s*&&\s*pathname\s*===\s*'/api/profiles/push-token'\s*\)\s*\{)[\s\S]+?(res\.end\(JSON\.stringify\(\{\s*success:\s*false,\s*error:\s*'Invalid push token payload'\s*\}\)\);\s*\});\s*return;\s*\}"

new_endpoint = """if (req.method === 'POST' && pathname === '/api/profiles/push-token') {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { userId, expoPushToken, fcmPushToken } = JSON.parse(body);
      if (!userId || (!expoPushToken && !fcmPushToken)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'User ID and at least one push token required' }));
        return;
      }
      if (!db.pushTokens) db.pushTokens = {};
      if (!db.pushTokens[userId]) db.pushTokens[userId] = {};
      db.pushTokens[userId] = { expoPushToken: expoPushToken || null, fcmPushToken: fcmPushToken || null };
      if (db.profiles[userId]) {
        db.profiles[userId].expoPushToken = expoPushToken || null;
        db.profiles[userId].fcmPushToken = fcmPushToken || null;
      }
      saveDb();
      console.log([PUSH_TOKEN_BOUND] user= expo= fcm=);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, expo: !!expoPushToken, fcm: !!fcmPushToken }));
    } catch (e) {
      console.error('[PUSH_TOKEN_ERROR]', e?.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid push token payload' }));
    }
  });
  return;
}"""
content = re.sub(token_endpoint_pattern, new_endpoint, content)

push_func_pattern = r"function\s+sendCallPushNotification\s*\([^)]*\)\s*\{[\s\S]+?(req\.write\(pushBody\);\s*req\.end\(\);\s*\})"

new_push = """async function sendNativeFcmCallNotification(targetUserId, callPayload) {
  if (!firebaseAdminReady) {
    console.log('[FCM_SKIP] Firebase Admin not ready');
    return false;
  }
  const tokenRecord = db.pushTokens?.[targetUserId];
  const fcmToken = typeof tokenRecord === 'object' ? tokenRecord.fcmPushToken : null;
  if (!fcmToken) {
    console.log([FCM_SKIP] No native FCM token for );
    return false;
  }
  const callerName = callPayload?.callerUser?.name || 'Someone';
  const callType = callPayload?.type === 'video' ? 'video' : 'audio';
  const data = {
    type: 'INCOMING_CALL',
    callId: String(callPayload?.callId || ''),
    callerId: String(callPayload?.callerUser?.id || ''),
    callerName: String(callerName),
    callerPhoto: String(callPayload?.callerUser?.photo || ''),
    callType,
  };
  try {
    const message = { token: fcmToken, data, android: { priority: 'high' } };
    const messageId = await admin.messaging().send(message);
    console.log([FCM_CALL_SENT] user= messageId= callId=);
    return true;
  } catch (e) {
    console.error([FCM_CALL_ERROR] user=, e?.message || String(e));
    return false;
  }
}

async function sendCallPushNotification(targetUserId, callPayload) {
  console.log([CALL_PUSH] Starting dual push for );
  const fcmSent = await sendNativeFcmCallNotification(targetUserId, callPayload);
  const tokenRecord = db.pushTokens?.[targetUserId];
  const expoToken = typeof tokenRecord === 'object' ? tokenRecord.expoPushToken : (typeof tokenRecord === 'string' ? tokenRecord : db.profiles[targetUserId]?.pushToken);
  if (!expoToken) {
    console.log([EXPO_SKIP] No Expo token for );
    return;
  }
  const callerName = callPayload?.callerUser?.name || 'Someone';
  const callType = callPayload?.type === 'video' ? 'Video' : 'Voice';
  const pushBody = JSON.stringify({
    to: expoToken,
    title: ?? Incoming  Call,
    body: ${callerName} is calling you on SYNKING,
    data: { type: 'INCOMING_CALL', callId: callPayload?.callId, callerUser: callPayload?.callerUser, callType: callPayload?.type },
    priority: 'high', channelId: 'incoming_calls', categoryIdentifier: 'CALL', sound: 'default',
  });
  const req = require('https').request('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(pushBody) },
  }, (res) => {
    let respData = '';
    res.on('data', chunk => { respData += chunk; });
    res.on('end', () => { console.log([EXPO_FALLBACK_SENT] user= fcm=, respData); });
  });
  req.on('error', err => { console.error('[EXPO_FALLBACK_ERROR]', err.message); });
  req.write(pushBody);
  req.end();
}"""

content = re.sub(push_func_pattern, new_push, content)

with open('realtime-server.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Python patch done!')
