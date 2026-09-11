'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Video,
  Coffee,
  ShieldCheck,
  Lock,
  ArrowRight,
  Download,
  Zap,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function NextLandingPage() {
  const [selectedRadius, setSelectedRadius] = useState<number>(500);

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white overflow-x-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#FD3A73]/15 blur-[140px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-700/15 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[20%] h-[550px] w-[550px] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* NAVBAR */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#07050d]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Official Synkin Logo ("Do Dil Upar Do Dot") */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30 group-hover:scale-105 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img
                  src="/images/logo_emblem.png"
                  alt="Synkin Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#FD3A73] -mt-1">
                Realtime Attraction
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#radar" className="hover:text-[#FD3A73] transition">360° Radar</a>
            <a href="#vibe-check" className="hover:text-[#FD3A73] transition">3-Min Vibe Check</a>
            <a href="#dates" className="hover:text-[#FD3A73] transition">Daylight Dates</a>
            <a href="#safety" className="hover:text-[#FD3A73] transition">Safety Shield</a>
            <a href="/privacy-policy" className="text-zinc-400 hover:text-white transition text-xs uppercase tracking-wider">Privacy</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-full border border-[#FD3A73]/40 bg-[#FD3A73]/10 px-4 py-2 text-xs font-bold text-[#FD3A73] shadow-md shadow-[#FD3A73]/10 hover:bg-[#FD3A73]/20 active:scale-95 transition-all"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Login ⚡</span>
            </Link>

            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FD3A73] to-[#B81855] px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Find Your Spark</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION: Editorial High-Contrast + Anti-Pen-Pal Positioning */}
      {/* ========================================================================= */}
      <section className="relative z-10 px-6 pt-36 pb-20 md:pt-44 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Text Column */}
          <div className="space-y-8 text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FD3A73]/20 bg-[#FD3A73]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#FD3A73]">
              <span className="h-2 w-2 rounded-full bg-[#FD3A73] animate-ping" />
              Walking-Distance Matches · Real-Time Spark 🔥
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
              Stop Collecting Pen-Pals.<br />
              <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
                Catch A Real Spark Tonight.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-zinc-300 sm:text-lg lg:mx-0">
              Tired of 3 weeks of dry texting with matches you never meet? Synkin is built for spontaneous attraction—see who&apos;s radiating good energy within 500 meters, laugh together on a 3-minute video vibe check, and turn mutual chemistry into coffee in 15 minutes.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/app"
                className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#FD3A73] to-[#B81855] px-8 py-4 font-bold text-white shadow-xl shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
              >
                <Zap className="h-5 w-5 text-white animate-pulse" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-pink-100 font-medium">Instant Access</div>
                  <div className="text-base font-extrabold leading-none">Launch Web App 🔥</div>
                </div>
              </Link>

              <a
                href="#download"
                className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-zinc-200 hover:border-[#FD3A73]/40 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download className="h-5 w-5 text-[#FD3A73]" />
                <span>Download Android APK</span>
              </a>
            </div>

            {/* Micro-Social Proof */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Real Verified Singles</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#FD3A73]" />
                <span>E2EE Private Calls · Zero Number Sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-400" />
                <span>Public Daylight Date Spots</span>
              </div>
            </div>
          </div>

          {/* Right Phone Showcase Column */}
          <div className="flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[340px] rounded-[44px] border-4 border-zinc-800 bg-black p-3 shadow-2xl shadow-purple-900/40">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-zinc-900 border border-zinc-800 z-20" />
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[34px] bg-zinc-950 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                  alt="Singles Preview"
                  className="h-full w-full object-cover"
                />

                {/* Radar Concentric Rings */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full border border-pink-500/30 animate-ping [animation-duration:3s]" />
                </div>

                {/* Top Badge with Official Logo */}
                <div className="absolute top-8 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                  <img src="/images/logo_emblem.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
                  <span>Verified · 350m Away</span>
                </div>

                {/* Bottom Card Profile */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 pt-12">
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>Ananya, 23</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Filter coffee, indie vinyls & spontaneous road trips ☕
                  </p>
                  <Link
                    href="/app"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>Connect On Web App →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: 360° REAL-TIME SPARK RADAR (Proximity Sweep) */}
      {/* ========================================================================= */}
      <section id="radar" className="py-20 px-6 border-t border-white/5 bg-[#090712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              Spontaneous Proximity
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              360° Spark Radar
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Skip 20-mile radius dead-ends. Discover verified singles within immediate walking distance.
            </p>

            {/* Interactive Radius Filter Pills */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 p-1">
              {[100, 300, 500, 1000].map((radius) => (
                <button
                  key={radius}
                  onClick={() => setSelectedRadius(radius)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    selectedRadius === radius
                      ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {radius < 1000 ? `${radius}m` : '1 km'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 hover:border-[#FD3A73]/40 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FD3A73]/20 text-[#FD3A73] mb-5 group-hover:scale-110 transition-transform">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Walking-Distance Singles</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
                Discover singles within your favorite cafe or campus right now. Zero bots, zero stale accounts—only real people active this hour.
              </p>
            </div>

            <div id="vibe-check" className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 hover:border-purple-500/40 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">3-Minute Video Vibe Check</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
                A private, timed 3-minute video encounter. No phone numbers exchanged. See if the real-life chemistry matches the profile before meeting up.
              </p>
            </div>

            <div id="dates" className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 hover:border-amber-500/40 transition-all group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <Coffee className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Verified Safe First Dates</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
                Curated romantic daylight spots (Blue Tokai, Diggin, Cyber Hub) with verified safety scores and exclusive dessert perks for Synkin matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: SYNKIN SHIELD (Safety First in Ice-Blue) */}
      {/* ========================================================================= */}
      <section id="safety" className="py-20 px-6 border-t border-white/5 bg-[#0B131E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
              Trust &amp; Empowerment
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              Built Around Your Safety &amp; Dignity
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Designed from the ground up to eliminate catfishing, unsolicited numbers, and safety anxiety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-sky-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Biometric Liveness</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Every member passes real-time selfie verification. Zero stolen photos or impersonators.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Proximity Privacy</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Exact GPS coordinates are never stored or displayed—only general walking distance.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-4">
                <MapPin className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Share My Date</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                One-tap live date itinerary sharing with trusted friends before you step out to cafe spots.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-4">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Zero Number Leaks</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Audio and video calls happen encrypted inside the app. Never reveal personal contact numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: CLOSING PUNCHLINE & DOWNLOAD */}
      {/* ========================================================================= */}
      <section id="download" className="py-24 px-6 border-t border-white/5 bg-[#07050d]">
        <div className="max-w-4xl mx-auto rounded-3xl border border-[#FD3A73]/30 bg-gradient-to-r from-pink-950/40 via-zinc-900 to-purple-950/40 p-8 sm:p-14 text-center shadow-2xl">
          {/* Centered Official Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-xl shadow-[#FD3A73]/30">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-2">
              <img
                src="/images/logo_emblem.png"
                alt="Synkin Emblem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            You&apos;ve Swiped Enough Screens.<br />
            <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
              Go Catch A Real Spark Tonight.
            </span>
          </h2>

          <p className="mt-4 max-w-xl mx-auto text-sm text-zinc-300 leading-relaxed">
            Available on Android and Web. Jump into the Web App directly on your browser or download the APK.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#FD3A73] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Zap className="h-5 w-5" />
              <span>Launch Web App Now →</span>
            </Link>

            <a
              href="https://play.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <Download className="h-5 w-5" />
              <span>Download Android APK</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#050308] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo_emblem.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>© 2026 Synkin Inc. Built on Next.js 15 &amp; React 19. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/app" className="text-[#FD3A73] hover:underline font-semibold">Web App</Link>
            <a href="/privacy-policy" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="/terms" className="hover:text-zinc-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
