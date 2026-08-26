import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { MOCK_PROFILES } from '../../constants/mockData';
import { WebRTCService } from '../../services/webrtcService';
import { CallModal } from '../../components/CallModal';
import { CallSession, ChatMessage } from '../../types';
import { fetchChatMessagesFromFirestore } from '../../services/firebase';
import { RealtimeBridge } from '../../services/realtimeBridge';
import { ChatDebugger } from '../../components/ChatDebugger';

const ICEBREAKERS = [
  { text: 'Specialty Coffee or Boba Tea? ☕', tag: 'Cafe Vibe' },
  { text: 'Two truths and one lie — you first! 🎲', tag: 'Fun Game' },
  { text: 'Best pizza slice in town? 🍕', tag: 'Foodie' },
  { text: 'What song is on loop for you right now? 🎵', tag: 'Music' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { matches, profiles, messages, sendMessage, activeBookings, currentUser, isDarkMode } = useApp();
  const [inputText, setInputText] = useState('');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>([]);

  // Fallback to match or profile or first mock user
  const targetUser =
    matches.find(m => m.id === id) ||
    profiles.find(p => p.id === id) ||
    MOCK_PROFILES[0];

  const localMessages = (id && messages[id]) || [];

  // 1. Instant 0ms Real-Time Message Listener (WhatsApp Speed)
  useEffect(() => {
    const unsubscribe = RealtimeBridge.subscribe(({ type, payload }) => {
      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;
        if (msg.senderId === id || msg.receiverId === id) {
          setCloudMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
    });
    return () => unsubscribe();
  }, [id]);

  // 2. Cloud Firestore Initial Sync & Backup Stream
  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchCloud = async () => {
      const msgs = await fetchChatMessagesFromFirestore(currentUser.id, id);
      if (msgs.length > 0) {
        setCloudMessages(msgs);
      }
    };
    fetchCloud();
    const interval = setInterval(fetchCloud, 12000);
    return () => clearInterval(interval);
  }, [id, currentUser?.id]);

  // Combine and deduplicate cloud + local messages
  const userMessages = React.useMemo(() => {
    const map = new Map<string, ChatMessage>();
    cloudMessages.forEach(m => map.set(m.id, m));
    localMessages.forEach(m => map.set(m.id, m));
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [cloudMessages, localMessages]);

  const activeBooking = activeBookings.find(b => b.user2Id === id || b.user1Id === id);

  // Subscribe to live WebRTC Call State
  useEffect(() => {
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
    });
    return () => unsubscribe();
  }, []);

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const inputBg = isDarkMode ? '#0E0F17' : '#FFFFFF';
  const inputFieldBg = isDarkMode ? '#181926' : '#F1F5F9';

  const handleForceSync = async () => {
    if (!id || !currentUser) return;
    const msgs = await fetchChatMessagesFromFirestore(currentUser.id, id);
    setCloudMessages(msgs);
    Alert.alert('Cloud Synced 🔄', `Fetched ${msgs.length} messages from Cloud Firestore.`);
  };

  const handleSendTestPing = () => {
    if (!id) return;
    handleSend(`🧪 Test Ping at ${new Date().toLocaleTimeString()}`);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || !id) return;
    sendMessage(id, text);
    setInputText('');

    // Simulate real-time partner typing after user sends a message
    setTimeout(() => {
      setIsPartnerTyping(true);
      setTimeout(() => {
        setIsPartnerTyping(false);
      }, 3000);
    }, 1500);
  };

  const handleVoiceNote = () => {
    Alert.alert('Voice Note 🎙️', '10-second encrypted voice note recorded!');
    handleSend('🎙️ [Encrypted Voice Note · 0:14s]');
  };

  // Start Native WebRTC Voice or Video Call (Outgoing)
  const handleStartCall = (type: 'audio' | 'video') => {
    if (!currentUser || !targetUser) return;
    WebRTCService.startCall({
      callerUser: currentUser,
      targetUser,
      type,
    });
  };

  // Trigger Real Incoming Call Ringing from Partner
  const handleTriggerIncomingCall = (type: 'audio' | 'video' = 'audio') => {
    if (!targetUser) return;
    WebRTCService.receiveIncomingCall(targetUser, type);
  };

  // End Call & Log to Chat Thread
  const handleEndCall = () => {
    const result = WebRTCService.endCall();
    if (result && id) {
      const { session, durationFormatted } = result;
      const callLogText =
        session.type === 'video'
          ? `📹 Video Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`
          : `📞 Voice Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`;
      sendMessage(id, callLogText);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chats');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      {/* 1. TOP APP BAR WITH WHATSAPP-STYLE CALLING ICONS */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderCol }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={textColor} />
        </TouchableOpacity>

        {/* User Avatar + Name + Status */}
        <TouchableOpacity
          style={styles.userHeaderInfo}
          activeOpacity={0.8}
          onPress={() => Alert.alert(targetUser.name, `${targetUser.occupation} • ${targetUser.location}`)}
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: targetUser.photo || targetUser.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' }}
              style={styles.avatar}
            />
            <View style={styles.onlineDot} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
                {targetUser.name}
              </Text>
              {targetUser.isVerified && (
                <Ionicons name="shield-checkmark" size={14} color="#00E5FF" />
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed" size={10} color="#22C55E" />
              <Text style={[styles.userStatus, { color: '#22C55E' }]}>P2P WebRTC</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons: Video Call + Voice Call + Plan Date */}
        <View style={styles.headerActions}>
          {/* Video Call Icon */}
          <TouchableOpacity
            style={styles.callIconBtn}
            onPress={() => handleStartCall('video')}
            activeOpacity={0.75}
          >
            <Ionicons name="videocam" size={20} color="#FD3A73" />
          </TouchableOpacity>

          {/* Voice Call Icon */}
          <TouchableOpacity
            style={styles.callIconBtn}
            onPress={() => handleStartCall('audio')}
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={18} color="#FD3A73" />
          </TouchableOpacity>

          {/* Plan Date Action */}
          <TouchableOpacity
            style={styles.planDateBtn}
            onPress={() => router.push(`/plan-date/${id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={13} color="#FFF" />
            <Text style={styles.planDateBtnText}>Date</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LIVE IN-APP REAL-TIME DEBUGGER */}
      <ChatDebugger
        currentUserId={currentUser?.id || 'unknown'}
        partnerId={id || 'unknown'}
        partnerName={targetUser?.name || 'Partner'}
        localCount={localMessages.length}
        cloudCount={cloudMessages.length}
        lastMessage={userMessages[userMessages.length - 1]}
        onForceSync={handleForceSync}
        onSendTestPing={handleSendTestPing}
      />

      {/* 2. SUBTLE SECURITY NOTICE */}
      <View style={[styles.e2eePillWrapper, { backgroundColor: bg }]}>
        <View style={[styles.e2eePill, { backgroundColor: isDarkMode ? '#13141F' : '#EFF6FF', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#DBEAFE' }]}>
          <Ionicons name="shield-checkmark" size={12} color="#0284C7" />
          <Text style={[styles.e2eePillText, { color: isDarkMode ? '#94A3B8' : '#1E40AF' }]}>
            End-to-End Encrypted. Calls & chats stream P2P with WebRTC.
          </Text>
        </View>
      </View>

      {/* 3. ACTIVE DATE PASS BANNER */}
      {activeBooking && (
        <TouchableOpacity
          style={styles.datePassBanner}
          onPress={() => router.push(`/date-pass/${activeBooking.id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="ticket" size={18} color="#FD3A73" />
          <View style={{ flex: 1 }}>
            <Text style={styles.datePassTitle}>Confirmed Date Pass Active!</Text>
            <Text style={styles.datePassSub}>
              📍 {activeBooking.venue.name} • {activeBooking.dateTime}
            </Text>
          </View>
          <Text style={styles.datePassAction}>View 🎟️</Text>
        </TouchableOpacity>
      )}

      {/* 4. CHAT THREAD & MATCH HERO */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={userMessages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            userMessages.length === 0 ? (
              <View style={styles.heroMatchCard}>
                <View style={styles.heroAvatarRing}>
                  <Image
                    source={{ uri: targetUser.photo || targetUser.photos?.[0] }}
                    style={styles.heroAvatar}
                  />
                  <View style={styles.heroSparkle}>
                    <Ionicons name="sparkles" size={14} color="#FFF" />
                  </View>
                </View>

                <Text style={[styles.heroTitle, { color: textColor }]}>
                  You and {targetUser.name} Synked!
                </Text>
                <Text style={[styles.heroSubtitle, { color: subText }]}>
                  {targetUser.occupation} • {targetUser.location || 'Nearby'}
                </Text>

                <View style={[styles.matchBadge, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor: borderCol }]}>
                  <Ionicons name="heart" size={14} color="#FD3A73" />
                  <Text style={[styles.matchBadgeText, { color: textColor }]}>
                    Mutual Match • {targetUser.compatibility || 96}% Compatible
                  </Text>
                </View>

                <Text style={[styles.heroPromptIntro, { color: subText }]}>
                  Call {targetUser.name}, send a voice note, or plan a public date:
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUser?.id || item.senderId === 'my_user_id';
            const isCallLog = item.text.startsWith('📞') || item.text.startsWith('📹');

            if (item.type === 'date_invite') {
              return (
                <View style={[styles.inviteCard, { backgroundColor: isDarkMode ? '#13141F' : '#EFF6FF', borderColor: isDarkMode ? '#BAE6FD' : '#93C5FD' }]}>
                  <View style={styles.inviteHeader}>
                    <Ionicons name="calendar-sharp" size={18} color="#0284C7" />
                    <Text style={styles.inviteTitle}>MUTUAL DATE INVITATION</Text>
                  </View>
                  <Text style={[styles.inviteBody, { color: textColor }]}>{item.text}</Text>
                  {item.extraData?.bookingId && (
                    <TouchableOpacity
                      style={styles.inviteBtn}
                      onPress={() => router.push(`/date-pass/${item.extraData?.bookingId}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.inviteBtnText}>Open Safe Boarding Pass 🎟️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            // WhatsApp Style Call Log Bubble
            if (isCallLog) {
              return (
                <View style={[styles.callLogBubble, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={styles.callLogIconCircle}>
                    <Ionicons
                      name={item.text.startsWith('📹') ? 'videocam' : 'call'}
                      size={18}
                      color="#FD3A73"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.callLogTitle, { color: textColor }]}>{item.text}</Text>
                    <Text style={[styles.callLogSub, { color: subText }]}>{item.timestamp} · P2P WebRTC</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callBackBtn}
                    onPress={() => handleStartCall(item.text.startsWith('📹') ? 'video' : 'audio')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.callBackText}>Call Back</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <View
                style={[
                  styles.bubble,
                  isMine
                    ? styles.myBubble
                    : [styles.theirBubble, { backgroundColor: isDarkMode ? '#141522' : '#FFFFFF', borderColor: borderCol }],
                ]}
              >
                <Text style={[styles.bubbleText, isMine ? styles.myText : { color: textColor }]}>
                  {item.text}
                </Text>
                <View style={styles.bubbleFooter}>
                  <Text style={[styles.timestamp, { color: isMine ? 'rgba(255, 255, 255, 0.75)' : subText }]}>
                    {item.timestamp}
                  </Text>
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color={isMine ? '#FFFFFF' : '#22C55E'}
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
            );
          }}
        />

        {/* Live Partner Typing Indicator */}
        {isPartnerTyping && (
          <View style={styles.typingRow}>
            <Ionicons name="create-outline" size={14} color="#FD3A73" />
            <Text style={[styles.typingText, { color: subText }]}>
              {targetUser.name} is typing...
            </Text>
          </View>
        )}

        {/* 5. QUICK ICEBREAKERS CAROUSEL */}
        <View style={[styles.icebreakerContainer, { backgroundColor: bg }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.icebreakerScroll}
          >
            {ICEBREAKERS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.icebreakerChip,
                  { backgroundColor: cardBg, borderColor: borderCol },
                ]}
                onPress={() => handleSend(item.text)}
                activeOpacity={0.75}
              >
                <Text style={[styles.icebreakerText, { color: textColor }]}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. BOTTOM INPUT BAR */}
        <View style={[styles.inputBar, { backgroundColor: inputBg, borderTopColor: borderCol }]}>
          {/* Plan Date Quick Icon */}
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => router.push(`/plan-date/${id}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={22} color="#FD3A73" />
          </TouchableOpacity>

          {/* Voice Note Icon */}
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={handleVoiceNote}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={22} color="#FD3A73" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputFieldBg,
                borderColor: borderCol,
                color: textColor,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={subText}
            multiline
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 7. FULLSCREEN WEBRTC CALL MODAL (AUDIO & VIDEO) */}
      <CallModal session={activeCall} onEndCall={handleEndCall} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  backBtn: {
    padding: 4,
  },
  userHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callIconBtn: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 2,
  },
  planDateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  e2eePillWrapper: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  e2eePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '94%',
  },
  e2eePillText: {
    fontSize: 10.5,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  datePassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(253, 58, 115, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(253, 58, 115, 0.25)',
    marginHorizontal: 14,
    marginTop: 4,
    padding: 12,
    borderRadius: 16,
  },
  datePassTitle: {
    color: '#FD3A73',
    fontSize: 13,
    fontWeight: '800',
  },
  datePassSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  datePassAction: {
    color: '#FD3A73',
    fontSize: 12,
    fontWeight: '800',
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  heroMatchCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroAvatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    backgroundColor: '#FD3A73',
    position: 'relative',
    marginBottom: 4,
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  heroSparkle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FD3A73',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  matchBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroPromptIntro: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 16,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FD3A73',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  myText: {
    color: '#FFFFFF',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
  },
  callLogBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
    width: '92%',
    gap: 10,
    marginVertical: 4,
  },
  callLogIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callLogTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  callLogSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  callBackBtn: {
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  callBackText: {
    color: '#FD3A73',
    fontSize: 11,
    fontWeight: '800',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  inviteCard: {
    alignSelf: 'center',
    width: '96%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inviteTitle: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  inviteBody: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  inviteBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  icebreakerContainer: {
    paddingVertical: 6,
  },
  icebreakerScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  icebreakerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icebreakerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FD3A73',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});