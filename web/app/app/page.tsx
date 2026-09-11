'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function WebAppPortal() {
  useEffect(() => {
    // Dynamically inject the exact Expo React Native Web application bundle
    const scriptId = 'expo-web-bundle';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = '/app/_expo/static/js/web/index-91dc49b0979d50b0fa990b2eb3b0bcad.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-[#050308] text-white font-sans overflow-hidden select-none">
      {/* Ambient Backdrop Gradients */}
      <div className="fixed -left-24 top-1/4 h-[450px] w-[450px] rounded-full bg-[#FD3A73]/15 blur-[100px] pointer-events-none z-0" />
      <div className="fixed -right-24 bottom-1/4 h-[450px] w-[450px] rounded-full bg-purple-700/15 blur-[100px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* DESKTOP LEFT SIDEBAR (Hidden on mobile / tablet, visible on lg screens) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col fixed left-8 xl:left-16 top-1/2 -translate-y-1/2 w-[300px] xl:w-[340px] z-20 gap-5">
        {/* Back to Landing Page Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#FD3A73] px-4 py-2 rounded-full bg-[#FD3A73]/10 border border-[#FD3A73]/25 w-fit hover:bg-[#FD3A73]/20 hover:-translate-x-1 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back to Showcase</span>
        </Link>

        {/* Official Synkin Logo ("Do Dil Upar Do Dot") */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
              <img
                src="/images/logo_emblem.png"
                alt="Synkin Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              Synkin<span className="text-[#FD3A73]">.</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FD3A73] mt-1">
              Realtime Attraction
            </span>
          </div>
        </div>

        {/* Features Glass Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            140+ Singles Active Nearby
          </div>

          <div className="flex items-start gap-3 pt-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400 text-sm flex-shrink-0">
              🎯
            </div>
            <div>
              <div className="text-xs font-bold text-white">360° Spark Radar</div>
              <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                See verified singles active right now within walking distance.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 text-sm flex-shrink-0">
              📹
            </div>
            <div>
              <div className="text-xs font-bold text-white">3-Min Vibe Check</div>
              <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Private timed video encounter. Zero phone number exchange.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 text-sm flex-shrink-0">
              ☕
            </div>
            <div>
              <div className="text-xs font-bold text-white">Safe Date Spots</div>
              <div className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Curated daylight cafes with verified safety score.
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 px-1">
          <span>🔒 End-to-End Encrypted</span>
          <span>•</span>
          <span>🛡️ 100% Real Profiles</span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* CENTER PHONE STAGE (Hosts the exact React Native Expo App) */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full h-full lg:max-w-[430px] lg:h-[min(94vh,900px)] flex flex-col items-center justify-center lg:p-2.5 lg:rounded-[44px] lg:bg-gradient-to-b lg:from-white/10 lg:via-white/5 lg:to-pink-500/15 lg:shadow-[0_30px_100px_-20px_rgba(253,58,115,0.35)]">
        {/* React Native Web Mounting Point */}
        <div
          id="root"
          className="relative w-full h-full bg-black overflow-hidden lg:rounded-[36px] lg:border lg:border-white/10 flex"
        >
          {/* Fallback loader before Expo JS bundle executes */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white gap-3 pointer-events-none">
            <img
              src="/images/logo_emblem.png"
              alt="Synkin Loading"
              className="w-16 h-16 object-contain animate-pulse"
            />
            <div className="text-xs font-semibold tracking-wider text-pink-400">
              Connecting to Spark Radar...
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* DESKTOP RIGHT SIDEBAR (Hidden on mobile / tablet, visible on lg screens) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col fixed right-8 xl:right-16 top-1/2 -translate-y-1/2 w-[300px] xl:w-[340px] z-20 gap-5">
        {/* QR Code Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-xl shadow-2xl text-center">
          <div className="text-sm font-bold text-white">Open on Your Phone 📲</div>
          <div className="text-xs text-zinc-400 mt-1">
            Scan with your mobile camera to launch Synkin Web directly
          </div>

          <div className="mx-auto my-3.5 flex h-44 w-44 items-center justify-center rounded-2xl border-2 border-[#FD3A73]/40 bg-[#0d0817] p-2.5 shadow-lg shadow-[#FD3A73]/25">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=http://3.108.217.155:8082/app&color=FD3A73&bgcolor=0D0817"
              alt="Scan QR code for Synkin mobile web"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>

          <a
            href="/#download"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#b81855] py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            <span>Download Android APK</span>
          </a>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-bold text-white mb-2">Desktop Shortcuts</div>
          <div className="flex items-center justify-between text-xs text-zinc-300 py-1 border-b border-white/5">
            <span>Pass / Nope</span>
            <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pink-400">
              ←
            </kbd>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-300 py-1 border-b border-white/5">
            <span>Like / Synk</span>
            <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pink-400">
              →
            </kbd>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-300 py-1 border-b border-white/5">
            <span>Super Synk</span>
            <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pink-400">
              ↑
            </kbd>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-300 py-1">
            <span>Next Photo</span>
            <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-pink-400">
              Space
            </kbd>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500">
          <a href="/privacy-policy" className="hover:text-pink-400 transition">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-pink-400 transition">Terms</a>
          <span>•</span>
          <span>© 2026 Synkin Inc.</span>
        </div>
      </aside>
    </div>
  );
}
