'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileHeader from '../../components/MobileHeader';
import MobileTabBar, { TabType } from '../../components/MobileTabBar';
import SwipeScreen from '../../components/tabs/SwipeScreen';
import ExploreScreen from '../../components/tabs/ExploreScreen';
import InSynkScreen from '../../components/tabs/InSynkScreen';
import ChatScreen from '../../components/tabs/ChatScreen';
import ProfileScreen from '../../components/tabs/ProfileScreen';
import DiscoveryFilterModal from '../../components/modals/DiscoveryFilterModal';
import VipMembershipModal from '../../components/modals/VipMembershipModal';
import ChatModal from '../../components/modals/ChatModal';
import AuthModal from '../../components/AuthModal';
import { Profile, CurrentUser, DateVenue } from '../../lib/types';
import { getCurrentUser, setCurrentUser, fetchProfiles } from '../../lib/api';
import { Heart, Sparkles, PhoneOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AppRoutePage() {
  const [activeTab, setActiveTab] = useState<TabType>('swipe');
  const [currentUser, setLocalUser] = useState<CurrentUser | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isVipOpen, setIsVipOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [activeCallPartner, setActiveCallPartner] = useState<string | null>(null);

  useEffect(() => {
    // Check persistent session
    const user = getCurrentUser();
    if (user) {
      setLocalUser(user);
      // Guest user profile for preview
      const demoUser: CurrentUser = {
        id: `guest_${Date.now()}`,
        name: 'Guest User',
        phone: '',
        city: 'Delhi NCR',
      };
      setLocalUser(demoUser);
      setCurrentUser(demoUser);
    }

    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLocalUser(null);
    window.location.href = '/';
  };

  const handleAcceptRequest = (profile: Profile) => {
    setMatchedProfile(profile);
  };

  const handlePlanDateFromExplore = (venue: DateVenue) => {
    setActiveTab('insynk');
    alert(`⚡ Date planned at ${venue.name}! VIP Date Pass generated in InSynk tab.`);
  };

  const handleTriggerVideoCall = (partnerName: string) => {
    setActiveCallPartner(partnerName);
  };

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
            {profiles.length > 0 ? `${profiles.length}+ Singles Live in Radar` : '140+ Singles Active Nearby'}
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
      {/* CENTER PHONE CONTAINER (Full-featured 5-tab Next.js mobile app) */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full h-full lg:max-w-[430px] lg:h-[min(94vh,900px)] flex flex-col items-center justify-center lg:p-2.5 lg:rounded-[44px] lg:bg-gradient-to-b lg:from-white/10 lg:via-white/5 lg:to-pink-500/15 lg:shadow-[0_30px_100px_-20px_rgba(253,58,115,0.35)]">
        <div className="relative flex h-full w-full flex-col bg-[#000000] lg:rounded-[36px] lg:border lg:border-white/10 overflow-hidden shadow-2xl">
          {/* Top Mobile Header */}
          <MobileHeader
            onOpenFilter={() => setIsFilterOpen(true)}
            onOpenVip={() => setIsVipOpen(true)}
            hasActiveFilters={false}
          />

          {/* Content Area for 5 Tabs */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FD3A73] border-t-transparent" />
                <span className="mt-3 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  Loading Radar Feed...
                </span>
              </div>
            ) : (
              <>
                {activeTab === 'swipe' && (
                  <SwipeScreen
                    profiles={profiles}
                    currentUser={currentUser}
                    onOpenAuth={() => setIsAuthOpen(true)}
                    onRefresh={loadProfiles}
                    onOpenProfileModal={(p) =>
                      alert(`Bio: ${p.bio || 'Living life fully'}\nInterests: ${(p.interests || []).join(', ')}`)
                    }
                  />
                )}

                {activeTab === 'explore' && (
                  <ExploreScreen onPlanDate={handlePlanDateFromExplore} />
                )}

                {activeTab === 'insynk' && (
                  <InSynkScreen onAcceptRequest={handleAcceptRequest} />
                )}

                {activeTab === 'chat' && (
                  <ChatScreen onOpenChatThread={(c) => setActiveChat(c)} />
                )}

                {activeTab === 'profile' && (
                  <ProfileScreen
                    currentUser={currentUser}
                    onOpenAuth={() => setIsAuthOpen(true)}
                    onLogout={handleLogout}
                    onOpenVip={() => setIsVipOpen(true)}
                  />
                )}
              </>
            )}
          </div>

          {/* 5 Bottom Tabs matching mobile layout */}
          <MobileTabBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            incomingCount={2}
            unreadChatCount={1}
          />
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
              src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://synkin.in/app&color=FD3A73&bgcolor=0D0817"
              alt="Scan QR code for Synkin mobile web"
              className="h-full w-full rounded-xl object-contain"
            />
          </div>

          <a
            href="/download/apk"
            download="Synkin.apk"
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

      {/* ========================================================================= */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================================= */}

      {/* MATCH CELEBRATION MODAL */}
      {matchedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#FD3A73]/40 bg-[#121422] p-6 text-center shadow-2xl shadow-[#FD3A73]/20">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#FD3A73]/20 text-[#FD3A73]">
              <Heart className="h-10 w-10 fill-[#FD3A73] text-[#FD3A73] animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white">It&apos;s InSynk! 🔥</h2>
            <p className="mt-1 text-xs text-zinc-300">
              You and <strong className="text-[#FD3A73]">{matchedProfile.name}</strong> connected with mutual sparks!
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#FD3A73] shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200"
                  alt="You"
                  className="h-full w-full object-cover"
                />
              </div>
              <Sparkles className="h-6 w-6 text-amber-400 animate-spin" />
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#FD3A73] shadow-md">
                <img
                  src={matchedProfile.photoUrl}
                  alt={matchedProfile.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMatchedProfile(null);
                  setActiveTab('chat');
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 active:scale-95 transition-all cursor-pointer"
              >
                Send Message &amp; Plan Coffee ☕
              </button>
              <button
                onClick={() => setMatchedProfile(null)}
                className="w-full rounded-2xl bg-white/5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-MIN VIDEO CALL SIMULATOR */}
      {activeCallPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative flex h-[580px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-purple-500/40 bg-zinc-950 shadow-2xl">
            {/* Remote Video Stream */}
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800"
              alt="Remote Video"
              className="h-full w-full object-cover"
            />
            {/* Local Video Inset */}
            <div className="absolute top-4 right-4 h-28 w-20 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300"
                alt="My Video"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Top Timer */}
            <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>02:44 · WebRTC Encrypted</span>
            </div>
            {/* Bottom Controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 text-center">
              <h3 className="text-lg font-bold text-white">{activeCallPartner}</h3>
              <p className="text-xs text-zinc-300">3-Minute Video Vibe Check</p>
              <button
                onClick={() => setActiveCallPartner(null)}
                className="mt-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 hover:scale-105 active:scale-90 transition-all cursor-pointer"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      <DiscoveryFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f) => console.log('Filters applied:', f)}
      />

      {/* VIP MEMBERSHIP MODAL */}
      <VipMembershipModal
        isOpen={isVipOpen}
        onClose={() => setIsVipOpen(false)}
      />

      {/* CHAT MODAL */}
      <ChatModal
        chat={activeChat}
        onClose={() => setActiveChat(null)}
        onTriggerVideoCall={(p) => {
          setActiveChat(null);
          handleTriggerVideoCall(p);
        }}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setLocalUser(u);
          loadProfiles();
        }}
      />
    </div>
  );
}
