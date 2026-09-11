'use client';

import React, { useState } from 'react';
import { Heart, Ticket, Check, X, QrCode, Clock, MapPin, Sparkles } from 'lucide-react';
import { Profile } from '../../lib/types';

interface InSynkScreenProps {
  onAcceptRequest: (profile: Profile) => void;
}

export default function InSynkScreen({ onAcceptRequest }: InSynkScreenProps) {
  const [activeSubtab, setActiveSubtab] = useState<'requests' | 'passes'>('requests');
  const [requests, setRequests] = useState<Profile[]>([
    {
      id: 'req_ananya',
      name: 'Ananya',
      age: 22,
      city: 'Delhi NCR',
      distanceKm: 1.8,
      bio: 'Architect & vinyl collector. Filter coffee lover.',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
      isVerified: true,
      online: true,
      interests: ['Art', 'Coffee', 'Architecture'],
    },
    {
      id: 'req_priya',
      name: 'Priya',
      age: 23,
      city: 'Gurugram',
      distanceKm: 3.2,
      bio: 'Bookworm, travel photographer & spontaneous sunset chaser.',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      isVerified: true,
      online: true,
      interests: ['Photography', 'Reading', 'Travel'],
    },
  ]);

  const handleDecline = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAccept = (profile: Profile) => {
    setRequests((prev) => prev.filter((r) => r.id !== profile.id));
    onAcceptRequest(profile);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-24 pt-3">
      {/* Subtabs: Requests vs Date Passes */}
      <div className="mx-auto mb-4 flex w-full max-w-[420px] rounded-2xl border border-white/10 bg-zinc-900/90 p-1">
        <button
          onClick={() => setActiveSubtab('requests')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeSubtab === 'requests'
              ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span>Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubtab('passes')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeSubtab === 'passes'
              ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Ticket className="h-3.5 w-3.5" />
          <span>Date Passes (1)</span>
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        {activeSubtab === 'requests' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Who Liked You ({requests.length})
              </span>
              <span className="text-[11px] text-zinc-500">Accept to start chat</span>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-xs text-zinc-500">
                No new incoming requests right now. Keep swiping!
              </div>
            ) : (
              requests.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-zinc-900/90 p-3 shadow-lg"
                >
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate">{profile.name}</h4>
                      <span className="text-xs text-zinc-400">{profile.age}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                      <MapPin className="h-3 w-3 text-[#FD3A73]" />
                      <span>{profile.city} · {profile.distanceKm} km</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-300 truncate">{profile.bio}</p>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecline(profile.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 active:scale-90 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleAccept(profile)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] text-white shadow-lg shadow-[#FD3A73]/30 active:scale-90 transition-all"
                    >
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          /* Date Passes View */
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 via-zinc-900 to-black p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-black tracking-wide text-white uppercase">
                  VIP Date Pass #SYN-882
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Confirmed
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400"
                alt="Blue Tokai"
                className="h-20 w-20 rounded-2xl object-cover"
              />
              <div>
                <h4 className="text-base font-bold text-white">Blue Tokai Roastery</h4>
                <div className="mt-0.5 text-xs text-zinc-400">Cyber Hub, Gurugram</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Valid for 47h 20m</span>
                </div>
              </div>
            </div>

            {/* Perk Description */}
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-zinc-200">
              <strong className="text-amber-300">Included Perk:</strong> Complimentary Pour-Over Coffee & Dessert Platter for two.
            </div>

            {/* QR Code Demo */}
            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-black/60 p-4 border border-white/5">
              <QrCode className="h-16 w-16 text-white" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Show QR at Cafe Counter</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Verified Safe Daylight Partner</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
