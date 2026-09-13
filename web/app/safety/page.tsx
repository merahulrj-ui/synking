'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  PhoneOff,
  EyeOff,
  Video,
  Mic,
  Server,
  Key,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';

export default function SafetyPage() {
  const securityPillars = [
    {
      icon: <PhoneOff className="h-7 w-7 text-[#FD3A73]" />,
      title: 'Zero Phone Number Exposure',
      desc: 'You never have to exchange your phone number, WhatsApp, or personal Instagram handle. All communications happen securely inside Synkin with zero contact leaks or Truecaller lookups.',
      badge: '100% Private',
    },
    {
      icon: <Key className="h-7 w-7 text-purple-400" />,
      title: 'E2E WebRTC Encryption (DTLS-SRTP)',
      desc: 'Audio and video packets travel directly peer-to-peer (P2P) between your browser and your match. Every frame is encrypted with military-grade DTLS 1.2 and SRTP protocols.',
      badge: 'Peer-to-Peer',
    },
    {
      icon: <Server className="h-7 w-7 text-sky-400" />,
      title: 'Zero-Knowledge Server Architecture',
      desc: 'Our signaling servers only facilitate the initial encrypted handshake. Synkin servers cannot intercept, listen to, or record any audio or video stream. Your intimacy remains strictly yours.',
      badge: 'No Recording',
    },
    {
      icon: <ShieldCheck className="h-7 w-7 text-emerald-400" />,
      title: 'Mandatory AI Selfie Liveness Check',
      desc: 'Every account is authenticated through real-time facial micro-motion and depth analysis to permanently eliminate bots, stolen photo catfishes, and impersonators.',
      badge: 'Human Only',
    },
  ];

  const consentRules = [
    {
      step: '01',
      title: 'Two-Way Explicit Request',
      text: 'Neither user can force a call. When one person requests an audio or video vibe check, an explicit consent prompt appears on the other user’s screen.',
    },
    {
      step: '02',
      title: 'Zero Random Rings & Flashing',
      text: 'No surprise pop-up video or camera flashing. The media stream remains completely dark and unstreamed until both users actively click [Accept].',
    },
    {
      step: '03',
      title: 'Camera-Off Private Audio Option',
      text: 'Not camera-ready or prefer privacy first? Switch instantly to an encrypted Private Audio Call with zero video obligation.',
    },
    {
      step: '04',
      title: '3-Minute Safe Exit Timer',
      text: 'Calls have an automatic 3-minute countdown. If chemistry isn’t mutual, the session terminates cleanly without awkward excuses or pressure.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#FD3A73]/15 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-700/15 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07050d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img src="/images/logo_emblem.png" alt="Synkin Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#FD3A73] -mt-1">
                Safety & Cryptography
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
            <Link
              href="/app"
              className="rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              Launch Web App →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 sm:pt-24 sm:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-400 backdrop-blur-md mb-6 shadow-sm">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            <span>ZERO-KNOWLEDGE PRIVACY & FEMALE SAFETY ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Your Privacy Is A Right.<br />
            <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
              Not A Dating App Feature.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Synkin was engineered from mathematical zero-knowledge cryptographic foundations. We built a dating
            environment where you can connect spontaneously without ever leaking your phone number, home location, or
            personal media.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> DTLS-SRTP 256-Bit P2P
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-purple-400">
              <CheckCircle2 className="h-4 w-4" /> Two-Way Mutual Consent Only
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-[#FD3A73]">
              <CheckCircle2 className="h-4 w-4" /> Zero Server Recording
            </span>
          </div>
        </div>
      </section>

      {/* The 4 Non-Negotiable Privacy Pillars */}
      <section className="py-20 px-6 border-y border-white/[0.08] bg-[#0A0714]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              The Trust Moat
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              4 Non-Negotiable Privacy Pillars.
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              How our zero-knowledge architecture protects every woman and man on Synkin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityPillars.map((pillar, i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-[#FD3A73]/40 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
                <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Way Consent Flow Deep Dive */}
      <section className="py-24 px-6 border-b border-white/[0.08] bg-[#07050d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Female Safety Engine
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Two-Way Consent Approval Protocol.
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Zero unsolicited calls, zero camera flashing, zero random rings. Media streams only when both say YES.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {consentRules.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl relative"
              >
                <span className="text-3xl font-black text-purple-400/40">{rule.step}</span>
                <h3 className="text-base font-bold text-white mt-3">{rule.title}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>

          {/* Interactive Consent Simulation Card */}
          <div className="mt-14 max-w-3xl mx-auto rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-zinc-900 to-pink-950/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-[#FD3A73] shadow-lg shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80"
                    alt="Incoming Consent Check"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Sneha, 24 (Hauz Khas)</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    Requested a 3-Minute Encrypted Video Vibe Check 🎥
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => alert('Consent Declined: Media session closed with zero notifications sent.')}
                  className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Decline ✕
                </button>
                <Link
                  href="/app"
                  className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110"
                >
                  Accept & Open Window ⚡
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radius Fuzzing & Physical Safety */}
      <section className="py-20 px-6 border-b border-white/[0.08] bg-[#090712]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Location Integrity
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              Privacy-Preserving Radius Fuzzing.
            </h2>
            <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
              Synkin never exposes your exact GPS coordinates, building number, or live pinpoint location to anyone.
              Distances are algorithmically fuzzed to approximate walking and neighborhood sectors (e.g., &quot;Within 400m&quot;
              or &quot;In Hauz Khas Corridor&quot;).
            </p>
            <ul className="mt-6 space-y-3 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero real-time coordinate logging on disk.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant Incognito toggle to vanish from proximity radar.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Curated daylight partner cafes with verified public security.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#FD3A73]" />
              <span>Cryptographic Protocol Specs</span>
            </h3>
            <div className="space-y-3 font-mono text-xs text-zinc-300">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Signaling Channel:</span>
                <span className="text-white">WSS TLS 1.3 (Port 443)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Media Transport:</span>
                <span className="text-white">P2P WebRTC / DTLS-SRTP</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Video Encryption:</span>
                <span className="text-white">AES-128 / AES-256 GCM</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500">Contact Retention:</span>
                <span className="text-emerald-400 font-bold">0 Days (Never Stored)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Server Audio Listen:</span>
                <span className="text-emerald-400 font-bold">Impossible by Design</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#07050d] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Experience Dating With<br />
            <span className="bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] bg-clip-text text-transparent">
              Zero Phone Number Exposure.
            </span>
          </h2>
          <p className="mt-4 text-sm text-zinc-400">
            Join verified singles on India’s most private real-time dating platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#FD3A73] px-9 py-4 text-sm font-bold text-white shadow-xl shadow-[#FD3A73]/35 hover:brightness-110 active:scale-95 transition-all"
            >
              <Zap className="h-5 w-5" />
              <span>Launch Web App Now →</span>
            </Link>
            <a
              href="/download/apk"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              <span>Download Android APK (75MB)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050308] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo_emblem.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>© 2026 Synkin · Jayanti Cybernetics (SMD Group). All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/app" className="text-[#FD3A73] hover:underline font-semibold">Web App</Link>
            <Link href="/safety" className="hover:text-white">Safety</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
