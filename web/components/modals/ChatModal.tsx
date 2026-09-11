'use client';

import React, { useState } from 'react';
import { X, Video, Send, Coffee, ShieldCheck, Lock } from 'lucide-react';

interface ChatModalProps {
  chat: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  } | null;
  onClose: () => void;
  onTriggerVideoCall: (partnerName: string) => void;
}

export default function ChatModal({ chat, onClose, onTriggerVideoCall }: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'me' | 'them'; text: string; time: string }>>([
    { sender: 'them', text: 'Hey! Loved your profile vibe ✨', time: '6:12 PM' },
    { sender: 'me', text: 'Hey Ananya! Nice to connect. Are you into specialty coffee?', time: '6:14 PM' },
    { sender: 'them', text: 'Yes! Blue Tokai pour-overs are my absolute favorite ☕', time: '6:15 PM' },
  ]);
  const [inputText, setInputText] = useState('');

  if (!chat) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: 'me', text: inputText.trim(), time: 'Just now' },
    ]);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md">
      <div className="flex h-full max-h-[640px] w-full max-w-[420px] flex-col rounded-3xl border border-white/10 bg-[#0d0e17] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Chat Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <img src={chat.avatar} alt={chat.name} className="h-full w-full rounded-full object-cover" />
              {chat.online && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white">{chat.name}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-400">ZK-Encrypted Chat</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Video Call Button */}
            <button
              onClick={() => onTriggerVideoCall(chat.name)}
              title="3-Min Video Vibe Check"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 active:scale-95 transition-all"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[10px] text-zinc-400 border border-white/5">
            <Lock className="h-3 w-3 text-[#FD3A73]" />
            <span>Mutual match verified. Your contact info is locked.</span>
          </div>

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.sender === 'me'
                    ? 'bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] text-white rounded-br-none shadow-md shadow-[#FD3A73]/20'
                    : 'bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-white/5'
                }`}
              >
                {m.text}
              </div>
              <span className="mt-1 text-[9px] text-zinc-500">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Date Suggestion Pill */}
        <div className="border-t border-white/5 bg-zinc-950/60 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => {
              setMessages((prev) => [
                ...prev,
                { sender: 'me', text: '⚡ How about a quick coffee date at Blue Tokai? ☕', time: 'Just now' },
              ]);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            <Coffee className="h-3.5 w-3.5 text-amber-400" />
            <span>Send Coffee Date Invite ☕</span>
          </button>
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 bg-zinc-950 p-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FD3A73] focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FD3A73] text-white shadow-md shadow-[#FD3A73]/30 active:scale-90 transition-all disabled:opacity-40"
            disabled={!inputText.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
