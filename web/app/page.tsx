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
  Flame,
  Check,
  X,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function NextLandingPage() {
  const [selectedRadius, setSelectedRadius] = useState<number>(500);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCity, setActiveCity] = useState<string>('delhi');

  const radiusStats: Record<number, { walkTime: string; label: string; desc: string }> = {
    500: {
      walkTime: '4 min walk',
      label: 'Same Street & Cafes',
      desc: 'Instant spontaneous connection within walking distance',
    },
    1000: {
      walkTime: '9 min walk',
      label: 'Immediate Neighborhood',
      desc: 'Discover singles in your local sector or university campus',
    },
    2000: {
      walkTime: 'Short metro/drive',
      label: 'Metro & Market Hub',
      desc: 'Explore popular cafes and social hotspots nearby',
    },
    5000: {
      walkTime: '15 min commute',
      label: 'City Sector Coverage',
      desc: 'Wider proximity coverage for your commercial or tech corridor',
    },
  };

  const cityHubs: Record<
    string,
    { name: string; tag: string; hubs: string[]; cafes: string[]; status: string }
  > = {
    delhi: {
      name: 'Delhi NCR',
      tag: 'Connaught Place · Hauz Khas · Cyber Hub',
      hubs: ['Hauz Khas Social & Deer Park', 'Cyber Hub Gurgaon', 'Connaught Place Inner Circle', 'Noida Sector 18 & Advant'],
      cafes: ['Blue Tokai (SDA & Galleria)', 'Diggin (Chanakyapuri & Anand Lok)', 'Colocal Chocolaterie (Dhan Mill)', 'Third Wave Coffee (Cyber Hub)'],
      status: 'Live on Synkin Radar',
    },
    bangalore: {
      name: 'Bengaluru',
      tag: 'Koramangala · Indiranagar · HSR Layout',
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
      tag: 'Koregaon Park · FC Road · Kalyani Nagar',
      hubs: ['North Main Road Koregaon Park', 'FC Road Student Spine', 'Kalyani Nagar Joggers Park', 'Balewadi High Street'],
      cafes: ['German Bakery (Koregaon Park)', 'One O Eight Cafe (KP)', 'Third Wave Coffee (Aundh)', 'Le Plaisir (Deccan)'],
      status: 'Live on Synkin Radar',
    },
    hyderabad: {
      name: 'Hyderabad',
      tag: 'Jubilee Hills · Banjara Hills · Gachibowli',
      hubs: ['Road No. 36 Jubilee Hills', 'Banjara Hills Road 12', 'Gachibowli Tech Corridor', 'Durgam Cheruvu Lakefront'],
      cafes: ['Roastery Coffee House (Banjara Hills)', 'Concu (Jubilee Hills)', 'Autumn Leaf Cafe', 'Third Wave Coffee (Hitec City)'],
      status: 'Live on Synkin Radar',
    },
  };

  const faqs = [
    {
      q: 'How is Synkin different from Tinder, Bumble, or Hinge?',
      a: 'Traditional dating apps keep you trapped in endless messaging loops with people who live far away or have zero intention of meeting. Synkin uses a 360° Spark Radar to show singles within actual walking distance (500m - 5km). Instead of texting for weeks, matched singles take a 3-minute video vibe check to confirm chemistry, then meet at verified partner daylight cafes the same evening.',
    },
    {
      q: 'Is Synkin free to use for dating in India?',
      a: 'Yes! Joining Synkin, setting your proximity radar, discovering nearby singles, initiating matches, and conducting 3-minute video vibe checks is 100% free. There are no paywalls blocking you from connecting with real people.',
    },
    {
      q: 'Can I use Synkin directly in my mobile or desktop browser without downloading?',
      a: 'Absolutely. Synkin features an instant, progressive Web App accessible on any browser at synkin.in/app with zero download required. For users who prefer a native Android experience, we also provide a lightweight 75MB Android APK with direct download.',
    },
    {
      q: 'What is the 3-Minute Video Vibe Check and how does it prevent catfishing?',
      a: 'The Video Vibe Check is an end-to-end encrypted, timed 3-minute video call that unlocks once two people match. It allows both singles to see each other in real-time, hear their voices, and confirm authentic chemistry before committing to an in-person date. If both feel the spark, Synkin suggests a safe partner cafe; if not, the call ends automatically with zero awkwardness.',
    },
    {
      q: 'How does Synkin protect female safety and prevent phone number leaks?',
      a: "Female safety is Synkin's cornerstone. All messaging and HD video calls happen securely inside the app using WebRTC encryption—your personal phone number and social handles are NEVER revealed. Furthermore, Synkin includes mandatory selfie verification, 1-tap live date itinerary sharing with trusted friends, and strict Daylight Cafe partnerships.",
    },
    {
      q: 'What are Daylight Date Spots and how do they work?',
      a: 'Daylight Date Spots are curated, bustling public coffee houses (such as Blue Tokai, Third Wave Coffee, and Starbucks) partnered with Synkin. Meeting during daylight hours in well-lit public cafes ensures complete safety, eliminates awkward alcohol-heavy bar environments, and offers Synkin users exclusive perks like 15% off first-date orders.',
    },
    {
      q: 'Does the 360° Spark Radar expose my exact GPS location or home address?',
      a: 'Never. Synkin uses privacy-preserving radius fuzzing. Other users can only see approximate walking distance (e.g., "350m away" or "Within 1km"), never your exact pin, coordinates, building, or home address. You also have full control to toggle Incognito Mode anytime.',
    },
    {
      q: 'Where can I download the official Synkin Android APK?',
      a: 'You can download the official Golden APK directly from synkin.in/download/apk. It installs instantly with zero third-party bloat, fast load times, and automatic background OTA updates for smooth performance.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white overflow-x-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#FD3A73]/15 blur-[140px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-700/15 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[20%] h-[550px] w-[550px] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* NAVBAR (CLEAN & PROFESSIONAL - NO FAKE BANNER) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07050d]/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Official Synkin Logo ("Do Dil Upar Do Dot") */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30 group-hover:scale-105 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img
                  src="/images/logo_emblem.png"
                  alt="Synkin Logo - Real-time Dating"
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

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-zinc-300">
            <a href="#radar" className="hover:text-[#FD3A73] transition-colors">360° Radar</a>
            <a href="#vibe-check" className="hover:text-[#FD3A73] transition-colors">3-Min Vibe Check</a>
            <a href="#cafes" className="hover:text-[#FD3A73] transition-colors">Daylight Cafes</a>
            <a href="#comparison" className="hover:text-[#FD3A73] transition-colors">Why Synkin</a>
            <a href="#safety" className="hover:text-[#FD3A73] transition-colors">Safety Shield</a>
            <a href="#hubs" className="hover:text-[#FD3A73] transition-colors">Singles Hubs</a>
            <a href="#faq" className="hover:text-[#FD3A73] transition-colors">FAQs</a>
          </nav>

          {/* Navbar Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:text-white transition-all"
            >
              Login ⚡
            </button>
            <Link
              href="/app"
              className="rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              Find Your Spark →
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 px-6 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Category Pill Badges */}
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#FD3A73]/30 bg-[#FD3A73]/10 px-4 py-1.5 text-xs font-bold text-[#FD3A73] backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 animate-spin [animation-duration:8s]" />
              <span>THE SPONTANEOUS REAL-TIME DATING APP</span>
              <span className="text-zinc-500">·</span>
              <span className="text-emerald-400 font-semibold">Zero Number Sharing</span>
            </div>

            {/* Keyword-Rich H1 */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Stop Collecting Pen-Pals.<br />
              <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
                Catch A Real Spark Tonight.
              </span>
            </h1>

            {/* Seductive & High-Converting Subheadline */}
            <p className="mt-6 text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
              Traditional dating apps trap you in weeks of dry messaging with strangers you never meet. Synkin turns
              walking-distance proximity into instant chemistry with a <strong>360° Proximity Radar</strong>, private
              <strong> 3-Minute Video Vibe Checks</strong>, and safe daylight coffee dates.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href="/app"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#FD3A73] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#FD3A73]/35 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <Zap className="h-5 w-5" />
                <span>Launch Web App (No Download) →</span>
              </Link>

              <a
                href="/download/apk"
                download="Synkin.apk"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all text-center"
              >
                <Download className="h-5 w-5 text-[#FD3A73]" />
                <span>Download Android APK (75MB)</span>
              </a>
            </div>

            {/* Micro Trust Proof - 100% Genuine Features */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">100% Free Signup</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-[#FD3A73]" />
                <span>Zero Phone Number Leaks</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                <span>Selfie Liveness Verified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] rounded-[48px] border-[5px] border-white/10 bg-[#0B0817] p-3 shadow-2xl shadow-pink-950/40">
              {/* Phone Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 h-4 w-28 rounded-full bg-black/80 border border-white/10 z-20 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FD3A73]/80 animate-pulse" />
              </div>

              {/* Inside Phone Screen */}
              <div className="relative h-full w-full rounded-[38px] overflow-hidden bg-gradient-to-b from-[#120D24] to-[#080511] flex flex-col justify-between">
                {/* Profile Image with Radar Visual */}
                <div className="relative h-full w-full">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                    alt="Verified Singles Nearby on Synkin"
                    className="h-full w-full object-cover"
                  />

                  {/* Concentric Pulsing Radar Rings */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="h-48 w-48 rounded-full border border-pink-500/30 animate-ping [animation-duration:2.8s]" />
                    <div className="h-72 w-72 rounded-full border border-purple-500/20 animate-ping [animation-duration:3.8s]" />
                  </div>

                  {/* Top Floating Badge */}
                  <div className="absolute top-10 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-lg">
                    <img src="/images/logo_emblem.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
                    <span>Verified · 350m Walking Distance</span>
                  </div>

                  {/* Live Profile Overlay Card */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-5 pt-16">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-white flex items-center gap-2">
                        <span>Ananya, 23</span>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FD3A73] bg-[#FD3A73]/10 px-2 py-0.5 rounded-md border border-[#FD3A73]/20">
                        Nearby
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 mt-1.5 leading-snug">
                      Filter coffee, vinyl records & spontaneous late-night bookstore runs ☕
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400">
                      <MapPin className="h-3 w-3 text-[#FD3A73]" />
                      <span>Near Blue Tokai Coffee Roasters (4 min walk)</span>
                    </div>

                    <Link
                      href="/app"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Zap className="h-3.5 w-3.5" />
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
      {/* SECTION 2: ARCHITECTURAL PILLARS (GENUINE CORE VALUES) */}
      {/* ========================================================================= */}
      <section className="border-y border-white/[0.08] bg-[#0A0714] py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-2xl sm:text-3xl font-black text-white">
              <span className="text-[#FD3A73]">500m</span>
              <span className="text-base text-zinc-400 font-semibold">- 5km</span>
            </div>
            <p className="text-xs text-zinc-400 font-semibold mt-1 uppercase tracking-wider">Walking Proximity</p>
            <span className="text-[10px] text-zinc-500 mt-0.5">Zero distant matches</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">Selfie Check</div>
            <p className="text-xs text-zinc-400 font-semibold mt-1 uppercase tracking-wider">Liveness Verification</p>
            <span className="text-[10px] text-zinc-500 mt-0.5">Zero fake catfish accounts</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">3 Minutes</div>
            <p className="text-xs text-zinc-400 font-semibold mt-1 uppercase tracking-wider">Video Vibe Check</p>
            <span className="text-[10px] text-zinc-500 mt-0.5">Face-to-face chemistry</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-2xl sm:text-3xl font-black text-sky-400">256-Bit</div>
            <p className="text-xs text-zinc-400 font-semibold mt-1 uppercase tracking-wider">Zero-Knowledge Privacy</p>
            <span className="text-[10px] text-zinc-500 mt-0.5">No phone numbers revealed</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: COMPARISON MATRIX (Why Traditional Apps Fail vs Synkin) */}
      {/* ========================================================================= */}
      <section id="comparison" className="py-24 px-6 border-b border-white/5 bg-[#07050d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              The Reality Check
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Why Traditional Dating Is Broken.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Swiping fatigue is real. See how Synkin eliminates ghosting, catfishing, and dry conversations.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-12 border-b border-white/10 bg-white/[0.03] p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-4 sm:col-span-5">The Experience</div>
              <div className="col-span-4 sm:col-span-3 text-center text-rose-400">Legacy Apps (Tinder/Bumble)</div>
              <div className="col-span-4 text-center text-[#FD3A73]">Synkin Real-Time</div>
            </div>

            <div className="divide-y divide-white/[0.06] text-xs sm:text-sm">
              {/* Row 1 */}
              <div className="grid grid-cols-12 items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 sm:col-span-5 font-semibold text-white">
                  Match Proximity
                  <p className="text-[11px] text-zinc-400 font-normal mt-0.5 hidden sm:block">
                    Where your matches actually live
                  </p>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">15-40 km away across traffic</span>
                </div>
                <div className="col-span-4 text-center font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>500m - 5km Walking Radius</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 sm:col-span-5 font-semibold text-white">
                  Chemistry & Vibe Verification
                  <p className="text-[11px] text-zinc-400 font-normal mt-0.5 hidden sm:block">
                    Knowing who you are talking to
                  </p>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">Filtered selfies & catfish profiles</span>
                </div>
                <div className="col-span-4 text-center font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>3-Minute Encrypted Video Vibe</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 sm:col-span-5 font-semibold text-white">
                  Time To Meet In Real Life
                  <p className="text-[11px] text-zinc-400 font-normal mt-0.5 hidden sm:block">
                    From initial hello to face-to-face date
                  </p>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">2-3 weeks of dry texting or ghosted</span>
                </div>
                <div className="col-span-4 text-center font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Same Evening (Within Walking Reach)</span>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-12 items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 sm:col-span-5 font-semibold text-white">
                  First Date Environment
                  <p className="text-[11px] text-zinc-400 font-normal mt-0.5 hidden sm:block">
                    Where your first meetup takes place
                  </p>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">Awkward bars or isolated spots</span>
                </div>
                <div className="col-span-4 text-center font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Curated Daylight Cafes with Perks</span>
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-12 items-center p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 sm:col-span-5 font-semibold text-white">
                  Contact Privacy & Safety
                  <p className="text-[11px] text-zinc-400 font-normal mt-0.5 hidden sm:block">
                    Protection of your personal identity
                  </p>
                </div>
                <div className="col-span-4 sm:col-span-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">Forced to share WhatsApp number</span>
                </div>
                <div className="col-span-4 text-center font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Zero Number Sharing (In-App Calling)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: 360° REAL-TIME SPARK RADAR */}
      {/* ========================================================================= */}
      <section id="radar" className="py-24 px-6 border-b border-white/5 bg-[#090712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              Spontaneous Proximity
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              360° Spark Radar
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Find verified singles sitting in the cafe down your street, reading in the library, or walking through your
              neighborhood right now.
            </p>

            {/* Interactive Radius Selector */}
            <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
              {[500, 1000, 2000, 5000].map((radius) => (
                <button
                  key={radius}
                  onClick={() => setSelectedRadius(radius)}
                  className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRadius === radius
                      ? 'bg-[#FD3A73] text-white shadow-lg shadow-[#FD3A73]/30 scale-105'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
                </button>
              ))}
            </div>

            {/* Genuine Status Pill */}
            <div className="mt-4 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Proximity Range: {radiusStats[selectedRadius].walkTime} ({radiusStats[selectedRadius].label}) — {radiusStats[selectedRadius].desc}</span>
            </div>
          </div>

          {/* 3 Radar Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 hover:border-[#FD3A73]/40 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FD3A73]/20 text-[#FD3A73] mb-6">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Walking-Distance Radar</h3>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Stop matching with singles who live 30 kilometers across city gridlock. Synkin connects you with people
                you can realistically meet in under 15 minutes.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 hover:border-purple-500/40 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-6">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Spontaneous Attraction</h3>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Catch eyes across the room or discover someone on your commute. When two people trigger their spark radar
                within proximity, chemistry happens naturally.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 hover:border-cyan-500/40 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Radius Fuzzing Privacy</h3>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                Your exact GPS coordinates are NEVER revealed. Distance is fuzzed to approximate walking zones to protect
                your residential address and workplace security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: 3-MINUTE VIDEO VIBE CHECK */}
      {/* ========================================================================= */}
      <section id="vibe-check" className="py-24 px-6 border-b border-white/5 bg-[#07050d]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Zero Catfishing · Mutual Chemistry
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              The 3-Minute<br />
              <span className="bg-gradient-to-r from-purple-400 to-[#FD3A73] bg-clip-text text-transparent">
                Video Vibe Check.
              </span>
            </h2>
            <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
              Ever texted someone for two weeks only to realize within 10 seconds of meeting that there is zero chemistry?
              Synkin solves this forever.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Mutual Match Unlocks Call</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Both of you agree to a fast 3-minute video check. No phone numbers or Instagram handles are exchanged.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FD3A73]/20 text-[#FD3A73] font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">3-Minute Countdown On Screen</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    See authentic expressions, hear their laugh, and feel the natural vibe in crisp WebRTC HD video.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Mutual Coffee Decision</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Both feel the spark? Synkin automatically suggests a nearby partner cafe. If not, the call ends
                    gracefully with zero hurt feelings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/30 to-black p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Live Vibe Check</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                  <Clock className="h-3.5 w-3.5" />
                  <span>02:14 Remaining</span>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80"
                  alt="Video Vibe Check on Synkin Dating App"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  Sneha, 24 · Hauz Khas
                </div>

                <div className="absolute top-3 right-3 h-20 w-16 rounded-xl border border-white/30 overflow-hidden bg-zinc-800 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80"
                    alt="Self Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/15 transition-all">
                  End Call ✕
                </button>
                <Link
                  href="/app"
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-2.5 text-xs font-bold text-white text-center shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 transition-all"
                >
                  Meet for Coffee ☕
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: DAYLIGHT DATE SPOTS (Safe Public Cafes) */}
      {/* ========================================================================= */}
      <section id="cafes" className="py-24 px-6 border-b border-white/5 bg-[#090712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Safe Daylight Dates
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Curated Daylight Partner Cafes.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              No shady bars or late-night uncertainty. We partner with the best aesthetic coffee houses in your city to
              provide safe, well-lit environments and 15% off your first-date coffee.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cafe 1: Blue Tokai */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-emerald-500/40 transition-all group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                <img
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80"
                  alt="Blue Tokai Coffee Roasters Date Spot"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Verified Partner · 15% Off
              </span>
              <h4 className="text-lg font-bold text-white mt-2">Blue Tokai Coffee</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Artisanal pour-overs, relaxed ambient music, and great lighting for conversation.
              </p>
            </div>

            {/* Cafe 2: Third Wave Coffee */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-emerald-500/40 transition-all group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80"
                  alt="Third Wave Coffee Date Spot"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Verified Partner · 15% Off
              </span>
              <h4 className="text-lg font-bold text-white mt-2">Third Wave Coffee</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Vibrant tech & creative crowd, cozy booths, and signature cinnamon iced lattes.
              </p>
            </div>

            {/* Cafe 3: Starbucks */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-emerald-500/40 transition-all group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80"
                  alt="Starbucks Coffee Date Spot"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Public Daylight Hub
              </span>
              <h4 className="text-lg font-bold text-white mt-2">Starbucks Coffee</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Familiar comfort, bustling public presence, and foolproof low-pressure first dates.
              </p>
            </div>

            {/* Cafe 4: Diggin */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 hover:border-emerald-500/40 transition-all group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-900">
                <img
                  src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&auto=format&fit=crop&q=80"
                  alt="Diggin Cafe Romantic Spot"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Aesthetic Romantic Spot
              </span>
              <h4 className="text-lg font-bold text-white mt-2">Diggin Cafe</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Lush greenery, fairy-lit courtyards, and handcrafted Italian pizzas and gelatos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: HOW SYNKIN WORKS (4 Simple Steps) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 px-6 border-b border-white/5 bg-[#07050d]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              Frictionless Real-Life Dating
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              How Synkin Works in 4 Steps.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              From opening the app to sitting across each other with iced coffee in less than an hour.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-4xl font-black text-[#FD3A73]/40">01</span>
              <h3 className="text-lg font-bold text-white mt-3">Open Web App or APK</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Launch directly in your phone browser at synkin.in/app or download our fast 75MB APK. Instant signup in
                under 30 seconds.
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-4xl font-black text-[#FD3A73]/40">02</span>
              <h3 className="text-lg font-bold text-white mt-3">Radar Sweeps Walking Area</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Set your radius (500m to 5km). See verified singles active right around you in real-time without fake
                distant profiles.
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-4xl font-black text-[#FD3A73]/40">03</span>
              <h3 className="text-lg font-bold text-white mt-3">3-Min Video Vibe Check</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                When mutual sparks ignite, enter a fast 3-minute video call. Check authentic chemistry and vibe before
                stepping out.
              </p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-4xl font-black text-[#FD3A73]/40">04</span>
              <h3 className="text-lg font-bold text-white mt-3">Coffee at a Partner Cafe</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Meet at a safe, curated daylight cafe nearby. Enjoy a low-pressure real-world conversation with 15% off
                your coffee bill.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: SAFETY SHIELD & ZERO-KNOWLEDGE PRIVACY */}
      {/* ========================================================================= */}
      <section id="safety" className="py-24 px-6 border-b border-white/5 bg-[#090712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
              Female Safety First
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Safety Shield Architecture.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              We engineered Synkin from the ground up so you never have to hand over personal numbers or worry about
              unsafe encounters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-sky-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mb-4">
                <PhoneOff className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Zero Number Sharing</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                High-definition audio and video calls run entirely inside the app. Never reveal your phone number or WhatsApp.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Selfie Liveness Shield</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                AI-powered facial liveness checks prevent bots, impersonators, and catfish accounts from entering the radar.
              </p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">1-Tap Live Date SOS</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Share your verified cafe date spot and live itinerary with your best friends or family with one tap before
                stepping out.
              </p>
            </div>

            <div className="rounded-3xl border border-pink-500/20 bg-slate-900/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-white text-base">Discreet Incognito Mode</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Toggle your profile visible only when you are in the mood for coffee. Disappear from the radar anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: LOCAL SINGLES DATING HUBS (GENUINE STATUS - NO FAKE NUMBERS) */}
      {/* ========================================================================= */}
      <section id="hubs" className="py-24 px-6 border-b border-white/5 bg-[#07050d]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FD3A73]">
              Local Proximity Hubs
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Singles Hubs In Your City.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Synkin is active across the premier social and cafe districts of India. Explore where sparks happen.
            </p>

            {/* City Tabs */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {Object.keys(cityHubs).map((cityKey) => (
                <button
                  key={cityKey}
                  onClick={() => setActiveCity(cityKey)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeCity === cityKey
                      ? 'bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] text-white shadow-lg shadow-[#FD3A73]/25'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  {cityHubs[cityKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Active City Details Card */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4">
              <div>
                <h3 className="text-2xl font-black text-white">{cityHubs[activeCity].name} Dating Radar</h3>
                <p className="text-xs text-[#FD3A73] font-semibold mt-1">{cityHubs[activeCity].tag}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{cityHubs[activeCity].status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Popular Singles Hotspots</h4>
                <ul className="space-y-2.5 text-xs text-zinc-200">
                  {cityHubs[activeCity].hubs.map((hub, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#FD3A73] shrink-0" />
                      <span>{hub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Verified Daylight Partner Cafes</h4>
                <ul className="space-y-2.5 text-xs text-zinc-200">
                  {cityHubs[activeCity].cafes.map((cafe, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Coffee className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{cafe}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-zinc-400">
                Looking for spontaneous dates in {cityHubs[activeCity].name}?
              </span>
              <Link
                href="/app"
                className="rounded-xl bg-[#FD3A73] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 hover:brightness-110 transition-all"
              >
                Scan {cityHubs[activeCity].name} Radar Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: INTERACTIVE SCHEMA-BACKED FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 px-6 border-b border-white/5 bg-[#090712]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions.
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Everything you need to know about Synkin, the 360° Spark Radar, Video Vibe Checks, and safety.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:text-[#FD3A73] transition-colors gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#FD3A73]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/5">
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
      {/* SECTION 11: CLOSING PUNCHLINE & DOWNLOAD CARD */}
      {/* ========================================================================= */}
      <section id="download" className="py-28 px-6 bg-[#07050d]">
        <div className="max-w-5xl mx-auto rounded-3xl border border-[#FD3A73]/30 bg-gradient-to-r from-pink-950/40 via-zinc-900 to-purple-950/40 p-8 sm:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-[#FD3A73]/20 blur-3xl pointer-events-none" />

          {/* Centered Official Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-xl shadow-[#FD3A73]/30">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-2">
              <img
                src="/images/logo_emblem.png"
                alt="Synkin Official Emblem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            You've Swiped Enough Screens.<br />
            <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
              Go Catch A Real Spark Tonight.
            </span>
          </h2>

          <p className="mt-4 max-w-xl mx-auto text-sm text-zinc-300 leading-relaxed">
            Available instantly on your browser or installable as a native Android APK. Free to sign up. No credit card.
            Zero pen-pals.
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
              download="Synkin.apk"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all"
            >
              <Download className="h-5 w-5 text-[#FD3A73]" />
              <span>Download Android APK (75MB)</span>
            </a>
          </div>

          <div className="mt-6 text-xs text-zinc-400 flex items-center justify-center gap-4">
            <span>✓ Android 8.0+</span>
            <span>✓ All Modern Browsers (Chrome, Safari, Edge)</span>
            <span>✓ 100% Free Forever</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MEGA FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#050308] pt-16 pb-12 px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FD3A73] p-1 shadow-md shadow-[#FD3A73]/30">
                <img src="/images/logo_emblem.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Synkin is India's fastest-growing real-time proximity dating platform. Designed for spontaneous attraction,
              video vibe checks, and safe daylight coffee dates.
            </p>
            <div className="mt-4 text-[11px] text-zinc-500">
              HQ: New Delhi, India · Server Region: ap-south-1 (Mumbai)
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/app" className="hover:text-white transition-colors">Web App</Link></li>
              <li><a href="/download/apk" className="hover:text-white transition-colors">Android APK</a></li>
              <li><a href="#radar" className="hover:text-white transition-colors">360° Spark Radar</a></li>
              <li><a href="#vibe-check" className="hover:text-white transition-colors">3-Min Vibe Check</a></li>
              <li><a href="#cafes" className="hover:text-white transition-colors">Daylight Cafes</a></li>
            </ul>
          </div>

          {/* Col 3: Popular Cities */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Dating Hubs</h4>
            <ul className="space-y-2.5">
              <li><a href="#hubs" className="hover:text-white transition-colors">Delhi NCR Dating</a></li>
              <li><a href="#hubs" className="hover:text-white transition-colors">Bengaluru Singles</a></li>
              <li><a href="#hubs" className="hover:text-white transition-colors">Mumbai Dating Hub</a></li>
              <li><a href="#hubs" className="hover:text-white transition-colors">Pune Cafe Meetups</a></li>
              <li><a href="#hubs" className="hover:text-white transition-colors">Hyderabad Sparks</a></li>
            </ul>
          </div>

          {/* Col 4: Safety & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Safety & Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="#safety" className="hover:text-white transition-colors">Safety Shield</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Safety Guidelines</a></li>
              <li><a href="mailto:support@synkin.in" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo_emblem.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>© 2026 Synkin Inc. Built with Next.js 15 & React 19. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-zinc-400">
            <Link href="/app" className="text-[#FD3A73] hover:underline font-semibold">Launch App</Link>
            <a href="/privacy-policy" className="hover:text-zinc-200">Privacy</a>
            <a href="/terms" className="hover:text-zinc-200">Terms</a>
          </div>
        </div>
      </footer>

      {/* Interactive Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          window.location.href = '/app';
        }}
      />
    </div>
  );
}
