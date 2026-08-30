import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useApp } from '../../contexts/AppContext';
import { WebRTCService } from '../../services/webrtcService';
import { CallModal } from '../../components/CallModal';
import { CallSession, ChatMessage, UserProfile } from '../../types';
import { fetchChatMessagesFromFirestore } from '../../services/firebase';
import { RealtimeBridge } from '../../services/realtimeBridge';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptE2EEMessage } from '../../utils/encryption';

function formatWhatsAppTime(timestamp?: string): string {
  if (!timestamp) return '';
  if (timestamp === 'Just now') return 'Just now';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 || 12;
    const timeStr = `${formattedHour}:${mins} ${ampm}`;

    if (isToday) {
      return timeStr;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  } catch (e) {
    return timestamp;
  }
}

const ICEBREAKERS = [
  { text: 'Specialty Coffee or Boba Tea? ☕', tag: 'Cafe Vibe' },
  { text: 'Movies or late night drives? 🚗✨', tag: 'Fun Vibe' },
  { text: 'Best pizza slice in town? 🍕', tag: 'Foodie' },
  { text: 'What song is on loop for you right now? 🎵', tag: 'Music' },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { matches, profiles, messages, sendMessage, deleteMessage, activeBookings, currentUser, isDarkMode } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedMsgForAction, setSelectedMsgForAction] = useState<ChatMessage | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);
  const [supportedMimes, setSupportedMimes] = useState<string>('default');
  const [lastAudioSize, setLastAudioSize] = useState<string>('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<number | null>(null);

  // Load persistent 2-Strike & 3-Day Suspension Status
  const addAudioLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(`[AUDIO_DEBUG] ${entry}`);
  };
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

  const mediaRecorderRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const activeAudioRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const isSendingRef = useRef<boolean>(false);
  const lastSentTimeRef = useRef<number>(0);
  const nativeRecordingRef = useRef<any>(null);
  const nativeSoundRef = useRef<any>(null);

  // Test Device Speaker with Synthetic Beep
  const testSpeakerSound = () => {
    try {
      addAudioLog('🔊 Testing device speaker with 440Hz test chime...');
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        addAudioLog('❌ Web Audio API not supported on this browser.');
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5 chime
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
      addAudioLog('✅ Speaker test tone triggered successfully. Did you hear the chime?');
    } catch (e: any) {
      addAudioLog(`❌ Speaker test failed: ${e.message || e}`);
    }
  };

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

  const startRecording = async () => {
    try {
      addAudioLog('🎙️ Requesting microphone access...');
      if (Platform.OS !== 'web') {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        nativeRecordingRef.current = recording;
        animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
        setIsRecording(true);
        setRecordingSeconds(0);
        addAudioLog('🎙️ Native Recording active!');
      } else {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];
          let mimeType = 'audio/webm';
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          setSupportedMimes(mimeType);
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
          animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
          setIsRecording(true);
          setRecordingSeconds(0);
        }
      }
    } catch (err: any) {
      addAudioLog(`❌ Mic permission failed: ${err.message || err}`);
      if (Platform.OS === 'web') window.alert('Microphone Access Required');
      else Alert.alert('Microphone Access Required');
    }
  };

  const cancelRecording = async () => {
    addAudioLog('🛑 Recording cancelled by user.');
    if (animFrameRef.current) clearInterval(animFrameRef.current);
    if (Platform.OS !== 'web') {
      if (nativeRecordingRef.current) {
        await nativeRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        nativeRecordingRef.current = null;
      }
    } else {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {}
    }
    audioChunksRef.current = [];
    setLiveMicLevel(0);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceNote = async () => {
    addAudioLog('🚀 Finishing voice note...');
    if (animFrameRef.current) clearInterval(animFrameRef.current);
    setLiveMicLevel(0);
    const duration = Math.max(1, recordingSeconds);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const textLabel = `🎵 Voice Note (${durStr})`;
    let audioDataUri = '';

    try {
      if (Platform.OS !== 'web') {
        if (nativeRecordingRef.current) {
          await nativeRecordingRef.current.stopAndUnloadAsync();
          const uri = nativeRecordingRef.current.getURI();
          if (uri) {
            const FileSystem = require('expo-file-system');
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            audioDataUri = `data:audio/m4a;base64,${base64}`;
          }
          nativeRecordingRef.current = null;
        }
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          await Promise.race([
             new Promise<void>((resolve) => {
               mediaRecorderRef.current.onstop = () => resolve();
               mediaRecorderRef.current.stop();
             }),
             new Promise<void>((resolve) => setTimeout(resolve, 500))
          ]);
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
          mediaStreamRef.current = null;
        }
        if (audioChunksRef.current.length > 0) {
          const mime = supportedMimes || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          audioDataUri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(audioBlob);
          });
        }
      }
    } catch (e: any) {
      addAudioLog(`❌ Audio error: ${e.message}`);
    } finally {
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);
    }

    if (id) {
      const fullText = audioDataUri ? `${textLabel}|||AUDIO_DATA::${audioDataUri}` : textLabel;
      sendMessage(id, fullText, 'voice', { audioUrl: audioDataUri, audioDuration: duration });
    }
  };

  const togglePlayVoiceNote = async (messageId: string, audioUrl?: string) => {
    if (playingMessageId === messageId) {
       if (Platform.OS !== 'web') await nativeSoundRef.current?.pauseAsync();
       else activeAudioRef.current?.pause();
       setPlayingMessageId(null);
       return;
    }
    
    if (Platform.OS !== 'web') {
      await nativeSoundRef.current?.stopAsync().catch(()=>{});
      await nativeSoundRef.current?.unloadAsync().catch(()=>{});
      nativeSoundRef.current = null;
    } else {
      activeAudioRef.current?.pause();
      activeAudioRef.current = null;
    }

    if (audioUrl && audioUrl.startsWith('data:audio/')) {
      try {
        if (Platform.OS !== 'web') {
          const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
          nativeSoundRef.current = sound;
          setPlayingMessageId(messageId);
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status: any) => {
             if (status.didJustFinish) {
               setPlayingMessageId(null);
               sound.unloadAsync();
             }
          });
        } else {
          const HTMLAudio = (window as any).Audio;
          const audio = new HTMLAudio(audioUrl);
          activeAudioRef.current = audio;
          setPlayingMessageId(messageId);
          audio.play();
          audio.onended = () => setPlayingMessageId(null);
        }
      } catch (e) {
        setPlayingMessageId(null);
      }
    }
  };

  // Real target profile resolution (NO fake mock profiles)
  const targetUser: UserProfile =
    matches.find(m => m && m.id === id) ||
    profiles.find(p => p && p.id === id) || {
      id: id || 'user',
      name: (profiles.find(p => p && p.id === id)?.name) || 'Member',
      age: 22,
      gender: 'other',
      occupation: 'Member',
      location: 'Roorkee',
      distance: '0 km',
      bio: 'Ready to connect!',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      photos: [],
      interests: ['Coffee', 'Music'],
      compatibility: 100,
      isVerified: true,
      isVip: false,
    };

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
          const decryptAndAdd = async () => {
            let readable = msg.text || (msg as any).plainText || '';
            if (readable && typeof readable === 'string' && readable.startsWith('E2EE::')) {
              readable = await decryptE2EEMessage(readable, msg.senderId, msg.receiverId);
            }
            let audioUrl = msg.extraData?.audioUrl;
            let displayText = readable;
            if (readable && typeof readable === 'string' && readable.includes('|||AUDIO_DATA::')) {
              const parts = readable.split('|||AUDIO_DATA::');
              displayText = parts[0];
              audioUrl = parts[1];
            }
            const clean = {
              ...msg,
              text: displayText,
              extraData: {
                ...msg.extraData,
                audioUrl: audioUrl || msg.extraData?.audioUrl,
              },
            };
            setCloudMessages(prev => {
              if (prev.some(m => m.id === clean.id)) {
                addAudioLog(`🛡️ [WS_DUPLICATE_IGNORED] ID ${clean.id.substring(0, 15)} already exists`);
                return prev;
              }
              addAudioLog(`📥 [WS_MESSAGE_ACCEPTED] "${clean.text.substring(0, 20)}"`);
              return [...prev, clean];
            });
          };
          decryptAndAdd();
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
    const interval = setInterval(fetchCloud, 2000);
    return () => clearInterval(interval);
  }, [id, currentUser?.id]);

  // Combine and strictly bifurcate cloud + local messages for this specific conversation (0 duplicates guaranteed)
  const userMessages = React.useMemo(() => {
    const myId = currentUser?.id || 'my_user_id';
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const result: ChatMessage[] = [];

    const all = [...cloudMessages, ...localMessages];
    for (const m of all) {
      if (!m || !m.id) continue;
      const isForThisThread =
        (m.senderId === id && m.receiverId === myId) ||
        (m.senderId === myId && m.receiverId === id);
      if (!isForThisThread) continue;

      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      result.push(m);
    }

    // WhatsApp-Style Inverted Sort: Newest at index 0 (bottom of screen), oldest at end (top)
    result.sort((a, b) => {
      const getMs = (t?: string) => {
        if (!t || t === 'Just now') return Date.now();
        const d = new Date(t).getTime();
        return isNaN(d) ? 0 : d;
      };
      return getMs(b.timestamp) - getMs(a.timestamp);
    });

    return result;
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
    const parsed = msgs.map(m => {
      let raw = m.text || '';
      let audioUrl = m.extraData?.audioUrl;
      let displayText = raw;
      if (raw && typeof raw === 'string' && raw.includes('|||AUDIO_DATA::')) {
        const parts = raw.split('|||AUDIO_DATA::');
        displayText = parts[0];
        audioUrl = parts[1];
      }
      return {
        ...m,
        text: displayText,
        extraData: {
          ...m.extraData,
          audioUrl: audioUrl || m.extraData?.audioUrl,
        },
      };
    });
    setCloudMessages(parsed);
    Alert.alert('Cloud Synced 🔄', `Fetched ${parsed.length} messages from Cloud Firestore.`);
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

    // 6. MULTI-MESSAGE FRAGMENT CHECK (e.g. user sends raw digits in parts: 9812, 345, 678)
    let isFragmentedLeak = false;
    const isPureDigitChunk = /^[\d\s\-\.,+]{2,8}$/.test(rawText.trim());
    if (isPureDigitChunk && currentDigits.length >= 2) {
      const myId = currentUser?.id || 'my_user_id';
      const recentMyMessages = userMessages
        .filter(m => (m.senderId === myId || m.senderId === 'my_user_id') && !m.text.startsWith('📞') && !m.text.startsWith('📹'))
        .slice(-4);
      
      const prevDigits = recentMyMessages
        .filter(m => /^[\d\s\-\.,+]{2,8}$/.test(m.text.trim()))
        .map(m => m.text.replace(/\D/g, ''))
        .join('');
      
      const combinedDigits = prevDigits + currentDigits;
      if (combinedDigits.length >= 10 && (/(?:[6-9]\d{9})|(?:91[6-9]\d{9})|(?:0[6-9]\d{9})/.test(combinedDigits) || /\d{10,}/.test(combinedDigits))) {
        isFragmentedLeak = true;
      }
    }

    // 7. UPI & PAYMENT FRAUD SHIELD
    const upiPattern = /[a-zA-Z0-9.\-_]{2,}@(okaxis|okhdfcbank|oksbi|okicici|paytm|ybl|ibl|axl|apl|upi|kotak|barodampay|idfcbank|federal|indus|freecharge|pockets|airtel|jupiteraxis|sliceaxis|fbl|waaxis|sbi|hdfcbank|icici|axisbank)\b/i;
    const paymentIntent = /(?:(?:paytm|gpay|googlepay|phonepe|bhim|upi|scanner|qr\s*code|send\s*(?:money|cash|rs|rupees)|transfer)\s*(?:is|:|\s)?\s*[\w\.\-@]{3,})/i;

    // 8. SOCIAL MEDIA HANDLES & EXTERNAL ID SHIELD (Instagram, Snapchat, Telegram, FB, Links, @handles)
    const socialHandlePattern = /(?:(?:insta|instagram|ig|snap|snapchat|sc|telegram|tele|tg|facebook|fb|twitter)\s*(?:id|handle|username|pe|par|account)?\s*(?:is|:|\s)?\s*[@a-zA-Z0-9._]{3,})/i;
    const atHandlePattern = /(?:^|\s)@[a-zA-Z0-9._]{3,30}\b/;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const socialLinkPattern = /(?:t\.me|telegram\.me|instagram\.com|snapchat\.com|wa\.me|facebook\.com)\/[a-zA-Z0-9._-]+/i;

    const isUpiViolation = upiPattern.test(rawText) || paymentIntent.test(rawText);
    const isSocialViolation = socialHandlePattern.test(rawText) || atHandlePattern.test(rawText) || emailPattern.test(rawText) || socialLinkPattern.test(rawText);
    const isPhoneViolation = has10DigitNumber || spacedPattern.test(normalized) || intentPattern.test(normalized) || isFragmentedLeak;

    if (isPhoneViolation || isUpiViolation || isSocialViolation) {
      const violationType = isUpiViolation
        ? 'UPI / Payment ID sharing'
        : isSocialViolation
        ? 'Social Media / Insta / Snap ID sharing'
        : 'Phone Number sharing';

      if (strikeCount === 0) {
        // STRIKE 1: FIRST WARNING
        setStrikeCount(1);
        AsyncStorage.setItem('synking_phone_strikes', '1').catch(() => {});
        
        const warningTitle = '⚠️ 1st Safety Warning (Strike 1/2)';
        const warningMsg = `${violationType} is strictly prohibited for user privacy and fraud protection.\n\n⚠️ CAUTION: Attempting this a 2nd time will immediately BLOCK YOUR WHOLE ACCOUNT FOR 3 DAYS (72 Hours)!`;
        
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
        const banTitle = '🚫 ENTIRE ACCOUNT BLOCKED FOR 3 DAYS (Strike 2/2)';
        const banMsg = `You repeatedly attempted ${violationType}.\n\nAs per community safety policy, your ENTIRE ACCOUNT (Swiping, Calls, Messages, & InSynk) is SUSPENDED FOR 3 DAYS (72 Hours).\n\n🔒 Unlock Time: ${unlockDateStr}`;
        
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
    const now = Date.now();
    if (isSendingRef.current || now - lastSentTimeRef.current < 600) {
      addAudioLog('🛡️ [DUP_BLOCKED] Debounced duplicate tap within 600ms');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const text = textToSend || inputText.trim();
    if (!text || !id) return;

    // Basic XSS Sanitization & Script blocking
    let sanitizedText = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/on\w+=/gi, 'blocked=')
      .replace(/javascript:/gi, 'blocked:');

    // Anti-Spam: Block Links / URLs
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i;
    if (urlPattern.test(sanitizedText)) {
      if (Platform.OS === 'web') {
        window.alert('Links are not allowed in messages for security reasons.');
      } else {
        Alert.alert('Security Warning', 'Links are not allowed in messages.');
      }
      isSendingRef.current = false;
      return;
    }

    // 500 Character Limit Enforcement
    if (sanitizedText.length > 500) {
      if (Platform.OS === 'web') {
        window.alert('Message cannot exceed 500 characters.');
      } else {
        Alert.alert('Limit Reached', 'Message cannot exceed 500 characters.');
      }
      isSendingRef.current = false;
      return;
    }

    // Safety Filter: Block Phone Numbers & Direct Contact Leaks
    if (checkAndBlockPhoneNumber(sanitizedText)) {
      isSendingRef.current = false;
      return;
    }

    isSendingRef.current = true;
    lastSentTimeRef.current = now;
    setInputText('');

    addAudioLog(`📤 [MSG_SENDING] "${sanitizedText.substring(0, 25)}"`);
    sendMessage(id, sanitizedText);

    setTimeout(() => {
      isSendingRef.current = false;
      addAudioLog('✅ [MSG_SENT] Ready for next message');
    }, 500);

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

    if (isSuspended && suspendedUntil && Date.now() < suspendedUntil) {
      const unlockStr = new Date(suspendedUntil).toLocaleString();
      const msg = `Your ENTIRE account is temporarily suspended for 3 days.\n\n🔒 Voice & Video calls unlock on: ${unlockStr}`;
      if (Platform.OS === 'web') {
        window.alert(`🚫 Calls Disabled\n\n${msg}`);
      } else {
        Alert.alert('🚫 Calls Disabled', msg, [{ text: 'OK' }]);
      }
      return;
    }

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

  const handleSendTestPing = () => {
    if (id) {
      sendMessage(id, '⚡ Ping Test ' + new Date().toLocaleTimeString());
    }
  };

  const handleBack = () => {
    try {
      if (isRecording) {
        cancelRecording();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    } catch (e) {}

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chats');
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: bg, paddingTop: insets.top }]}>
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          inverted={true}
          ListFooterComponent={
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
                    <Text style={[styles.callLogSub, { color: subText }]}>{formatWhatsAppTime(item.timestamp)} · P2P WebRTC</Text>
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
            const rawItemText = item.text || '';
            const isVoiceMsg = rawItemText.startsWith('🎙️') || rawItemText.includes('Voice Note') || item.type === 'voice';

            if (isVoiceMsg) {
              const isPlaying = playingMessageId === item.id;
              let displayText = rawItemText;
              let effectiveAudioUrl = item.extraData?.audioUrl;
              if (rawItemText.includes('|||AUDIO_DATA::')) {
                const p = rawItemText.split('|||AUDIO_DATA::');
                displayText = p[0];
                if (!effectiveAudioUrl) effectiveAudioUrl = p[1];
              }

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setSelectedMsgForAction(item);
                  }}
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
                      onPress={() => togglePlayVoiceNote(item.id, effectiveAudioUrl)}
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
                        {displayText.replace('🎙️ ', '')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.timestamp, { color: isMine ? 'rgba(255, 255, 255, 0.75)' : subText }]}>
                      {formatWhatsAppTime(item.timestamp)}
                    </Text>
                    <Ionicons
                      name="checkmark-done"
                      size={12}
                      color={isMine ? '#FFFFFF' : '#22C55E'}
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setSelectedMsgForAction(item);
                }}
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
                    {formatWhatsAppTime(item.timestamp)}
                  </Text>
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color={isMine ? '#FFFFFF' : '#22C55E'}
                    style={{ marginLeft: 2 }}
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedMsgForAction(item)}
                    style={{ marginLeft: 4, paddingHorizontal: 2 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 12, color: isMine ? 'rgba(255, 255, 255, 0.7)' : subText, fontWeight: '900' }}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
          <View style={[styles.inputBar, { backgroundColor: inputBg, borderTopColor: borderCol, paddingBottom: Math.max(8, insets.bottom) }]}>
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
              maxLength={500}
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

      {/* 6. COMPACT FLOATING MESSAGE ACTION & DELETE MODAL */}
      <Modal
        visible={!!selectedMsgForAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMsgForAction(null)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setSelectedMsgForAction(null)}
        >
          <View
            style={{
              width: 280,
              backgroundColor: isDarkMode ? '#141522' : '#FFFFFF',
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1.5,
              borderColor: isDarkMode ? 'rgba(253, 58, 115, 0.35)' : '#E2E8F0',
              shadowColor: '#FD3A73',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDarkMode ? 0.35 : 0.15,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* Header Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#FD3A73" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: isDarkMode ? '#FD3A73' : '#E11D48', letterSpacing: 0.5 }}>
                MESSAGE OPTIONS
              </Text>
            </View>

            {/* Actions List */}
            <View style={{ marginTop: 8, gap: 4 }}>
              {/* Copy Text */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                }}
                onPress={() => {
                  if (selectedMsgForAction?.text) {
                    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(selectedMsgForAction.text);
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  }
                  setSelectedMsgForAction(null);
                }}
              >
                <Ionicons name="copy-outline" size={18} color="#00E5FF" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                  Copy Text
                </Text>
              </TouchableOpacity>

              {/* Delete For Me */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                }}
                onPress={() => {
                  if (selectedMsgForAction && id) {
                    deleteMessage(id, selectedMsgForAction.id, false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  }
                  setSelectedMsgForAction(null);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                  Delete for Me
                </Text>
              </TouchableOpacity>

              {/* Delete For Everyone (Only if I sent the message) */}
              {(selectedMsgForAction?.senderId === currentUser?.id || selectedMsgForAction?.senderId === 'my_user_id') && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                  }}
                  onPress={() => {
                    if (selectedMsgForAction && id) {
                      deleteMessage(id, selectedMsgForAction.id, true);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                    }
                    setSelectedMsgForAction(null);
                  }}
                >
                  <Ionicons name="flame-outline" size={18} color="#EF4444" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>
                    Delete for Everyone
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  paddingVertical: 8,
                  marginTop: 4,
                  borderRadius: 10,
                }}
                onPress={() => setSelectedMsgForAction(null)}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: subText }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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

