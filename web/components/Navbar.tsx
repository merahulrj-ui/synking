'use client';

import React from 'react';
import { Flame, Compass, Coffee, User, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { CurrentUser } from '../lib/types';

interface NavbarProps {
  activeTab: 'swipe' | 'radar' | 'venues';
  onTabChange: (tab: 'swipe' | 'radar' | 'venues') => void;
  currentUser: CurrentUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090a10]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('swipe')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 shadow-lg shadow-pink-500/25">
            <Flame className="h-6 w-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">Synkin</span>
              <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-semibold text-pink-400 border border-pink-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Instant Chemistry & Verified Dates</p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <nav className="flex items-center gap-1 rounded-2xl bg-zinc-900/80 p-1 border border-white/5 shadow-inner">
          <button
            onClick={() => onTabChange('swipe')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'swipe'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span className="hidden md:inline">Sparks</span>
          </button>

          <button
            onClick={() => onTabChange('radar')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'radar'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden md:inline">360° Radar</span>
          </button>

          <button
            onClick={() => onTabChange('venues')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'venues'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coffee className="h-4 w-4" />
            <span className="hidden md:inline">Safe Spots</span>
          </button>
        </nav>

        {/* Auth / Profile */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-zinc-800/70 border border-white/10 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    {currentUser.name}
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-zinc-400">{currentUser.city || 'Verified'}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <LogIn className="h-4 w-4" />
              <span>Login / Join</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
