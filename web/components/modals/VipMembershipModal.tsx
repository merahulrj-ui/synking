'use client';

import React, { useState } from 'react';
import { X, Crown, Check, Sparkles } from 'lucide-react';

interface VipMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VipMembershipModal({ isOpen, onClose }: VipMembershipModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'1m' | '3m' | 'life'>('3m');

  if (!isOpen) return null;

  const features = [
    'See Who Liked You Before Swiping',
    'Unlimited Rewinds on Missed Profiles',
    '5 Free Super Synks Every Week',
    'Priority High-Res WebRTC Video Calling',
    'Exclusive VIP Table Perks at Partner Cafes',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#1a1420] via-zinc-950 to-black p-6 shadow-2xl shadow-amber-500/10 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Crown & Title */}
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="h-8 w-8 fill-amber-400" />
          </div>
          <h3 className="text-xl font-black text-white">Synkin VIP Gold</h3>
          <p className="mt-1 text-xs text-amber-300">Level up your dating experience with zero limits</p>
        </div>

        {/* Features List */}
        <div className="mt-5 space-y-2.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-200">
              <Check className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedPlan('1m')}
            className={`rounded-2xl p-3 text-center border transition-all ${
              selectedPlan === '1m'
                ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/20'
                : 'border-white/10 bg-zinc-900 text-zinc-400'
            }`}
          >
            <div className="text-[11px] font-bold text-zinc-300">1 Month</div>
            <div className="mt-1 text-sm font-black text-white">₹499</div>
          </button>

          <button
            onClick={() => setSelectedPlan('3m')}
            className={`relative rounded-2xl p-3 text-center border transition-all ${
              selectedPlan === '3m'
                ? 'border-amber-400 bg-amber-500/25 shadow-md shadow-amber-500/30'
                : 'border-white/10 bg-zinc-900 text-zinc-400'
            }`}
          >
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.2 text-[8px] font-bold text-black uppercase">
              Popular
            </span>
            <div className="text-[11px] font-bold text-amber-300">3 Months</div>
            <div className="mt-1 text-sm font-black text-white">₹999</div>
          </button>

          <button
            onClick={() => setSelectedPlan('life')}
            className={`rounded-2xl p-3 text-center border transition-all ${
              selectedPlan === 'life'
                ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/20'
                : 'border-white/10 bg-zinc-900 text-zinc-400'
            }`}
          >
            <div className="text-[11px] font-bold text-zinc-300">Lifetime</div>
            <div className="mt-1 text-sm font-black text-white">₹2,499</div>
          </button>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={() => {
            alert('🎉 VIP Gold Simulation: Your account now has Unlimited Swipes & 5 Free Super Synks!');
            onClose();
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 py-3 text-xs font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Unlock VIP Gold Now</span>
        </button>
      </div>
    </div>
  );
}
