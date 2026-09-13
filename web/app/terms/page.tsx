'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldAlert,
  Lock,
  PhoneOff,
  Video,
  AlertTriangle,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Scale,
} from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white font-sans">
      {/* Ambient glows */}
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
                Terms of Service
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
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 backdrop-blur-md mb-4">
            <Scale className="h-3.5 w-3.5" />
            <span>COMMUNITY SAFETY & USER AGREEMENT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Terms of Service &amp; Community Rules
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400">
            Last Updated &amp; Effective: September 12, 2026 · Legal Jurisdiction: Uttarakhand, India
          </p>
        </div>
      </section>

      {/* Content Body */}
      <main className="max-w-4xl mx-auto py-16 px-6 space-y-10 text-sm leading-relaxed text-zinc-300">
        {/* Section 1: Acceptance */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <FileText className="h-5 w-5 text-[#FD3A73]" />
            <span>1. Acceptance of Terms</span>
          </h2>
          <p>
            By downloading, installing, accessing, or using the Synkin application, progressive web app, or website (<a href="https://synkin.in" className="text-[#FD3A73] hover:underline">synkin.in</a>), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not access or use the platform.
          </p>
        </div>

        {/* Section 2: Strict 18+ Age Requirement */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-8">
          <h2 className="text-xl font-bold text-rose-400 flex items-center gap-2.5 mb-4">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <span>2. Strict 18+ Adult Age Requirement</span>
          </h2>
          <p className="text-zinc-200">
            Synkin is strictly reserved for adults who are <strong>18 years of age or older</strong>. By registering an account, you legally warrant and represent that you are at least 18 years old.
          </p>
          <p className="mt-3 text-xs text-rose-300/90 font-medium">
            Any accounts discovered to be operated by minors or created under false age representations are subject to immediate permanent device-level ban and complete data purging.
          </p>
        </div>

        {/* Section 3: Two-Way Consent Calling Protocol */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Video className="h-5 w-5 text-purple-400" />
            <span>3. Two-Way Consent Calling &amp; Harassment Prevention</span>
          </h2>
          <p>
            Synkin operates on an uncompromising mutual consent architecture designed to eliminate harassment, stalking, and unsolicited calls:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
            <li><strong className="text-white">Zero Unsolicited Calls:</strong> No user can force a voice or video call. Audio/video streams unlock ONLY when the recipient explicitly clicks [Accept].</li>
            <li><strong className="text-white">Zero Camera Flashing:</strong> Video remains off until mutual consent is verified. Members can opt for Private Audio Calls anytime.</li>
            <li><strong className="text-white">Right to Terminate:</strong> Either participant may end an active call instantly at any second with zero penalty.</li>
          </ul>
        </div>

        {/* Section 4: Privacy & Anti-Screen Recording (FLAG_SECURE) */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Lock className="h-5 w-5 text-sky-400" />
            <span>4. Screenshot &amp; Screen Recording Protection (FLAG_SECURE)</span>
          </h2>
          <p>
            To protect our members from unauthorized image distribution and extortion:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
            <li>Synkin employs hardware-level screenshot and screen recording blocking (Android FLAG_SECURE &amp; Web DRM policies).</li>
            <li>Attempting to capture, mirror, or record another user&apos;s photos or video call streams using external recording software, rooting, or physical cameras without explicit legal consent is a criminal violation and results in immediate permanent hardware banning.</li>
          </ul>
        </div>

        {/* Section 5: In-Person Meetups & Daylight Partner Cafes */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>5. In-Person Daylight Meetups &amp; Personal Safety</span>
          </h2>
          <p>
            Synkin encourages real-world meetups at curated, public, well-lit Daylight Partner Cafes (e.g., Blue Tokai, Third Wave Coffee, Starbucks).
          </p>
          <p className="mt-3 text-zinc-400">
            Users are advised to always meet in busy public venues, arrange their own transportation, and inform trusted friends or family of their plans using Synkin&apos;s 1-Tap Date Itinerary sharing. Synkin is not responsible for individual conduct outside the application.
          </p>
        </div>

        {/* Section 6: Prohibited Conduct & Penalties */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>6. Strictly Prohibited Conduct</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs text-zinc-300">
            <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
              <strong className="text-rose-400 block mb-1">✕ Catfishing &amp; Impersonation</strong>
              Using photos of other individuals, celebrities, or AI-generated fakes is strictly forbidden.
            </div>
            <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
              <strong className="text-rose-400 block mb-1">✕ Commercial Solicitation</strong>
              Promoting paid services, escorts, adult webcam platforms, or financial scams results in instant ban.
            </div>
            <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
              <strong className="text-rose-400 block mb-1">✕ Non-Consensual Explicit Media</strong>
              Sending unsolicited nudity or inappropriate sexual imagery triggers automatic moderation ban.
            </div>
            <div className="rounded-2xl bg-black/40 p-4 border border-white/5">
              <strong className="text-rose-400 block mb-1">✕ Hate Speech &amp; Harassment</strong>
              Targeting users based on religion, caste, gender, sexual orientation, or ethnicity will not be tolerated.
            </div>
          </div>
        </div>

        {/* Section 7: Account Deletion */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Scale className="h-5 w-5 text-[#FD3A73]" />
            <span>7. Account Termination &amp; Right to Erasure</span>
          </h2>
          <p>
            You may terminate your account and wipe all personal data at any time from within the app:
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Go to <em>Profile &rarr; Settings &rarr; Delete Account</em>. Your profile, matches, and chats are permanently deleted immediately. Synkin reserves the right to suspend or ban any user who breaches these Terms.
          </p>
        </div>

        {/* Section 8: Legal Jurisdiction & Contact */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-pink-950/30 via-zinc-900 to-purple-950/30 p-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
            <Mail className="h-5 w-5 text-[#FD3A73]" />
            <span>8. Governing Law &amp; Grievance Redressal</span>
          </h2>
          <p className="text-zinc-300">
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with Synkin shall be subject to the exclusive jurisdiction of the competent courts in Uttarakhand, India.
          </p>
          <div className="mt-4 space-y-1 font-mono text-xs text-zinc-400">
            <p><strong className="text-white">Entity:</strong> Jayanti Cybernetics (Owned and operated by SMD Group)</p>
            <p><strong className="text-white">Legal &amp; Privacy Inquiries:</strong> <a href="mailto:privacy@synkin.in" className="text-[#FD3A73] hover:underline">privacy@synkin.in</a></p>
            <p><strong className="text-white">Legal Jurisdiction:</strong> Uttarakhand, India</p>
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
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/safety" className="hover:text-white">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
