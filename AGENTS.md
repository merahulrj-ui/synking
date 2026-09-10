# STRICT CODE LOCK & IMMUTABILITY SECURITY POLICY

> 🚨 **SECURITY RULE - MANDATORY FOR ALL AI AGENTS & DEVELOPERS**
> **STATUS: LOCKED & FROZEN (Baseline: Commit `64bcb09` / Version `1.0.71` Golden Release)**

---

## 1. Core Principles (Zero Mutation)

1. **NO CODE MODIFICATIONS**:
   - Do NOT edit, alter, rewrite, refactor, or touch ANY existing line of code in the locked files.
   - All existing files in `src/`, `android/`, `assets/`, root configuration files (`package.json`, `app.json`, `index.js`), and server scripts are completely FROZEN.

2. **NO DELETIONS**:
   - Do NOT delete any files, functions, variables, classes, hooks, assets, or comments.
   - Every file present at this baseline is permanent and protected.

3. **ALL ADDITIONS MUST BE COMPLETELY SEPARATE & MODULAR**:
   - If a new feature, screen, utility, service, or API is requested, it MUST be implemented in a **SEPARATE NEW FILE**.
   - Store all future additions in dedicated extension/module directories:
     - `src/extensions/`
     - `src/modules/`
     - `src/features/`
   - New code must NEVER overwrite or mutate existing core logic.

4. **USER EXPLICIT OVERRIDE ONLY**:
   - Any modification to an existing locked file is strictly prohibited unless the user explicitly gives a clear, unambiguous command specifying the exact file and change to be made.

---

## 2. Protected Files Inventory

The following core modules are cryptographically and strictly locked:
- **Calling Suite**: `src/components/CallModal.tsx`, `src/components/CallApp.tsx`, `src/services/webrtcService.ts`, `src/services/audioRouteService.ts`, `src/services/telecomBridge.ts`, `src/services/realtimeBridge.ts`.
- **Navigation & Layout**: `src/app/_layout.tsx`, `src/app/(tabs)/*`, `src/app/chat/*`.
- **Native Android Module Layer**: `android/app/src/main/java/com/synking/*` (`CallWakeLockModule`, `AudioRouteModule`, `TelecomModule`, `MainActivity`, `CallActivity`, `SynkingConnectionService`).
- **Encryption & Security**: `src/utils/encryption.ts`, `src/services/firebase.ts`, `src/services/radarService.ts`.

---

## 3. Enforcement
- Any proposed change violating this policy must be rejected immediately by the AI agent with a notification to the user.
- Any new features must be presented as separate, standalone files.
