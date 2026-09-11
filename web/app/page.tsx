'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SwipeDeck from '../components/SwipeDeck';
import RadarView from '../components/RadarView';
import DateVenues from '../components/DateVenues';
import AuthModal from '../components/AuthModal';
import { Profile, CurrentUser } from '../lib/types';
import { getCurrentUser, setCurrentUser, fetchProfiles } from '../lib/api';
import { Flame, Compass, Coffee, ShieldCheck, Zap, Heart, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'swipe' | 'radar' | 'venues'>('swipe');
  const [currentUser, setLocalUser] = useState<CurrentUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setLocalUser(user);

    loadProfiles(user?.id);
  }, []);

  const loadProfiles = async (uid?: string) => {
    setLoading(true);
    try {
      const data = await fetchProfiles(uid);
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLocalUser(null);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#090a10]">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Interactive Stage */}
      <div className="flex-1">
        {/* Welcome / Active Sub-Header */}
        <section className="border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent py-4 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping absolute h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-zinc-300 font-medium">
                Live Cloud Sync · <strong className="text-white">AWS Mumbai</strong> · {profiles.length} Active Singles Nearby
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> ZK-Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-purple-400" /> 3-Min Vibe Calls
              </span>
            </div>
          </div>
        </section>

        {/* View Switcher */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-pink-500/20 border border-pink-500/30">
              <Flame className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-pink-400">
              Scanning Nearby Radar...
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'swipe' && (
              <SwipeDeck
                profiles={profiles}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
                onRefresh={() => loadProfiles(currentUser?.id)}
              />
            )}

            {activeTab === 'radar' && (
              <RadarView
                profiles={profiles}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'venues' && (
              <DateVenues
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}
          </div>
        )}
      </div>

      {/* Trust & Features Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#07080d] py-8 px-4 text-center">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 mb-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Real Verified Singles
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-400" /> Private WebRTC Video & Audio
            </span>
            <span className="flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-amber-400" /> Curated Safe Public Date Spots
            </span>
          </div>
          <p className="text-[11px] text-zinc-600">
            © 2026 Synkin Inc. Built with Next.js & React 19. All communications zero-knowledge encrypted.
          </p>
        </div>
      </footer>

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setLocalUser(user);
          loadProfiles(user.id);
        }}
      />
    </main>
  );
}
