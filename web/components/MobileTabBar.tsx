'use client';

import React from 'react';
import { Flame, Compass, Heart, MessageSquare, User } from 'lucide-react';

export type TabType = 'swipe' | 'explore' | 'insynk' | 'chat' | 'profile';

interface MobileTabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  incomingCount?: number;
  unreadChatCount?: number;
}

export default function MobileTabBar({
  activeTab,
  onSelectTab,
  incomingCount = 0,
  unreadChatCount = 0,
}: MobileTabBarProps) {
  const tabs = [
    { id: 'swipe' as TabType, label: 'Swipe', icon: Flame },
    { id: 'explore' as TabType, label: 'Explore', icon: Compass },
    { id: 'insynk' as TabType, label: 'InSynk', icon: Heart, badge: incomingCount },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare, badge: unreadChatCount },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-white/[0.08] bg-black/95 px-2 backdrop-blur-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className="group relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={`h-6 w-6 transition-all duration-200 ${
                  isActive
                    ? 'scale-110 text-[#FD3A73] drop-shadow-[0_0_8px_rgba(253,58,115,0.6)]'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              {/* Badge indicator */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border border-black shadow-sm">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`mt-1 text-[10px] font-medium tracking-tight transition-colors ${
                isActive ? 'text-[#FD3A73] font-semibold' : 'text-zinc-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
