import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useApp } from '../contexts/AppContext';
import { RealtimeBridge } from '../services/realtimeBridge';
import { RingtoneService } from '../services/ringtoneService';
import { decryptE2EEMessage } from '../utils/encryption';
import { ChatMessage } from '../types';
import { activeChatTracker } from '../services/activeChatTracker';

interface NotificationState {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  previewText: string;
  type?: 'message' | 'swipe' | 'match' | 'date_pass';
  bookingId?: string;
  badgeTitle?: string;
  badgeColor?: string;
}

export const InAppNotificationBanner: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const { currentUser, profiles, matches, isDarkMode } = useApp();
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const hideTimerRef = useRef<any>(null);

  // Request Native Browser Notification Permissions on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const seenMessageIds = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = RealtimeBridge.subscribe(async ({ type, payload }) => {
      function isMe(targetId?: string) {
        if (!targetId || !currentUser) return false;
        if (currentUser.id === targetId) return true;
        const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const tPhone = String(targetId).replace(/\D/g, '').slice(-10);
        if (myPhone && tPhone && myPhone === tPhone) return true;
        return false;
      }

      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;
        
        // ⛔ Deduplicate notifications
        if (seenMessageIds.current.has(msg.id)) return;
        seenMessageIds.current.add(msg.id);

        // Ignore messages sent by ourselves
        if (isMe(msg.senderId)) return;

        // ⛔ CRITICAL: Only show notification if this message is addressed to ME
        if (!isMe(msg.receiverId)) return;

        // ⛔ CRITICAL: Suppress notification completely if user is currently inside the chat with this sender!
        if (activeChatTracker.isChatActive(msg.senderId)) {
          return;
        }

        // Decrypt text if E2EE encrypted
        const myId = currentUser?.id || 'my_user_id';
        let readableText = msg.text || (msg as any).plainText || 'New message';
        if (readableText && typeof readableText === 'string' && readableText.startsWith('E2EE::')) {
          readableText = await decryptE2EEMessage(readableText, msg.senderId, myId);
        }

        // Clean up audio data payload from preview
        if (readableText && typeof readableText === 'string' && readableText.includes('|||AUDIO_DATA::')) {
          readableText = readableText.split('|||AUDIO_DATA::')[0];
        }

        // Find sender profile
        const sender =
          profiles.find(p => p && p.id === msg.senderId) ||
          matches.find(m => m && m.id === msg.senderId);

        const senderName = sender?.name || 'Someone';
        const senderPhoto = sender?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

        // 1. Play sweet notification sound chime
        RingtoneService.playMessageChime();

        // 2. Trigger native OS / browser notification if tab is backgrounded
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted' && typeof document !== 'undefined' && document.hidden) {
            try {
              new Notification(`💬 ${senderName}`, {
                body: readableText,
                icon: senderPhoto,
              });
            } catch (e) {}
          }
        }

        const isDateInvite = msg.type === 'date_invite' || (msg.extraData && msg.extraData.bookingId);
        const dateVenue = msg.extraData?.venueName || 'Restaurant';

        // 3. Show or update floating banner
        setNotification({
          id: msg.id,
          senderId: msg.senderId,
          senderName,
          senderPhoto,
          previewText: isDateInvite
            ? `Reserved table at ${dateVenue}! Tap to view Date Pass 🎟️`
            : readableText,
          type: isDateInvite ? 'date_pass' : 'message',
          bookingId: msg.extraData?.bookingId,
          badgeTitle: isDateInvite ? '🎟️ Date Pass & Table Booked!' : '💬 New Message',
          badgeColor: isDateInvite ? '#F59E0B' : '#00E5FF',
        });

        // Slide Down Animation
        Animated.spring(slideAnim, {
          toValue: 12,
          useNativeDriver: true,
          bounciness: 8,
        }).start();

        // Auto-hide after 4.5 seconds
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          dismissBanner();
        }, 4500);
      } else if (type === 'SYNK_REQUEST' && payload) {
        const req = payload as any;
        if (!req || !currentUser) return;
        if (!isMe(req.toUserId)) return;
        if (isMe(req.fromUser?.id)) return;

        const isSuper = req.type === 'supersynk';
        const senderName = req.fromUser?.name || 'Someone';
        const senderPhoto = req.fromUser?.photo || req.fromUser?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
        const preview = isSuper ? 'Sent you a SuperSynk! ⚡ Tap to view' : 'Swiped right on your profile! 💖 Tap to view';

        RingtoneService.playMessageChime();

        setNotification({
          id: req.id || `req_${Date.now()}`,
          senderId: req.fromUser?.id || '',
          senderName,
          senderPhoto,
          previewText: preview,
          type: 'swipe',
          badgeTitle: isSuper ? '⚡ SuperSynk' : '💖 New Like',
          badgeColor: isSuper ? '#00E5FF' : '#FF2D55',
        });

        Animated.spring(slideAnim, {
          toValue: 12,
          useNativeDriver: true,
          bounciness: 8,
        }).start();

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          dismissBanner();
        }, 5000);
      } else if (type === 'REQUEST_ACCEPTED' && payload) {
        if (!payload || !currentUser) return;
        if (!isMe(payload.fromUserId)) return;
        const acceptedBy = payload.acceptedBy;
        if (!acceptedBy) return;

        const partnerName = acceptedBy.name || 'Someone';
        const partnerPhoto = acceptedBy.photo || acceptedBy.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

        RingtoneService.playMessageChime();

        setNotification({
          id: `match_${Date.now()}`,
          senderId: acceptedBy.id || '',
          senderName: partnerName,
          senderPhoto: partnerPhoto,
          previewText: "It's a Match! You both liked each other 🎉",
          type: 'match',
          badgeTitle: "🎉 It's a Match!",
          badgeColor: '#10B981',
        });

        Animated.spring(slideAnim, {
          toValue: 12,
          useNativeDriver: true,
          bounciness: 8,
        }).start();

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          dismissBanner();
        }, 5000);
      } else if (type === 'DATE_BOOKED' && payload) {
        const booking = payload.booking;
        if (!booking || !currentUser) return;
        if (!isMe(booking.user2Id)) return;

        const senderName = booking.userName || 'Your Date';
        const senderPhoto = booking.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
        const venueName = booking.venue?.name || 'Restaurant';

        RingtoneService.playMessageChime();

        setNotification({
          id: booking.id || `date_${Date.now()}`,
          senderId: booking.user1Id || '',
          senderName,
          senderPhoto,
          previewText: `Reserved table at ${venueName}! Tap to view Safe Date Pass 🎟️`,
          type: 'date_pass',
          bookingId: booking.id,
          badgeTitle: '🎟️ Date Pass & Table Reserved!',
          badgeColor: '#F59E0B',
        });

        Animated.spring(slideAnim, {
          toValue: 12,
          useNativeDriver: true,
          bounciness: 8,
        }).start();

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          dismissBanner();
        }, 5000);
      }
    });

    return () => unsubscribe();
  }, [currentUser, profiles, matches, segments]);

  const dismissBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  const handlePress = () => {
    if (!notification) return;
    const { senderId, type, bookingId } = notification;
    dismissBanner();

    if (type === 'date_pass' && bookingId) {
      router.push(`/date-pass/${bookingId}` as any);
      return;
    }

    if (type === 'swipe') {
      router.push('/(tabs)/matches');
      return;
    }

    if (type === 'match') {
      router.push(`/chat/${senderId}` as any);
      return;
    }

    // Default: chat message
    if (activeChatTracker.isChatActive(senderId)) {
      return;
    }

    const currentChat = activeChatTracker.getActiveChat();
    if (currentChat) {
      router.replace(`/chat/${senderId}` as any);
    } else {
      router.push(`/chat/${senderId}` as any);
    }
  };

  if (!notification) return null;

  const bg = isDarkMode ? '#13141F' : '#FFFFFF';
  const textCol = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.bannerCard,
          {
            backgroundColor: bg,
            borderColor: borderCol,
          },
        ]}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        {/* Sender Avatar with Online Badge */}
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: notification.senderPhoto }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>

        {/* Message Content */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.senderName, { color: textCol }]} numberOfLines={1}>
              {notification.senderName}
            </Text>
            <Text style={[styles.badgeText, notification.badgeColor ? { color: notification.badgeColor } : null]}>
              {notification.badgeTitle || '💬 New Message'}
            </Text>
          </View>
          <Text style={[styles.previewText, { color: subText }]} numberOfLines={1}>
            {notification.previewText}
          </Text>
        </View>

        {/* Close Icon */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismissBanner}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={subText} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  bannerCard: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#13141F',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderName: {
    fontSize: 14,
    fontFamily: 'Poppins_800ExtraBold',
    maxWidth: 160,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 12.5,
    fontFamily: 'Poppins_500Medium',
  },
  closeBtn: {
    padding: 6,
  },
});
