import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { DatePassCard } from '../../components/DatePassCard';
import { useRouter } from 'expo-router';

export default function MatchesScreen() {
  const { incomingRequests, sentRequests, acceptRequest, declineRequest, deleteSentRequest, activeBookings, isDarkMode } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'passes'>('requests');
  const [showSentHistory, setShowSentHistory] = useState(false);
  const [acceptedCelebration, setAcceptedCelebration] = useState<any>(null);

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const handleAccept = (requestId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const user = acceptRequest(requestId);
    if (user) {
      setAcceptedCelebration(user);
    }
  };

  const handleDecline = (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    declineRequest(requestId);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <View style={styles.container}>
        {/* Top 2 Clean Subtabs: 'Requests' vs 'Date Passes' (No redundant Chat tab) */}
        <View style={[styles.tabToggleRow, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor: borderCol }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'requests' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('requests')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="heart"
              size={15}
              color={activeTab === 'requests' ? '#FFFFFF' : subText}
            />
            <Text style={[styles.toggleText, { color: activeTab === 'requests' ? '#FFFFFF' : subText }]}>
              Requests ({incomingRequests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'passes' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('passes')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="ticket"
              size={15}
              color={activeTab === 'passes' ? '#FFFFFF' : subText}
            />
            <Text style={[styles.toggleText, { color: activeTab === 'passes' ? '#FFFFFF' : subText }]}>
              Date Passes ({activeBookings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: INCOMING REQUESTS & SENT LIKES HISTORY */}
        {activeTab === 'requests' && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Incoming Requests Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: textColor }]}>
                  Who Liked You ({incomingRequests.length})
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: subText }]}>
                Accept to unlock private encrypted chat & plan your public date.
              </Text>

              {incomingRequests.length > 0 ? (
                <View style={styles.requestCardList}>
                  {incomingRequests.map((req, idx) => (
                    <View
                      key={`${req.id}_${idx}`}
                      style={[
                        styles.requestCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: req.type === 'supersynk' ? '#00E5FF' : borderCol,
                          borderWidth: req.type === 'supersynk' ? 1.5 : 1,
                        }
                      ]}
                    >
                      <Image source={{ uri: req.fromUser.photo }} style={styles.requestPhoto} />

                      <View style={styles.requestBody}>
                        {req.type === 'supersynk' && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 229, 255, 0.15)', borderColor: '#00E5FF', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 }}>
                            <Ionicons name="star" size={11} color="#00E5FF" />
                            <Text style={{ color: '#00E5FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>SUPER SYNK ⭐</Text>
                          </View>
                        )}

                        <View style={styles.requestTopRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.requestName, { color: textColor }]}>
                              {req.fromUser.name}, {req.fromUser.age}
                            </Text>
                            {req.fromUser.isVerified && (
                              <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
                            )}
                          </View>

                          <View style={styles.badgeBox}>
                            <Ionicons name="sparkles" size={10} color="#FD3A73" />
                            <Text style={styles.badgeText}>{req.fromUser.compatibility}% SYNK</Text>
                          </View>
                        </View>

                        <Text style={[styles.requestOccupation, { color: subText }]}>
                          💼 {req.fromUser.occupation} • 📍 {req.fromUser.distance || 'Nearby'}
                        </Text>

                        <Text style={[styles.requestBio, { color: textColor }]} numberOfLines={2}>
                          "{req.fromUser.bio}"
                        </Text>

                        <View style={styles.requestActionsRow}>
                          <TouchableOpacity
                            style={[styles.declineBtn, { borderColor: borderCol }]}
                            onPress={() => handleDecline(req.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.declineText}>Pass ✕</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleAccept(req.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="chatbubbles" size={16} color="#FFF" />
                            <Text style={styles.acceptText}>Accept & Chat</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="heart-dislike-outline" size={36} color="#FD3A73" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Pending Requests</Text>
                  <Text style={[styles.emptySub, { color: subText }]}>
                    When someone swipes right on your profile, their request will appear here for your approval.
                  </Text>
                </View>
              )}
            </View>

            {/* Sent Likes History Expandable Button */}
            <View style={styles.historyContainer}>
              <TouchableOpacity
                style={[styles.historyHeaderBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
                onPress={() => setShowSentHistory(!showSentHistory)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="paper-plane" size={16} color="#FD3A73" />
                  <Text style={[styles.historyHeaderText, { color: textColor }]}>
                    Sent Likes History ({sentRequests.length})
                  </Text>
                </View>
                <Ionicons
                  name={showSentHistory ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={subText}
                />
              </TouchableOpacity>

              {showSentHistory && (
                <View style={styles.historyList}>
                  {sentRequests.length > 0 ? (
                    sentRequests.map((s, idx) => (
                      <View
                        key={s.id || idx}
                        style={[styles.sentItem, { backgroundColor: cardBg, borderColor: borderCol }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Ionicons name="time-outline" size={16} color="#F59E0B" />
                          <Text style={[styles.sentText, { color: subText }]}>
                            Sent like to <Text style={{ color: textColor, fontWeight: '800' }}>{s.toUserId}</Text> • {s.timestamp}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => deleteSentRequest(s.id)}
                          style={{ padding: 6 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={[styles.sentItem, { backgroundColor: cardBg, borderColor: borderCol }]}>
                      <Text style={[styles.sentText, { color: subText }]}>
                        You haven't sent any Synk requests yet. Start swiping on the Discover tab!
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* TAB 2: CONFIRMED DATE PASSES */}
        {activeTab === 'passes' && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: textColor }]}>
                Confirmed Date Passes ({activeBookings.length})
              </Text>
              <Text style={[styles.sectionSub, { color: subText }]}>
                Show this digital boarding pass at the counter to redeem your reserved table & free perk.
              </Text>

              {activeBookings.length > 0 ? (
                <View style={{ gap: 14, marginTop: 4 }}>
                  {activeBookings.map((b, idx) => (
                    <DatePassCard key={`${b.id}_${idx}`} booking={b} />
                  ))}
                </View>
              ) : (
                <View style={[styles.emptyBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="ticket-outline" size={38} color="#FD3A73" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Upcoming Date Passes</Text>
                  <Text style={[styles.emptySub, { color: subText }]}>
                    Plan a safe public date with one of your matches to generate a verified boarding pass and unlock free perks!
                  </Text>
                  <TouchableOpacity
                    style={styles.exploreSpotsBtn}
                    onPress={() => router.push('/(tabs)/venues')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="compass" size={16} color="#FFF" />
                    <Text style={styles.exploreSpotsText}>Explore Curated Date Spots</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Acceptance Celebration Modal */}
      {acceptedCelebration && (
        <View style={styles.celebrationModal}>
          <Text style={styles.celebEmoji}>🎉</Text>
          <Text style={styles.celebTitle}>Request Accepted!</Text>
          <Text style={styles.celebSub}>
            You and <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{acceptedCelebration.name}</Text> are now InSynk!
          </Text>
          <Text style={styles.celebHint}>🔒 Your private End-to-End Encrypted chat is unlocked.</Text>

          <TouchableOpacity
            style={styles.startChatNowBtn}
            onPress={() => {
              const target = acceptedCelebration;
              setAcceptedCelebration(null);
              router.push(`/chat/${target.id}`);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.startChatNowText}>Open Chat Room 💬</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  tabToggleRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginVertical: 10,
    gap: 4,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: '#FD3A73',
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  toggleText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 12.5,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeader: {
    fontFamily: 'Poppins_900Black',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    marginBottom: 16,
  },
  requestCardList: {
    gap: 12,
  },
  requestCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  requestCardTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  requestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
  },
  requestPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
  },
  requestInfo: {
    flex: 1,
    gap: 4,
  },
  requestBody: {
    flex: 1,
    gap: 4,
  },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  requestName: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 17,
  },
  badgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(253, 58, 115, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FD3A73',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 10.5,
  },
  requestOccupation: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  requestBio: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  declineText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FD3A73',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 26,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253, 58, 115, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  exploreSpotsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  exploreSpotsText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  historyContainer: {
    marginTop: 10,
    marginBottom: 30,
    gap: 8,
  },
  historyHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  historyHeaderText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  historyList: {
    gap: 8,
  },
  sentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sentText: {
    fontSize: 12,
  },
  celebrationModal: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(8, 9, 15, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
    zIndex: 100,
  },
  celebEmoji: {
    fontSize: 54,
  },
  celebTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  celebSub: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
  },
  celebHint: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  startChatNowBtn: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  startChatNowText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});