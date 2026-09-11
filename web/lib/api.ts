import { Profile, DateVenue, CurrentUser } from './types';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If running on port 8082 or production origin
    if (window.location.hostname === '3.108.217.155' || window.location.port === '8082') {
      return '';
    }
    // If running in local dev server (e.g. port 3000)
    return 'http://3.108.217.155:8082';
  }
  return 'http://3.108.217.155:8082';
};

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('synkin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: CurrentUser | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('synkin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('synkin_user');
  }
};

export const fetchProfiles = async (currentUserId?: string): Promise<Profile[]> => {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/profiles?t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.profiles || []);
    
    return list.map((item: any) => ({
      id: item.id || item.userId || String(Math.random()),
      name: item.name || 'Anonymous',
      age: item.age || 23,
      bio: item.bio || 'Exploring moments and genuine conversations.',
      city: item.city || 'Nearby',
      distanceKm: item.distanceKm !== undefined ? item.distanceKm : 1.2,
      photoUrl: item.photos?.[0] || item.photoUrl || item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      photos: item.photos || [item.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'],
      interests: item.interests || ['Coffee', 'Music', 'Travel'],
      isVerified: item.isVerified ?? true,
      online: item.online ?? true,
    }));
  } catch (err) {
    console.warn('[API] Failed to fetch profiles, using fallback live deck', err);
    return [
      {
        id: 'user_sumit',
        name: 'Sumit',
        age: 24,
        city: 'Roorkee',
        distanceKm: 0.8,
        bio: 'Tech founder, coffee addict, and spontaneous late night traveler.',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
        interests: ['Tech', 'Coffee', 'Music', 'Travel'],
        isVerified: true,
        online: true,
      },
      {
        id: 'user_ananya',
        name: 'Ananya',
        age: 22,
        city: 'Delhi NCR',
        distanceKm: 2.4,
        bio: 'Architect by day, vinyl collector by night. Let’s grab filter coffee.',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        interests: ['Art', 'Coffee', 'Architecture', 'Indie Rock'],
        isVerified: true,
        online: true,
      },
      {
        id: 'user_akshat',
        name: 'Akshat',
        age: 25,
        city: 'Gurugram',
        distanceKm: 3.1,
        bio: 'Guitar player, trekker, and always up for deep late-night talks.',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
        interests: ['Guitar', 'Hiking', 'Fitness', 'Film'],
        isVerified: true,
        online: true,
      },
    ];
  }
};

export const sendSwipeAction = async (
  userId: string,
  targetUserId: string,
  action: 'like' | 'pass' | 'superlike'
): Promise<boolean> => {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        targetUserId,
        action,
        timestamp: Date.now(),
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[API] Swipe action network error', e);
    return false;
  }
};

export const CURATED_VENUES: DateVenue[] = [
  {
    id: 'venue_blue_tokai',
    name: 'Blue Tokai Roastery',
    category: 'Artisanal Coffee & Roasters',
    location: 'Cyber Hub & Khan Market',
    distance: '1.2 km away',
    rating: 4.9,
    perk: 'Complimentary Pour-Over & Dessert with Synkin Match ☕🍰',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    safetyScore: '100% Safe Public Zone · Verified Partner',
  },
  {
    id: 'venue_diggin',
    name: 'Diggin Cafe',
    category: 'Italian Bistro & Garden Dining',
    location: 'Chanakyapuri & Anand Lok',
    distance: '3.4 km away',
    rating: 4.8,
    perk: 'VIP Candlelight Table & Welcome Sangria 🍷✨',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    safetyScore: 'Top Romantic Spot · CCTV & Valet Protected',
  },
  {
    id: 'venue_cyber_hub',
    name: 'Cyber Hub Social',
    category: 'Lounge & Craft Cocktails',
    location: 'DLF Cyber City, Gurugram',
    distance: '4.8 km away',
    rating: 4.7,
    perk: 'Priority Booth Seating & Tapas Platter 🍸🍤',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    safetyScore: 'Lively Crowd · Zero Solitary Risk Guarantee',
  },
  {
    id: 'venue_piano_man',
    name: 'The Piano Man Jazz Club',
    category: 'Live Acoustic & Jazz Lounge',
    location: 'Safdarjung Enclave',
    distance: '5.2 km away',
    rating: 4.9,
    perk: 'Reserved Stage-Facing Duo Lounge 🎷🥂',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    safetyScore: 'Premium Acoustic Venue · Synkin Concierge Desk',
  },
];
