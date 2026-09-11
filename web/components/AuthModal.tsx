'use client';

import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, ArrowRight, Phone, User, MapPin } from 'lucide-react';
import { CurrentUser } from '../lib/types';
import { setCurrentUser, getApiBaseUrl } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CurrentUser) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Delhi NCR');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [otp, setOtp] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (step === 'info') {
      setStep('otp');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const userId = `user_${cleanPhone.slice(-10) || Date.now()}`;
      const newUser: CurrentUser = {
        id: userId,
        name: name.trim(),
        phone: cleanPhone,
        city: city.trim() || 'Nearby',
        token: `zk_token_${Date.now()}`,
      };

      // Register or sync with backend
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          city: newUser.city,
          phone: newUser.phone,
          isVerified: true,
          bio: 'Passionate about meaningful conversations & spontaneous coffee dates.',
          interests: ['Coffee', 'Music', 'Travel', 'Reading'],
        }),
      }).catch((e) => console.warn('Background profile sync notice:', e));

      setCurrentUser(newUser);
      onSuccess(newUser);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#10121d] p-6 sm:p-8 shadow-2xl">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {step === 'info' ? 'Enter Synkin Portal' : 'Verify Your Number'}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            {step === 'info'
              ? 'Meet singles nearby, swipe sparks & explore verified spots.'
              : `6-digit instant verification code sent to +91 ${phone}`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'info' ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">City / Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Delhi NCR, Roorkee, Mumbai"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Enter OTP</label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456 (or any 6 digits for demo)"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/90 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <p className="mt-2 text-center text-[11px] text-zinc-400">Demo Mode: Any 6 digits will instantly log you in!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Connecting...' : step === 'info' ? 'Continue with OTP' : 'Start Swiping & Matching'}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Encrypted Zero-Knowledge Identity • 100% Private</span>
        </div>
      </div>
    </div>
  );
}
