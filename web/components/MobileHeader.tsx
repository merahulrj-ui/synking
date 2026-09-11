'use client';

import React from 'react';
import { SlidersHorizontal, Crown } from 'lucide-react';

interface MobileHeaderProps {
  onOpenFilter: () => void;
  onOpenVip: () => void;
  hasActiveFilters?: boolean;
}

export default function MobileHeader({
  onOpenFilter,
  onOpenVip,
  hasActiveFilters = false,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-black/90 px-4 backdrop-blur-xl">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FD3A73] to-[#7928CA] p-0.5 shadow-md shadow-[#FD3A73]/20">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-black text-xs font-black text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#FD3A73]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-xl font-bold tracking-tight text-white">
            Synkin<span className="text-[#FD3A73]">.</span>
          </span>
        </div>
      </div>

      {/* Action Buttons: Discovery Filter + VIP Crown */}
      <div className="flex items-center gap-2">
        {/* Filter Button */}
        <button
          onClick={onOpenFilter}
          title="Discovery Filter"
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
            hasActiveFilters
              ? 'border-[#FD3A73] bg-[#FD3A73]/15 text-[#FD3A73]'
              : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#FD3A73]" />
          )}
        </button>

        {/* VIP Crown Button */}
        <button
          onClick={onOpenVip}
          title="VIP Membership"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all"
        >
          <Crown className="h-4 w-4 fill-amber-400 text-amber-400" />
        </button>
      </div>
    </header>
  );
}
