'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';

interface DiscoveryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function DiscoveryFilterModal({
  isOpen,
  onClose,
  onApply,
}: DiscoveryFilterModalProps) {
  const [distance, setDistance] = useState(25);
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(30);
  const [gender, setGender] = useState<'all' | 'women' | 'men'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onApply({ distance, minAge, maxAge, gender, verifiedOnly });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#12141f] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <SlidersHorizontal className="h-4 w-4 text-[#FD3A73]" />
            <span>Discovery Preferences</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Distance */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Maximum Distance</span>
              <span className="text-[#FD3A73]">{distance} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="100"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="mt-2 w-full accent-[#FD3A73]"
            />
          </div>

          {/* Age Range */}
          <div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Age Range</span>
              <span className="text-[#FD3A73]">{minAge} - {maxAge}</span>
            </div>
            <div className="mt-2 flex gap-3">
              <input
                type="number"
                min="18"
                max="60"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-1/2 rounded-xl border border-white/10 bg-zinc-900 py-1.5 text-center text-xs text-white"
              />
              <input
                type="number"
                min="18"
                max="60"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-1/2 rounded-xl border border-white/10 bg-zinc-900 py-1.5 text-center text-xs text-white"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <span className="text-xs font-semibold text-zinc-300 block mb-2">Show Me</span>
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'women', 'men'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-xl py-2 text-xs font-medium capitalize transition-all ${
                    gender === g
                      ? 'border border-[#FD3A73] bg-[#FD3A73]/20 text-[#FD3A73]'
                      : 'border border-white/10 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Singles Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-black/40 p-3 border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">Verified Profiles Only</div>
              <div className="text-[10px] text-zinc-400">Hide unverified profiles</div>
            </div>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-5 w-5 accent-[#FD3A73]"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>Apply Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
