import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChatMessagesFromFirestore } from '../../services/firebase';
import { ChatMessage } from '../../types';

function formatLastMessageSnippet(msg?: ChatMessage): string {
  if (!msg || !msg.text) return 'Say hi! Mutual match verified ✨';
  const raw = msg.text;
  if (raw.includes('|||AUDIO_DATA::') || raw.startsWith('🎙️') || msg.type === 'voice') {
    return '🎤 Voice note';
  }
  if (raw.startsWith('⚡ Date Planned!')) {
    return '⚡ Date Invite Sent';
  }
  if (raw.startsWith('📞') || raw.startsWith('📹')) {
    return raw;
  }
  return raw;
}

function formatChatTime(timestamp?: string): string {
  if (!timestamp) return '';
  if (timestamp === 'Just now') return 'Just now';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return timestamp;
  }
}

function getLastMessageForUser(
  user: any,
  messagesObj: Record<string, ChatMessage[]>,
  chatMap: Record<string, ChatMessage>
): ChatMessage | undefined {
  if (!user) return undefined;
  const uid = String(user.id || '');
  const uPhone = String(user.phoneNumber || '').replace(/\D/g, '').slice(-10);

  // 1. Direct match by user.id
  if (chatMap[uid]) return chatMap[uid];
  if (messagesObj[uid] && messagesObj[uid].length > 0) {
    return messagesObj[uid][messagesObj[uid].length - 1];
  }

  // 2. Direct match by user.phoneNumber
  if (user.phoneNumber) {
    if (chatMap[user.phoneNumber]) return chatMap[user.phoneNumber];
    if (messagesObj[user.phoneNumber] && messagesObj[user.phoneNumber].length > 0) {
      return messagesObj[user.phoneNumber][messagesObj[user.phoneNumber].length - 1];
    }
  }

  // 3. Normalized 10-digit phone match
  if (uPhone) {
    for (const [key, msg] of Object.entries(chatMap)) {
      const kDigits = key.replace(/\D/g, '').slice(-10);
      if (kDigits && kDigits === uPhone) return msg;
    }
    for (const [key, thread] of Object.entries(messagesObj)) {
      const kDigits = key.replace(/\D/g, '').slice(-10);
      if (kDigits && kDigits === uPhone && Array.isArray(thread) && thread.length > 0) {
        return thread[thread.length - 1];
      }
    }
  }

  return undefined;
}

export default function ChatsScreen() {
  const { matches, profiles, messages, currentUser, isDarkMode, unreadChatIds, markChatAsRead, deleteChat, clearChat } = useApp();
  const router = useRouter();
  const [recentChatMap, setRecentChatMap] = React.useState<Record<string, ChatMessage>>({});
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedChatIds, setSelectedChatIds] = React.useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);

  const toggleSelectChat = (chatId: string) => {
    setSelectedChatIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
        if (next.size === 0) {
          setIsSelectionMode(false);
        }
      } else {
        next.add(chatId);
      }
      return next;
    });
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleDeleteSelected = () => {
    selectedChatIds.forEach(id => {
      deleteChat(id);
      clearChat(id, false);
      AsyncStorage.removeItem(`synking_cached_msgs_${id}`).catch(() => {});
      AsyncStorage.removeItem(`synking_deleted_${id}`).catch(() => {});
    });
    setSelectedChatIds(new Set());
    setIsSelectionMode(false);
    setIsDeleteModalVisible(false);
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const bg = isDarkMode ? '#000000' : '#F8F9FA';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#000000' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';

  // 1. Instant 0ms cached messages load + cloud sync for all matches
  React.useEffect(() => {
    if (!matches || matches.length === 0) return;
    const currentUserId = currentUser?.id;

    matches.forEach(async (m) => {
      if (!m || !m.id) return;
      try {
        // Load from disk cache
        const cached = await AsyncStorage.getItem(`synking_cached_msgs_${m.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const last = parsed[parsed.length - 1];
            setRecentChatMap(prev => ({ ...prev, [m.id]: last }));
          }
        }
        // Sync latest from cloud
        if (currentUserId) {
          const cloudMsgs = await fetchChatMessagesFromFirestore(currentUserId, m.id);
          if (Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
            const last = cloudMsgs[cloudMsgs.length - 1];
            setRecentChatMap(prev => ({ ...prev, [m.id]: last }));
            AsyncStorage.setItem(`synking_cached_msgs_${m.id}`, JSON.stringify(cloudMsgs)).catch(() => {});
          }
        }
      } catch (e) {}
    });
  }, [matches, currentUser?.id]);

  // 2. React to live messages coming through AppContext
  React.useEffect(() => {
    Object.entries(messages).forEach(([partnerId, thread]) => {
      if (Array.isArray(thread) && thread.length > 0) {
        const last = thread[thread.length - 1];
        setRecentChatMap(prev => ({ ...prev, [partnerId]: last }));
      }
    });
  }, [messages]);

  // 3. Fast 3s Live Background Sync: Ensures newly received voice notes & messages refresh automatically
  React.useEffect(() => {
    if (!matches || matches.length === 0 || !currentUser?.id) return;
    const interval = setInterval(() => {
      matches.forEach(async (m) => {
        if (!m || !m.id) return;
        try {
          const cloudMsgs = await fetchChatMessagesFromFirestore(currentUser.id, m.id);
          if (Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
            const last = cloudMsgs[cloudMsgs.length - 1];
            setRecentChatMap(prev => {
              if (prev[m.id]?.id === last.id) return prev;
              return { ...prev, [m.id]: last };
            });
          }
        } catch (e) {}
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [matches, currentUser?.id]);

  // Deduplicate and SORT matches by latest message activity (WhatsApp/Tinder style: latest conversation on top)
  const uniqueMatches = React.useMemo(() => {
    const map = new Map<string, any>();
    matches.filter(Boolean).forEach(m => {
      if (m && m.id) map.set(m.id, m);
    });

    // Also include any active chat partner from messages or recentChatMap
    const allChatPartnerKeys = new Set([...Object.keys(messages), ...Object.keys(recentChatMap)]);
    allChatPartnerKeys.forEach(partnerKey => {
      if (!partnerKey) return;
      const cleanKeyDigits = partnerKey.replace(/\D/g, '').slice(-10);
      const alreadyIn = Array.from(map.values()).some(m => 
        m.id === partnerKey || 
        (cleanKeyDigits && (m.phoneNumber || '').replace(/\D/g, '').slice(-10) === cleanKeyDigits)
      );
      if (!alreadyIn) {
        const found = profiles.find(p => 
          p.id === partnerKey || 
          (cleanKeyDigits && (p.phoneNumber || '').replace(/\D/g, '').slice(-10) === cleanKeyDigits)
        );
        if (found) {
          map.set(found.id, found);
        }
      }
    });

    const list = Array.from(map.values());

    return list.sort((a, b) => {
      const lastA = getLastMessageForUser(a, messages, recentChatMap);
      const lastB = getLastMessageForUser(b, messages, recentChatMap);

      const timeA = lastA?.timestamp ? new Date(lastA.timestamp).getTime() : 0;
      const timeB = lastB?.timestamp ? new Date(lastB.timestamp).getTime() : 0;

      return timeB - timeA;
    });
  }, [matches, profiles, messages, recentChatMap]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <View style={styles.container}>
        {/* Title Bar with E2EE Shield or Selection Controls */}
        {isSelectionMode ? (
          <View style={styles.titleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedChatIds(new Set());
                }}
                style={{ padding: 4 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
              <Text style={[styles.screenTitle, { color: textColor, fontSize: 18, fontFamily: 'Poppins_700Bold' }]}>
                {selectedChatIds.size} Selected
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedChatIds.size === uniqueMatches.length) {
                    setSelectedChatIds(new Set());
                  } else {
                    setSelectedChatIds(new Set(uniqueMatches.map(m => m.id)));
                  }
                }}
                style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: textColor }}>
                  {selectedChatIds.size === uniqueMatches.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (selectedChatIds.size > 0) {
                    setIsDeleteModalVisible(true);
                  }
                }}
                disabled={selectedChatIds.size === 0}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: selectedChatIds.size > 0 ? '#EF4444' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: selectedChatIds.size > 0 ? 1 : 0.4,
                }}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={[styles.screenTitle, { color: textColor }]}>Messages</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.e2eeBadge}>
                <Ionicons name="lock-closed" size={12} color="#22C55E" />
                <Text style={styles.e2eeText}>AES-256 Encrypted</Text>
              </View>
              {uniqueMatches.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setIsSelectionMode(true);
                  }}
                  style={{ padding: 4 }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="checkbox-outline" size={20} color="#FD3A73" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {uniqueMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={44} color="#FD3A73" />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Active Chats Yet</Text>
            <Text style={[styles.emptySub, { color: subText }]}>
              When you and someone both Synk each other, your encrypted chat thread will appear here.
            </Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.discoverBtnText}>Start Swiping 🔥</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={uniqueMatches}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const lastMsg = getLastMessageForUser(item, messages, recentChatMap);
              const displayLastText = formatLastMessageSnippet(lastMsg);
              const timeDisplay = formatChatTime(lastMsg?.timestamp);
              const isSelected = selectedChatIds.has(item.id);

              // 1. Detect if this conversation has an unread message
              const myId = currentUser?.id;
              const myPhone = (currentUser?.phoneNumber || '').replace(/\D/g, '').slice(-10);
              const isSentByMe = !!(
                lastMsg &&
                (lastMsg.senderId === myId ||
                  (myPhone && lastMsg.senderId.replace(/\D/g, '').slice(-10) === myPhone))
              );

              const cleanItemId = String(item.id || '').trim();
              const cleanItemDigits = String(item.phoneNumber || '').replace(/\D/g, '').slice(-10);

              const isUnread = Boolean(
                !isSentByMe &&
                !isSelected &&
                !!lastMsg &&
                (unreadChatIds.has(cleanItemId) ||
                  (cleanItemDigits ? unreadChatIds.has(cleanItemDigits) : false) ||
                  (lastMsg.senderId ? unreadChatIds.has(lastMsg.senderId) : false) ||
                  (lastMsg.senderId && cleanItemDigits
                    ? lastMsg.senderId.replace(/\D/g, '').slice(-10) === cleanItemDigits
                    : false))
              );

              return (
                <TouchableOpacity
                  style={[
                    styles.chatCard,
                    {
                      backgroundColor: isSelected
                        ? (isDarkMode ? 'rgba(253, 58, 115, 0.18)' : '#FFE4E6')
                        : cardBg,
                      borderColor: isSelected
                        ? '#FD3A73'
                        : isDarkMode
                        ? 'rgba(253, 58, 115, 0.22)'
                        : borderColor,
                    },
                    isSelected && {
                      shadowColor: '#FD3A73',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
                      elevation: 8,
                    },
                  ]}
                  onPress={() => {
                    if (isSelectionMode) {
                      toggleSelectChat(item.id);
                    } else {
                      markChatAsRead(item.id);
                      if (item.phoneNumber) markChatAsRead(item.phoneNumber);
                      router.push(`/chat/${item.id}`);
                    }
                  }}
                  onLongPress={() => {
                    if (Platform.OS !== 'web') {
                      const Haptics = require('expo-haptics');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    }
                    if (!isSelectionMode) {
                      setIsSelectionMode(true);
                      setSelectedChatIds(new Set([item.id]));
                    } else {
                      toggleSelectChat(item.id);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <View style={{ marginRight: 6 }}>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={isSelected ? "#FD3A73" : subText}
                      />
                    </View>
                  )}

                  {/* Avatar */}
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={{ uri: item.photo }}
                      style={[
                        styles.avatar,
                        {
                          borderColor: isDarkMode
                            ? 'rgba(253, 58, 115, 0.4)'
                            : 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                    />
                  </View>

                  {/* Chat Info */}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Text
                          style={[
                            styles.userName,
                            {
                              color: textColor,
                              fontFamily: isUnread ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
                              fontSize: 16,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {Boolean(item.isVerified) && (
                          <Ionicons name="shield-checkmark" size={14} color="#00E5FF" />
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.timeText,
                            {
                              color: subText,
                              fontFamily: isUnread ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
                            },
                          ]}
                        >
                          {timeDisplay}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {isSentByMe && lastMsg && (
                        (lastMsg.status === 'read' || lastMsg.read) ? (
                          <Ionicons name="checkmark-done" size={15} color="#00E5FF" />
                        ) : (lastMsg.status === 'delivered' || (lastMsg.status !== 'sending' && lastMsg.timestamp !== 'Just now')) ? (
                          <Ionicons name="checkmark-done" size={15} color={subText} />
                        ) : (
                          <Ionicons name="checkmark" size={15} color={subText} />
                        )
                      )}
                      <Text
                        style={[
                          styles.lastMsgText,
                          {
                            color: isUnread ? (isDarkMode ? '#FFFFFF' : '#0F172A') : subText,
                            fontFamily: isUnread ? 'Poppins_700Bold' : 'Poppins_400Regular',
                            fontSize: isUnread ? 13.5 : 13,
                            flex: 1,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {displayLastText}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={isSelectionMode ? (isSelected ? "checkbox" : "square-outline") : "chevron-forward"}
                    size={16}
                    color={isSelected ? '#FD3A73' : isUnread ? '#FD3A73' : subText}
                  />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setIsDeleteModalVisible(false)}
        >
          <View
            style={{
              width: 300,
              backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
              borderRadius: 22,
              paddingVertical: 18,
              paddingHorizontal: 18,
              borderWidth: 1.5,
              borderColor: '#EF4444',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 12,
              alignItems: 'center',
            }}
          >
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="trash" size={26} color="#EF4444" />
            </View>

            <Text style={{ fontSize: 17, fontFamily: 'Poppins_800ExtraBold', color: textColor, textAlign: 'center', marginBottom: 6 }}>
              Delete {selectedChatIds.size} Conversation{selectedChatIds.size > 1 ? 's' : ''}?
            </Text>
            <Text style={{ fontSize: 12.5, color: subText, textAlign: 'center', marginBottom: 18, lineHeight: 18, fontFamily: 'Poppins_400Regular' }}>
              This will permanently delete the selected conversations and their message history for you.
            </Text>

            <View style={{ width: '100%', gap: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                onPress={handleDeleteSelected}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_800ExtraBold', fontSize: 14 }}>
                  Delete Conversations
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={{ color: subText, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  e2eeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  e2eeText: {
    color: '#22C55E',
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FD3A73',
    shadowColor: '#FD3A73',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000000',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
  },
  timeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  lastMsgText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  unreadBadgePill: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadBadgePillText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 9.5,
    includeFontPadding: false,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(253, 58, 115, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 58, 115, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
  },
  emptySub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  discoverBtn: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 8,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  discoverBtnText: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
});
