# 🛡️ SYNKING PROTECTED FILES REGISTRY & PRE-CHANGE DISCLOSURE PROTOCOL

## Rule 11: Core Architecture File Freeze & Pre-Change Verification Guard
Any file listed in this registry is **FROZEN & PROTECTED**.
No modifications, refactors, rewrites, or deletions are permitted on these files without:
1. **Explicit Prior Disclosure:** The AI assistant MUST list each protected file that is proposed to be modified.
2. **Exact Diff Preview:** The AI assistant MUST display the exact lines to be changed (`BEFORE` vs `AFTER`).
3. **Explicit User Confirmation:** The user must review and explicitly approve before any edit is executed.

---

## 🔒 REGISTERED FROZEN & PROTECTED FILES

### Layer 1: Core WebRTC & Audio Routing Engine
1. `src/services/webrtcService.ts` — WebRTC P2P signaling, ICE management & call state machine.
2. `src/services/webrtcCore.ts` — Platform-specific WebRTC native driver imports.
3. `src/services/audioRouteService.ts` — TypeScript audio route bridge (Earpiece vs Loudspeaker).
4. `src/services/telecomBridge.ts` — Headless background event receiver for Telecom.
5. `src/services/ringtoneService.ts` — In-call sound effects and ringtones.

### Layer 2: Dedicated Call UI & Dating Privacy Boundary
6. `src/components/CallApp.tsx` — Isolated React root for `CallActivity` (Zero dating data leakage).
7. `src/components/CallModal.tsx` — In-call video/voice dialer UI and PiP controls.

### Layer 3: Native Android Calling Engine (Kotlin)
8. `android/app/src/main/java/com/synking/CallActivity.kt` — Standalone native call activity.
9. `android/app/src/main/java/com/synking/AudioRouteModule.kt` — Native AudioManager routing.
10. `android/app/src/main/java/com/synking/TelecomModule.kt` — Native TelecomManager bridge.
11. `android/app/src/main/java/com/synking/SynkingConnectionService.kt` — Telecom ConnectionService.
12. `android/app/src/main/java/com/synking/SynkingConnection.kt` — Native Android Telecom call handle.
13. `android/app/src/main/java/com/synking/CallConnectionManager.kt` — Central native call state singleton.
14. `android/app/src/main/java/com/synking/MyFirebaseMessagingService.kt` — High-priority FCM VoIP push handler.
15. `android/app/src/main/java/com/synking/CallState.kt` — Deduplication & active call state persistence.
16. `android/app/src/main/java/com/synking/PendingCallStore.kt` — Cold-boot pending call store.

### Layer 4: Cloud Signaling Backend
17. `realtime-server.js` — AWS EC2 WebSocket signaling, push token management & FCM v1 dispatch.

---

## 📋 MANDATORY CHANGE PROTOCOL

Whenever a task requires modifying ANY of the above 17 files:
```markdown
⚠️ PROTECTED FILE CHANGE DISCLOSURE:
The following protected file is about to be modified:
📁 File: [Path to file]
🎯 Reason: [Why this change is strictly necessary]
🔍 Proposed Change (BEFORE vs AFTER):
[Exact diff]

Please review carefully. Reply with 'APPROVED' to proceed with this modification.
```
