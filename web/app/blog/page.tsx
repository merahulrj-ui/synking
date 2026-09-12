'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  Coffee,
  Heart,
  Lock,
  Zap,
} from 'lucide-react';

export default function BlogIndexPage() {
  const articles = [
    {
      slug: 'why-sharing-phone-numbers-on-dating-apps-is-dangerous',
      title: 'Why Sharing Your Phone Number on Dating Apps is a Major Security Risk',
      excerpt:
        'From Truecaller identity lookups to unsolicited WhatsApp spam, discover why zero-knowledge WebRTC in-app calling is the new gold standard for modern romance.',
      category: 'Privacy & Safety',
      readTime: '4 min read',
      date: 'Sept 2026',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    },
    {
      slug: 'how-the-3-minute-video-vibe-check-eliminates-catfishing',
      title: 'The Death of Catfishing: How a 3-Minute Video Call Replaces Two Weeks of Texting',
      excerpt:
        'Swiping fatigue is real. Learn how real-time micro-expressions, genuine laughter, and timed consent windows save singles from ghosting and dry texting.',
      category: 'Dating Culture',
      readTime: '5 min read',
      date: 'Sept 2026',
      image:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    },
    {
      slug: 'best-first-date-coffee-spots-in-delhi-ncr-and-bengaluru',
      title: 'Top 10 Daylight First Date Cafes in Delhi NCR & Bengaluru (2026 Guide)',
      excerpt:
        'Explore curated partner cafes from Blue Tokai to Third Wave Coffee offering vibrant daylight ambiance, artisanal pour-overs, and low-pressure first encounters.',
      category: 'City Guides',
      readTime: '6 min read',
      date: 'Sept 2026',
      image:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    },
    {
      slug: 'nearest-first-dating-solving-the-metropolitan-traffic-problem',
      title: 'Nearest-First Dating: Why Meeting Singles in Walking Distance Changes Everything',
      excerpt:
        'Matching with someone 35km away across city traffic rarely turns into a date. How proximity radar prioritizes your street, local hub, and metro corridor.',
      category: 'Tech & Proximity',
      readTime: '4 min read',
      date: 'Sept 2026',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white font-sans">
      {/* Background Glows */}
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
                Insights & Guides
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

      {/* Hero */}
      <section className="relative pt-16 pb-16 px-6 sm:pt-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FD3A73]/30 bg-[#FD3A73]/10 px-4 py-1.5 text-xs font-bold text-[#FD3A73] backdrop-blur-md mb-6 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" />
            <span>MODERN ROMANCE, SAFETY & SPONTANEITY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            The Synkin Journal.<br />
            <span className="bg-gradient-to-r from-[#FD3A73] via-[#FF6584] to-[#8E2DE2] bg-clip-text text-transparent">
              Real Chemistry, Zero Bullshit.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Deep dives on privacy cryptography, date safety, curated cafe culture, and how to stop collecting pen-pals.
          </p>
        </div>
      </section>

      {/* Article Grid */}
      <section className="pb-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((art, idx) => (
            <Link
              key={idx}
              href={`/blog/${art.slug}/`}
              className="rounded-3xl border border-white/10 bg-zinc-900/40 overflow-hidden backdrop-blur-xl hover:border-[#FD3A73]/60 transition-all flex flex-col group cursor-pointer hover:shadow-2xl hover:shadow-[#FD3A73]/10 hover:-translate-y-1 duration-300"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-900 relative">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-[#FD3A73] backdrop-blur-md border border-white/10">
                  {art.category}
                </div>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {art.date}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {art.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-[#FD3A73] transition-colors leading-snug">
                    {art.title}
                  </h2>

                  <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FD3A73] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">Synkin Editorial</span>
                </div>
              </div>
            </Link>
          ))}
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
