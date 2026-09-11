'use client';

import React, { useState } from 'react';
import {
  Heart,
  X,
  Sparkles,
  RotateCcw,
  Zap,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Profile, CurrentUser } from '../lib/types';
import { sendSwipeAction } from '../lib/api';

interface SwipeDeckProps {
  profiles: Profile[];
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
  onRefresh: () => void;
}

export default function SwipeDeck({
  profiles,
  currentUser,
  onOpenAuth,
  onRefresh,
}: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!currentProfile) return;

    setLastAction(action);

    // Call API
    sendSwipeAction(currentUser.id, currentProfile.id, action);

    if (action === 'like' || action === 'superlike') {
      // 50% random chance to simulate instant match notification for demo excitement!
      if (Math.random() > 0.4) {
        setMatchPopup(currentProfile);
      }
    }

    setTimeout(() => {
      setLastAction(null);
      setCurrentIndex((prev) => prev + 1);
      setPhotoIndex(0);
    }, 280);
  };

  const handleRewind = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setPhotoIndex(0);
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProfile?.photos && currentProfile.photos.length > 1) {
      setPhotoIndex((prev) => (prev + 1) % currentProfile.photos!.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentProfile?.photos && currentProfile.photos.length > 1) {
      setPhotoIndex((prev) => (prev - 1 + currentProfile.photos!.length) % currentProfile.photos!.length);
    }
  };

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-800/80 border border-white/10 shadow-2xl mb-4">
          <Flame className="h-10 w-10 text-pink-500 animate-bounce" />
        </div>
        <h3 className="text-xl font-bold text-white">You've Caught Up on Nearby Sparks!</h3>
        <p className="mt-2 max-w-sm text-xs text-zinc-400">
          You've explored everyone in your immediate radius. Expand your radar or reset the deck to see new profiles.
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            onRefresh();
          }}
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset & Shuffle Profiles</span>
        </button>
      </div>
    );
  }

  const activePhoto =
    currentProfile.photos?.[photoIndex] || currentProfile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col items-center px-4 py-4 sm:py-6">
      {/* Match Alert Popup */}
      {matchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-pink-500/30 bg-[#121422] p-6 text-center shadow-2xl shadow-pink-500/20">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
              <Heart className="h-10 w-10 fill-pink-500 text-pink-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">It's a Spark! 🔥</h2>
            <p className="mt-1 text-xs text-zinc-300">
              You and <span className="font-semibold text-pink-400">{matchPopup.name}</span> liked each other!
            </p>
            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-pink-500 shadow-md">
                <img src={currentUser?.name ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' : ''} alt="You" className="h-full w-full object-cover" />
              </div>
              <Sparkles className="h-6 w-6 text-amber-400 animate-spin" />
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-pink-500 shadow-md">
                <img src={activePhoto} alt={matchPopup.name} className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setMatchPopup(null)}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/30 hover:brightness-110"
              >
                Send Instant Date Invite ☕
              </button>
              <button
                onClick={() => setMatchPopup(null)}
                className="w-full rounded-xl bg-white/5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Card Container */}
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-300 ${
          lastAction === 'like'
            ? 'translate-x-32 rotate-12 opacity-0'
            : lastAction === 'pass'
            ? '-translate-x-32 -rotate-12 opacity-0'
            : lastAction === 'superlike'
            ? '-translate-y-32 scale-95 opacity-0'
            : 'translate-x-0 rotate-0 opacity-100'
        }`}
      >
        {/* Profile Image */}
        <img
          src={activePhoto}
          alt={currentProfile.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />

        {/* Photo Carousel Indicators */}
        {currentProfile.photos && currentProfile.photos.length > 1 && (
          <div className="absolute top-3 inset-x-0 flex justify-center gap-1 px-4 z-20">
            {currentProfile.photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx === photoIndex ? 'bg-white shadow' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Left/Right Photo Tap Triggers */}
        {currentProfile.photos && currentProfile.photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/70 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/70 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Top Badges */}
        <div className="absolute top-6 left-4 z-10 flex items-center gap-2">
          {currentProfile.isVerified && (
            <div className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified Single</span>
            </div>
          )}
          {currentProfile.online && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-950/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Now</span>
            </div>
          )}
        </div>

        {/* Gradient Overlay & Info Bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5 pt-20 z-10">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{currentProfile.name}</h2>
            <span className="text-xl font-normal text-zinc-300">{currentProfile.age}</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-pink-400" />
            <span>
              {currentProfile.city || 'Nearby'} · {currentProfile.distanceKm || 1.2} km away
            </span>
          </div>

          {currentProfile.bio && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-200 line-clamp-2">
              {currentProfile.bio}
            </p>
          )}

          {/* Interests Tags */}
          {currentProfile.interests && currentProfile.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentProfile.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swipe Action Buttons */}
      <div className="mt-5 flex items-center justify-center gap-3.5 sm:gap-5">
        {/* Rewind */}
        <button
          onClick={handleRewind}
          disabled={currentIndex === 0}
          title="Rewind Profile"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 text-amber-400 border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        {/* Pass (Nope) */}
        <button
          onClick={() => handleSwipe('pass')}
          title="Pass / Nope"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/90 text-rose-500 border border-rose-500/20 shadow-xl shadow-rose-500/10 hover:scale-110 active:scale-95 transition-all"
        >
          <X className="h-7 w-7 stroke-[2.5]" />
        </button>

        {/* Super Like */}
        <button
          onClick={() => handleSwipe('superlike')}
          title="Super Like"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/90 text-blue-400 border border-blue-400/20 shadow-xl shadow-blue-400/10 hover:scale-110 active:scale-95 transition-all"
        >
          <Sparkles className="h-6 w-6" />
        </button>

        {/* Like (Synk) */}
        <button
          onClick={() => handleSwipe('like')}
          title="Like / Spark"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart className="h-7 w-7 fill-white stroke-none" />
        </button>

        {/* 3-Min Vibe Check */}
        <button
          onClick={() => handleSwipe('like')}
          title="3-Min Video Vibe Check"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/90 text-purple-400 border border-purple-400/20 shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Zap className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 text-[11px] text-zinc-400">
        Profile {currentIndex + 1} of {profiles.length} · Encrypted Live Deck
      </div>
    </div>
  );
}
