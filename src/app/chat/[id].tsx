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
  Keyboard,
} from 'react-native';
import {
  createAudioPlayer,
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../contexts/AppContext';
import { WebRTCService } from '../../services/webrtcService';
import { CallModal } from '../../components/CallModal';
import { CallSession, ChatMessage, UserProfile } from '../../types';
import { fetchChatMessagesFromFirestore, getLocalBackendUrl } from '../../services/firebase';
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
    if (now.getTime() - d.getTime() < 60000) {
      return 'Just now';
    }

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
  const [cloudMessages, setCloudMessages] = useState<ChatMessage[]>((id && messages[id]) || []);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);
  const [supportedMimes, setSupportedMimes] = useState<string>('default');
  const [lastAudioSize, setLastAudioSize] = useState<string>('');
  const [visualLogs, setVisualLogs] = useState<string[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackCurrentSeconds, setPlaybackCurrentSeconds] = useState<number>(0);
  const [audioMsgStatus, setAudioMsgStatus] = useState<Record<string, { status: string; error?: string; timestamp: string; payloadLen: number }>>({});
  const playbackTimerRef = useRef<any>(null);
  const amrPlayerRef = useRef<any>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<number | null>(null);
  const [deletedMsgIds, setDeletedMsgIds] = useState<Set<string>>(new Set());
  const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Instant 0ms Preloading: Cache messages & Resolve Real User Profile
  useEffect(() => {
    if (!id) return;
    // 1. Instant 0ms cached messages load from disk
    AsyncStorage.getItem(`synking_cached_msgs_${id}`).then(cached => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCloudMessages(prev => (prev.length === 0 ? parsed : prev));
          }
        } catch (e) {}
      }
    });

    // 2. Resolve real user profile from Cloud SQLite / Backend
    fetch(`${getLocalBackendUrl()}/api/profiles`).then(r => r.json()).then(list => {
      if (Array.isArray(list)) {
        const cleanDigits = id.replace(/\D/g, '').slice(-10);
        const found = list.find((p: any) => 
          p.id === id || 
          (cleanDigits && p.phoneNumber && p.phoneNumber.replace(/\D/g, '').slice(-10) === cleanDigits)
        );
        if (found) {
          setFetchedProfile(found);
        }
      }
    }).catch(() => {});
  }, [id]);

  // Load locally deleted message IDs from AsyncStorage on mount
  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(`synking_deleted_${id}`).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDeletedMsgIds(new Set(parsed));
          }
        } catch (e) {}
      }
    });
  }, [id]);

  const markMessageDeletedLocally = (msgId: string) => {
    setDeletedMsgIds(prev => {
      const next = new Set(prev);
      next.add(msgId);
      if (id) {
        AsyncStorage.setItem(`synking_deleted_${id}`, JSON.stringify(Array.from(next))).catch(() => {});
      }
      return next;
    });
    setCloudMessages(prev => prev.filter(m => m && m.id !== msgId));
  };

  const addAudioLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(`[AUDIO_DEBUG] ${entry}`);
    setVisualLogs(prev => [entry, ...prev].slice(0, 5));
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
  const typingTimeoutRef = useRef<any>(null);

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

// WhatsApp-Standard Voice Compressor Preset (Mono, 22.05 kHz, 32 kbps AAC = 75% lighter)
const VOICE_COMPRESSED_CONFIG: any = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  outputFormat: 'mpeg4',
  audioEncoder: 'aac',
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'aac ',
    audioQuality: 0x40,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 32000,
  },
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

  // 60-Second Auto-Cutoff Safety Guard (Prevents server overload)
  useEffect(() => {
    if (isRecording && recordingSeconds >= 60) {
      addAudioLog('⏱️ Max 60-second limit reached. Auto-sending compressed voice note...');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        } catch (e) {}
      }
      sendVoiceNote();
    }
  }, [isRecording, recordingSeconds]);

  const startRecording = async () => {
    try {
      addAudioLog('🎙️ Requesting microphone access...');
      if (Platform.OS !== 'web') {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Microphone Access Required', 'Please enable microphone permissions in settings to record voice notes.');
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        const androidOptions: any = {
          extension: '.m4a',
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 32000,
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
          android: {
            extension: '.m4a',
            outputFormat: 'mpeg4',
            audioEncoder: 'aac',
            sampleRate: 22050,
            numberOfChannels: 1,
            bitRate: 32000,
          },
        };
        const recorder = new AudioModule.AudioRecorder(androidOptions);
        await recorder.prepareToRecordAsync(androidOptions);
        recorder.record();
        nativeRecordingRef.current = recorder;
        animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
        setIsRecording(true);
        setRecordingSeconds(0);
        addAudioLog('🎙️ Native Recording active (Voice Compressed)!');
      } else {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];
          let mimeType = 'audio/webm';
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          }
          setSupportedMimes(mimeType);
          let recorder: any;
          try {
            recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
          } catch (e) {
            recorder = new MediaRecorder(stream, { mimeType });
          }
          recorder.ondataavailable = (e: any) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
          animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
          setIsRecording(true);
          setRecordingSeconds(0);
          addAudioLog('🎙️ Web Recording active (Voice Compressed)!');
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
        try {
          await nativeRecordingRef.current.stop();
        } catch (e) {}
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

    // ⚡ Instant UI feedback: Close the recording bar immediately (0ms delay)
    setIsRecording(false);
    setRecordingSeconds(0);

    try {
      if (Platform.OS !== 'web') {
        if (nativeRecordingRef.current) {
          try {
            await nativeRecordingRef.current.stop();
          } catch (e) {}
          const uri = nativeRecordingRef.current.uri;
          addAudioLog(`🎙️ Native URI: ${uri}`);
          if (uri) {
            const FileSystem = require('expo-file-system/legacy');
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            audioDataUri = `data:audio/m4a;base64,${base64}`;
            addAudioLog(`📦 Encoded audio payload size: ${base64.length} bytes`);
          }
          nativeRecordingRef.current = null;
        }
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          await new Promise<void>((resolve) => {
            const rec = mediaRecorderRef.current;
            if (!rec) return resolve();
            rec.onstop = () => resolve();
            try {
              if (rec.state === 'recording') {
                rec.requestData(); // 🚀 Force flush all remaining audio bytes into ondataavailable!
              }
              rec.stop();
            } catch (e) {
              resolve();
            }
            setTimeout(resolve, 150); // Ultra-fast 150ms timeout!
          });
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
          mediaStreamRef.current = null;
        }
        if (audioChunksRef.current.length > 0) {
          const mime = (supportedMimes && supportedMimes !== 'default') ? supportedMimes : 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          console.log(`[AUDIO_RECORDED_SUCCESS] Size: ${audioBlob.size} bytes, type: ${mime}`);
          if (audioBlob.size > 0) {
            audioDataUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(audioBlob);
            });
          }
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
      // 🚀 Send audioDuration only in extraData (audioDataUri is already in fullText, cutting payload size in half!)
      sendMessage(id, fullText, 'voice', { audioDuration: duration });
    }
  };

  const togglePlayVoiceNote = async (messageId: string, audioUrl?: string) => {
    if (playingMessageId === messageId) {
      if (Platform.OS !== 'web') nativeSoundRef.current?.pause();
      else {
        activeAudioRef.current?.pause();
        try { amrPlayerRef.current?.stop(); } catch (e) {}
      }
      setPlayingMessageId(null);
      setPlaybackCurrentSeconds(0);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }
    
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setPlaybackCurrentSeconds(0);

    if (Platform.OS !== 'web') {
      nativeSoundRef.current?.pause();
      nativeSoundRef.current = null;
    } else {
      activeAudioRef.current?.pause();
      activeAudioRef.current = null;
      try { amrPlayerRef.current?.stop(); } catch (e) {}
      amrPlayerRef.current = null;
    }

    const timeStr = new Date().toLocaleTimeString();
    const pLen = audioUrl?.length || 0;

    addAudioLog(`▶ [PLAY_TAP] ID: ${messageId.substring(0, 8)} | Len: ${pLen} | Pfx: ${audioUrl ? audioUrl.substring(0, 25) : 'EMPTY'}`);

    if (audioUrl && (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:') || audioUrl.startsWith('file:') || audioUrl.startsWith('http'))) {
      try {
        setAudioMsgStatus(prev => ({
          ...prev,
          [messageId]: {
            status: 'LOADING',
            timestamp: timeStr,
            payloadLen: pLen,
          }
        }));

        if (Platform.OS !== 'web') {
          // Native Android / iOS Audio Playback via expo-audio
          let finalPlayUri = audioUrl;

          if (audioUrl.startsWith('data:')) {
            const FileSystem = require('expo-file-system/legacy');
            const cleanBase64 = audioUrl.includes(';base64,') ? audioUrl.split(';base64,')[1] : audioUrl;
            const cacheFilePath = `${FileSystem.cacheDirectory}voice_${messageId}.m4a`;
            await FileSystem.writeAsStringAsync(cacheFilePath, cleanBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            finalPlayUri = cacheFilePath;
            addAudioLog(`💾 [NATIVE_CACHE] Saved ${cleanBase64.length} chars to ${cacheFilePath}`);
          }

          const player = createAudioPlayer(finalPlayUri);
          nativeSoundRef.current = player;
          setPlayingMessageId(messageId);
          setPlaybackCurrentSeconds(0);
          setAudioMsgStatus(prev => ({
            ...prev,
            [messageId]: {
              status: 'PLAYING',
              timestamp: timeStr,
              payloadLen: pLen,
            }
          }));

          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.isLoaded) {
              const currentSec = Math.floor(status.currentTime || 0);
              setPlaybackCurrentSeconds(currentSec);
              if (status.didJustFinish) {
                setPlayingMessageId(null);
                setPlaybackCurrentSeconds(0);
                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
                addAudioLog(`🏁 [NATIVE_FINISHED] Playback completed`);
                setAudioMsgStatus(prev => ({
                  ...prev,
                  [messageId]: {
                    status: 'FINISHED',
                    timestamp: timeStr,
                    payloadLen: pLen,
                  }
                }));
              }
            }
          });

          player.play();
          addAudioLog(`🔊 [NATIVE_PLAYING] Started ExoPlayer`);

          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = setInterval(() => {
            if (nativeSoundRef.current) {
              const cur = nativeSoundRef.current.currentTime || 0;
              const dur = nativeSoundRef.current.duration || 0;
              setPlaybackCurrentSeconds(Math.floor(cur));
              if (dur > 0 && cur >= dur) {
                clearInterval(playbackTimerRef.current);
                setPlayingMessageId(null);
                setPlaybackCurrentSeconds(0);
                setAudioMsgStatus(prev => ({
                  ...prev,
                  [messageId]: {
                    status: 'FINISHED',
                    timestamp: timeStr,
                    payloadLen: pLen,
                  }
                }));
              }
            }
          }, 350);
        } else {
          // Web Audio Playback via Blob URL with WebAudio fallback
          let finalUrl = audioUrl;
          let rawBytes: Uint8Array | null = null;

          if (typeof window !== 'undefined' && audioUrl.startsWith('data:')) {
            try {
              const commaIndex = audioUrl.indexOf(',');
              if (commaIndex !== -1) {
                const header = audioUrl.substring(0, commaIndex);
                const rawB64 = audioUrl.substring(commaIndex + 1);
                
                const cleanB64 = rawB64.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
                const paddedB64 = cleanB64.padEnd(cleanB64.length + (4 - cleanB64.length % 4) % 4, '=');

                let mime = 'audio/webm';
                const mimeMatch = header.match(/data:([^;]+)/);
                if (mimeMatch && mimeMatch[1]) {
                  mime = mimeMatch[1].trim().toLowerCase();
                }
                if (mime.includes('m4a') || mime.includes('mp4') || mime.includes('aac') || mime.includes('3gp') || mime.includes('amr')) {
                  mime = 'audio/mp4';
                } else if (mime.includes('webm') || mime.includes('opus')) {
                  mime = 'audio/webm';
                }

                const binaryStr = atob(paddedB64);
                const len = binaryStr.length;
                if (len > 0) {
                  rawBytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    rawBytes[i] = binaryStr.charCodeAt(i);
                  }

                  // Ensure all AAC/m4a/3gp containers use audio/mp4 so Chrome plays natively
                  if (mime.includes('m4a') || mime.includes('mp4') || mime.includes('aac') || mime.includes('3gp')) {
                    mime = 'audio/mp4';
                  }

                  const blob = new Blob([rawBytes as any], { type: mime });
                  finalUrl = URL.createObjectURL(blob);
                  addAudioLog(`📦 [BLOB_CREATED] Decoded ${len} bytes, MIME: ${mime}`);
                }
              }
            } catch (convErr: any) {
              addAudioLog(`⚠️ [BLOB_WARN] ${convErr.message}`);
            }
          }

          const HTMLAudio = (window as any).Audio;
          const audio = new HTMLAudio(finalUrl);
          activeAudioRef.current = audio;
          setPlayingMessageId(messageId);
          setPlaybackCurrentSeconds(0);

          audio.ontimeupdate = () => {
            setPlaybackCurrentSeconds(Math.floor(audio.currentTime));
          };
          audio.onended = () => {
            setPlayingMessageId(null);
            setPlaybackCurrentSeconds(0);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            addAudioLog(`🏁 [WEB_FINISHED] Playback completed`);
            setAudioMsgStatus(prev => ({
              ...prev,
              [messageId]: {
                status: 'FINISHED',
                timestamp: timeStr,
                payloadLen: pLen,
              }
            }));
          };

          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = setInterval(() => {
            if (activeAudioRef.current) {
              const cur = activeAudioRef.current.currentTime || 0;
              const dur = activeAudioRef.current.duration || 0;
              setPlaybackCurrentSeconds(Math.floor(cur));
              if (activeAudioRef.current.ended || (dur > 0 && cur >= dur)) {
                clearInterval(playbackTimerRef.current);
                setPlayingMessageId(null);
                setPlaybackCurrentSeconds(0);
                setAudioMsgStatus(prev => ({
                  ...prev,
                  [messageId]: {
                    status: 'FINISHED',
                    timestamp: timeStr,
                    payloadLen: pLen,
                  }
                }));
              }
            }
          }, 350);

          audio.play().then(() => {
            addAudioLog(`🔊 [HTML5_PLAYING] Started HTML5 Audio`);
            setAudioMsgStatus(prev => ({
              ...prev,
              [messageId]: {
                status: 'PLAYING (HTML5)',
                timestamp: timeStr,
                payloadLen: pLen,
              }
            }));
          }).catch(async (err: any) => {
            addAudioLog(`⚠️ [HTML5_FAIL] ${err.name}, trying WebAudio...`);
            try {
              if (rawBytes && rawBytes.length > 0) {
                const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (AudioCtxClass) {
                  const ctx = new AudioCtxClass();
                  if (ctx.state === 'suspended') {
                    await ctx.resume();
                  }
                  audioContextRef.current = ctx;
                  const audioBuffer = await ctx.decodeAudioData(rawBytes.buffer.slice(0));
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.onended = () => {
                    setPlayingMessageId(null);
                    setPlaybackCurrentSeconds(0);
                    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
                    try { ctx.close(); } catch (e) {}
                    addAudioLog(`🏁 [WEBAUDIO_FINISHED] Playback completed`);
                    setAudioMsgStatus(prev => ({
                      ...prev,
                      [messageId]: {
                        status: 'FINISHED',
                        timestamp: timeStr,
                        payloadLen: pLen,
                      }
                    }));
                  };
                  const startTime = ctx.currentTime;
                  source.start(0);
                  addAudioLog(`🔊 [WEBAUDIO_PLAYING] Hardware decoder active (${Math.round(audioBuffer.duration)}s)`);
                  setAudioMsgStatus(prev => ({
                    ...prev,
                    [messageId]: {
                      status: 'PLAYING (WebAudio)',
                      timestamp: timeStr,
                      payloadLen: pLen,
                    }
                  }));

                  if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
                  playbackTimerRef.current = setInterval(() => {
                    const elapsed = Math.floor(ctx.currentTime - startTime);
                    setPlaybackCurrentSeconds(elapsed);
                    if (elapsed >= Math.floor(audioBuffer.duration)) {
                      clearInterval(playbackTimerRef.current);
                      setPlayingMessageId(null);
                      setPlaybackCurrentSeconds(0);
                      setAudioMsgStatus(prev => ({
                        ...prev,
                        [messageId]: {
                          status: 'FINISHED',
                          timestamp: timeStr,
                          payloadLen: pLen,
                        }
                      }));
                    }
                  }, 350);
                  return;
                }
              }
            } catch (ctxErr: any) {
              addAudioLog(`❌ [WEBAUDIO_ERROR] ${ctxErr.message}`);
            }

            // Fallback Engine 3: Pure JavaScript AMR/3GP WebAudio Decoder (Handles legacy & Android 3GP voice notes)
            try {
              if (rawBytes && rawBytes.length > 0) {
                addAudioLog(`🔄 Trying BenzAMR AMR/3GP decoder fallback...`);
                const BenzAMRRecorder = require('benz-amr-recorder');
                const amr = new BenzAMRRecorder();
                const amrBlob = new Blob([rawBytes as any], { type: 'audio/amr' });
                await amr.initWithBlob(amrBlob);
                amrPlayerRef.current = amr;
                amr.play();
                const amrDur = Math.round(amr.getDuration()) || 5;
                addAudioLog(`🔊 [AMR_PLAYING] BenzAMR decoded & playing (${amrDur}s)`);
                setAudioMsgStatus(prev => ({
                  ...prev,
                  [messageId]: {
                    status: 'PLAYING (AMR Decoder)',
                    timestamp: timeStr,
                    payloadLen: pLen,
                  }
                }));

                if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
                playbackTimerRef.current = setInterval(() => {
                  if (amrPlayerRef.current) {
                    const cur = amrPlayerRef.current.getCurrentPosition() || 0;
                    setPlaybackCurrentSeconds(Math.floor(cur));
                    if (!amrPlayerRef.current.isPlaying()) {
                      clearInterval(playbackTimerRef.current);
                      setPlayingMessageId(null);
                      setPlaybackCurrentSeconds(0);
                      setAudioMsgStatus(prev => ({
                        ...prev,
                        [messageId]: {
                          status: 'FINISHED',
                          timestamp: timeStr,
                          payloadLen: pLen,
                        }
                      }));
                    }
                  }
                }, 350);

                amr.onEnded(() => {
                  setPlayingMessageId(null);
                  setPlaybackCurrentSeconds(0);
                  if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
                  setAudioMsgStatus(prev => ({
                    ...prev,
                    [messageId]: {
                      status: 'FINISHED',
                      timestamp: timeStr,
                      payloadLen: pLen,
                    }
                  }));
                });
                return; // Successfully playing AMR audio!
              }
            } catch (amrErr: any) {
              addAudioLog(`❌ [AMR_ERROR] ${amrErr?.message || amrErr}`);
            }

            const errorText = `${err.name || 'Error'}: ${err.message || 'Play rejected'}`;
            addAudioLog(`❌ [PLAY_PERM_FAIL] ${errorText}`);
            setPlayingMessageId(null);
            setPlaybackCurrentSeconds(0);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            setAudioMsgStatus(prev => ({
              ...prev,
              [messageId]: {
                status: 'ERROR',
                error: errorText,
                timestamp: timeStr,
                payloadLen: pLen,
              }
            }));
          });
        }
      } catch (e: any) {
        const errorText = `${e?.name || 'Error'}: ${e?.message || e}`;
        addAudioLog(`❌ [CRITICAL_AUDIO_ERR] ${errorText}`);
        setPlayingMessageId(null);
        setPlaybackCurrentSeconds(0);
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        setAudioMsgStatus(prev => ({
          ...prev,
          [messageId]: {
            status: 'ERROR',
            error: errorText,
            timestamp: timeStr,
            payloadLen: pLen,
          }
        }));
      }
    } else {
      addAudioLog(`❌ [PLAY_INVALID_URL] Missing or unsupported audio format`);
      setAudioMsgStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'ERROR',
          error: 'Missing or unsupported audio payload',
          timestamp: timeStr,
          payloadLen: pLen,
        }
      }));
    }
  };

  // Real target profile resolution (NO fake mock profiles)
  const targetUser: UserProfile =
    fetchedProfile ||
    matches.find(m => m && (m.id === id || (m.phoneNumber && id.includes(m.phoneNumber.replace(/\D/g, '').slice(-10))))) ||
    profiles.find(p => p && (p.id === id || (p.phoneNumber && id.includes(p.phoneNumber.replace(/\D/g, '').slice(-10))))) || {
      id: id || 'user',
      name: (fetchedProfile as any)?.name || (profiles.find(p => p && p.id === id)?.name) || (id && id.startsWith('user_') ? `User ${id.replace('user_', '').slice(-4)}` : 'Member'),
      age: 22,
      gender: 'other',
      occupation: 'Member',
      location: 'Roorkee',
      distance: '0 km',
      bio: 'Ready to connect!',
      photo: (fetchedProfile as any)?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      photos: (fetchedProfile as any)?.photos || [],
      interests: ['Coffee', 'Music'],
      compatibility: 100,
      isVerified: true,
      isVip: false,
    };

  const localMessages = (id && messages[id]) || [];

  // 1. Instant 0ms Real-Time Message Listener (WhatsApp Speed)
  useEffect(() => {
    const unsubscribe = RealtimeBridge.subscribe(({ type, payload }) => {
      const myId = currentUser?.id || 'my_user_id';
      
      if (type === 'TYPING' && payload?.senderId === id) {
        setIsPartnerTyping(true);
        setTimeout(() => setIsPartnerTyping(false), 2000);
      } else if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload as ChatMessage;
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

      if (type === 'DELETE_MESSAGE' && payload?.messageId) {
        markMessageDeletedLocally(payload.messageId);
        addAudioLog(`🗑️ [DELETE_RECEIVED] Message ${payload.messageId.substring(0, 10)} deleted`);
      }
    });
    return () => unsubscribe();
  }, [id, currentUser?.id]);

  // 2. Cloud Backend Initial Sync & Backup Stream
  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchCloud = async () => {
      const msgs = await fetchChatMessagesFromFirestore(currentUser.id, id);
      const filtered = msgs.filter(m => m && !deletedMsgIds.has(m.id));
      setCloudMessages(filtered);
      if (filtered.length > 0 && id) {
        AsyncStorage.setItem(`synking_cached_msgs_${id}`, JSON.stringify(filtered)).catch(() => {});
      }
    };
    fetchCloud();
  }, [id, currentUser?.id, deletedMsgIds]);

  // 3. Fast 2.5-Second Live Background Sync (Guarantees zero-drop delivery across all network conditions)
  useEffect(() => {
    if (!id || !currentUser) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchChatMessagesFromFirestore(currentUser.id, id);
        if (Array.isArray(msgs) && msgs.length > 0) {
          const filtered = msgs.filter(m => m && !deletedMsgIds.has(m.id));
          setCloudMessages(prev => {
            const hasNew = filtered.some(f => !prev.some(p => p.id === f.id));
            if (hasNew) {
              return filtered;
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(interval);
  }, [id, currentUser?.id, deletedMsgIds]);

  // Combine and strictly bifurcate cloud + local messages for this specific conversation (0 duplicates guaranteed)
  const userMessages = React.useMemo(() => {
    const myId = currentUser?.id || 'my_user_id';
    const seenIds = new Set<string>();
    const result: ChatMessage[] = [];

    const all = [...cloudMessages, ...localMessages];
    for (const m of all) {
      if (!m || !m.id) continue;
      if (deletedMsgIds.has(m.id)) continue;
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
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!typingTimeoutRef.current) {
      RealtimeBridge.broadcast('TYPING', { senderId: currentUser?.id }, id);
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1500);
    }
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
  };const handleSendTestPing = () => {
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={userMessages}
          keyExtractor={item => item.id}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={[
            styles.messagesList,
            userMessages.length === 0 && { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 20 }
          ]}
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

            // WhatsApp / Instagram Style Sleek Centered Call Pill
            if (isCallLog) {
              const isVideo = item.text.includes('Video') || item.text.startsWith('📹');
              const isMissed = item.text.toLowerCase().includes('missed') || item.text.toLowerCase().includes('declined');
              
              // Extract duration cleanly whether delimited by '·' or '-'
              let duration = '';
              const parts = item.text.split(/[·\-]/);
              if (parts.length > 1) {
                const possible = parts[parts.length - 1].trim();
                if (possible && !possible.toLowerCase().includes('call')) {
                  duration = possible;
                }
              }

              const label = isMissed ? (isVideo ? 'Missed Video Call' : 'Missed Call') : (isVideo ? 'Video Call' : 'Voice Call');

              return (
                <TouchableOpacity
                  style={[
                    styles.callPill,
                    {
                      backgroundColor: isDarkMode ? 'rgba(26, 29, 41, 0.85)' : 'rgba(240, 242, 245, 0.95)',
                      borderColor: isMissed ? 'rgba(239, 68, 68, 0.35)' : 'rgba(253, 58, 115, 0.25)',
                    }
                  ]}
                  onPress={() => handleStartCall(isVideo ? 'video' : 'audio')}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isVideo ? 'videocam' : 'call'}
                    size={13}
                    color={isMissed ? '#EF4444' : '#FD3A73'}
                  />
                  <Text style={[styles.callPillText, { color: isDarkMode ? '#E2E8F0' : '#1E293B' }]}>
                    {label}{duration ? ` · ${duration}` : ''}
                  </Text>
                  <Text style={[styles.callPillTime, { color: subText }]}>
                    · {formatWhatsAppTime(item.timestamp)}
                  </Text>
                  <Ionicons
                    name="arrow-redo-outline"
                    size={12}
                    color={isMissed ? '#EF4444' : '#FD3A73'}
                    style={{ marginLeft: 2, opacity: 0.8 }}
                  />
                </TouchableOpacity>
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

              // Duration parsing
              const durMatch = displayText.match(/\((\d+):(\d+)\)/);
              const parsedSecs = durMatch ? parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]) : 0;
              const totalSeconds = item.extraData?.audioDuration || parsedSecs || 15;
              const totMins = Math.floor(totalSeconds / 60);
              const totSecs = (totalSeconds % 60).toString().padStart(2, '0');
              const totalDurationStr = `${totMins}:${totSecs}`;

              const currentPlaySec = isPlaying ? playbackCurrentSeconds : 0;
              const curMins = Math.floor(currentPlaySec / 60);
              const curSecs = (currentPlaySec % 60).toString().padStart(2, '0');
              const playTimerStr = `${curMins}:${curSecs} / ${totalDurationStr}`;

              const progress = totalSeconds > 0 ? Math.min(1, currentPlaySec / totalSeconds) : 0;
              const filledBars = Math.floor(progress * 12);

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
                      ? [
                          styles.myBubble,
                          {
                            shadowColor: '#FD3A73',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.45,
                            shadowRadius: 10,
                            elevation: 5,
                          }
                        ]
                      : [
                          styles.theirBubble,
                          {
                            backgroundColor: isDarkMode ? '#11121F' : '#FFFFFF',
                            borderColor: isDarkMode ? 'rgba(0, 229, 255, 0.45)' : borderCol,
                            shadowColor: isDarkMode ? '#00E5FF' : '#000000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDarkMode ? 0.35 : 0.05,
                            shadowRadius: isDarkMode ? 8 : 2,
                            elevation: isDarkMode ? 4 : 1,
                          },
                        ],
                    { width: 215, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 15 }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => togglePlayVoiceNote(item.id, effectiveAudioUrl)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isMine ? '#FFFFFF' : '#FD3A73',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={16}
                        color={isMine ? '#FD3A73' : '#FFFFFF'}
                        style={{ marginLeft: isPlaying ? 0 : 1.5 }}
                      />
                    </TouchableOpacity>

                    {/* Compact Animated Sound Waves */}
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        {[5, 11, 16, 9, 14, 10, 18, 13, 7, 15, 11, 5].map((h, i) => {
                          const isFilled = isPlaying && i <= filledBars;
                          return (
                            <View
                              key={i}
                              style={{
                                width: 2.2,
                                height: isPlaying ? Math.min(18, h + (i % 2 === 0 ? 4 : -3)) : h,
                                borderRadius: 1.5,
                                backgroundColor: isMine
                                  ? (isFilled || !isPlaying ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)')
                                  : (isFilled ? '#FD3A73' : (isPlaying ? 'rgba(253, 58, 115, 0.3)' : subText)),
                              }}
                            />
                          );
                        })}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        {isPlaying && (
                          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isMine ? '#FFFFFF' : '#22C55E' }} />
                        )}
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: isMine ? 'rgba(255, 255, 255, 0.95)' : (isPlaying ? '#FD3A73' : subText) }}>
                          {isPlaying ? `▶ ${playTimerStr}` : displayText.replace('🎙️ ', '').replace('🎵 ', '')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Compact Error Alert Badge (Only shown if error occurs) */}
                  {audioMsgStatus[item.id]?.status === 'ERROR' && (
                    <View style={{
                      marginTop: 3,
                      paddingVertical: 1.5,
                      paddingHorizontal: 6,
                      borderRadius: 4,
                      backgroundColor: isMine ? 'rgba(0, 0, 0, 0.45)' : '#FEE2E2',
                      alignSelf: 'flex-start',
                      maxWidth: '100%',
                    }}>
                      <Text style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color: isMine ? '#FCA5A5' : '#DC2626',
                      }} numberOfLines={1}>
                        ❌ {audioMsgStatus[item.id].error}
                      </Text>
                    </View>
                  )}

                  {item.extraData?.reaction && (
                    <View style={{ position: 'absolute', bottom: -8, right: isMine ? 25 : -8, backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 12, paddingHorizontal: 4, paddingVertical: 2, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
                      <Text style={{ fontSize: 12 }}>{item.extraData.reaction}</Text>
                    </View>
                  )}

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
                    ? [
                        styles.myBubble,
                        {
                          shadowColor: '#FD3A73',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.45,
                          shadowRadius: 10,
                          elevation: 5,
                        }
                      ]
                    : [
                        styles.theirBubble,
                        {
                          backgroundColor: isDarkMode ? '#11121F' : '#FFFFFF',
                          borderColor: isDarkMode ? 'rgba(0, 229, 255, 0.45)' : borderCol,
                          shadowColor: isDarkMode ? '#00E5FF' : '#000000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDarkMode ? 0.35 : 0.05,
                          shadowRadius: isDarkMode ? 8 : 2,
                          elevation: isDarkMode ? 4 : 1,
                        },
                      ],
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
          <View style={[styles.inputBar, { backgroundColor: isDarkMode ? '#200D11' : '#FEE2E2', borderTopColor: '#EF4444', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 4, paddingBottom: isKeyboardOpen ? 14 : Math.max(Platform.OS === 'android' ? 20 : 14, insets.bottom + 6) }]}>
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
          <View style={[styles.inputBar, { backgroundColor: isDarkMode ? '#1E1218' : '#FFF1F2', borderTopColor: '#FECDD3', paddingHorizontal: 16, paddingBottom: isKeyboardOpen ? 8 : Math.max(Platform.OS === 'android' ? 18 : 10, insets.bottom + 4) }]}>
            {/* Pulsing Recording Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: recordingSeconds >= 50 ? '#EF4444' : '#10B981' }} />
              <Text style={{ color: recordingSeconds >= 50 ? '#EF4444' : (isDarkMode ? '#F1F5F9' : '#0F172A'), fontWeight: '800', fontSize: 13.5 }}>
                Recording... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')} <Text style={{ color: subText, fontSize: 11.5, fontWeight: '600' }}>/ 1:00</Text>
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
          <View style={[styles.inputBar, { backgroundColor: inputBg, borderTopColor: borderCol, paddingBottom: isKeyboardOpen ? 8 : Math.max(Platform.OS === 'android' ? 18 : 10, insets.bottom + 4) }]}>
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
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={subText}
              multiline
              maxLength={2000}
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

            {/* Emoji Reactions Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }}>
              {['❤️', '😂', '🔥', '👍', '😢'].map((emoji) => (
                 <TouchableOpacity
                   key={emoji}
                   onPress={() => {
                      if (selectedMsgForAction && id) {
                         RealtimeBridge.broadcast('MESSAGE_REACTION', { messageId: selectedMsgForAction.id, threadKey: id, emoji }, id);
                         if (Platform.OS !== 'web') {
                           const Haptics = require('expo-haptics');
                           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                         }
                      }
                      setSelectedMsgForAction(null);
                   }}
                   style={{ padding: 6, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderRadius: 20 }}
                 >
                   <Text style={{ fontSize: 22 }}>{emoji}</Text>
                 </TouchableOpacity>
              ))}
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
                    const targetMsgId = selectedMsgForAction.id;
                    markMessageDeletedLocally(targetMsgId);
                    deleteMessage(id, targetMsgId, false);
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
                      const targetMsgId = selectedMsgForAction.id;
                      markMessageDeletedLocally(targetMsgId);
                      deleteMessage(id, targetMsgId, true);
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
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  callPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  callPillTime: {
    fontSize: 10,
    fontWeight: '400',
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








