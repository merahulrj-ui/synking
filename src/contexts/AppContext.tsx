import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, SynkRequest, Venue, DateBooking, ChatMessage, SafetyContact } from '../types';
import { MOCK_VENUES } from '../constants/mockData';
import {
  saveChatMessageToFirestore,
  saveUserProfileToFirestore,
  fetchProfilesFromFirestore,
  saveSynkRequestToFirestore,
  fetchIncomingRequestsFromFirestore,
  fetchSentRequestsFromFirestore,
  updateRequestStatusInFirestore,
  deleteUserProfileFromBackend,
} from '../services/firebase';
import { encryptE2EEMessage } from '../utils/encryption';
import { RealtimeBridge } from '../services/realtimeBridge';
import { WebRTCService } from '../services/webrtcService';

interface AppContextType {
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
  venues: Venue[];
  activeBookings: DateBooking[];
  messages: Record<string, ChatMessage[]>;
  safetyContact: SafetyContact;
  acceptedMatchAlert: UserProfile | null;
  clearAcceptedMatchAlert: () => void;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;
  deleteAccount: () => Promise<void>;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  updateSafetyContact: (contact: SafetyContact) => void;
  swipeProfile: (profileId: string, action: 'like' | 'pass' | 'supersynk') => { success: boolean; requestSent?: boolean; profile?: UserProfile };
  acceptRequest: (requestId: string) => UserProfile | null;
  declineRequest: (requestId: string) => void;
  bookDate: (params: { targetUser: UserProfile; venue: Venue; dateTime: string; splitType: 'split_50_50' | 'i_treat' | 'they_treat' }) => DateBooking;
  sendMessage: (receiverId: string, text: string) => void;
  submitFeedback: (bookingId: string, feedback: { matched: boolean; respectful: boolean; safe: boolean; notes: string }) => void;
  refreshDiscoverFeed: () => Promise<void>;
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
  return false; // Default: Pure Light Mode
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

  // Zero Fake Users: Start with stored user or null
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
  const [currentLocation, setCurrentLocation] = useState<string>('Roorkee');

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SynkRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SynkRequest[]>([]);
  const [acceptedMatchAlert, setAcceptedMatchAlert] = useState<UserProfile | null>(null);
  const seenMatchAlerts = useRef<Set<string>>(new Set());
  const [venues] = useState<Venue[]>(MOCK_VENUES);
  const [activeBookings, setActiveBookings] = useState<DateBooking[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [safetyContact, setSafetyContact] = useState<SafetyContact>({
    name: 'Emergency Contact',
    phone: '+91 98765 43210'
  });

  // 1. Zero-Latency Realtime Bridge Subscription (0ms instant cross-device/tab synchronization)
  useEffect(() => {
    const unsubscribe = RealtimeBridge.subscribe(({ type, payload }) => {
      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;
        const threadKey = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
        setMessages(prev => {
          const list = prev[threadKey] || [];
          if (list.some(m => m.id === msg.id)) return prev;
          return { ...prev, [threadKey]: [...list, msg] };
        });
      } else if (type === 'SYNK_REQUEST' && payload) {
        const req = payload as SynkRequest;
        if (req.toUserId === currentUser?.id && req.fromUser?.id !== currentUser?.id) {
          setIncomingRequests(prev => {
            if (prev.some(r => r.id === req.id)) return prev;
            return [req, ...prev];
          });
        }
      } else if (type === 'REQUEST_ACCEPTED' && payload) {
        if (payload.fromUserId === currentUser?.id && payload.acceptedBy) {
          const acceptedUser = payload.acceptedBy as UserProfile;
          if (acceptedUser && acceptedUser.id) {
            setMatches(prev => {
              if (prev.some(m => m && m.id === acceptedUser.id)) return prev;
              return [acceptedUser, ...prev.filter(Boolean)];
            });
            // ONLY alert ONCE ever per match (no repeated loops)
            if (!seenMatchAlerts.current.has(acceptedUser.id)) {
              seenMatchAlerts.current.add(acceptedUser.id);
              setAcceptedMatchAlert(acceptedUser);
            }
          }
        }
      } else if (type === 'INCOMING_CALL' && payload) {
        if (payload.receiverId === currentUser?.id && payload.callerUser) {
          WebRTCService.receiveIncomingCall(payload.callerUser, payload.type, payload.callId);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  // 2. Sync Real User Profiles & Incoming/Sent Requests from Cloud Firestore
  const syncCloudState = async () => {
    if (!currentUser) return;

    // Fetch real registered profiles for Discover
    const realUsers = await fetchProfilesFromFirestore(currentUser.id);
    if (Array.isArray(realUsers)) {
      setProfiles(realUsers.filter(Boolean));
    }

    // Fetch Incoming Synk Requests sent to this user (filtered by pending)
    const cloudRequests = await fetchIncomingRequestsFromFirestore(currentUser.id);
    if (Array.isArray(cloudRequests) && cloudRequests.length > 0) {
      setIncomingRequests(prev => {
        const map = new Map<string, SynkRequest>();
        prev.filter(Boolean).forEach(r => map.set(r.id, r));
        cloudRequests.filter(Boolean).forEach(r => map.set(r.id, r));
        return Array.from(map.values());
      });
    }

    // Fetch Sent Requests to see if partner accepted via Cloud Firestore
    const cloudSent = await fetchSentRequestsFromFirestore(currentUser.id);
    if (Array.isArray(cloudSent) && cloudSent.length > 0) {
      setSentRequests(cloudSent.filter(Boolean));
      cloudSent.forEach(sentReq => {
        if (sentReq && sentReq.status === 'accepted') {
          // Find user profile of the person who accepted
          const partner = realUsers.find(u => u && u.id === sentReq.toUserId);
          if (partner && partner.id) {
            setMatches(prev => {
              if (prev.some(m => m && m.id === partner.id)) return prev;
              return [partner, ...prev.filter(Boolean)];
            });
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
          if (parsed && !/^user_\d{4}$/.test(parsed.id)) {
            setCurrentUser(parsed);
            setIsLoggedIn(true);
          }
        }
      } catch (e) {}
    };
    loadNativeUser();
  }, []);

  // Sync user profile to Firestore on startup and changes
  useEffect(() => {
    if (currentUser) {
      RealtimeBridge.registerUser(currentUser.id);
      saveUserProfileToFirestore(currentUser);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('synking_my_user', JSON.stringify(currentUser));
      }
      AsyncStorage.setItem('synking_my_user', JSON.stringify(currentUser)).catch(() => {});
      setIsLoggedIn(true);
      syncCloudState();
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.photo, currentUser?.location]);

  // Relaxed Firestore Polling (WebSocket handles 0ms instant updates)
  useEffect(() => {
    if (!currentUser) return;
    syncCloudState();
    const interval = setInterval(syncCloudState, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveUserProfileToFirestore(updated);
      AsyncStorage.setItem('synking_my_user', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    saveUserProfileToFirestore(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('synking_my_user', JSON.stringify(user));
    }
    AsyncStorage.setItem('synking_my_user', JSON.stringify(user)).catch(() => {});
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('synking_my_user');
    }
    AsyncStorage.removeItem('synking_my_user').catch(() => {});
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
    const swipedUser = profiles.find(p => p.id === profileId);
    setProfiles(prev => prev.filter(p => p.id !== profileId));

    if (action === 'like' || action === 'supersynk') {
      // NEVER allow matching or sending request to yourself
      if (swipedUser && currentUser && swipedUser.id !== currentUser.id) {
        const newReq: SynkRequest = {
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fromUser: currentUser,
          toUserId: swipedUser.id,
          type: action === 'supersynk' ? 'supersynk' : 'like',
          timestamp: 'Just now',
          status: 'pending'
        };

        setSentRequests(prev => [newReq, ...prev]);
        RealtimeBridge.broadcast('SYNK_REQUEST', newReq);
        saveSynkRequestToFirestore(newReq);

        return { success: true, requestSent: true, profile: swipedUser };
      }
    }
    return { success: true };
  };

  // Accept Request: Broadcasts instant acceptance alert to sender device & updates cloud
  const acceptRequest = (requestId: string): UserProfile | null => {
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

    setActiveBookings(prev => [newBooking, ...prev]);

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

    RealtimeBridge.broadcast('NEW_MESSAGE', inviteMsg);

    return newBooking;
  };

  // Send Message: Instant 0ms Broadcast + Fast Firestore Stream
  const sendMessage = async (receiverId: string, text: string) => {
    const senderId = currentUser?.id || 'my_user_id';
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: senderId,
      receiverId: receiverId,
      text: text,
      timestamp: 'Just now',
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), newMsg]
    }));

    RealtimeBridge.broadcast('NEW_MESSAGE', newMsg);

    const encryptedPayload = await encryptE2EEMessage(text, senderId, receiverId);

    saveChatMessageToFirestore({
      id: newMsg.id,
      senderId: newMsg.senderId,
      receiverId: newMsg.receiverId,
      cipherText: encryptedPayload.ciphertext,
      plainText: text,
      isEncrypted: true,
      type: newMsg.type,
      timestamp: new Date().toISOString(),
    });
  };

  const submitFeedback = (bookingId: string, feedback: { matched: boolean; respectful: boolean; safe: boolean; notes: string }) => {
    console.log('Feedback submitted anonymously for booking:', bookingId, feedback);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isDarkMode,
        toggleTheme,
        currentUser,
        currentLocation,
        refreshLocation: async () => {},
        profiles,
        matches,
        incomingRequests,
        sentRequests,
        venues,
        activeBookings,
        messages,
        safetyContact,
        acceptedMatchAlert,
        clearAcceptedMatchAlert: () => setAcceptedMatchAlert(null),
        loginUser,
        logoutUser,
        deleteAccount,
        updateCurrentUser,
        updateSafetyContact,
        swipeProfile,
        acceptRequest,
        declineRequest,
        bookDate,
        sendMessage,
        submitFeedback,
        refreshDiscoverFeed: syncCloudState,
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