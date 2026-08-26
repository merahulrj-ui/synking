import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { useRouter } from 'expo-router';

export default function ChatsScreen() {
  const { matches, messages, isDarkMode } = useApp();
  const router = useRouter();

  const bg = isDarkMode ? '#05060A' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : '#111827';
  const subText = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cardBg = isDarkMode ? '#11121A' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // Deduplicate matches by ID to guarantee unique keys
  const uniqueMatches = React.useMemo(() => {
    const map = new Map<string, any>();
    matches.filter(Boolean).forEach(m => {
      if (m && m.id) map.set(m.id, m);
    });
    return Array.from(map.values());
  }, [matches]);

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
              const thread = messages[item.id] || [];
              const lastMsg = thread[thread.length - 1];
              const displayLastText = lastMsg
                ? lastMsg.text
                : 'Say hi! Mutual match verified ✨';
              const timeDisplay = lastMsg
                ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'New';

              return (
                <TouchableOpacity
                  style={[styles.chatCard, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => router.push(`/chat/${item.id}`)}
                  activeOpacity={0.75}
                >
                  {/* Avatar with Online Indicator */}
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.photo }} style={styles.avatar} />
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
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  e2eeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  e2eeText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 16,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lastMsgText: {
    fontSize: 13,
    fontWeight: '400',
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
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
  },
  discoverBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
