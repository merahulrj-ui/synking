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
  Shield,
  Eye,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  PhoneOff,
  Check,
  X,
  Smartphone,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function NextLandingPage() {
  const [selectedRadius, setSelectedRadius] = useState<number>(500);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCity, setActiveCity] = useState<string>('delhi');

  const radiusStats: Record<number, { walkTime: string; label: string; desc: string; sparks: string }> = {
    500: {
      walkTime: '4 min walk',
      label: 'Same Street & Cafes',
      desc: 'Instant spontaneous connection. Walk over to Blue Tokai or Third Wave Coffee within minutes.',
      sparks: '12 Sparks Live',
    },
    1000: {
      walkTime: '9 min walk',
      label: 'Immediate Neighborhood',
      desc: 'Discover active singles in your immediate local sector, residential block, or university campus.',
      sparks: '28 Sparks Live',
    },
    2000: {
      walkTime: 'Quick 5-min transit',
      label: 'Metro & Market Hub',
      desc: 'Explore popular social hubs, gourmet markets, and vibrant transit corridors right next to you.',
      sparks: '64 Sparks Live',
    },
    5000: {
      walkTime: '15 min corridor',
      label: 'City Sector Corridor',
      desc: 'Broad proximity sweep across major business parks, lifestyle districts, and nightlife lanes.',
      sparks: '140+ Sparks Live',
    },
  };

  const cityHubs: Record<
    string,
    { name: string; tag: string; hubs: string[]; cafes: string[]; status: string }
  > = {
    delhi: {
      name: 'Delhi NCR',
      tag: 'Connaught Place · Hauz Khas · Cyber Hub · Sector 18',
      hubs: ['Hauz Khas Social & Deer Park', 'Cyber Hub Gurgaon', 'Connaught Place Inner Circle', 'Noida Sector 18 & Advant'],
      cafes: ['Blue Tokai (SDA & Galleria)', 'Diggin (Chanakyapuri & Anand Lok)', 'Colocal Chocolaterie (Dhan Mill)', 'Third Wave Coffee (Cyber Hub)'],
      status: 'Live on Synkin Radar',
    },
    bangalore: {
      name: 'Bengaluru',
      tag: 'Koramangala · Indiranagar · HSR Layout · Church Street',
      hubs: ['Koramangala 5th Block', '100ft Road Indiranagar', 'HSR Sector 4 & 7', 'Church Street & Lavelle Road'],
      cafes: ['Third Wave Coffee (12th Main Indiranagar)', 'Blue Tokai (Koramangala)', 'Dyu Art Cafe (Koramangala)', 'Brik Oven (Church Street)'],
      status: 'Live on Synkin Radar',
    },
    mumbai: {
      name: 'Mumbai',
      tag: 'Bandra · BKC · Powai · Juhu',
      hubs: ['Pali Hill & Carter Road Bandra', 'BKC Gourmet District', 'Juhu Tara Road', 'Hiranandani Gardens Powai'],
      cafes: ['Subko Specialty Coffee (Bandra)', 'Blue Tokai (Bandra & BKC)', 'Kala Ghoda Cafe (Fort)', 'The Pantry (Colaba)'],
      status: 'Live on Synkin Radar',
    },
    pune: {
      name: 'Pune',
      tag: 'Koregaon Park · FC Road · Kalyani Nagar · Balewadi',
      hubs: ['North Main Road Koregaon Park', 'FC Road Student Spine', 'Kalyani Nagar Joggers Park', 'Balewadi High Street'],
      cafes: ['German Bakery (Koregaon Park)', 'One O Eight Cafe (KP)', 'Third Wave Coffee (Aundh)', 'Le Plaisir (Deccan)'],
      status: 'Live on Synkin Radar',
    },
    hyderabad: {
      name: 'Hyderabad',
      tag: 'Jubilee Hills · Banjara Hills · Gachibowli · Hitec City',
      hubs: ['Road No. 36 Jubilee Hills', 'Banjara Hills Road 12', 'Gachibowli Tech Corridor', 'Durgam Cheruvu Lakefront'],
      cafes: ['Roastery Coffee House (Banjara Hills)', 'Concu (Jubilee Hills)', 'Autumn Leaf Cafe', 'Third Wave Coffee (Hitec City)'],
      status: 'Live on Synkin Radar',
    },
  };

  const faqs = [
    {
      q: 'How is Synkin different from Tinder, Bumble, or Hinge?',
      a: 'Traditional dating apps trap you in weeks of dry messaging with people 30km away who never actually meet. Synkin uses a 360° Spark Radar to show singles within actual walking distance (500m - 5km). Instead of texting for weeks, matched singles take a private 3-minute video vibe check to confirm chemistry, then meet at verified partner daylight cafes the same evening.',
    },
    {
      q: 'Is Synkin free to use for dating in India?',
      a: 'Yes! Joining Synkin, setting your proximity radar, discovering nearby singles, initiating matches, and conducting 3-minute video vibe checks is 100% free. There are no paywalls blocking you from connecting with real people.',
    },
    {
      q: 'Can I use Synkin directly in my browser without downloading an app?',
      a: 'Absolutely. Synkin is a full Progressive Web App accessible on any browser at synkin.in/app with zero installation required. For users who prefer a dedicated Android app, our standalone Release APK is also available for direct 1-click download.',
    },
    {
      q: 'What is the 3-Minute Video Vibe Check and how does it stop catfishing?',
      a: 'The Video Vibe Check is an end-to-end encrypted, timed 180-second video call that unlocks once two people match. It allows both singles to see each other in real time, hear genuine voices, and confirm authentic chemistry before committing to an in-person date. When 3 minutes expire, the call automatically concludes with zero pressure or awkward goodbyes.',
    },
    {
      q: 'How does Synkin protect female safety and prevent phone number leaks?',
      a: "Female safety is Synkin's foundation. All audio and HD video calls happen securely inside the app over encrypted WebRTC channels—your personal phone number and social handles are NEVER revealed to anyone. Furthermore, Synkin includes mandatory 3D selfie verification, two-way mutual consent calling, and curated daylight public cafe partnerships.",
    },
    {
      q: 'What are Daylight Date Spots and how do they work?',
      a: 'Daylight Date Spots are curated, bustling public coffee houses (such as Blue Tokai, Third Wave Coffee, and Starbucks) partnered with Synkin. Meeting during daylight hours in well-lit public cafes eliminates awkward bar environments and ensures total safety, plus gives Synkin users exclusive 15% discount vouchers on first-date coffee.',
    },
    {
      q: 'Does the 360° Spark Radar expose my exact GPS location or home address?',
      a: 'Never. Synkin uses privacy-preserving radius fuzzing. Other users can only see approximate walking distance (e.g., "350m away" or "Within 1km"), never your exact pin, GPS coordinates, apartment, or home address. You also have full control to enable Incognito Mode anytime.',
    },
    {
      q: 'Where can I download the official Synkin Android APK?',
      a: 'You can download the official Release APK directly from synkin.in/download/apk. It installs instantly with zero third-party bloat, blazing-fast speed, and automatic background updates.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white overflow-x-hidden font-sans">
      {/* Dynamic Ambient Glow Anchors */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FD3A73]/12 via-purple-600/8 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* 1. FLOATING LUXURY NAVBAR */}
      {/* ========================================================================= */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#07050d]/85 px-5 sm:px-6 backdrop-blur-2xl shadow-2xl shadow-black/60">
          {/* Official Synkin Logo ("Do Dil Upar Do Dot") */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-md shadow-[#FD3A73]/25 group-hover:scale-105 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img
                  src="/images/logo_emblem.png"
                  alt="Synkin Logo - Realtime Attraction"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white leading-none">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#FD3A73] mt-0.5">
                Realtime Attraction
              </span>
            </div>
          </Link>

          {/* Clean 4 Core Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-300">
            <a href="#radar" className="hover:text-[#FD3A73] transition-colors">360° Radar</a>
            <a href="#vibe-check" className="hover:text-[#FD3A73] transition-colors">3-Min Vibe</a>
            <a href="#safety" className="hover:text-[#FD3A73] transition-colors">Safety Shield</a>
            <a href="#cafes" className="hover:text-[#FD3A73] transition-colors">Curated Cafes</a>
            <Link href="/blog" className="hover:text-[#FD3A73] transition-colors">Journal</Link>
          </nav>

          {/* Single Dominant CTA */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="hidden sm:inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
            >
              Sign In
            </button>
            <Link
              href="/app"
              className="rounded-full bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
            >
              Open App ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-16 px-6 sm:pt-20 sm:pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Focused Copy & Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Minimalist Proximity Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FD3A73]/30 bg-[#FD3A73]/10 px-3.5 py-1.5 text-xs font-bold text-[#FD3A73] backdrop-blur-md mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SPONTANEOUS PROXIMITY DATING</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300 font-medium">Zero Phone Number Sharing</span>
            </div>

            {/* Crisp, Punchy H1 */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.06]">
              Stop Collecting Pen-Pals.<br />
              <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
                Meet Someone Real Tonight.
              </span>
            </h1>

            {/* Clear Subheadline */}
            <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed font-normal">
              Skip 3 weeks of dry texting with people you never meet. Synkin turns walking-distance proximity into
              instant chemistry with a 360° radar, private 3-minute video vibe check, and same-day coffee at verified partner cafes.
            </p>

            {/* Clean Dual Conversion Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <Link
                href="/app"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <Zap className="h-4 w-4" />
                <span>Launch Web App (Instant Free) →</span>
              </Link>

              <a
                href="/download/apk"
                download="Synkin.apk"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all text-center"
              >
                <Download className="h-4 w-4 text-[#FD3A73]" />
                <span>Download Android APK</span>
              </a>
            </div>

            {/* Streamlined Trust Proof */}
            <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> 100% Free
              </span>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-[#FD3A73]" /> 3D Selfie Verified
              </span>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-purple-400" /> Zero Number Exposure
              </span>
            </div>
          </div>

          {/* Right Column: Hero Mockup with Radial Backlight & Floating Badges */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Dedicated Luxury Ambient Backlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#FD3A73]/25 to-purple-600/25 blur-[90px] -z-10" />

            {/* Floating Top Chip */}
            <div className="hidden sm:flex absolute -top-3 -left-6 z-30 items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl animate-bounce [animation-duration:6s]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>12 Singles Live within 500m</span>
            </div>

            {/* Floating Bottom Chip */}
            <div className="hidden sm:flex absolute -bottom-3 -right-4 z-30 items-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl">
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span>Blue Tokai · 4 min walk</span>
            </div>

            {/* Center Phone Simulator Frame */}
            <div className="relative w-full max-w-[320px] aspect-[9/18.5] rounded-[46px] border-[4px] border-white/20 bg-[#0B0817] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
              {/* Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-3.5 w-24 rounded-full bg-black border border-white/10 z-20 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-[#FD3A73]/90 animate-pulse" />
              </div>

              {/* Inside Screen Container */}
              <div className="relative h-full w-full rounded-[36px] overflow-hidden bg-gradient-to-b from-[#120D24] to-[#080511] flex flex-col justify-between">
                {/* Profile Photo */}
                <div className="relative h-full w-full">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                    alt="Active Spark Nearby"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* Smooth Concentric SVG Radar Wave */}
                  <div className="absolute top-7 right-7 pointer-events-none">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute h-10 w-10 rounded-full border border-[#FD3A73]/60 animate-ping [animation-duration:3s]" />
                      <span className="absolute h-6 w-6 rounded-full border border-[#FD3A73]/40 animate-ping [animation-duration:2s]" />
                      <div className="h-3.5 w-3.5 rounded-full bg-[#FD3A73] shadow-lg shadow-[#FD3A73]" />
                    </div>
                  </div>

                  {/* Proximity Badges */}
                  <div className="absolute top-12 left-4 flex flex-col gap-1.5">
                    <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30 w-fit">
                      🟢 Verified · 350m Away
                    </span>
                  </div>

                  {/* Card Content & Action */}
                  <div className="absolute bottom-4 inset-x-4">
                    <h3 className="text-xl font-bold text-white">Ananya, 23</h3>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      "At Blue Tokai reading. Catch my eye if you are around ☕"
                    </p>

                    <Link
                      href="/app"
                      className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/35 hover:brightness-110 transition-all"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Start 3-Min Vibe Check →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR CORE METRICS (TRUST BAR) */}
      {/* ========================================================================= */}
      <section className="border-y border-white/[0.08] bg-white/[0.01] py-8 px-6 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-black text-white">500m – 5km</div>
            <div className="text-xs font-semibold text-[#FD3A73] mt-1">Walking Reach Only</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Zero 30km ghosting</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-black text-white">100% Verified</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1">3D Selfie Liveness</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Zero bots or catfishing</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-black text-white">3 Minutes</div>
            <div className="text-xs font-semibold text-purple-400 mt-1">Timed Video Vibe</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Mutual chemistry check</div>
          </div>
          <div className="p-3">
            <div className="text-2xl sm:text-3xl font-black text-white">Zero Leaks</div>
            <div className="text-xs font-semibold text-[#FD3A73] mt-1">100% In-App WebRTC</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">No phone number shared</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE 4-STEP SYNKIN EXPERIENCE */}
      {/* ========================================================================= */}
      <section id="experience" className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FD3A73]">
              THE 4-STEP REAL-WORLD JOURNEY
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-white tracking-tight">
              From Radar Sweep To First Coffee Date
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400">
              No endless small talk. No fake profiles. A clear, safe 4-step path to spontaneous attraction.
            </p>
          </div>

          {/* 4 Unified Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* STEP 1: 360° RADAR */}
            <div id="radar" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-white/15 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#FD3A73] tracking-wider uppercase">STEP 01</span>
                  <span className="rounded-full bg-[#FD3A73]/15 border border-[#FD3A73]/30 px-3 py-0.5 text-[10px] font-bold text-[#FD3A73]">
                    Nearest Radar
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">360° Walking Proximity Radar</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Set your walking radius from 500m to 5km. Discover who is actively nearby in your favorite cafes,
                  residential sectors, or campus right now.
                </p>

                {/* Interactive Radius Bar */}
                <div className="mt-6 rounded-xl bg-black/40 border border-white/10 p-3.5">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-2.5">Select Radar Walking Reach:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setSelectedRadius(radius)}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          selectedRadius === radius
                            ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-white/5">
                    <span className="text-emerald-400 font-bold">{radiusStats[selectedRadius].sparks}</span>
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#FD3A73]" />
                      {radiusStats[selectedRadius].walkTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Privacy-fuzzed coordinates</span>
                <Link href="/app" className="text-[#FD3A73] font-bold hover:underline flex items-center gap-1">
                  Scan Radar <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* STEP 2: 3-MINUTE VIDEO VIBE CHECK */}
            <div id="vibe-check" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-white/15 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">STEP 02</span>
                  <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-0.5 text-[10px] font-bold text-purple-400">
                    Micro-Video Call
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">3-Minute Video Vibe Check</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Catch genuine micro-expressions and laughter before leaving home. An encrypted 180-second timed call
                  gives you zero awkwardness and zero pressure.
                </p>

                {/* Vibe Check Simulator Visual */}
                <div className="mt-6 rounded-xl bg-black/40 border border-white/10 p-3.5 flex items-center gap-3.5">
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-purple-500/40">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300"
                      alt="Call partner"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-purple-950/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">Sneha, 24</span>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        02:14
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      Mutual Chemistry Call · WebRTC Encrypted
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/app"
                      className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Coffee ☕
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Automatic conclude timer</span>
                <Link href="/app" className="text-purple-400 font-bold hover:underline flex items-center gap-1">
                  Try Vibe Call <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* STEP 3: ZERO-NUMBER SAFETY SHIELD */}
            <div id="safety" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-white/15 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">STEP 03</span>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-bold text-emerald-400">
                    Female-First Privacy
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Zero-Number Safety Shield</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Never expose your personal phone number, WhatsApp, or Instagram. All interactions remain completely inside
                  the encrypted Synkin app with a two-way mutual consent window.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 mb-1.5" />
                    <div className="text-xs font-bold text-white">No Contact Leaks</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Audio & video over WebRTC</div>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3">
                    <Lock className="h-4 w-4 text-[#FD3A73] mb-1.5" />
                    <div className="text-xs font-bold text-white">Mutual Consent</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Calls unlock only on dual yes</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>1-Tap Live SOS Itinerary</span>
                <Link href="/safety" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                  Safety Protocol <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* STEP 4: DAYLIGHT PARTNER CAFES */}
            <div id="cafes" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-white/15 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">STEP 04</span>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[10px] font-bold text-amber-400">
                    Safe Public Date
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Curated Daylight Date Cafes</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Say goodbye to shady bar bills. Meet during daylight hours in trusted public cafes like Blue Tokai,
                  Third Wave Coffee, and Starbucks with instant 15% first-date coffee vouchers.
                </p>

                {/* Partner Cafe Badges */}
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400">
                      BT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Blue Tokai</div>
                      <div className="text-[10px] text-amber-400">15% Off Voucher</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-white/5 p-3 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-xs font-black text-orange-400">
                      TW
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Third Wave</div>
                      <div className="text-[10px] text-amber-400">15% Off Voucher</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Verified well-lit public spots</span>
                <Link href="/app" className="text-amber-400 font-bold hover:underline flex items-center gap-1">
                  View Date Cafes <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THE REALITY CHECK (COMPARISON MATRIX) */}
      {/* ========================================================================= */}
      <section id="comparison" className="py-20 sm:py-28 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FD3A73]">
              WHY SYNKIN WINS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              The Reality Check
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Why modern singles are dumping infinite swiping for spontaneous real-time attraction.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-white/[0.04] p-4 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10">
              <div className="col-span-4">Experience</div>
              <div className="col-span-4 text-zinc-500">Legacy Dating Apps</div>
              <div className="col-span-4 text-[#FD3A73]">Synkin Real-Time</div>
            </div>

            <div className="divide-y divide-white/5 text-xs sm:text-sm">
              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Distance to Match</div>
                <div className="col-span-4 text-zinc-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-red-500 shrink-0" /> 15 – 45km across traffic
                </div>
                <div className="col-span-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" /> 500m – 5km walking reach
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Chemistry Check</div>
                <div className="col-span-4 text-zinc-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-red-500 shrink-0" /> 3 weeks of dry texting
                </div>
                <div className="col-span-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" /> 3-minute video vibe check
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Catfish Prevention</div>
                <div className="col-span-4 text-zinc-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-red-500 shrink-0" /> Old filters & AI photos
                </div>
                <div className="col-span-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Live camera verification
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">Contact Privacy</div>
                <div className="col-span-4 text-zinc-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-red-500 shrink-0" /> Forced to give phone #
                </div>
                <div className="col-span-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Zero numbers ever shared
                </div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-4 font-bold text-white">First Date Spot</div>
                <div className="col-span-4 text-zinc-400 flex items-center gap-1.5">
                  <X className="h-4 w-4 text-red-500 shrink-0" /> Awkward expensive bars
                </div>
                <div className="col-span-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" /> Curated daylight coffee
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CITY DATING CORRIDORS */}
      {/* ========================================================================= */}
      <section id="hubs" className="py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FD3A73]">
              METRO CITY CORRIDORS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Active Singles Nearby In Your City
            </h2>
          </div>

          {/* City Selection Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {Object.keys(cityHubs).map((cityKey) => (
              <button
                key={cityKey}
                onClick={() => setActiveCity(cityKey)}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeCity === cityKey
                    ? 'bg-[#FD3A73] text-white shadow-lg shadow-[#FD3A73]/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cityHubs[cityKey].name}
              </button>
            ))}
          </div>

          {/* Active City Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">{cityHubs[activeCity].name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{cityHubs[activeCity].tag}</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400 w-fit">
                {cityHubs[activeCity].status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#FD3A73] mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> High-Density Singles Hubs
                </div>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {cityHubs[activeCity].hubs.map((hub, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FD3A73]" />
                      <span>{hub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5" /> Curated First Date Cafes (15% Off)
                </div>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {cityHubs[activeCity].cafes.map((cafe, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{cafe}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7 pt-5 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Discover sparks active right now in {cityHubs[activeCity].name}</span>
              <Link
                href="/app"
                className="rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#FD3A73]/25 hover:brightness-110 transition-all"
              >
                Scan City Radar →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FD3A73]">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Everything You Need To Know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:text-[#FD3A73] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 text-zinc-400 ${
                        isOpen ? 'rotate-180 text-[#FD3A73]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CLOSING CONVERSION BANNER */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FD3A73]/20 via-purple-600/15 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto rounded-3xl border border-[#FD3A73]/30 bg-gradient-to-b from-[#140D24] to-[#07050d] p-8 sm:p-14 text-center shadow-2xl relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-400 mb-5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sparks Are Active Nearby Right Now</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            You've Swiped Enough Screens.<br />
            <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
              Go Catch A Real Spark Tonight.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Zero phone number exposure. Verified genuine humans. 3-minute video vibe check, then coffee at Blue Tokai.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#FD3A73]/35 hover:brightness-110 active:scale-95 transition-all text-center"
            >
              <Zap className="h-4 w-4" />
              <span>Launch Web App (No Download) →</span>
            </Link>

            <a
              href="/download/apk"
              download="Synkin.apk"
              className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-zinc-200 hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all text-center"
            >
              <Download className="h-4 w-4 text-[#FD3A73]" />
              <span>Download Android APK</span>
            </a>
          </div>

          <div className="mt-7 text-xs text-zinc-400">
            Available on Web Browser (Chrome, Safari) &amp; Android Standalone APK
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. REFINED LUXURY FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#050308] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-sm">
              <div className="h-full w-full rounded-[6px] bg-[#0A0714] p-1 flex items-center justify-center">
                <img
                  src="/images/logo_emblem.png"
                  alt="Synkin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <span className="font-bold text-white text-sm">Synkin.</span>
              <span className="block text-[10px] text-zinc-500">© 2026 Synkin · Jayanti Cybernetics (SMD Group). All rights reserved.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <a href="#radar" className="hover:text-white transition-colors">Radar</a>
            <a href="#vibe-check" className="hover:text-white transition-colors">3-Min Vibe</a>
            <a href="#safety" className="hover:text-white transition-colors">Safety</a>
            <a href="#cafes" className="hover:text-white transition-colors">Curated Cafes</a>
            <Link href="/blog" className="text-[#FD3A73] hover:underline font-semibold">Blogs</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Floating Launch Bar */}
      <div className="fixed bottom-4 inset-x-4 z-40 md:hidden">
        <div className="rounded-2xl border border-white/15 bg-[#07050d]/90 p-2.5 backdrop-blur-2xl shadow-2xl flex items-center gap-2">
          <Link
            href="/app"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 active:scale-95 transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Launch Instant Web App ⚡</span>
          </Link>
          <a
            href="/download/apk"
            download="Synkin.apk"
            className="rounded-xl border border-white/15 bg-white/5 p-3 text-zinc-300 hover:text-white active:scale-95 transition-all"
            aria-label="Download Android APK"
          >
            <Smartphone className="h-4 w-4 text-[#FD3A73]" />
          </a>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
