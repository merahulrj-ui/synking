'use client';

import React, { useState } from 'react';
import { Search, Heart, Star, MapPin, ShieldCheck, Gift, Coffee } from 'lucide-react';
import { CURATED_VENUES } from '../../lib/api';
import { DateVenue } from '../../lib/types';

interface ExploreScreenProps {
  onPlanDate: (venue: DateVenue) => void;
}

const VIBES = [
  { id: 'all', label: 'All Vibes' },
  { id: 'coffee', label: 'First Coffee ☕' },
  { id: 'rooftop', label: 'Rooftops & Drinks 🍸' },
  { id: 'foodie', label: 'Casual Bites 🍕' },
  { id: 'romantic', label: 'Romantic Diners ✨' },
  { id: 'jazz', label: 'Live Soul Music 🎷' },
];

export default function ExploreScreen({ onPlanDate }: ExploreScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'wishlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = CURATED_VENUES.filter((v) => {
    const matchesTab = activeTab === 'all' || wishlist.has(v.id);
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-24 pt-3">
      {/* Top 2 Clean Subtabs: 'All Venues' vs 'Wishlist' */}
      <div className="mx-auto mb-4 flex w-full max-w-[420px] rounded-2xl border border-white/10 bg-zinc-900/90 p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>All Venues</span>
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'wishlist'
              ? 'bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span>Wishlist ({wishlist.size})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mx-auto mb-3 w-full max-w-[420px]">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search safe cafes, rooftop bars, vibes..."
          className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FD3A73] focus:outline-none"
        />
      </div>

      {/* Vibe Filter Pills */}
      <div className="mx-auto mb-4 flex w-full max-w-[420px] gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {VIBES.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => setSelectedVibe(vibe.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all ${
              selectedVibe === vibe.id
                ? 'border border-[#FD3A73]/40 bg-[#FD3A73]/15 text-[#FD3A73]'
                : 'border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {vibe.label}
          </button>
        ))}
      </div>

      {/* Venues List matching VenueCard.tsx in mobile */}
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-xs text-zinc-500">
            No venues found matching your filter.
          </div>
        ) : (
          filtered.map((venue) => {
            const isFav = wishlist.has(venue.id);

            return (
              <div
                key={venue.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-xl transition-all hover:border-[#FD3A73]/30"
              >
                {/* Photo & Top Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-zinc-800">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md border border-amber-500/30">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span>{venue.rating}</span>
                  </div>
                  {/* Wishlist Heart */}
                  <button
                    onClick={(e) => toggleWishlist(venue.id, e)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:scale-110 active:scale-95 transition-all"
                  >
                    <Heart
                      className={`h-4 w-4 ${isFav ? 'fill-[#FD3A73] text-[#FD3A73]' : 'text-white'}`}
                    />
                  </button>
                  {/* Category Pill */}
                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md border border-white/10">
                    {venue.category}
                  </div>
                </div>

                {/* Venue Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{venue.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-[#FD3A73] shrink-0" />
                        <span>{venue.location} · {venue.distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety Badge */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>{venue.safetyScore}</span>
                  </div>

                  {/* Perk Box */}
                  <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5">
                    <div className="flex items-start gap-2">
                      <Gift className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                          Synkin Match Perk:
                        </span>
                        <p className="text-xs text-zinc-200 mt-0.5 leading-snug">{venue.perk}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onPlanDate(venue)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/20 active:scale-95 transition-all"
                  >
                    <Coffee className="h-4 w-4" />
                    <span>Plan a Date Here</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
