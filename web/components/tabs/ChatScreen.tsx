'use client';

import React from 'react';
import { MessageSquare, ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { Profile } from '../../lib/types';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  online: boolean;
}

interface ChatScreenProps {
  onOpenChatThread: (chat: ChatItem) => void;
}

const DUMMY_CHATS: ChatItem[] = [
  {
    id: 'chat_1',
    name: 'Ananya',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    lastMessage: 'Are we still meeting at Blue Tokai at 6? ☕',
    time: '2m ago',
    unreadCount: 1,
    online: true,
  },
  {
    id: 'chat_2',
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    lastMessage: '🎤 Voice note (0:14)',
    time: '1h ago',
    online: false,
  },
  {
    id: 'chat_3',
    name: 'Shreya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    lastMessage: 'Mutual spark verified! Say hi ✨',
    time: 'Yesterday',
    online: true,
  },
];

export default function ChatScreen({ onOpenChatThread }: ChatScreenProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-24 pt-3">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        {/* New Sparks Horizontal Stories */}
        <div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            New Sparks (3)
          </span>
          <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {DUMMY_CHATS.map((c) => (
              <div
                key={c.id}
                onClick={() => onOpenChatThread(c)}
                className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
              >
                <div className="relative h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-[#FD3A73] to-[#7928CA] shadow-md shadow-[#FD3A73]/20">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="h-full w-full rounded-full object-cover border-2 border-black"
                  />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[60px]">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* E2EE Notice Banner */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/60 p-2.5 text-center text-[10px] text-zinc-400">
          <Lock className="h-3.5 w-3.5 text-[#FD3A73] shrink-0" />
          <span>Messages are Zero-Knowledge end-to-end encrypted. Only you two can read them.</span>
        </div>

        {/* Conversations List */}
        <div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Messages
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {DUMMY_CHATS.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onOpenChatThread(chat)}
                className="flex items-center gap-3.5 rounded-2xl border border-white/5 bg-zinc-900/80 p-3 hover:border-[#FD3A73]/30 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="relative h-13 w-13 rounded-full shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-black" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{chat.name}</h4>
                    <span className="text-[10px] text-zinc-500">{chat.time}</span>
                  </div>
                  <p
                    className={`mt-0.5 text-xs truncate ${
                      chat.unreadCount ? 'text-white font-medium' : 'text-zinc-400'
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FD3A73] text-[10px] font-bold text-white shadow-md shadow-[#FD3A73]/40">
                    {chat.unreadCount}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
