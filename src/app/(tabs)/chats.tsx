import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
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
  if (raw.includes('Video Call') || raw.startsWith('📹')) {
    return '📹 Video Call';
  }
  if (raw.includes('Voice Call') || raw.startsWith('📞')) {
    return '📞 Voice Call';
  }
  if (raw.startsWith('E2EE::')) {
    return '🔒 Encrypted message';
  }
  return raw;
}

function formatChatTime(timestamp?: string): string {
  if (!timestamp) return 'New';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'New';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'New';
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
  const { matches, profiles, messages, currentUser, isDarkMode } = useApp();
  const router = useRouter();
  const [recentChatMap, setRecentChatMap] = React.useState<Record<string, ChatMessage>>({});

  const bg = isDarkMode ? '#05060A' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : '#111827';
  const subText = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cardBg = isDarkMode ? '#11121A' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

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
        {/* Title Bar with E2EE Shield */}
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: textColor }]}>Messages</Text>
          <View style={styles.e2eeBadge}>
            <Ionicons name="lock-closed" size={12} color="#22C55E" />
            <Text style={styles.e2eeText}>AES-256 Encrypted</Text>
          </View>
        </View>

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

              return (
                <TouchableOpacity
                  style={[styles.chatCard, { backgroundColor: cardBg, borderColor: isDarkMode ? 'rgba(253, 58, 115, 0.22)' : borderColor }]}
                  onPress={() => router.push(`/chat/${item.id}`)}
                  activeOpacity={0.75}
                >
                  {/* Avatar with Online Indicator */}
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.photo }} style={[styles.avatar, { borderColor: isDarkMode ? '#FD3A73' : 'transparent' }]} />
                    <View style={styles.onlineDot} />
                  </View>

                  {/* Chat Info */}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.userName, { color: textColor }]}>{item.name}</Text>
                        {item.isVerified && (
                          <Ionicons name="shield-checkmark" size={14} color="#00E5FF" />
                        )}
                      </View>
                      <Text style={[styles.timeText, { color: subText }]}>{timeDisplay}</Text>
                    </View>

                    <Text style={[styles.lastMsgText, { color: subText }]} numberOfLines={1}>
                      {displayLastText}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={subText} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
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
    borderColor: '#05060A',
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
