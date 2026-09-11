'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  Star,
  Heart,
  Zap,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
} from 'lucide-react';
import { Profile, CurrentUser } from '../../lib/types';
import { sendSwipeAction } from '../../lib/api';

interface SwipeScreenProps {
  profiles: Profile[];
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
  onRefresh: () => void;
  onOpenProfileModal: (profile: Profile) => void;
}

export default function SwipeScreen({
  profiles,
  currentUser,
  onOpenAuth,
  onRefresh,
  onOpenProfileModal,
}: SwipeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'like' | 'pass' | 'super' | null>(null);
  const [rewindsLeft, setRewindsLeft] = useState(5);
  const [superSynksLeft, setSuperSynksLeft] = useState(3);
  const [boostActive, setBoostActive] = useState(false);

  const currentProfile = profiles[currentIndex];

  const triggerSwipe = (action: 'like' | 'pass' | 'super') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!currentProfile) return;

    setSwipeState(action);

    const apiAction = action === 'super' ? 'superlike' : action;
    sendSwipeAction(currentUser.id, currentProfile.id, apiAction);

    setTimeout(() => {
      setSwipeState(null);
      setCurrentIndex((prev) => prev + 1);
      setPhotoIndex(0);
    }, 280);
  };

  const handleRewind = () => {
    if (currentIndex > 0 && rewindsLeft > 0) {
      setRewindsLeft((prev) => prev - 1);
      setCurrentIndex((prev) => prev - 1);
      setPhotoIndex(0);
    }
  };

  const handleSuperSynk = () => {
    if (superSynksLeft > 0) {
      setSuperSynksLeft((prev) => prev - 1);
      triggerSwipe('super');
    }
  };

  const handleBoost = () => {
    setBoostActive(true);
    alert('⚡ Boost Activated! Your profile is prioritized 10x in nearby radars for the next 30 minutes.');
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
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl mb-4">
          <Flame className="h-10 w-10 text-[#FD3A73] animate-bounce" />
        </div>
        <h3 className="text-xl font-bold text-white">No More Sparks Nearby</h3>
        <p className="mt-2 max-w-xs text-xs text-zinc-400 leading-relaxed">
          You've viewed everyone in your immediate radius. Expand discovery filters or shuffle the deck.
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            onRefresh();
          }}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 active:scale-95 transition-all"
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
    <div className="relative flex flex-1 flex-col items-center justify-between p-3 pb-20 select-none">
      {/* Swipe Card Container */}
      <div
        className={`relative aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-2xl transition-all duration-300 ${
          swipeState === 'like'
            ? 'translate-x-32 rotate-12 opacity-0'
            : swipeState === 'pass'
            ? '-translate-x-32 -rotate-12 opacity-0'
            : swipeState === 'super'
            ? '-translate-y-32 scale-95 opacity-0'
            : 'translate-x-0 rotate-0 opacity-100'
        }`}
      >
        {/* Profile Image */}
        <img
          src={activePhoto}
          alt={currentProfile.name}
          className="h-full w-full object-cover select-none pointer-events-none"
        />

        {/* Top Photo Carousel Progress Bars */}
        {currentProfile.photos && currentProfile.photos.length > 1 && (
          <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center gap-1.5 px-4">
            {currentProfile.photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === photoIndex ? 'bg-white shadow-md' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Tap areas for prev / next photo */}
        <div className="absolute inset-0 z-20 flex">
          <div onClick={prevPhoto} className="h-full w-1/2 cursor-pointer" />
          <div onClick={nextPhoto} className="h-full w-1/2 cursor-pointer" />
        </div>

        {/* Top Badges */}
        <div className="absolute top-5 left-3.5 z-30 flex items-center gap-2">
          {currentProfile.isVerified && (
            <div className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Single</span>
            </div>
          )}
          {currentProfile.online && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Now</span>
            </div>
          )}
        </div>

        {/* Info Overlay at Bottom */}
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">{currentProfile.name}</h2>
              <span className="text-xl font-normal text-zinc-300">{currentProfile.age}</span>
            </div>
            <button
              onClick={() => onOpenProfileModal(currentProfile)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
            <MapPin className="h-3.5 w-3.5 text-[#FD3A73]" />
            <span>{currentProfile.city || 'Nearby'} · {currentProfile.distanceKm || 1.2} km away</span>
          </div>

          {currentProfile.bio && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-200 line-clamp-2">
              {currentProfile.bio}
            </p>
          )}

          {/* Interests Pills */}
          {currentProfile.interests && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {currentProfile.interests.slice(0, 4).map((tag) => (
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

      {/* 5 Bottom Action Buttons matching mobile index.tsx */}
      <div className="mt-4 flex w-full max-w-[400px] items-center justify-center gap-3 sm:gap-4">
        {/* 1. Rewind */}
        <button
          onClick={handleRewind}
          disabled={currentIndex === 0 || rewindsLeft <= 0}
          title="Rewind Profile"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-black text-amber-400 shadow-lg shadow-amber-500/10 active:scale-90 transition-all disabled:opacity-30"
        >
          <RotateCcw className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black border border-black">
            {rewindsLeft}
          </span>
        </button>

        {/* 2. Nope / Pass */}
        <button
          onClick={() => triggerSwipe('pass')}
          title="Pass"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-black text-red-500 shadow-xl shadow-red-500/20 active:scale-90 transition-all"
        >
          <X className="h-8 w-8 stroke-[2.5]" />
        </button>

        {/* 3. Super Synk */}
        <button
          onClick={handleSuperSynk}
          disabled={superSynksLeft <= 0}
          title="Super Synk"
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#00E5FF]/40 bg-black text-[#00E5FF] shadow-lg shadow-[#00E5FF]/20 active:scale-90 transition-all"
        >
          <Star className="h-6 w-6 fill-[#00E5FF]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5FF] text-[9px] font-bold text-black border border-black">
            {superSynksLeft}
          </span>
        </button>

        {/* 4. Synk / Like */}
        <button
          onClick={() => triggerSwipe('like')}
          title="Synk / Like"
          className="flex h-15 w-15 items-center justify-center rounded-full border border-[#FD3A73]/50 bg-black text-[#FD3A73] shadow-2xl shadow-[#FD3A73]/30 active:scale-90 transition-all"
        >
          <Heart className="h-8 w-8 fill-[#FD3A73]" />
        </button>

        {/* 5. Boost */}
        <button
          onClick={handleBoost}
          title="Boost Profile"
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-black active:scale-90 transition-all ${
            boostActive
              ? 'border-purple-500 text-purple-400 shadow-lg shadow-purple-500/30'
              : 'border-white/10 text-purple-400 hover:border-purple-500/40'
          }`}
        >
          <Zap className="h-5 w-5 fill-purple-400" />
        </button>
      </div>
    </div>
  );
}
