import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, SynkRequest, Venue, DateBooking, ChatMessage, SafetyContact, BlockReport } from '../types';
import { MOCK_VENUES } from '../constants/mockData';
import {
  saveChatMessageToFirestore,
  saveUserProfileToFirestore,
  fetchProfilesFromFirestore,
  saveSynkRequestToFirestore,
  fetchIncomingRequestsFromFirestore,
  fetchSentRequestsFromFirestore,
  updateRequestStatusInFirestore,
  deleteSynkRequestFromBackend,
  deleteUserProfileFromBackend,
  deleteChatMessageFromBackend,
  clearChatFromBackend,
  deleteMultipleMessagesFromBackend,
  markMessagesAsReadOnBackend,
  updateMessageReactionOnBackend,
  checkUserExistsOnBackend,
  unregisterPushTokenOnBackend,
  blockUserOnBackend,
  unblockUserOnBackend,
  fetchBlockedUsersFromBackend,
  CLOUD_BACKEND_URL,
} from '../services/firebase';
import { encryptE2EEMessage } from '../utils/encryption';
import { RealtimeBridge } from '../services/realtimeBridge';
import { WebRTCService } from '../services/webrtcService';
import { NotificationService } from '../services/notificationService';
import { activeChatTracker } from '../services/activeChatTracker';
import * as Location from 'expo-location';

interface AppContextType {
  vipPlansEnabled: boolean;
  vipPlansConfig: any;
  isLoggedIn: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentUser: UserProfile | null;
  currentLocation: string;
  refreshLocation: () => Promise<void>;
  profiles: UserProfile[];
  matches: UserProfile[];
  incomingRequests: SynkRequest[];
  sentRequests: SynkRequest[];
  passedProfiles: Set<string>;
  venues: Venue[];
  wishlistVenueIds: Set<string>;
  toggleVenueWishlist: (venueId: string) => void;
  activeBookings: DateBooking[];
  cancelBooking: (bookingId: string) => Promise<void>;
  messages: Record<string, ChatMessage[]>;
  unreadChatIds: Set<string>;
  markChatAsRead: (partnerId: string) => void;
  blockedUsers: Set<string>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  safetyContact: SafetyContact;
  acceptedMatchAlert: UserProfile | null;
  clearAcceptedMatchAlert: () => void;
  loginUser: (user: UserProfile) => Promise<void>;
  logoutUser: () => void;
  deleteAccount: () => Promise<void>;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  updateSafetyContact: (contact: SafetyContact) => void;
  swipeProfile: (profileId: string, action: 'like' | 'pass' | 'supersynk') => { success: boolean; requestSent?: boolean; profile?: UserProfile };
  acceptRequest: (requestId: string) => UserProfile | null;
  declineRequest: (requestId: string) => void;
  deleteSentRequest: (requestId: string) => void;
  bookDate: (params: { targetUser: UserProfile; venue: Venue; dateTime: string; splitType: 'split_50_50' | 'i_treat' | 'they_treat' }) => DateBooking;
  sendMessage: (receiverId: string, text: string, type?: 'text' | 'voice' | 'call_request' | 'date_invite' | 'image' | 'call' | 'system', extraData?: ChatMessage['extraData']) => void;
  deleteMessage: (partnerId: string, messageId: string, deleteForEveryone?: boolean) => void;
  clearChat: (partnerId: string, deleteForEveryone?: boolean) => void;
  deleteMultipleMessages: (partnerId: string, messageIds: string[], deleteForEveryone?: boolean) => void;
  deleteChat: (partnerId: string) => void;
  addMessageReaction: (messageId: string, partnerId: string, emoji: string) => void;
  submitFeedback: (bookingId: string, feedback: { matched: boolean; respectful: boolean; safe: boolean; notes: string }) => void;
  refreshDiscoverFeed: () => Promise<void>;
  resetPassedProfiles: () => void;
  undoLastSwipe: () => UserProfile | null;
  superSynksRemaining: number;
  freeRewindsRemaining: number;
  dailySwipesRemaining: number;
  boostActiveUntil: number | null;
  useSuperSynk: () => boolean;
  useRewind: () => boolean;
  useSwipe: () => boolean;
  activateBoost: (durationMinutes?: number) => void;
  isSuspended: boolean;
  suspendedUntil: number | null;
  strikeCount: number;
  triggerSafetyViolation: (customMsg?: string) => boolean;
  blockReports: BlockReport[];
  submitBlockReport: (report: Omit<BlockReport, 'id' | 'timestamp' | 'status'> & { reason: string; appealNote?: string }) => Promise<void>;
  submitUnlockRequest: (userId: string, appealNote: string, violationReason?: string) => Promise<boolean>;
  adminUnblockUser: (reportId: string, userId: string) => Promise<boolean>;
  adminDismissAppeal: (reportId: string) => Promise<boolean>;
  deleteBlockReport: (reportId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialTheme = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('synking_theme');
      if (saved !== null) {
        return saved === 'dark';
      }
    }
  } catch (e) {}
  return true; // Default: PURE DARK MODE (#05060A / #08090F)
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('synking_theme', next ? 'dark' : 'light');
        }
      } catch (e) {}
      AsyncStorage.setItem('synking_theme', next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  // Zero Fake Users - Forced Reload: Start with stored user or null
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('synking_my_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && /^user_\d{4}$/.test(parsed.id)) {
            window.localStorage.removeItem('synking_my_user');
            return null;
          }
          return parsed;
        } catch (e) {}
      }
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!currentUser);
  const [currentLocation, setCurrentLocation] = useState<string>('Current Location');

  const refreshLocation = async () => {
    try {
      let lat: number | null = null;
      let lon: number | null = null;
      let detectedCity = 'Current Location';

      // 1. Try Browser / Device GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc && loc.coords) {
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;

          // Try native reverse geocode
          try {
            const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            if (geo?.city || geo?.subregion || geo?.region) {
              detectedCity = geo.city || geo.subregion || geo.region || '';
            }
          } catch (e) {}

          // If city not resolved (common on Web), use high-accuracy OpenStreetMap reverse geocoding
          if (!detectedCity || detectedCity === 'Current Location') {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
              if (res.ok) {
                const osm = await res.json();
                const c = osm?.address?.city || osm?.address?.town || osm?.address?.village || osm?.address?.county || osm?.address?.state_district;
                if (c) detectedCity = c;
              }
            } catch (e) {}
          }
        }
      }

      // 2. Fallback to IP Geolocation if GPS is not available or blocked
      if (!detectedCity || detectedCity === 'Current Location') {
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData?.city) {
              detectedCity = ipData.city;
              if (lat === null) lat = ipData.latitude;
              if (lon === null) lon = ipData.longitude;
            }
          }
        } catch (e) {}
      }

      if (!detectedCity || detectedCity === 'Current Location') {
        detectedCity = 'Roorkee';
      }

      setCurrentLocation(detectedCity);

      if (currentUser) {
        updateCurrentUser({
          location: {
            city: detectedCity,
            coordinates: [lat || 29.86, lon || 77.87],
            distance: 0,
          } as any
        });
      }
    } catch (e) {
      console.warn('[LOCATION_ERROR]', e);
      setCurrentLocation('Roorkee');
    }
  };

  // Automatically request GPS location on app launch
  useEffect(() => {
    refreshLocation();
  }, []);

  // Sync user credentials to Native TelecomModule so self missed-calls are 100% suppressed
  useEffect(() => {
    if (currentUser?.id && Platform.OS === 'android') {
      try {
        NativeModules.TelecomModule?.setCurrentUser(currentUser.id, currentUser.name || '');
      } catch (e) {}
    }
  }, [currentUser]);

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SynkRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SynkRequest[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<Set<string>>(new Set());
  const swipeHistory = useRef<{ user: UserProfile; action: 'like' | 'pass' | 'supersynk'; requestId?: string }[]>([]);
  const [acceptedMatchAlert, setAcceptedMatchAlert] = useState<UserProfile | null>(null);
  const seenMatchAlerts = useRef<Set<string>>(new Set());
  const [venues] = useState<Venue[]>(MOCK_VENUES);
  const [wishlistVenueIds, setWishlistVenueIds] = useState<Set<string>>(new Set());

  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('synking_venue_wishlist').then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setWishlistVenueIds(new Set(parsed));
          }
        } catch (e) {}
      }
    });
  }, []);

  const toggleVenueWishlist = (venueId: string) => {
    setWishlistVenueIds(prev => {
      const next = new Set(prev);
      if (next.has(venueId)) {
        next.delete(venueId);
      } else {
        next.add(venueId);
      }
      AsyncStorage.setItem('synking_venue_wishlist', JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  const [activeBookings, setActiveBookings] = useState<DateBooking[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [readChatTimestamps, setReadChatTimestamps] = useState<Record<string, number>>({});
  const [unreadChatIds, setUnreadChatIds] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  // Load blocked users from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('@synking_blocked_users').then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const set = new Set<string>(parsed);
            setBlockedUsers(set);
            WebRTCService.setBlockedUsers(set);
          }
        } catch (e) {}
      }
    });
  }, []);

  // Load active bookings from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('@synking_active_bookings').then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setActiveBookings(parsed);
          }
        } catch (e) {}
      }
    });
  }, []);

  // Sync blocked users from backend when currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchBlockedUsersFromBackend(currentUser.id).then(serverBlocked => {
        if (serverBlocked && serverBlocked.length > 0) {
          setBlockedUsers(prev => {
            const next = new Set([...Array.from(prev), ...serverBlocked]);
            AsyncStorage.setItem('@synking_blocked_users', JSON.stringify(Array.from(next))).catch(() => {});
            WebRTCService.setBlockedUsers(next);
            return next;
          });
        }
      }).catch(() => {});
    }
  }, [currentUser?.id]);

  const blockUser = useCallback(async (userId: string) => {
    if (!userId) return;
    setBlockedUsers(prev => {
      const next = new Set(prev);
      next.add(userId);
      AsyncStorage.setItem('@synking_blocked_users', JSON.stringify(Array.from(next))).catch(() => {});
      WebRTCService.setBlockedUsers(next);
      return next;
    });
    if (currentUser?.id) {
      blockUserOnBackend(currentUser.id, userId).catch(() => {});
      RealtimeBridge.broadcast('USER_BLOCKED', { blockerId: currentUser.id, blockedId: userId }, userId);
    }
    const currentSession = WebRTCService.getCurrentSession();
    if (currentSession && (currentSession.callerId === userId || currentSession.receiverId === userId)) {
      WebRTCService.endCall();
    }
  }, [currentUser?.id]);

  const unblockUser = useCallback(async (userId: string) => {
    if (!userId) return;
    setBlockedUsers(prev => {
      const next = new Set(prev);
      next.delete(userId);
      AsyncStorage.setItem('@synking_blocked_users', JSON.stringify(Array.from(next))).catch(() => {});
      WebRTCService.setBlockedUsers(next);
      return next;
    });
    if (currentUser?.id) {
      unblockUserOnBackend(currentUser.id, userId).catch(() => {});
      RealtimeBridge.broadcast('USER_UNBLOCKED', { blockerId: currentUser.id, blockedId: userId }, userId);
    }
  }, [currentUser?.id]);

  const isUserBlocked = useCallback((userId: string): boolean => {
    return blockedUsers.has(userId);
  }, [blockedUsers]);

  // 🛡️ Block Reports & Admin Unlock Appeals Management
  const [blockReports, setBlockReports] = useState<BlockReport[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('@synkin_block_reports').then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBlockReports(parsed);
            return;
          }
        } catch (e) {}
      }
      // Initial seed demo report so admin immediately sees how reports and unlock appeals appear
      const initialSeed: BlockReport[] = [
        {
          id: 'report_sample_1',
          blockedUserId: 'user_aman_77',
          blockedUserName: 'Aman Gupta',
          blockedUserPhone: '+91 98111 22334',
          blockedUserPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          reportedByUserId: 'system_shield',
          reportedByUserName: 'Synkin Safety Shield 🛡️',
          reason: 'Contact Sharing Violation: Attempted to share Instagram ID & Phone number in chat',
          timestamp: Date.now() - 3600000 * 5,
          status: 'appeal_pending',
          appealNote: 'Galti se chat me Instagram handle type ho gaya tha, aage se rules strictly follow karunga. Please account unblock kar dijiye.',
          appealTimestamp: Date.now() - 3600000 * 2,
        },
        {
          id: 'report_sample_2',
          blockedUserId: 'user_rahul_99',
          blockedUserName: 'Rahul Sharma',
          blockedUserPhone: '+91 98765 43210',
          blockedUserPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
          reportedByUserId: 'user_ananya_22',
          reportedByUserName: 'Ananya Verma',
          reason: 'Inappropriate / Abusive messages in chat',
          timestamp: Date.now() - 3600000 * 24,
          status: 'blocked',
          appealNote: undefined,
        },
      ];
      setBlockReports(initialSeed);
      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(initialSeed)).catch(() => {});
    });
  }, []);

  const submitBlockReport = useCallback(async (reportData: Omit<BlockReport, 'id' | 'timestamp' | 'status'> & { reason: string; appealNote?: string }) => {
    const newReport: BlockReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      blockedUserId: reportData.blockedUserId,
      blockedUserName: reportData.blockedUserName,
      blockedUserPhoto: reportData.blockedUserPhoto,
      blockedUserPhone: reportData.blockedUserPhone,
      reportedByUserId: reportData.reportedByUserId,
      reportedByUserName: reportData.reportedByUserName,
      reason: reportData.reason,
      timestamp: Date.now(),
      status: reportData.appealNote ? 'appeal_pending' : 'blocked',
      appealNote: reportData.appealNote,
      appealTimestamp: reportData.appealNote ? Date.now() : undefined,
    };

    setBlockReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.blockedUserId !== newReport.blockedUserId)];
      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    await blockUser(reportData.blockedUserId);

    // Sync report to Central Web Admin Console (Turso Cloud SQLite)
    try {
      fetch(`${CLOUD_BACKEND_URL}/api/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      }).catch(err => console.warn('[REPORT_SYNC_WARN]', err));
    } catch (e) {}
  }, [blockUser]);

  const submitUnlockRequest = useCallback(async (userId: string, appealNote: string, violationReason?: string): Promise<boolean> => {
    if (!userId || !appealNote.trim()) return false;
    let targetReport: BlockReport | null = null;
    let found = false;
    setBlockReports(prev => {
      const updated = prev.map(r => {
        if (r.blockedUserId === userId || (currentUser && r.blockedUserId === currentUser.id)) {
          found = true;
          const updatedReport: BlockReport = {
            ...r,
            reason: violationReason ? `Contact Sharing: ${violationReason}` : r.reason,
            status: 'appeal_pending' as const,
            appealNote: appealNote.trim(),
            appealTimestamp: Date.now(),
          };
          targetReport = updatedReport;
          return updatedReport;
        }
        return r;
      });

      if (!found) {
        const freshReport: BlockReport = {
          id: `appeal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          blockedUserId: userId,
          blockedUserName: currentUser?.name || 'Blocked Member',
          blockedUserPhoto: currentUser?.photo,
          blockedUserPhone: currentUser?.phoneNumber,
          reportedByUserId: 'system_shield',
          reportedByUserName: 'Synkin Safety Shield 🛡️',
          reason: violationReason ? `Contact Sharing: ${violationReason}` : 'Contact Sharing Violation (Phone / Instagram ID)',
          timestamp: Date.now(),
          status: 'appeal_pending',
          appealNote: appealNote.trim(),
          appealTimestamp: Date.now(),
        };
        targetReport = freshReport;
        updated.unshift(freshReport);
      }

      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    // Sync appeal to Central Web Admin Console
    if (targetReport) {
      try {
        fetch(`${CLOUD_BACKEND_URL}/api/reports/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetReport),
        }).catch(err => console.warn('[APPEAL_SYNC_WARN]', err));
      } catch (e) {}
    }

    return true;
  }, [currentUser]);

  const adminUnblockUser = useCallback(async (reportId: string, userId: string): Promise<boolean> => {
    await unblockUser(userId);

    // Unsuspend account and reset safety strikes
    setIsSuspended(false);
    setSuspendedUntil(null);
    setStrikeCount(0);
    AsyncStorage.removeItem('synking_suspended_until').catch(() => {});
    AsyncStorage.removeItem('synking_phone_strikes').catch(() => {});

    setBlockReports(prev => {
      const updated = prev.map(r => {
        if (r.id === reportId || r.blockedUserId === userId) {
          return {
            ...r,
            status: 'unblocked_by_admin' as const,
          };
        }
        return r;
      });
      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    return true;
  }, [unblockUser]);

  const adminDismissAppeal = useCallback(async (reportId: string): Promise<boolean> => {
    setBlockReports(prev => {
      const updated = prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'appeal_rejected' as const,
          };
        }
        return r;
      });
      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    return true;
  }, []);

  const deleteBlockReport = useCallback(async (reportId: string): Promise<boolean> => {
    setBlockReports(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    return true;
  }, []);


  // Load chat read timestamps from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('synking_chat_read_timestamps').then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setReadChatTimestamps(parsed);
          }
        } catch (e) {}
      }
    });
  }, []);

  const markChatAsRead = useCallback((partnerId: string) => {
    if (!partnerId) return;
    const now = Date.now();
    const cleanId = String(partnerId).trim();
    const cleanDigits = cleanId.replace(/\D/g, '').slice(-10);

    setReadChatTimestamps(prev => {
      const next = { ...prev, [cleanId]: now };
      if (cleanDigits) next[cleanDigits] = now;
      AsyncStorage.setItem('synking_chat_read_timestamps', JSON.stringify(next)).catch(() => {});
      return next;
    });

    setUnreadChatIds(prev => {
      const next = new Set(prev);
      next.delete(cleanId);
      if (cleanDigits) next.delete(cleanDigits);
      return next;
    });

    // Mark incoming messages as read in local state
    setMessages(prev => {
      const thread = prev[cleanId] || (cleanDigits ? prev[cleanDigits] : []) || [];
      let changed = false;
      const updated = thread.map(m => {
        if (m && m.senderId !== currentUser?.id && (!m.read || m.status !== 'read')) {
          changed = true;
          return { ...m, read: true, status: 'read' as const, readAt: new Date().toISOString() };
        }
        return m;
      });
      if (!changed) return prev;
      return {
        ...prev,
        [cleanId]: updated,
        ...(cleanDigits ? { [cleanDigits]: updated } : {}),
      };
    });

    // Notify partner in real-time that their messages were read
    if (currentUser?.id) {
      RealtimeBridge.broadcast('MESSAGES_READ', {
        readerId: currentUser.id,
        partnerId: cleanId,
        timestamp: new Date().toISOString(),
      }, cleanId);
      markMessagesAsReadOnBackend(currentUser.id, cleanId).catch(() => {});
    }
  }, [currentUser]);

  // Recalculate unreadChatIds whenever messages or readChatTimestamps change
  useEffect(() => {
    if (!currentUser) return;
    const myId = currentUser.id;
    const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);

    const newUnread = new Set<string>();

    Object.entries(messages).forEach(([partnerId, thread]) => {
      if (!Array.isArray(thread) || thread.length === 0) return;
      const last = thread[thread.length - 1];
      if (!last) return;

      const isFromMe =
        last.senderId === myId ||
        (myPhone && last.senderId.replace(/\D/g, '').slice(-10) === myPhone);

      if (!isFromMe) {
        const pDigits = partnerId.replace(/\D/g, '').slice(-10);
        const readTime = Math.max(
          readChatTimestamps[partnerId] || 0,
          (pDigits ? readChatTimestamps[pDigits] : 0) || 0
        );
        const msgTime = last.timestamp ? new Date(last.timestamp).getTime() : 0;
        if (msgTime > readTime) {
          newUnread.add(partnerId);
          if (pDigits) newUnread.add(pDigits);
        }
      }
    });

    setUnreadChatIds(prev => {
      const combined = new Set([...prev, ...newUnread]);
      for (const id of combined) {
        const pDigits = id.replace(/\D/g, '').slice(-10);
        const readTime = Math.max(
          readChatTimestamps[id] || 0,
          (pDigits ? readChatTimestamps[pDigits] : 0) || 0
        );
        const thread = messages[id] || (pDigits ? messages[pDigits] : undefined);
        if (thread && thread.length > 0) {
          const last = thread[thread.length - 1];
          const msgTime = last?.timestamp ? new Date(last.timestamp).getTime() : 0;
          if (readTime >= msgTime) {
            combined.delete(id);
            if (pDigits) combined.delete(pDigits);
          }
        }
      }
      if (prev.size === combined.size) {
        let same = true;
        for (const item of combined) {
          if (!prev.has(item)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return combined;
    });
  }, [messages, readChatTimestamps, currentUser?.id]);

  const [safetyContact, setSafetyContact] = useState<SafetyContact>({
    name: 'Emergency Contact',
    phone: '+91 98765 43210'
  });

  const [strikeCount, setStrikeCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<number | null>(null);

  // Dynamic App Configuration (VIP Plans Master Switch & Dynamic Pricing)
  const [vipPlansEnabled, setVipPlansEnabled] = useState<boolean>(false);
  const [vipPlansConfig, setVipPlansConfig] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${CLOUD_BACKEND_URL}/api/config`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (typeof data?.vipPlansEnabled === 'boolean') {
              setVipPlansEnabled(data.vipPlansEnabled);
            }
            if (data?.vipPlansConfig) {
              setVipPlansConfig(data.vipPlansConfig);
            }
          }
        }
      } catch (e) {}
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  // When VIP plans are disabled (launch/free mode), everyone enjoys VIP perks 100% free!
  const hasVipPerks = !vipPlansEnabled || Boolean(currentUser?.isVip);

  // 5 Action Buttons Quotas & Profile Boost Management
  const [superSynksRemaining, setSuperSynksRemaining] = useState<number>(() => (hasVipPerks ? 5 : 1));
  const [freeRewindsRemaining, setFreeRewindsRemaining] = useState<number>(() => (hasVipPerks ? 999 : 1));
  const [dailySwipesRemaining, setDailySwipesRemaining] = useState<number>(() => (hasVipPerks ? 9999 : 20));
  const [boostActiveUntil, setBoostActiveUntil] = useState<number | null>(null);

  // Daily Quota Reset (Midnight reset for SuperSynks, Rewinds & 20 Daily Free Swipes)
  useEffect(() => {
    const loadQuotas = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. SuperSynks Quota
        const storedSS = await AsyncStorage.getItem('synking_supersynks_data');
        if (storedSS) {
          const parsed = JSON.parse(storedSS);
          if (parsed && parsed.date === todayStr) {
            setSuperSynksRemaining(parsed.count);
          } else {
            const defaultCount = hasVipPerks ? 5 : 1;
            setSuperSynksRemaining(defaultCount);
            await AsyncStorage.setItem('synking_supersynks_data', JSON.stringify({ date: todayStr, count: defaultCount }));
          }
        } else {
          const defaultCount = hasVipPerks ? 5 : 1;
          setSuperSynksRemaining(defaultCount);
          await AsyncStorage.setItem('synking_supersynks_data', JSON.stringify({ date: todayStr, count: defaultCount }));
        }

        // 2. Free Rewinds Quota
        const storedRewind = await AsyncStorage.getItem('synking_rewinds_data');
        if (storedRewind) {
          const parsed = JSON.parse(storedRewind);
          if (parsed && parsed.date === todayStr) {
            setFreeRewindsRemaining(hasVipPerks ? 999 : parsed.count);
          } else {
            const defaultCount = hasVipPerks ? 999 : 1;
            setFreeRewindsRemaining(defaultCount);
            await AsyncStorage.setItem('synking_rewinds_data', JSON.stringify({ date: todayStr, count: defaultCount }));
          }
        } else {
          const defaultCount = hasVipPerks ? 999 : 1;
          setFreeRewindsRemaining(defaultCount);
          await AsyncStorage.setItem('synking_rewinds_data', JSON.stringify({ date: todayStr, count: defaultCount }));
        }

        // 3. Daily Free Swipes Quota (20 for free users, unlimited 9999 for VIP)
        const storedSwipes = await AsyncStorage.getItem('synking_daily_swipes_data');
        if (storedSwipes) {
          const parsed = JSON.parse(storedSwipes);
          if (parsed && parsed.date === todayStr) {
            setDailySwipesRemaining(hasVipPerks ? 9999 : (typeof parsed.count === 'number' ? parsed.count : 20));
          } else {
            const defaultCount = hasVipPerks ? 9999 : 20;
            setDailySwipesRemaining(defaultCount);
            await AsyncStorage.setItem('synking_daily_swipes_data', JSON.stringify({ date: todayStr, count: defaultCount }));
          }
        } else {
          const defaultCount = hasVipPerks ? 9999 : 20;
          setDailySwipesRemaining(defaultCount);
          await AsyncStorage.setItem('synking_daily_swipes_data', JSON.stringify({ date: todayStr, count: defaultCount }));
        }

        // 4. Boost Active Status
        const storedBoost = await AsyncStorage.getItem('synking_boost_active_until');
        if (storedBoost) {
          const boostUntil = parseInt(storedBoost, 10);
          if (boostUntil && Date.now() < boostUntil) {
            setBoostActiveUntil(boostUntil);
          } else {
            setBoostActiveUntil(null);
            await AsyncStorage.removeItem('synking_boost_active_until');
          }
        }
      } catch (e) {}
    };
    loadQuotas();
  }, [currentUser?.isVip, vipPlansEnabled]);

  // Load persistent Global Theme + 2-Strike & 3-Day Suspension Status + Seen Match Alerts
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('synking_theme');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          setIsDarkMode(true);
        }

        const storedStrikes = await AsyncStorage.getItem('synking_phone_strikes');
        const storedUntil = await AsyncStorage.getItem('synking_suspended_until');
        const storedSeenAlerts = await AsyncStorage.getItem('synking_seen_match_alerts');

        if (storedSeenAlerts) {
          try {
            const list = JSON.parse(storedSeenAlerts);
            if (Array.isArray(list)) {
              list.forEach((id: string) => seenMatchAlerts.current.add(id));
            }
          } catch (e) {}
        }

        if (storedStrikes) setStrikeCount(parseInt(storedStrikes, 10) || 0);
        if (storedUntil) {
          const untilTimestamp = parseInt(storedUntil, 10);
          if (untilTimestamp && Date.now() < untilTimestamp) {
            setIsSuspended(true);
            setSuspendedUntil(untilTimestamp);
          } else if (untilTimestamp && Date.now() >= untilTimestamp) {
            setIsSuspended(false);
            setSuspendedUntil(null);
            setStrikeCount(0);
            await AsyncStorage.removeItem('synking_suspended_until');
            await AsyncStorage.removeItem('synking_phone_strikes');
          }
        }
      } catch (e) {}
    };
    loadStoredState();
  }, []);

  const triggerSafetyViolation = (customMsg?: string): boolean => {
    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockDateStr = new Date(suspendedUntil).toLocaleString();
      const title = '🚫 Entire Account Blocked for 3 Days';
      const msg = `Your ENTIRE account is temporarily suspended for 72 hours due to repeated contact sharing violations.\n\n🔒 Account Unlocks: ${unlockDateStr}`;
      if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
      } else {
        Alert.alert(title, msg, [{ text: 'OK' }]);
      }
      return true;
    }

    if (strikeCount === 0) {
      setStrikeCount(1);
      AsyncStorage.setItem('synking_phone_strikes', '1').catch(() => {});
      const warningTitle = '⚠️ 1st Safety Warning (Strike 1/2)';
      const warningMsg = customMsg || 'Sharing phone numbers, social media handles, or contact info is strictly prohibited.\n\n⚠️ CAUTION: Doing this a 2nd time will immediately BLOCK YOUR WHOLE ACCOUNT (Swipes, Calls, & Chats) FOR 3 DAYS (72 Hours)!';
      if (Platform.OS === 'web') {
        window.alert(`${warningTitle}\n\n${warningMsg}`);
      } else {
        Alert.alert(warningTitle, warningMsg, [{ text: 'Understood 👍' }]);
      }
      return true;
    } else {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const unlockTimestamp = Date.now() + threeDaysMs;
      setStrikeCount(2);
      setIsSuspended(true);
      setSuspendedUntil(unlockTimestamp);
      AsyncStorage.setItem('synking_phone_strikes', '2').catch(() => {});
      AsyncStorage.setItem('synking_suspended_until', unlockTimestamp.toString()).catch(() => {});
      
      const unlockDateStr = new Date(unlockTimestamp).toLocaleString();
      const banTitle = '🚫 ENTIRE ACCOUNT BLOCKED FOR 3 DAYS (Strike 2/2)';
      const banMsg = `You repeatedly attempted to share contact details.\n\nAs per community safety policy, your ENTIRE ACCOUNT (Swiping, Calls, Messages, & InSynk) is SUSPENDED FOR 3 DAYS (72 Hours).\n\n🔒 Unlock Time: ${unlockDateStr}`;
      
      // Auto-log suspension to Admin Block Reports
      submitBlockReport({
        blockedUserId: currentUser?.id || 'my_account_id',
        blockedUserName: currentUser?.name || 'Member',
        blockedUserPhoto: currentUser?.photo,
        blockedUserPhone: currentUser?.phoneNumber,
        reportedByUserId: 'system_shield',
        reportedByUserName: 'Synkin Safety Shield 🛡️',
        reason: customMsg ? `Contact Sharing: ${customMsg}` : 'Contact Sharing Violation (Attempted to send Phone Number / Instagram ID)',
      }).catch(() => {});

      if (Platform.OS === 'web') {
        window.alert(`${banTitle}\n\n${banMsg}`);
      } else {
        Alert.alert(banTitle, banMsg, [{ text: 'I Understand' }]);
      }
      return true;
    }
  };

  // 1. Zero-Latency Realtime Bridge Subscription (0ms instant cross-device/tab synchronization)
  useEffect(() => {
    const unsubscribe = RealtimeBridge.subscribe(({ type, payload }) => {
      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;

        // Drop incoming messages from blocked contacts immediately
        if (blockedUsers.has(msg.senderId) || (msg.senderId && blockedUsers.has(String(msg.senderId).replace(/\D/g, '').slice(-10)))) {
          console.log(`🛡️ [BLOCKED_USER] Dropped incoming message from blocked contact ${msg.senderId}`);
          return;
        }
        
        function isMe(targetId?: string) {
          if (!targetId || !currentUser) return false;
          if (currentUser.id === targetId) return true;
          const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
          const tPhone = String(targetId).replace(/\D/g, '').slice(-10);
          if (myPhone && tPhone && myPhone === tPhone) return true;
          return false;
        }

        const isIncoming = isMe(msg.receiverId) && !isMe(msg.senderId);
        const isOutgoing = isMe(msg.senderId);

        // Accept message if user is either receiver or sender
        if (isIncoming || isOutgoing) {
          // Play Incoming Message Sound/Haptic if we are receiving it from someone else
          if (isIncoming) {
            // Acknowledge delivery back to sender immediately (Double Gray Tick on sender's device)
            try {
              RealtimeBridge.broadcast('MESSAGE_DELIVERED', { messageId: msg.id, senderId: msg.senderId }, msg.senderId);
            } catch (e) {}

            const isChatCurrentlyOpen = activeChatTracker.isChatActive(msg.senderId);

            // Instantly mark sender as having an unread message ONLY if not currently looking at this chat!
            if (!isChatCurrentlyOpen) {
              const senderKey = String(msg.senderId).trim();
              setUnreadChatIds(prev => {
                const next = new Set(prev);
                next.add(senderKey);
                const digits = senderKey.replace(/\D/g, '').slice(-10);
                if (digits) next.add(digits);
                return next;
              });
            }

            try {
              if (!isChatCurrentlyOpen) {
                if (Platform.OS !== 'web') {
                  const Haptics = require('expo-haptics');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                }
                const { RingtoneService } = require('../services/ringtoneService');
                if (RingtoneService) RingtoneService.playMessageChime();

                // Post notification banner on Web/iOS (Android is handled natively by MyFirebaseMessagingService to prevent duplicates)
                if (Platform.OS !== 'android') {
                  const sender = profiles.find(p => p.id === msg.senderId || (p.phoneNumber && (p.phoneNumber.replace(/\D/g, '').slice(-10) === msg.senderId.replace(/\D/g, '').slice(-10))));
                  const senderTitle = sender?.name || 'New Message';
                  let bodyText = msg.text || 'Sent you a message';
                  if (bodyText.includes('|||AUDIO_DATA::')) {
                    bodyText = '🎤 Voice note';
                  }
                  NotificationService.showMessageNotification(senderTitle, bodyText, msg.senderId);
                }
              }
            } catch(e) {}
          }

          const partnerId = isIncoming ? msg.senderId : msg.receiverId;
          setMessages(prev => {
            const list = prev[partnerId] || [];
            if (list.some(m => m.id === msg.id)) return prev;
            return { ...prev, [partnerId]: [...list, msg] };
          });
        }
      } else if (type === 'DELETE_MESSAGE' && payload) {
        const { messageId } = payload;
        if (messageId) {
          setMessages(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
              next[key] = (next[key] || []).filter(m => m && m.id !== messageId);
            }
            return next;
          });
        }
      } else if (type === 'DELETE_MESSAGES' && payload) {
        const { messageIds } = payload;
        if (Array.isArray(messageIds) && messageIds.length > 0) {
          const idSet = new Set(messageIds);
          setMessages(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
              next[key] = (next[key] || []).filter(m => m && !idSet.has(m.id));
            }
            return next;
          });
        }
      } else if (type === 'CLEAR_CHAT' && payload) {
        const { partnerId, clearedBy } = payload;
        const targetThread = clearedBy === currentUser?.id ? partnerId : (partnerId || clearedBy);
        if (targetThread) {
          setMessages(prev => ({
            ...prev,
            [targetThread]: [],
          }));
        }
      } else if (type === 'MESSAGE_DELIVERED' && payload) {
        const { messageId } = payload;
        if (messageId) {
          setMessages(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
              next[key] = (next[key] || []).map(m =>
                m.id === messageId && m.status !== 'read' && !m.read
                  ? { ...m, status: 'delivered' as const }
                  : m
              );
            }
            return next;
          });
        }
      } else if (type === 'MESSAGES_READ' && payload) {
        const { readerId, partnerId } = payload;
        const myId = currentUser?.id || '';
        const myDigits = myId.replace(/\D/g, '').slice(-10);
        const rDigits = String(readerId || '').replace(/\D/g, '').slice(-10);
        const pDigits = String(partnerId || '').replace(/\D/g, '').slice(-10);

        const isReaderMe = readerId === myId || (Boolean(rDigits) && Boolean(myDigits) && rDigits === myDigits);
        const targetThread = isReaderMe ? partnerId : readerId;
        const targetDigits = (isReaderMe ? pDigits : rDigits) || '';

        setMessages(prev => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            const keyDigits = key.replace(/\D/g, '').slice(-10);
            const isTargetThread =
              key === targetThread ||
              (Boolean(targetDigits) && Boolean(keyDigits) && keyDigits === targetDigits);

            if (isTargetThread) {
              next[key] = (next[key] || []).map(m => {
                const sDigits = String(m.senderId || '').replace(/\D/g, '').slice(-10);
                const isSentByMe = m.senderId === myId || (Boolean(sDigits) && Boolean(myDigits) && sDigits === myDigits);
                return isSentByMe
                  ? { ...m, read: true, status: 'read' as const, readAt: new Date().toISOString() }
                  : m;
              });
            }
          }
          return next;
        });
      } else if (type === 'MESSAGE_REACTION' && payload) {
        const { messageId, emoji } = payload;
        if (messageId) {
          setMessages(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
              next[key] = (next[key] || []).map(m =>
                m.id === messageId
                  ? { ...m, extraData: { ...m.extraData, reaction: emoji } }
                  : m
              );
            }
            return next;
          });
        }
      } else if (type === 'SYNK_REQUEST' && payload) {
        const req = payload as SynkRequest;
        const myId = currentUser?.id;
        const myPhone = (currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const toPhone = String(req.toUserId || '').replace(/\D/g, '').slice(-10);
        const isForMe = req.toUserId === myId || (myPhone && toPhone && myPhone === toPhone);
        const isFromMe = req.fromUser?.id === myId;

        if (isForMe && !isFromMe) {
          setIncomingRequests(prev => {
            if (prev.some(r => r.id === req.id)) return prev;
            return [req, ...prev];
          });

          // 🔔 Trigger local phone tray notification for incoming swipe / like
          const fromName = req.fromUser?.name || 'Someone';
          const isSuper = req.type === 'supersynk';
          const photo = req.fromUser?.photo || req.fromUser?.photos?.[0] || '';
          NotificationService.showSwipeNotification(fromName, isSuper, req.fromUser?.id || '', photo);
        }
      } else if (type === 'REQUEST_ACCEPTED' && payload) {
        if (payload.fromUserId === currentUser?.id && payload.acceptedBy) {
          const acceptedUser = payload.acceptedBy as UserProfile;
          if (acceptedUser && acceptedUser.id) {
            setMatches(prev => {
              if (prev.some(m => m && m.id === acceptedUser.id)) return prev;
              return [acceptedUser, ...prev.filter(Boolean)];
            });
            // ONLY alert ONCE ever per match in real time
            if (!seenMatchAlerts.current.has(acceptedUser.id)) {
              seenMatchAlerts.current.add(acceptedUser.id);
              AsyncStorage.setItem(
                'synking_seen_match_alerts',
                JSON.stringify(Array.from(seenMatchAlerts.current))
              ).catch(() => {});
              setAcceptedMatchAlert(acceptedUser);

              // 🔔 Trigger match celebration push notification
              NotificationService.showMatchNotification(acceptedUser.name, acceptedUser.id, acceptedUser.photo);
            }
          }
        }
      } else if (type === 'DATE_BOOKED' && payload) {
        const booking = payload.booking as DateBooking;
        const myId = currentUser?.id;
        const myPhone = (currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const toPhone = String(booking?.user2Id || '').replace(/\D/g, '').slice(-10);
        const isForMe = booking?.user2Id === myId || (myPhone && toPhone && myPhone === toPhone);

        if (booking && isForMe) {
          setActiveBookings(prev => {
            if (prev.some(b => b.id === booking.id)) return prev;
            const updated = [booking, ...prev];
            AsyncStorage.setItem('@synking_active_bookings', JSON.stringify(updated)).catch(() => {});
            return updated;
          });

          // 🔔 Trigger local phone tray notification for Date Booking
          const fromName = booking.userName || 'Your Date';
          const venueName = booking.venue?.name || 'Restaurant';
          const dateTime = booking.dateTime || 'Upcoming Date';
          NotificationService.showDateBookingNotification(fromName, venueName, dateTime, booking.id);
        }
      } else if (type === 'DATE_CANCELLED' && payload?.bookingId) {
        setActiveBookings(prev => {
          const updated = prev.map(b => b.id === payload.bookingId ? { ...b, status: 'cancelled' as const } : b);
          AsyncStorage.setItem('@synking_active_bookings', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      } else if (type === 'INCOMING_CALL' && payload) {
        if (payload.receiverId === currentUser?.id && payload.callerUser) {
          const currentSession = WebRTCService.getCurrentSession();
          if (currentSession && currentSession.id === payload.callId && (currentSession.status === 'ringing' || currentSession.status === 'connected')) {
            // Already active/ringing for this callId, ignore 3.5s pulse
            return;
          }
          const photo = payload.callerUser.photo || payload.callerUser.photos?.[0] || '';
          NotificationService.showIncomingCallNotification(
            payload.callerUser.name, 
            payload.type, 
            payload.callId,
            payload.callerUser.id,
            photo
          );
          WebRTCService.receiveIncomingCall(payload.callerUser, payload.type, payload.callId);
        }
      } else if (type === 'CALL_ENDED' || type === 'CALL_REJECTED' || type === 'CALL_ACCEPTED') {
        NotificationService.dismissCallNotification();
      } else if (type === 'USER_DELETED' && payload) {
        if (payload.userId === currentUser?.id) {
          console.log('🚪 [USER_DELETED_BY_ADMIN] Logging out deleted user:', currentUser?.id);
          logoutUser();
          if (Platform.OS === 'web') {
            window.alert('Session Expired: Your profile was removed from the server. Please sign in again.');
          } else {
            Alert.alert('Session Expired', 'Your profile is no longer active. Please sign in again.');
          }
        } else {
          setProfiles(prev => prev.filter(p => p && p.id !== payload.userId));
          setMatches(prev => prev.filter(m => m && m.id !== payload.userId));
          setIncomingRequests(prev => prev.filter(r => r && r.fromUser?.id !== payload.userId && r.toUserId !== payload.userId));
          setSentRequests(prev => prev.filter(r => r && r.toUserId !== payload.userId && r.fromUser?.id !== payload.userId));
          setMessages(prev => {
            const next = { ...prev };
            delete next[payload.userId];
            return next;
          });
        }
      } else if (type === 'ACCOUNT_UNBLOCKED' && payload) {
        const targetUserId = payload.userId;
        const myId = currentUser?.id;
        const myPhone = (currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const targetPhone = String(targetUserId || '').replace(/\D/g, '').slice(-10);
        const isMe = targetUserId === myId || (myPhone && targetPhone && myPhone === targetPhone);

        if (isMe) {
          console.log('⚖️ [ACCOUNT_UNBLOCKED_BY_ADMIN] Admin unlocked this account live!');
          setIsSuspended(false);
          setSuspendedUntil(null);
          setStrikeCount(0);
          AsyncStorage.removeItem('synking_suspended_until').catch(() => {});
          AsyncStorage.removeItem('synking_phone_strikes').catch(() => {});
        }

        // Also update local blockReports state
        setBlockReports(prev => {
          const updated = prev.map(r => {
            if (r.id === payload.reportId || r.blockedUserId === targetUserId) {
              return { ...r, status: 'unblocked_by_admin' as const };
            }
            return r;
          });
          AsyncStorage.setItem('@synkin_block_reports', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      } else if (type === 'DATABASE_WIPED') {
        console.log('🧹 [DATABASE_WIPED_BY_ADMIN] Resetting state and logging out all users');
        logoutUser();
        setProfiles([]);
        setMatches([]);
        setIncomingRequests([]);
        setSentRequests([]);
        setMessages({});
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Sync Real User Profiles & Incoming/Sent Requests from Cloud Firestore
  const syncCloudState = async () => {
    // 0. Auto-Validate: Check if current logged-in user still exists on server
    if (currentUser && currentUser.id) {
      const exists = await checkUserExistsOnBackend(currentUser.id);
      if (!exists) {
        console.log('🚨 [USER_NOT_FOUND_ON_SERVER] User was deleted by admin or database wiped. Auto-logging out.');
        logoutUser();
        setProfiles([]);
        setMatches([]);
        setIncomingRequests([]);
        setSentRequests([]);
        setMessages({});
        if (Platform.OS === 'web') {
          window.alert('Session Expired: Your profile is no longer active. Please sign in.');
        } else {
          Alert.alert('Session Expired', 'Your profile is no longer active. Please sign in again.');
        }
        return;
      }
    }

    // 1. Fetch real registered profiles for Discover (even if NOT logged in)
    const currentId = currentUser?.id || 'guest';
    const realUsers = await fetchProfilesFromFirestore(currentId);
    let combinedProfiles: UserProfile[] = Array.isArray(realUsers) ? realUsers.filter(Boolean) : [];

    if (currentUser) {
      const myId = currentUser.id;
      const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
      const myName = (currentUser.name || '').trim().toLowerCase();
      combinedProfiles = combinedProfiles.filter(u => {
        if (!u || !u.id) return false;
        if (u.id === myId) return false;
        const uPhone = (u.phoneNumber || '').replace(/\D/g, '').slice(-10);
        if (myPhone && uPhone && myPhone === uPhone) return false;
        if (myName && u.name && u.name.trim().toLowerCase() === myName) return false;
        return true;
      });
    }
    setProfiles(combinedProfiles);

    if (!currentUser) return; // Only stop here for requests/matches which require auth

    const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const myName = (currentUser.name || '').trim().toLowerCase();

    // 2. Fetch Incoming Synk Requests sent to this user (filtered by pending)
    const cloudRequests = await fetchIncomingRequestsFromFirestore(currentUser.id);
    if (Array.isArray(cloudRequests)) {
      const pendingOnly = cloudRequests.filter(r => {
        if (!r || r.status !== 'pending' || !r.fromUser) return false;
        // Never allow requests from oneself
        if (r.fromUser.id === currentUser.id) return false;
        const fromPhone = (r.fromUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
        if (myPhone && fromPhone && myPhone === fromPhone) return false;
        if (myName && r.fromUser.name && r.fromUser.name.trim().toLowerCase() === myName) return false;
        return true;
      });
      
      // Deduplicate by sender ID just in case
      const seenSenders = new Set();
      const deduplicatedPending = pendingOnly.filter(r => {
        if (!r.fromUser?.id) return false;
        if (seenSenders.has(r.fromUser.id)) return false;
        seenSenders.add(r.fromUser.id);
        return true;
      });
      
      setIncomingRequests(deduplicatedPending);
      
      // Add accepted incoming requests to matches
      cloudRequests.forEach(req => {
        if (req && req.status === 'accepted' && req.fromUser) {
          const fromPhone = (req.fromUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
          const isMe = req.fromUser.id === currentUser.id ||
            (myPhone && fromPhone && myPhone === fromPhone) ||
            (myName && req.fromUser.name && req.fromUser.name.trim().toLowerCase() === myName);
          if (!isMe) {
            setMatches(prev => {
              if (prev.some(m => m && m.id === req.fromUser!.id)) return prev;
              return [req.fromUser!, ...prev.filter(Boolean)];
            });
          }
        }
      });
    }

    // Fetch Sent Requests and silently sync matches (NO annoying repeat popups on refresh)
    const cloudSent = await fetchSentRequestsFromFirestore(currentUser.id);
    if (Array.isArray(cloudSent) && cloudSent.length > 0) {
      setSentRequests(cloudSent.filter(Boolean));
      cloudSent.forEach(sentReq => {
        if (sentReq && sentReq.status === 'accepted') {
          // Find user profile of the person who accepted
          const partner = realUsers.find(u => u && (u.id === sentReq.toUserId || u.name === sentReq.toUserName));
          if (partner && partner.id && partner.id !== currentUser.id) {
            const partnerPhone = (partner.phoneNumber || '').replace(/\D/g, '').slice(-10);
            const isMe = (myPhone && partnerPhone && myPhone === partnerPhone) ||
              (myName && partner.name && partner.name.trim().toLowerCase() === myName);
            if (!isMe) {
              setMatches(prev => {
                if (prev.some(m => m && m.id === partner.id)) return prev;
                return [partner, ...prev.filter(Boolean)];
              });
              // Mark partner as seen so it never re-triggers popups
              seenMatchAlerts.current.add(partner.id);
            }
          }
        }
      });
    }
  };

  // Load stored profile from AsyncStorage for Native Mobile Expo Go
  useEffect(() => {
    const loadNativeUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('synking_my_user');
        if (stored && !currentUser) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.name) {
            // Verify if user was deleted on server (e.g. admin reset database)
            const exists = await checkUserExistsOnBackend(parsed.id);
            if (!exists) {
              console.log('🧹 [STALE_USER_PURGED] User does not exist on server. Clearing local storage.');
              await AsyncStorage.removeItem('synking_my_user');
              setCurrentUser(null);
              setIsLoggedIn(false);
              return;
            }

            setCurrentUser(parsed);
            setIsLoggedIn(true);
          }
        }
      } catch (e) {}
    };
    loadNativeUser();
  }, []);

  // Sync user profile state and WebSocket registration
  useEffect(() => {
    if (currentUser) {
      RealtimeBridge.registerUser(currentUser.id);
      NotificationService.registerForPushNotificationsAsync(currentUser.id, currentUser.phoneNumber);
      setIsLoggedIn(true);
      syncCloudState();
    }
  }, [currentUser?.id]);

  // Relaxed Firestore Polling (WebSocket handles 0ms instant updates)
  useEffect(() => {
    syncCloudState();
    const interval = setInterval(syncCloudState, 45000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveUserProfileToFirestore(updated);
      AsyncStorage.setItem('synking_my_user', JSON.stringify(updated)).catch(() => {});
      if (Platform.OS === 'android' && updated.id) {
        try {
          NativeModules.TelecomModule?.setCurrentUser(updated.id, updated.name || '');
        } catch (e) {}
      }
      return updated;
    });
  };

  const loginUser = async (user: UserProfile) => {
    await saveUserProfileToFirestore(user); // Await the save to prevent race condition with self-check!
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('synking_my_user', JSON.stringify(user));
    }
    AsyncStorage.setItem('synking_my_user', JSON.stringify(user)).catch(() => {});
    if (Platform.OS === 'android' && user.id) {
      try {
        NativeModules.TelecomModule?.setCurrentUser(user.id, user.name || '');
      } catch (e) {}
    }
    setTimeout(() => {
      syncCloudState();
    }, 100);
  };

  const logoutUser = () => {
    const oldUserId = currentUser?.id;
    setCurrentUser(null);
    setIsLoggedIn(false);
    setMatches([]);
    setIncomingRequests([]);
    setSentRequests([]);
    setMessages({});

    // 1. Unbind Push Token & Socket from Backend so this device NEVER receives ghost calls or notifications
    if (oldUserId) {
      RealtimeBridge.unregisterUser(oldUserId);
      unregisterPushTokenOnBackend(oldUserId).catch(() => {});
    }

    // 2. Wipe Local Storage & Cache completely (All messages, calls, session data)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('synking_my_user');
    }
    AsyncStorage.getAllKeys().then(keys => {
      const keysToRemove = keys.filter(key => 
        key === 'synking_my_user' ||
        key.startsWith('synking_cached_msgs') ||
        key.startsWith('synking_msgs_') ||
        key.startsWith('synking_chat_') ||
        key.startsWith('synking_call_') ||
        key.startsWith('synking_deleted_') ||
        key === 'synking_chat_read_timestamps' ||
        key === '@synking_active_bookings' ||
        key === 'synking_seen_match_alerts' ||
        key === 'synking_supersynks_data' ||
        key === 'synking_rewinds_data' ||
        key === 'synking_daily_swipes_data' ||
        key === 'synking_boost_active_until' ||
        key === 'synking_phone_strikes' ||
        key === 'synking_suspended_until'
      );
      if (keysToRemove.length > 0) {
        AsyncStorage.multiRemove(keysToRemove).catch(() => {});
      }
    }).catch(() => {
      AsyncStorage.removeItem('synking_my_user').catch(() => {});
    });
  };

  const deleteAccount = async () => {
    if (currentUser?.id) {
      await deleteUserProfileFromBackend(currentUser.id);
    }
    logoutUser();
    setProfiles([]);
    setMatches([]);
    setIncomingRequests([]);
    setSentRequests([]);
    setMessages({});
  };

  const updateSafetyContact = (contact: SafetyContact) => {
    setSafetyContact(contact);
  };

  // Right Swipe: Instant 0ms Broadcast + Firestore Persistence
  const swipeProfile = (profileId: string, action: 'like' | 'pass' | 'supersynk') => {
    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockStr = new Date(suspendedUntil).toLocaleString();
      const msg = `Your ENTIRE account is temporarily suspended for 3 days.\n\n🔒 Swiping & Matching unlock on: ${unlockStr}`;
      if (Platform.OS === 'web') {
        window.alert(`🚫 Entire Account Suspended\n\n${msg}`);
      } else {
        Alert.alert('🚫 Entire Account Suspended', msg, [{ text: 'OK' }]);
      }
      return { success: false };
    }

    const swipedUser = profiles.find(p => p.id === profileId);
    setProfiles(prev => prev.filter(p => p.id !== profileId));

    if (action === 'pass') {
      if (swipedUser) {
        swipeHistory.current.push({ user: swipedUser, action: 'pass' });
      }
      setPassedProfiles(prev => {
        const newSet = new Set(prev);
        newSet.add(profileId);
        return newSet;
      });
      return { success: true };
    }

    if (action === 'like' || action === 'supersynk') {
      // NEVER allow matching or sending request to yourself (ID, phone, or name)
      const myPhone = (currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
      const swipedPhone = (swipedUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
      const isSelf =
        !swipedUser ||
        !currentUser ||
        swipedUser.id === currentUser.id ||
        (myPhone && swipedPhone && myPhone === swipedPhone) ||
        (currentUser.name && swipedUser.name && currentUser.name.trim().toLowerCase() === swipedUser.name.trim().toLowerCase());

      if (!isSelf && swipedUser && currentUser) {
        // Block multi-tap rapid duplicate requests
        const alreadySent = sentRequests.some(r => r.toUserId === swipedUser.id && r.status === 'pending');
        if (alreadySent) return { success: false, requestSent: false };

        const newReq: SynkRequest = {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fromUser: currentUser,
          toUserId: swipedUser.id,
          type: action === 'supersynk' ? 'supersynk' : 'like',
          timestamp: 'Just now',
          status: 'pending'
        };

        swipeHistory.current.push({ user: swipedUser, action, requestId: newReq.id });

        setSentRequests(prev => {
          if (prev.some(r => r.toUserId === swipedUser.id)) return prev;
          return [newReq, ...prev];
        });
        
        RealtimeBridge.broadcast('SYNK_REQUEST', newReq, swipedUser.id);
        saveSynkRequestToFirestore(newReq);

        return { success: true, requestSent: true, profile: swipedUser };
      }
    }
    return { success: true };
  };

  // Accept Request: Broadcasts instant acceptance alert to sender device & updates cloud
  const acceptRequest = (requestId: string): UserProfile | null => {
    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockStr = new Date(suspendedUntil).toLocaleString();
      const msg = `Your ENTIRE account is temporarily suspended for 3 days.\n\n🔒 Accepting matches unlocks on: ${unlockStr}`;
      if (Platform.OS === 'web') {
        window.alert(`🚫 Entire Account Suspended\n\n${msg}`);
      } else {
        Alert.alert('🚫 Entire Account Suspended', msg, [{ text: 'OK' }]);
      }
      return null;
    }

    const req = incomingRequests.find(r => r.id === requestId);
    if (!req) return null;

    setIncomingRequests(prev => prev.filter(r => r && r.id !== requestId));
    if (req.fromUser) {
      setMatches(prev => [req.fromUser, ...prev.filter(Boolean)]);
    }

    // 1. Broadcast instant 0ms Acceptance Notification to sender device
    if (currentUser) {
      RealtimeBridge.broadcast(
        'REQUEST_ACCEPTED',
        {
          requestId,
          fromUserId: req.fromUser.id,
          acceptedBy: currentUser,
        },
        req.fromUser.id
      );
    }

    // 2. Persist update in Cloud Firestore
    updateRequestStatusInFirestore(requestId, 'accepted');

    return req.fromUser;
  };

  const declineRequest = (requestId: string) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    updateRequestStatusInFirestore(requestId, 'declined');
  };

  const deleteSentRequest = (requestId: string) => {
    const deletedReq = sentRequests.find(r => r.id === requestId);
    const targetUserId = deletedReq?.toUserId;
    
    setSentRequests(prev => prev.filter(r => r.id !== requestId));
    if (targetUserId) {
      setPassedProfiles(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }

    // Central Cloud Delete
    deleteSynkRequestFromBackend(requestId).then(() => {
      syncCloudState();
    }).catch(() => {});
  };

  const bookDate = ({
    targetUser,
    venue,
    dateTime,
    splitType,
  }: {
    targetUser: UserProfile;
    venue: Venue;
    dateTime: string;
    splitType: 'split_50_50' | 'i_treat' | 'they_treat';
  }): DateBooking => {
    const newBooking: DateBooking = {
      id: `booking_${Date.now()}`,
      user1Id: currentUser?.id || 'my_user_id',
      user2Id: targetUser.id,
      userName: targetUser.name,
      userPhoto: targetUser.photo || targetUser.photos?.[0] || '',
      venue,
      dateTime,
      packageName: 'Synk Special Reservation',
      splitType,
      status: 'confirmed',
      qrCode: `SYNK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    setActiveBookings(prev => {
      const updated = [newBooking, ...prev];
      AsyncStorage.setItem('@synking_active_bookings', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    const inviteMsg: ChatMessage = {
      id: `msg_invite_${Date.now()}`,
      senderId: currentUser?.id || 'my_user_id',
      receiverId: targetUser.id,
      text: `⚡ Date Planned! Reserved table at ${venue.name} for ${dateTime}. Pass: ${newBooking.qrCode}`,
      timestamp: 'Just now',
      type: 'date_invite',
      extraData: {
        bookingId: newBooking.id,
        venueName: venue.name,
        qrCode: newBooking.qrCode
      }
    };

    setMessages(prev => ({
      ...prev,
      [targetUser.id]: [...(prev[targetUser.id] || []), inviteMsg]
    }));

    // 1. Broadcast chat message targeted to recipient
    RealtimeBridge.broadcast('NEW_MESSAGE', inviteMsg, targetUser.id);

    // 2. Broadcast booking event to recipient so their Date Passes tab updates & notification triggers
    const recipientBooking: DateBooking = {
      ...newBooking,
      userName: currentUser?.name || 'Your Date',
      userPhoto: currentUser?.photo || currentUser?.photos?.[0] || '',
    };
    RealtimeBridge.broadcast('DATE_BOOKED', { booking: recipientBooking, inviteMsg }, targetUser.id);

    // 3. Save to Firestore so it persists permanently
    saveChatMessageToFirestore({
      id: inviteMsg.id,
      senderId: inviteMsg.senderId,
      receiverId: inviteMsg.receiverId,
      cipherText: inviteMsg.text,
      plainText: inviteMsg.text,
      isEncrypted: false,
      type: inviteMsg.type,
      extraData: inviteMsg.extraData,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return newBooking;
  };

  const cancelBooking = useCallback(async (bookingId: string) => {
    setActiveBookings(prev => {
      const updated = prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b);
      AsyncStorage.setItem('@synking_active_bookings', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    RealtimeBridge.broadcast('DATE_CANCELLED', { bookingId });
  }, []);

  // Send Message: Instant 0ms Broadcast + Fast Firestore Stream
  const sendMessage = async (
    receiverId: string, 
    text: string, 
    type: 'text' | 'voice' | 'call_request' | 'date_invite' | 'image' | 'call' | 'system' = 'text', 
    extraData?: ChatMessage['extraData']
  ) => {
    if (blockedUsers.has(receiverId) || blockedUsers.has(String(receiverId).replace(/\D/g, '').slice(-10))) {
      if (Platform.OS === 'web') {
        window.alert('🚫 Contact Blocked\nYou have blocked this contact. Unblock them to send messages.');
      } else {
        Alert.alert('Contact Blocked', 'You have blocked this contact. Unblock them to send messages.');
      }
      return;
    }

    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockStr = new Date(suspendedUntil).toLocaleString();
      const msg = `Your ENTIRE account is temporarily suspended for 3 days.\n\n🔒 Messaging unlocks on: ${unlockStr}`;
      if (Platform.OS === 'web') {
        window.alert(`🚫 Entire Account Suspended\n\n${msg}`);
      } else {
        Alert.alert('🚫 Entire Account Suspended', msg, [{ text: 'OK' }]);
      }
      return;
    }

    const senderId = currentUser?.id || 'my_user_id';
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: senderId,
      receiverId: receiverId,
      text: text,
      timestamp: new Date().toISOString(),
      type: type,
      read: false,
      status: 'sent',
      extraData: extraData,
    };

      // 1. Play WhatsApp style 'Kat' send sound and vibration
      try {
        if (Platform.OS !== 'web') {
          const Haptics = require('expo-haptics');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        const { RingtoneService } = require('../services/ringtoneService');
        if (RingtoneService) {
          RingtoneService.playMessageChime();
        }
      } catch(e) {}

    setMessages(prev => {
      const existing = prev[receiverId] || [];
      if (existing.some(m => m.id === newMsg.id)) return prev;
      return {
        ...prev,
        [receiverId]: [...existing, newMsg]
      };
    });

    RealtimeBridge.broadcast('NEW_MESSAGE', newMsg, receiverId);

    const encryptedPayload = await encryptE2EEMessage(text, senderId, receiverId);

    saveChatMessageToFirestore({
      id: newMsg.id,
      senderId: newMsg.senderId,
      receiverId: newMsg.receiverId,
      cipherText: encryptedPayload.ciphertext,
      plainText: text,
      isEncrypted: true,
      type: newMsg.type,
      extraData: newMsg.extraData,
      timestamp: new Date().toISOString(),
    }).then(() => {
      setMessages(prev => {
        const list = prev[receiverId] || [];
        return {
          ...prev,
          [receiverId]: list.map(m => m.id === newMsg.id && m.status !== 'read' && !m.read ? { ...m, status: 'delivered' as const } : m)
        };
      });
    }).catch(() => {});
  };

  const deleteMessage = (partnerId: string, messageId: string, deleteForEveryone = false) => {
    setMessages(prev => {
      const list = prev[partnerId] || [];
      const filtered = list.filter(m => m && m.id !== messageId);
      return { ...prev, [partnerId]: filtered };
    });

    // Permanently remove from Turso SQLite database & backend cache
    deleteChatMessageFromBackend(messageId).catch(() => {});

    if (deleteForEveryone) {
      try {
        RealtimeBridge.broadcast('DELETE_MESSAGE', { messageId, partnerId, senderId: currentUser?.id }, partnerId);
      } catch (e) {
        console.warn('RealtimeBridge delete broadcast error:', e);
      }
    }
  };

  const clearChat = (partnerId: string, deleteForEveryone = false) => {
    if (!partnerId) return;
    setMessages(prev => {
      const next = { ...prev };
      next[partnerId] = [];
      const pDigits = partnerId.replace(/\D/g, '').slice(-10);
      if (pDigits) next[pDigits] = [];
      return next;
    });

    if (currentUser?.id) {
      clearChatFromBackend(currentUser.id, partnerId).catch(() => {});
    }

    if (deleteForEveryone) {
      try {
        RealtimeBridge.broadcast('CLEAR_CHAT', { partnerId, clearedBy: currentUser?.id }, partnerId);
      } catch (e) {}
    }
  };

  const deleteMultipleMessages = (partnerId: string, messageIds: string[], deleteForEveryone = false) => {
    if (!partnerId || !messageIds || messageIds.length === 0) return;
    const idSet = new Set(messageIds);

    setMessages(prev => {
      const list = prev[partnerId] || [];
      const filtered = list.filter(m => m && !idSet.has(m.id));
      const next = { ...prev, [partnerId]: filtered };
      const pDigits = partnerId.replace(/\D/g, '').slice(-10);
      if (pDigits && prev[pDigits]) {
        next[pDigits] = (prev[pDigits] || []).filter(m => m && !idSet.has(m.id));
      }
      return next;
    });

    deleteMultipleMessagesFromBackend(messageIds).catch(() => {});

    if (deleteForEveryone) {
      try {
        RealtimeBridge.broadcast('DELETE_MESSAGES', { messageIds, partnerId, senderId: currentUser?.id }, partnerId);
      } catch (e) {}
    }
  };

  const deleteChat = (partnerId: string) => {
    clearChat(partnerId, false);
    setMatches(prev => prev.filter(m => m && m.id !== partnerId));
  };

  const addMessageReaction = (messageId: string, partnerId: string, emoji: string) => {
    if (!messageId) return;
    setMessages(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = (next[key] || []).map(m =>
          m.id === messageId
            ? { ...m, extraData: { ...m.extraData, reaction: emoji } }
            : m
        );
      }
      return next;
    });

    updateMessageReactionOnBackend(messageId, emoji).catch(() => {});

    try {
      RealtimeBridge.broadcast('MESSAGE_REACTION', {
        messageId,
        threadKey: partnerId,
        emoji,
        senderId: currentUser?.id,
        partnerId
      }, partnerId);
    } catch (e) {}
  };

  const submitFeedback = (bookingId: string, feedback: { matched: boolean; respectful: boolean; safe: boolean; notes: string }) => {
    console.log('Feedback submitted anonymously for booking:', bookingId, feedback);
  };

  const resetPassedProfiles = () => {
    swipeHistory.current = [];
    setPassedProfiles(new Set());
    syncCloudState();
  };

  const undoLastSwipe = (): UserProfile | null => {
    const last = swipeHistory.current.pop();
    if (!last || !last.user) return null;

    // 1. Re-insert user at the beginning of profiles
    setProfiles(prev => [last.user, ...prev.filter(p => p.id !== last.user.id)]);

    // 2. If it was a pass, remove from passedProfiles
    if (last.action === 'pass') {
      setPassedProfiles(prev => {
        const next = new Set(prev);
        next.delete(last.user.id);
        return next;
      });
    }

    // 3. If it was a like/supersynk, retract sent request
    if (last.action === 'like' || last.action === 'supersynk') {
      setSentRequests(prev => prev.filter(r => r.toUserId !== last.user.id));
      if (last.requestId) {
        deleteSynkRequestFromBackend(last.requestId).catch(() => {});
      }
    }

    return last.user;
  };

  const useSuperSynk = (): boolean => {
    if (superSynksRemaining > 0) {
      const next = superSynksRemaining - 1;
      setSuperSynksRemaining(next);
      const todayStr = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem('synking_supersynks_data', JSON.stringify({ date: todayStr, count: next })).catch(() => {});
      return true;
    }
    return false;
  };

  const useRewind = (): boolean => {
    if (currentUser?.isVip) return true;
    if (freeRewindsRemaining > 0) {
      const next = freeRewindsRemaining - 1;
      setFreeRewindsRemaining(next);
      const todayStr = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem('synking_rewinds_data', JSON.stringify({ date: todayStr, count: next })).catch(() => {});
      return true;
    }
    return false;
  };

  const useSwipe = (): boolean => {
    if (currentUser?.isVip) return true;
    if (dailySwipesRemaining > 0) {
      const next = dailySwipesRemaining - 1;
      setDailySwipesRemaining(next);
      const todayStr = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem('synking_daily_swipes_data', JSON.stringify({ date: todayStr, count: next })).catch(() => {});
      return true;
    }
    return false;
  };

  const activateBoost = (durationMinutes = 30) => {
    const until = Date.now() + durationMinutes * 60 * 1000;
    setBoostActiveUntil(until);
    AsyncStorage.setItem('synking_boost_active_until', until.toString()).catch(() => {});
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isDarkMode,
        toggleTheme,
        currentUser,
        currentLocation,
        refreshLocation,
        profiles,
        matches,
        incomingRequests,
        sentRequests,
        passedProfiles,
        venues,
        wishlistVenueIds,
        toggleVenueWishlist,
        activeBookings,
        cancelBooking,
        messages,
        unreadChatIds,
        markChatAsRead,
        blockedUsers,
        blockUser,
        unblockUser,
        isUserBlocked,
        safetyContact,
        acceptedMatchAlert,
        clearAcceptedMatchAlert: () => {
          if (acceptedMatchAlert?.id) {
            seenMatchAlerts.current.add(acceptedMatchAlert.id);
            AsyncStorage.setItem(
              'synking_seen_match_alerts',
              JSON.stringify(Array.from(seenMatchAlerts.current))
            ).catch(() => {});
          }
          setAcceptedMatchAlert(null);
        },
        loginUser,
        logoutUser,
        vipPlansEnabled,
        vipPlansConfig,
        deleteAccount,
        updateCurrentUser,
        updateSafetyContact,
        swipeProfile,
        acceptRequest,
        declineRequest,
        deleteSentRequest,
        bookDate,
        sendMessage,
        deleteMessage,
        clearChat,
        deleteMultipleMessages,
        deleteChat,
        addMessageReaction,
        submitFeedback,
        refreshDiscoverFeed: syncCloudState,
        resetPassedProfiles,
        undoLastSwipe,
        superSynksRemaining,
        freeRewindsRemaining,
        dailySwipesRemaining,
        boostActiveUntil,
        useSuperSynk,
        useRewind,
        useSwipe,
        activateBoost,
        isSuspended,
        suspendedUntil,
        strikeCount,
        triggerSafetyViolation,
        blockReports,
        submitBlockReport,
        submitUnlockRequest,
        adminUnblockUser,
        adminDismissAppeal,
        deleteBlockReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

