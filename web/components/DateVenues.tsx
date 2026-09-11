'use client';

import React, { useState } from 'react';
import { Coffee, Star, MapPin, ShieldCheck, Gift, Check } from 'lucide-react';
import { CURATED_VENUES } from '../lib/api';
import { DateVenue, CurrentUser } from '../lib/types';

interface DateVenuesProps {
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
}

export default function DateVenues({ currentUser, onOpenAuth }: DateVenuesProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const handleBookDate = (venue: DateVenue) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedVenue(venue.id);
    setTimeout(() => {
      alert(`🎉 Date perk locked! Show this screen at ${venue.name} for: "${venue.perk}"`);
    }, 150);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header Banner */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-orange-950/30 p-6 sm:p-8 backdrop-blur-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/25 mb-3">
          <Coffee className="h-3.5 w-3.5 text-amber-400" />
          <span>Curated First Date Hotspots</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Verified Safe Romantic Venues
        </h2>
        <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Zero awkward first encounters. Every spot is vetted for ambience, high safety standards, and includes exclusive perks for Synkin couples.
        </p>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {CURATED_VENUES.map((venue) => {
          const isSelected = selectedVenue === venue.id;

          return (
            <div
              key={venue.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#12141e] transition-all hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10"
            >
              {/* Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md border border-amber-500/30">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{venue.rating}</span>
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md border border-white/10">
                  {venue.distance}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{venue.category}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{venue.location}</span>
                </div>

                {/* Perk Box */}
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Gift className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                        Synkin Match Perk:
                      </span>
                      <p className="text-xs text-zinc-200 mt-0.5 leading-snug">{venue.perk}</p>
                    </div>
                  </div>
                </div>

                {/* Safety Score */}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{venue.safetyScore}</span>
                </div>

                {/* Action */}
                <div className="mt-5 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleBookDate(venue)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Perk Claimed & Locked!</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="h-4 w-4" />
                        <span>Suggest This Date Spot</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
