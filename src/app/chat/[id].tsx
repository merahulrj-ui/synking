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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<number | null>(null);

  // Load persistent 2-Strike & 3-Day Suspension Status
  useEffect(() => {
    const loadSuspension = async () => {
      try {
        const storedStrikes = await AsyncStorage.getItem('synking_phone_strikes');
        const storedUntil = await AsyncStorage.getItem('synking_suspended_until');
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
    loadSuspension();
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceNote = () => {
    const duration = Math.max(1, recordingSeconds);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    handleSend(`🎙️ Voice Note (${durStr})`);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const togglePlayVoiceNote = (messageId: string) => {
    if (playingMessageId === messageId) {
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(messageId);
      setTimeout(() => {
        setPlayingMessageId(null);
      }, 3500);
    }
  };

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
        const myId = currentUser?.id || 'my_user_id';
        const isForThisThread =
          (msg.senderId === id && msg.receiverId === myId) ||
          (msg.senderId === myId && msg.receiverId === id);

        if (isForThisThread) {
          setCloudMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
    });
    return () => unsubscribe();
  }, [id, currentUser?.id]);

  // 2. Cloud Backend Initial Sync & Backup Stream
  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchCloud = async () => {
      const msgs = await fetchChatMessagesFromFirestore(currentUser.id, id);
      if (msgs.length > 0) {
        setCloudMessages(msgs);
      }
    };
    fetchCloud();
    const interval = setInterval(fetchCloud, 10000);
    return () => clearInterval(interval);
  }, [id, currentUser?.id]);

  // Combine and strictly bifurcate cloud + local messages for this specific conversation
  const userMessages = React.useMemo(() => {
    const myId = currentUser?.id || 'my_user_id';
    const map = new Map<string, ChatMessage>();
    cloudMessages.forEach(m => {
      if (
        (m.senderId === id && m.receiverId === myId) ||
        (m.senderId === myId && m.receiverId === id)
      ) {
        map.set(m.id, m);
      }
    });
    localMessages.forEach(m => {
      if (
        (m.senderId === id && m.receiverId === myId) ||
        (m.senderId === myId && m.receiverId === id)
      ) {
        map.set(m.id, m);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [cloudMessages, localMessages, id, currentUser?.id]);

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

  // Advanced Multi-lingual Word-to-Digit Anti-Evasion Normalizer
  const normalizeTextToDigits = (input: string): string => {
    let lower = input.toLowerCase();

    // Word-to-Digit Mapping (English words, Hindi/Hinglish numbers, typo slang)
    const wordMap: [RegExp, string][] = [
      [/\b(zero|shunya|sifar|oh)\b/gi, '0'],
      [/\b(one|ek|ik|wan|won)\b/gi, '1'],
      [/\b(two|do|too|tu)\b/gi, '2'],
      [/\b(three|teen|tin|tri|tree)\b/gi, '3'],
      [/\b(four|chaar|char|for|foor)\b/gi, '4'],
      [/\b(five|paanch|panch|fine|fiv|faiv)\b/gi, '5'],
      [/\b(six|chhe|che|chhey|siks)\b/gi, '6'],
      [/\b(seven|saat|sat|sath|sevn)\b/gi, '7'],
      [/\b(eight|aath|aat|ath|ate|ait)\b/gi, '8'],
      [/\b(nine|nau|no|nyn|nin)\b/gi, '9'],
    ];

    wordMap.forEach(([regex, digit]) => {
      lower = lower.replace(regex, digit);
    });

    return lower;
  };

  const checkAndBlockPhoneNumber = (rawText: string): boolean => {
    if (!rawText) return false;

    // Check if user is currently suspended for 3 days
    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockDateStr = new Date(suspendedUntil).toLocaleString();
      const title = '🚫 Account Blocked for 3 Days';
      const msg = `You are restricted from messaging due to repeated safety violations.\n\n🔒 Account Unlocks: ${unlockDateStr}`;
      if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
      } else {
        Alert.alert(title, msg, [{ text: 'OK' }]);
      }
      return true;
    }

    // 1. Normalize words like "nine", "two", "fine", "one", "teen" into digits
    const normalized = normalizeTextToDigits(rawText);

    // 2. Digits only extraction from normalized text
    const currentDigits = normalized.replace(/\D/g, '');
    
    // 3. Single message check: 10+ digits sequence or Indian mobile pattern (starts with 6,7,8,9)
    const has10DigitNumber =
      currentDigits.length >= 10 &&
      (/(?:[6-9]\d{9})|(?:91[6-9]\d{9})|(?:0[6-9]\d{9})/.test(currentDigits) || /\d{10,}/.test(currentDigits));
    
    // 4. Spaced / punctuated digits (e.g. 9 8 7 6 5 4 3 2 1 0 or 9-2-1 3424 5-1-9)
    const spacedPattern = /\b[6-9](?:[\s\-\._*#@,]{0,3}\d){9}\b/;
    
    // 5. Intent keywords + numbers (e.g. "whatsapp me on 921...", "call me on 98...")
    const intentPattern = /(?:(?:no|number|num|whatsapp|ph|phone|contact|call|watsap|insta|dm)\s*(?:is|:|\s)?\s*[\d\s\-\.]{6,})|(?:call\s*me\s*(?:at|on)\s*[\d\s\-\.]{6,})/i;

    // 6. MULTI-MESSAGE FRAGMENT CHECK (e.g. sends 4 digits, then 3 digits, then 3 digits)
    let isFragmentedLeak = false;
    if (currentDigits.length >= 2) {
      const myId = currentUser?.id || 'my_user_id';
      const recentMyMessages = userMessages
        .filter(m => (m.senderId === myId || m.senderId === 'my_user_id') && !m.text.startsWith('📞') && !m.text.startsWith('📹'))
        .slice(-4);
      
      const prevDigits = recentMyMessages
        .map(m => normalizeTextToDigits(m.text).replace(/\D/g, ''))
        .join('');
      
      const combinedDigits = prevDigits + currentDigits;
      if (combinedDigits.length >= 10 && (/(?:[6-9]\d{9})|(?:91[6-9]\d{9})|(?:0[6-9]\d{9})/.test(combinedDigits) || /\d{10,}/.test(combinedDigits))) {
        isFragmentedLeak = true;
      }
    }

    if (has10DigitNumber || spacedPattern.test(normalized) || intentPattern.test(normalized) || isFragmentedLeak) {
      if (strikeCount === 0) {
        // STRIKE 1: FIRST WARNING
        setStrikeCount(1);
        AsyncStorage.setItem('synking_phone_strikes', '1').catch(() => {});
        
        const warningTitle = '⚠️ 1st Safety Warning (Strike 1/2)';
        const warningMsg = isFragmentedLeak
          ? '⚠️ Splitting phone numbers across multiple messages is detected and prohibited.\n\n⚠️ CAUTION: Doing this a 2nd time will immediately BLOCK YOUR ACCOUNT FOR 3 DAYS (72 Hours)!'
          : 'Sharing mobile numbers or contact words (e.g. "nine two one...") is strictly prohibited.\n\n⚠️ CAUTION: Doing this a 2nd time will immediately BLOCK YOUR ACCOUNT FOR 3 DAYS (72 Hours)!';
        
        if (Platform.OS === 'web') {
          window.alert(`${warningTitle}\n\n${warningMsg}`);
        } else {
          Alert.alert(warningTitle, warningMsg, [{ text: 'Understood 👍' }]);
        }
      } else {
        // STRIKE 2: BLOCKED FOR 3 DAYS (72 HOURS)
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const unlockTimestamp = Date.now() + threeDaysMs;
        setStrikeCount(2);
        setIsSuspended(true);
        setSuspendedUntil(unlockTimestamp);
        
        AsyncStorage.setItem('synking_phone_strikes', '2').catch(() => {});
        AsyncStorage.setItem('synking_suspended_until', unlockTimestamp.toString()).catch(() => {});
        
        const unlockDateStr = new Date(unlockTimestamp).toLocaleString();
        const banTitle = '🚫 Account Blocked for 3 Days (Strike 2/2)';
        const banMsg = `You repeatedly attempted to share contact numbers.\n\nAs per community safety policy, your account is SUSPENDED FOR 3 DAYS (72 Hours).\n\n🔒 Unlock Time: ${unlockDateStr}`;
        
        if (Platform.OS === 'web') {
          window.alert(`${banTitle}\n\n${banMsg}`);
        } else {
          Alert.alert(banTitle, banMsg, [{ text: 'I Understand' }]);
        }
      }
      return true;
    }
    return false;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || !id) return;

    // Safety Filter: Block Phone Numbers & Direct Contact Leaks
    if (checkAndBlockPhoneNumber(text)) {
      return;
    }

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
                  {targetUser.occupation} • {typeof targetUser.location === 'object' ? (targetUser.location?.city || 'Nearby') : (targetUser.location || 'Nearby')}
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

            // Voice Note Bubble (WhatsApp Style Waveform)
            if (item.text.startsWith('🎙️') || item.text.includes('Voice Note')) {
              const isPlaying = playingMessageId === item.id;
              return (
                <View
                  style={[
                    styles.bubble,
                    isMine
                      ? styles.myBubble
                      : [styles.theirBubble, { backgroundColor: isDarkMode ? '#141522' : '#FFFFFF', borderColor: borderCol }],
                    { minWidth: 200, paddingVertical: 10 }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => togglePlayVoiceNote(item.id)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: isMine ? '#FFFFFF' : '#FD3A73',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={isMine ? '#FD3A73' : '#FFFFFF'}
                        style={{ marginLeft: isPlaying ? 0 : 2 }}
                      />
                    </TouchableOpacity>

                    {/* Animated Sound Waves */}
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        {[8, 16, 24, 12, 20, 14, 28, 18, 10, 22, 15, 8].map((h, i) => (
                          <View
                            key={i}
                            style={{
                              width: 3,
                              height: isPlaying ? Math.min(28, h + (i % 2 === 0 ? 6 : -4)) : h,
                              borderRadius: 2,
                              backgroundColor: isMine ? (isPlaying ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)') : (isPlaying ? '#FD3A73' : subText),
                            }}
                          />
                        ))}
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isMine ? 'rgba(255, 255, 255, 0.85)' : subText }}>
                        {item.text.replace('🎙️ ', '')}
                      </Text>
                    </View>
                  </View>

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

        {/* 6. BOTTOM INPUT BAR (WHATSAPP STYLE RECORDING / SUSPENSION LOCK) */}
        {isSuspended ? (
          <View style={[styles.inputBar, { backgroundColor: isDarkMode ? '#200D11' : '#FEE2E2', borderTopColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="lock-closed" size={18} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 13, letterSpacing: 0.3 }}>
                ACCOUNT BLOCKED FOR 3 DAYS (STRIKE 2/2)
              </Text>
            </View>
            <Text style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
              Restricted from messaging due to repeated contact sharing violations. Unlocks on {suspendedUntil ? new Date(suspendedUntil).toLocaleDateString() : '3 days'}.
            </Text>
          </View>
        ) : isRecording ? (
          <View style={[styles.inputBar, { backgroundColor: isDarkMode ? '#1E1218' : '#FFF1F2', borderTopColor: '#FECDD3', paddingHorizontal: 16 }]}>
            {/* Pulsing Recording Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
              <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 14 }}>
                Recording... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={cancelRecording}
              style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: subText, fontSize: 13, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>

            {/* Send Voice Note Button */}
            <TouchableOpacity
              onPress={sendVoiceNote}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#FD3A73',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.inputBar, { backgroundColor: inputBg, borderTopColor: borderCol }]}>
            {/* Plan Date Quick Icon */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => router.push(`/plan-date/${id}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={22} color="#FD3A73" />
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

            {/* Mic or Send Button depending on inputText */}
            {inputText.trim() ? (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleSend()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: '#FD3A73' }]}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
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