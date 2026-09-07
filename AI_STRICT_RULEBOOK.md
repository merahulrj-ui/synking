# 🛡️ AI STRICT RULEBOOK & ARCHITECTURE FREEZE PROTOCOL
**App Name:** Synkin (`com.synking`)  
**Strict Enforcement:** Active 100%

---

## 🚫 1. PERMANENTLY FROZEN MODULES (STRICTLY DO NOT TOUCH - 0% MODIFICATION)

The following modules, files, and architectures are completely stable, tested, and FROZEN. 
The AI assistant is strictly forbidden from modifying, refactoring, renaming, or touching these:

### 🔴 Core Layer 1: Central Backend
- `realtime-server.js` (AWS EC2 WebSocket signaling, Turso SQLite REST pipeline, FCM VoIP dispatch)
- Any backend routing, token management, or signaling logic.

### 🔴 Core Layer 2: Calling & Audio/Video Engine
- `src/services/webrtcService.ts` (WebRTC signaling, ICE candidates, call state machine)
- `src/services/webrtcCore.ts` (Native WebRTC drivers)
- `src/services/audioRouteService.ts` (Earpiece vs Loudspeaker audio routing)
- `src/services/telecomBridge.ts` (Native Telecom Android event bridge)
- `src/services/ringtoneService.ts` (In-call sound effects and ringtones)
- `android/app/src/main/java/com/synking/CallActivity.kt`
- `android/app/src/main/java/com/synking/IncomingCallActivity.kt`
- `android/app/src/main/java/com/synking/AudioRouteModule.kt`
- `android/app/src/main/java/com/synking/TelecomModule.kt`
- `android/app/src/main/java/com/synking/SynkingConnectionService.kt`
- `android/app/src/main/java/com/synking/SynkingConnection.kt`
- `android/app/src/main/java/com/synking/CallConnectionManager.kt`
- `android/app/src/main/java/com/synking/MyFirebaseMessagingService.kt`

### 🔴 Core Layer 3: Chat Engine, Encryption & Database
- `src/services/firebase.ts` (Turso REST wrapper and cloud profile sync)
- `src/services/realtimeBridge.ts` (Live WebSocket client bridge)
- `src/services/notificationService.ts` (FCM v1 & Expo Push Notification dispatch)
- `src/utils/encryption.ts` & `src/utils/crypto.ts` (End-to-End Encryption engines)
- `Turso Database & Schemas` (Cloud SQLite single source of truth)

---

## ⚡ 2. AI TOKEN / CREDIT EFFICIENCY RULES (ZERO WASTE)

1. **No Redundant Searches or Loops:** Never run repetitive file scans or unnecessary searches.
2. **Direct Action Only:** Execute only what is explicitly requested by the user.
3. **Frontend Display Only:** Work is restricted strictly to UI/UX, styling, text, and visual presentation unless explicitly instructed otherwise.
4. **Mandatory Header:** Every assistant response must display the frozen status guard at the very top.
