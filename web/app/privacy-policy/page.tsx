'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  PhoneOff,
  Video,
  Key,
  Server,
  ArrowLeft,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white font-sans">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#FD3A73]/10 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[-10%] h-[550px] w-[550px] rounded-full bg-purple-700/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07050d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img src="/images/logo_emblem.png" alt="Synkin Official Emblem" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#FD3A73] -mt-1">
                Legal & Privacy
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="pt-16 pb-12 px-6 border-b border-white/[0.08] bg-[#0A0714]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-md mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ZERO-KNOWLEDGE & DPDP ACT 2023 COMPLIANT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy &amp; Data Protection
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400">
            Last Updated &amp; Effective: September 12, 2026 · Legal Jurisdiction: Uttarakhand, India
          </p>
        </div>
      </section>

      {/* Content Body */}
      <main className="max-w-4xl mx-auto py-16 px-6 space-y-10 text-sm leading-relaxed text-zinc-300">
        {/* Section 1: Introduction */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Lock className="h-5 w-5 text-[#FD3A73]" />
            <span>1. Introduction &amp; Core Philosophy</span>
          </h2>
          <p>
            Welcome to <strong>Synkin</strong> (&ldquo;Synkin&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). We believe that finding real attraction should never come at the expense of your personal identity or private contact information.
          </p>
          <p className="mt-3">
            Synkin is engineered with zero-knowledge cryptographic foundations. We do not sell your personal data, we do not monitor your private conversations, and we never reveal your mobile phone number, SIM card details, or social handles to other users.
          </p>
        </div>

        {/* Section 2: Zero Phone Number Exposure */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <PhoneOff className="h-5 w-5 text-[#FD3A73]" />
            <span>2. Zero Phone Number Exposure</span>
          </h2>
          <p>
            Your mobile number is collected strictly during account verification (SMS OTP) to prevent automated bots and protect community safety.
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
            <li><strong className="text-white">Zero Public Display:</strong> Your phone number is never displayed on your profile, search radar, or chat windows.</li>
            <li><strong className="text-white">Zero Contact Leaks:</strong> Other users cannot discover your WhatsApp number or perform reverse Truecaller lookups through Synkin.</li>
            <li><strong className="text-white">In-App Calling:</strong> All voice and video interactions occur securely inside Synkin via WebRTC with zero phone number exchange.</li>
          </ul>
        </div>

        {/* Section 3: Audio & Video Calling Policy */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Video className="h-5 w-5 text-purple-400" />
            <span>3. Audio &amp; Video Calling Policy (Strict Two-Way Consent)</span>
          </h2>
          <p>
            Unsolicited calling, camera flashing, and surprise rings are fundamentally prohibited and architecturally prevented:
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
              <span className="font-bold text-white text-xs">A. Two-Way Explicit Approval Required</span>
              <p className="text-xs text-zinc-400 mt-1">
                A member must send an explicit call request. The call window opens ONLY when the recipient actively clicks [Accept].
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
              <span className="font-bold text-white text-xs">B. Zero Server Recording &amp; Direct P2P Encryption</span>
              <p className="text-xs text-zinc-400 mt-1">
                Media streams travel directly peer-to-peer (WebRTC DTLS-SRTP 256-bit). Synkin servers cannot intercept, listen to, or record any audio or video.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
              <span className="font-bold text-white text-xs">C. Camera-Off Flexibility</span>
              <p className="text-xs text-zinc-400 mt-1">
                Members may choose Private Audio Call anytime if they do not wish to enable video.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Location Data & Radius Fuzzing */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Key className="h-5 w-5 text-sky-400" />
            <span>4. Location Privacy &amp; Radius Fuzzing</span>
          </h2>
          <p>
            Synkin uses your device location to sort sparks in a Nearest-First Waterfall sequence (500m walking reach, 2km–25km city corridors, 50km+ Pan-India).
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
            <li><strong className="text-white">No Exact Pinpoint Exposure:</strong> Other users can only see generalized distance bands (e.g., &quot;450m away&quot; or &quot;Nearby Hauz Khas&quot;), never your building, street address, or exact GPS coordinates.</li>
            <li><strong className="text-white">Incognito Mode:</strong> You can toggle your visibility to &quot;Hidden&quot; at any moment from within your profile settings.</li>
            <li><strong className="text-white">Zero Coordinate Archiving:</strong> We do not log historical geographic travel tracks.</li>
          </ul>
        </div>

        {/* Section 5: Biometric AI Liveness Check */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>5. Mandatory AI Selfie Liveness Verification</span>
          </h2>
          <p>
            To protect our members from catfishing, deepfakes, and scammers, Synkin utilizes automated on-device facial micro-movement verification during onboarding.
          </p>
          <p className="mt-2 text-zinc-400">
            Verification data is processed securely to generate a mathematical liveness score. We do not store raw facial geometry templates or share biometric measurements with third-party advertising networks.
          </p>
        </div>

        {/* Section 6: Data Retention & Instant Deletion */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Server className="h-5 w-5 text-amber-400" />
            <span>6. Data Retention &amp; One-Tap Account Deletion</span>
          </h2>
          <p>
            You have full ownership of your data. You may permanently delete your account and all associated profile information at any time directly inside the app:
          </p>
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">
            <strong>How to Delete:</strong> Open Profile Settings &rarr; Tap &quot;Delete Account Permanently&quot;. Your profile, matches, encrypted message logs, and uploaded photos will be purged from active databases immediately.
          </div>
        </div>

        {/* Section 7: Contact & Grievance Officer */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-pink-950/30 via-zinc-900 to-purple-950/30 p-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Mail className="h-5 w-5 text-[#FD3A73]" />
            <span>7. Grievance Redressal &amp; Legal Inquiries</span>
          </h2>
          <p className="text-zinc-300">
            In accordance with the Indian Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the Grievance Officer details are provided below:
          </p>
          <div className="mt-4 space-y-1.5 font-mono text-xs text-zinc-300">
            <p><strong className="text-white">Organization:</strong> Jayanti Cybernetics (Owned and operated by SMD Group)</p>
            <p><strong className="text-white">Grievance Officer:</strong> Rahul Kumar</p>
            <p><strong className="text-white">Official Legal &amp; Privacy Email:</strong> <a href="mailto:privacy@synkin.in" className="text-[#FD3A73] hover:underline">privacy@synkin.in</a></p>
            <p><strong className="text-white">Legal Jurisdiction:</strong> Uttarakhand, India · Server Region: ap-south-1 (Mumbai)</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050308] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo_emblem.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>© 2026 Synkin · Jayanti Cybernetics (SMD Group). All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/app" className="text-[#FD3A73] hover:underline font-semibold">Web App</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/safety" className="hover:text-white">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
