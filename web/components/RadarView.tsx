'use client';

import React, { useState } from 'react';
import { Search, Compass, MapPin, Heart, ShieldCheck, Zap, Filter } from 'lucide-react';
import { Profile, CurrentUser } from '../lib/types';
import { sendSwipeAction } from '../lib/api';

interface RadarViewProps {
  profiles: Profile[];
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
}

const FILTER_TAGS = ['All', 'Coffee', 'Music', 'Travel', 'Food', 'Art', 'Fitness'];

export default function RadarView({ profiles, currentUser, onOpenAuth }: RadarViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  const handleConnect = (profile: Profile) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    sendSwipeAction(currentUser.id, profile.id, 'like');
    setConnectedIds((prev) => new Set(prev).add(profile.id));
  };

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.interests && p.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag =
      activeTag === 'All' ||
      (p.interests && p.interests.some((i) => i.toLowerCase().includes(activeTag.toLowerCase())));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Radar Sweep Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141624] to-[#0c0d15] p-6 sm:p-8">
        {/* Animated Radar Circle */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-purple-500/20 sm:h-80 sm:w-80">
          <div className="absolute inset-4 rounded-full border border-purple-500/15">
            <div className="absolute inset-4 rounded-full border border-purple-500/10" />
          </div>
          {/* Sweep Hand */}
          <div className="absolute inset-0 origin-center animate-spin [animation-duration:6s]">
            <div className="h-1/2 w-1/2 bg-gradient-to-br from-purple-500/30 to-transparent blur-sm rounded-tl-full" />
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/25 mb-3">
            <Compass className="h-3.5 w-3.5 text-purple-400 animate-spin [animation-duration:10s]" />
            <span>360° Real-time Hyperlocal Radar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Discover Singles Near You
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Scan your neighborhood for active members. Filter by passions, spontaneous coffee plans, or musical taste.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, interests (e.g. coffee, guitar), or city..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 backdrop-blur-md focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Interest Filter Pills */}
        <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTag === tag
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tag === 'All' ? '⚡ All Matches' : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Nearby Singles ({filtered.length})
        </span>
        <span className="text-xs text-zinc-500">Live within 10 km</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-zinc-400">No active members found matching "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTag('All');
            }}
            className="mt-3 text-xs text-pink-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((profile) => {
            const isConnected = connectedIds.has(profile.id);
            const photo = profile.photos?.[0] || profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';

            return (
              <div
                key={profile.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#12141f] p-4 transition-all hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10"
              >
                {/* Photo & Badge */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-800">
                  <img
                    src={photo}
                    alt={profile.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {profile.online && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Online</span>
                    </div>
                  )}
                  {profile.isVerified && (
                    <div className="absolute top-2.5 right-2.5 flex items-center rounded-full bg-black/60 p-1 text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-base font-bold text-white">{profile.name}</h3>
                      <span className="text-sm text-zinc-400">{profile.age}</span>
                    </div>
                    <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                      {profile.distanceKm || 1.2} km
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
                    <MapPin className="h-3 w-3 text-pink-400" />
                    <span>{profile.city || 'Nearby'}</span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {profile.bio || 'Exploring moments and genuine conversations.'}
                  </p>

                  {/* Interests */}
                  {profile.interests && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {profile.interests.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300 border border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Connect Action */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleConnect(profile)}
                      disabled={isConnected}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                        isConnected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 hover:brightness-110 active:scale-95'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Spark Sent!</span>
                        </>
                      ) : (
                        <>
                          <Heart className="h-3.5 w-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
