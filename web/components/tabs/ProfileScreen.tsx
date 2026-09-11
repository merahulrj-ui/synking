'use client';

import React from 'react';
import {
  User,
  ShieldCheck,
  Crown,
  Settings,
  LogOut,
  MapPin,
  Sparkles,
  Camera,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { CurrentUser } from '../../lib/types';

interface ProfileScreenProps {
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenVip: () => void;
}

const INTERESTS = [
  '☕ Specialty Coffee',
  '🎸 Indie Music',
  '🚗 Road Trips',
  '🏋️ Gym & Fitness',
  '🤖 Tech & AI',
  '🍕 Sourdough Pizza',
  '✈️ Solo Travel',
  '🎨 Art & Museums',
];

export default function ProfileScreen({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenVip,
}: ProfileScreenProps) {
  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-white/10 mb-4">
          <User className="h-10 w-10 text-zinc-500" />
        </div>
        <h3 className="text-xl font-bold text-white">Log in to view profile</h3>
        <p className="mt-2 text-xs text-zinc-400">Manage your photos, VIP badge, and dating preferences.</p>
        <button
          onClick={onOpenAuth}
          className="mt-6 rounded-2xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-8 py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 active:scale-95"
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-24 pt-3">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        {/* Profile Hero Card */}
        <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-zinc-900/80 p-6 text-center shadow-xl">
          <div className="relative">
            <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-[#FD3A73] via-[#7928CA] to-[#00DFD8] shadow-lg shadow-[#FD3A73]/30">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"
                alt={currentUser.name}
                className="h-full w-full rounded-full object-cover border-2 border-black"
              />
            </div>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#FD3A73] text-white border-2 border-black shadow-md hover:scale-110 active:scale-90 transition-all">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-white">{currentUser.name}, 24</h2>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3.5 w-3.5 text-[#FD3A73]" />
            <span>{currentUser.city || 'Delhi NCR'} · +91 {currentUser.phone}</span>
          </div>

          {/* Profile Strength Progress Bar */}
          <div className="mt-4 w-full rounded-2xl bg-black/50 p-3 border border-white/5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Profile Strength</span>
              <span className="text-emerald-400">85%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-[#FD3A73] to-emerald-400" />
            </div>
          </div>
        </div>

        {/* VIP Gold Banner */}
        <div
          onClick={onOpenVip}
          className="flex items-center justify-between rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black p-4 cursor-pointer hover:border-amber-500/50 active:scale-[0.99] transition-all shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="h-6 w-6 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Synkin VIP Gold</h4>
              <p className="text-[11px] text-zinc-400">Unlimited Swipes, 5 Free Super Synks & Rewinds</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-400" />
        </div>

        {/* Looking For Section */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Looking For
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-xl border border-[#FD3A73]/40 bg-[#FD3A73]/15 px-3 py-1 text-xs font-medium text-[#FD3A73]">
              💘 Long-term partner
            </span>
            <span className="rounded-xl border border-white/10 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
              ☕ Coffee & casual chats
            </span>
          </div>
        </div>

        {/* Passions Section */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Passions & Lifestyle
          </span>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {INTERESTS.map((tag) => (
              <span
                key={tag}
                className="rounded-xl border border-white/10 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Account & Logout Actions */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-2">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl p-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4" />
              <span>Log Out of Account</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
