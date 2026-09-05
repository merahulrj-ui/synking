import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import { useApp } from '../contexts/AppContext';
import { RealtimeBridge } from '../services/realtimeBridge';
import { RingtoneService } from '../services/ringtoneService';
import { decryptE2EEMessage } from '../utils/encryption';
import { ChatMessage } from '../types';

interface NotificationState {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  previewText: string;
}

export const InAppNotificationBanner: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const { id: activeChatId } = useGlobalSearchParams<{ id?: string }>();
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
      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;
        
        // ⛔ Deduplicate notifications
        if (seenMessageIds.current.has(msg.id)) return;
        seenMessageIds.current.add(msg.id);

        function isMe(targetId?: string) {
          if (!targetId || !currentUser) return false;
          if (currentUser.id === targetId) return true;
          const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
          const tPhone = String(targetId).replace(/\D/g, '').slice(-10);
          if (myPhone && tPhone && myPhone === tPhone) return true;
          return false;
        }

        // Ignore messages sent by ourselves
        if (isMe(msg.senderId)) return;

        // ⛔ CRITICAL: Only show notification if this message is addressed to ME
        if (!isMe(msg.receiverId)) return;

        // Check if user is currently inside the chat with this specific sender
        const isCurrentlyInThisChat = Boolean(
          activeChatId &&
          (activeChatId === msg.senderId ||
           (activeChatId.replace(/\D/g, '').slice(-10) &&
            activeChatId.replace(/\D/g, '').slice(-10) === String(msg.senderId).replace(/\D/g, '').slice(-10)))
        );

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

        // 3. Show floating banner if not actively reading this chat
        if (!isCurrentlyInThisChat) {
          setNotification({
            id: msg.id,
            senderId: msg.senderId,
            senderName,
            senderPhoto,
            previewText: readableText,
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
        }
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
    const targetSenderId = notification.senderId;
    dismissBanner();
    router.push(`/chat/${targetSenderId}` as any);
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
            <Text style={styles.badgeText}>💬 New Message</Text>
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
