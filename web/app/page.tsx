'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Compass,
  Video,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Zap,
  Lock,
} from 'lucide-react';

export default function ComingSoonPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [vipNumber, setVipNumber] = useState(1428);

  // Live countdown state (Target: 28 days launch window)
  const [timeLeft, setTimeLeft] = useState({
    days: 28,
    hours: 14,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      setVipNumber(Math.floor(1000 + Math.random() * 9000));
    }, 800);
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-white selection:bg-[#ec4899] selection:text-white font-['Poppins',sans-serif] overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-pink-600/15 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-48 w-[450px] h-[450px] bg-rose-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 -right-48 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Header / Brand Nav */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ec4899] to-[#8b5cf6] p-[1px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#0a0a0f] rounded-2xl flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#ec4899] animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Synkin
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-widest text-[#ec4899]">
              Real-Time Sparks
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Private Beta In Progress</span>
          </div>
          <a
            href="#waitlist"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all backdrop-blur-md"
          >
            Join VIP Waitlist
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24 text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-pink-400 animate-bounce" />
          <span className="text-xs font-semibold tracking-wider text-pink-300 uppercase">
            The Next Era of Dating • Coming Soon
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Stop Collecting Pen-Pals.{' '}
          <span className="block mt-2 bg-gradient-to-r from-[#ec4899] via-[#f43f5e] to-[#8b5cf6] bg-clip-text text-transparent">
            Meet Walking-Distance Singles.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          No ghosting. No endless texting weeks in advance. Synkin&apos;s 360° Proximity Radar connects you with verified singles nearby for instant daylight cafe meetups and 3-minute encrypted video vibe checks.
        </p>

        {/* Countdown Timer */}
        <div className="mb-14">
          <p className="text-xs uppercase font-semibold tracking-widest text-slate-500 mb-4">
            Private Launch Begins In
          </p>
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto">
            {[
              { label: 'Days', val: timeLeft.days },
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Minutes', val: timeLeft.minutes },
              { label: 'Seconds', val: timeLeft.seconds },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="relative group p-4 sm:p-5 rounded-2xl bg-[#0d0f18]/80 border border-white/10 backdrop-blur-xl shadow-xl hover:border-pink-500/40 transition-all duration-300"
              >
                <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {String(unit.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">
                  {unit.label}
                </div>
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist Box */}
        <div id="waitlist" className="max-w-xl mx-auto mb-16 scroll-mt-20">
          {!isJoined ? (
            <form onSubmit={handleJoinWaitlist} className="space-y-3">
              <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[#0f111d]/90 border border-white/15 backdrop-blur-2xl shadow-2xl focus-within:border-pink-500/60 transition-all">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter email or mobile number..."
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#ec4899] via-[#f43f5e] to-[#8b5cf6] hover:opacity-95 shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Get VIP Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center space-x-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  Zero Spam Guarantee
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Lock className="w-3.5 h-3.5 text-pink-400 mr-1" />
                  100% Privacy Protected
                </span>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-pink-500/15 to-purple-600/10 border border-pink-500/40 backdrop-blur-2xl text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                You&apos;re On The VIP List!
              </h3>
              <p className="text-xs text-slate-300 mb-3">
                Your Priority Access Pass has been issued. You will receive an exclusive invite before the public launch.
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-black/60 border border-pink-500/30 text-xs font-mono font-bold text-pink-300">
                VIP PASS #00{vipNumber}
              </div>
            </div>
          )}
        </div>

        {/* Live Social Proof */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 mb-20">
          <div className="flex items-center -space-x-2">
            {['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#000000] flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {['D', 'S', 'R', 'A'][i]}
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="font-semibold text-white">2,850+ Singles Waitlisted</div>
            <div className="text-[11px] text-slate-500">In Delhi NCR, Bangalore & Mumbai</div>
          </div>
        </div>

        {/* Feature Highlights Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-20">
          {/* Card 1: 360 Radar */}
          <div className="relative p-6 rounded-3xl bg-[#0c0e17]/80 border border-white/10 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">360° Spark Radar</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real-time proximity scanning discovers singles within 500m walking distance. No long-distance pen pals or catfish.
            </p>
            <div className="inline-flex items-center text-[11px] font-semibold text-pink-400">
              <span>Walking-Distance Only</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: 3-Min Video Vibe Check */}
          <div className="relative p-6 rounded-3xl bg-[#0c0e17]/80 border border-white/10 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3-Min Video Vibe Check</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A timed, ephemeral 3-minute encrypted video check to verify authentic chemistry before meeting or exchanging contacts.
            </p>
            <div className="inline-flex items-center text-[11px] font-semibold text-purple-400">
              <span>Anti-Catfish Protected</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Zero Number Sharing */}
          <div className="relative p-6 rounded-3xl bg-[#0c0e17]/80 border border-white/10 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Number Sharing</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Complete privacy with end-to-end encrypted in-app calling, selfie liveness checks, and verified daylight cafe itineraries.
            </p>
            <div className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
              <span>100% Daylight Safe</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>

        {/* Platform Badges */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 backdrop-blur-xl mb-16">
          <p className="text-xs uppercase font-semibold tracking-widest text-slate-400 mb-6">
            Available Soon On All Platforms
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-[#0a0a0f] border border-white/15 text-left opacity-90 hover:opacity-100 transition-opacity">
              <Smartphone className="w-6 h-6 text-pink-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Android App</div>
                <div className="text-xs font-semibold text-white">Google Play Store</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-[#0a0a0f] border border-white/15 text-left opacity-90 hover:opacity-100 transition-opacity">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">iOS App</div>
                <div className="text-xs font-semibold text-white">Apple App Store</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-[#0a0a0f] border border-white/15 text-left opacity-90 hover:opacity-100 transition-opacity">
              <Zap className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Browser Version</div>
                <div className="text-xs font-semibold text-white">Progressive Web App</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Phase 1 Rollout:</span>
          {['📍 Delhi NCR', '📍 Bangalore', '📍 Mumbai', '📍 Pune', '📍 Hyderabad'].map((city, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-[11px]"
            >
              {city}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050508] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-bold text-white tracking-tight">Synkin Inc.</span>
            <span className="text-xs text-slate-500">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/safety" className="hover:text-white transition-colors">
              Safety Guidelines
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
