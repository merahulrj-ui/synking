import '../services/telecomBridge';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, NativeModules, TouchableOpacity, Text, Animated, PanResponder, Dimensions, Image, DeviceEventEmitter, StatusBar as RNStatusBar, AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { AppProvider, useApp } from '../contexts/AppContext';
import { Colors } from '../constants/theme';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black } from '@expo-google-fonts/poppins';

import { CallModal } from '../components/CallModal';
import { InAppNotificationBanner } from '../components/InAppNotificationBanner';
import { WebRTCService } from '../services/webrtcService';
import { NativeRTCView } from '../services/webrtcCore';
import { CallSession } from '../types';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeBridge } from '../services/realtimeBridge';


// --- USER REGISTRATION ON BOOT ---
// Ensures user is registered with RealtimeBridge for live chat and notifications
setTimeout(async () => {
  try {
    const stored = await AsyncStorage.getItem('synking_my_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) {
        RealtimeBridge.registerUser(parsed.id);
        WebRTCService.log('[BOOT] Registered user: ' + parsed.id);
      }
    }
  } catch (e) {
    console.warn('User registration boot error:', e);
  }
}, 500);

const floatingPillStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 44,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#22C55E',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  nameText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    maxWidth: 90,
  },
  timeText: {
    color: '#86EFAC',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  tapText: {
    color: '#94A3B8',
    fontSize: 10,
    fontStyle: 'italic',
  },
  endBtn: {
    backgroundColor: '#EF4444',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});




function FloatingInCallPill({
  session,
  onExpand,
  onEndCall,
}: {
  session: CallSession;
  onExpand: () => void;
  onEndCall: () => void;
}) {
  const [sec, setSec] = React.useState(session.durationSeconds || 0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSec(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(sec / 60).toString().padStart(2, '0');
  const secs = (sec % 60).toString().padStart(2, '0');
  const durStr = `${mins}:${secs}`;
  const isVideo = session.type === 'video' || session.isVideoEnabled;

  return (
    <View style={floatingPillStyles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={floatingPillStyles.pill}
        onPress={onExpand}
        activeOpacity={0.85}
      >
        <View style={floatingPillStyles.pulseDot} />
        <Ionicons name={isVideo ? 'videocam' : 'call'} size={14} color="#22C55E" />
        <Text style={floatingPillStyles.nameText} numberOfLines={1}>
          {session.callerName || 'In Call'}
        </Text>
        <Text style={floatingPillStyles.timeText}>{durStr}</Text>
        <Text style={floatingPillStyles.tapText}>Tap to return</Text>

        <TouchableOpacity
          style={floatingPillStyles.endBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onEndCall();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="call" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

function GlobalCallOverlay() {
  const [activeCall, setActiveCall] = React.useState<CallSession | null>(null);
  const [isMinimized, setIsMinimized] = React.useState<boolean>(() => WebRTCService.getIsMinimized());
  const { sendMessage, currentUser } = useApp();
  const router = useRouter();

  const lastChatNavTimeRef = React.useRef<number>(0);

  const navigateToChat = React.useCallback((partnerId: string) => {
    const now = Date.now();
    if (now - lastChatNavTimeRef.current < 1500) {
      console.log('[GlobalCallOverlay] 🛑 Debouncing duplicate chat navigation for partnerId:', partnerId);
      return;
    }
    lastChatNavTimeRef.current = now;
    WebRTCService.setMinimized(true);
    setIsMinimized(true);
    router.push(`/chat/${partnerId}`);
  }, [router]);

  React.useEffect(() => {
    const chatSub = DeviceEventEmitter.addListener('onOpenChatRequested', (event: any) => {
      const partnerId = event?.partnerId;
      if (partnerId) {
        console.log('[GlobalCallOverlay] 💬 onOpenChatRequested received for partnerId:', partnerId);
        navigateToChat(partnerId);
      }
    });
    return () => {
      chatSub.remove();
    };
  }, [navigateToChat]);

  React.useEffect(() => {
    const target = WebRTCService.getTargetChatUserId();
    if (target) {
      WebRTCService.setTargetChatUserId(null);
      navigateToChat(target);
    }
  }, [isMinimized, activeCall, navigateToChat]);

  // 💡 Keep Screen Awake as long as any call is active (foreground + background native WakeLock)
  React.useEffect(() => {
    const isCallActive = activeCall && (
      activeCall.status === 'calling' || 
      activeCall.status === 'ringing' || 
      activeCall.status === 'connected'
    );
    if (isCallActive) {
      activateKeepAwakeAsync('synkin_global_call').catch(() => {});
      if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.acquireScreenWakeLock) {
        NativeModules.CallWakeLockModule.acquireScreenWakeLock().catch(() => {});
      }

      // Also handle background: reactivate when app comes back to foreground during call
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          activateKeepAwakeAsync('synkin_global_call').catch(() => {});
        }
      });
      return () => {
        subscription.remove();
        deactivateKeepAwake('synkin_global_call').catch(() => {});
        if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.releaseScreenWakeLock) {
          NativeModules.CallWakeLockModule.releaseScreenWakeLock().catch(() => {});
        }
      };
    } else {
      deactivateKeepAwake('synkin_global_call').catch(() => {});
      if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.releaseScreenWakeLock) {
        NativeModules.CallWakeLockModule.releaseScreenWakeLock().catch(() => {});
      }
    }
    return () => {
      deactivateKeepAwake('synkin_global_call').catch(() => {});
      if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.releaseScreenWakeLock) {
        NativeModules.CallWakeLockModule.releaseScreenWakeLock().catch(() => {});
      }
    };
  }, [activeCall?.status]);


  const hasStartedOngoingCallRef = React.useRef<boolean>(false);


  React.useEffect(() => {
    // Pure UI Observer: listens to WebRTC session state changes
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
      if (!session) {
        setIsMinimized(false);
        hasStartedOngoingCallRef.current = false;
        // Tell native: no active call, disable auto-PiP on Home press
        if (Platform.OS === 'android' && NativeModules.TelecomModule?.setVideoCallActive) {
          NativeModules.TelecomModule.setVideoCallActive(false).catch(() => {});
        }
      } else if (session.status === 'rejected' || session.status === 'ended') {
        setIsMinimized(false);
        hasStartedOngoingCallRef.current = false;
        if (Platform.OS === 'android' && NativeModules.TelecomModule?.setVideoCallActive) {
          NativeModules.TelecomModule.setVideoCallActive(false).catch(() => {});
        }
      } else {
        setIsMinimized(WebRTCService.getIsMinimized());
        if (session.status === 'connected') {
          // Tell native: video call active, auto-enter PiP on Home press
          const isVideo = session.type === 'video' || session.isVideoEnabled;
          if (Platform.OS === 'android' && NativeModules.TelecomModule?.setVideoCallActive) {
            NativeModules.TelecomModule.setVideoCallActive(!!isVideo).catch(() => {});
          }
          if (!hasStartedOngoingCallRef.current) {
            hasStartedOngoingCallRef.current = true;
            if (Platform.OS === 'android' && NativeModules.TelecomModule?.startOngoingCall) {
              const photo = session.callerPhoto || '';
              if (NativeModules.TelecomModule.startOngoingCallWithDetails) {
                NativeModules.TelecomModule.startOngoingCallWithDetails(session.callerName || 'Synkin Call', photo, !!isVideo).catch(() => {});
              } else {
                NativeModules.TelecomModule.startOngoingCall(session.callerName || 'Synkin Call').catch(() => {});
              }
            }
          }
        } else {
          hasStartedOngoingCallRef.current = false;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('CALL_TIMEOUT_NO_ANSWER', ({ session }) => {
      if (!session || !currentUser) return;
      const targetId = session.callerId === currentUser.id ? session.receiverId : session.callerId;
      if (targetId) {
        const isVideo = session.type === 'video' || session.isVideoEnabled;
        const isCaller = session.callerId === currentUser.id;
        const msgText = isVideo ? '📹 Missed Video Call' : '📞 Missed Call';
        sendMessage(targetId, msgText, 'call', {
          callType: isVideo ? 'video' : 'audio',
          callDuration: '00:00',
          callStatus: 'missed',
        });
        if (isCaller && Platform.OS !== 'web') {
          Alert.alert('No Answer', `${session.callerName || 'User'} is currently unavailable.`);
        }
      }
    });
    return () => sub.remove();
  }, [currentUser]);

  if (!activeCall) return null;

  const handleEndCall = () => {
    setIsMinimized(false);
    const result = WebRTCService.endCall();
    if (result && result.session && currentUser) {
      const { session, durationFormatted } = result;
      const targetId = session.callerId === currentUser.id ? session.receiverId : session.callerId;
      if (targetId) {
        const isConnected = session.status === 'connected' || session.durationSeconds > 0;
        const durText = session.durationSeconds > 0
          ? durationFormatted
          : isConnected
          ? '00:01'
          : session.status === 'rejected'
          ? 'Declined'
          : 'Missed';
        const callLogText =
          session.type === 'video'
            ? `📹 Video Call · ${durText}`
            : `📞 Voice Call · ${durText}`;
        sendMessage(targetId, callLogText, 'call', {
          callType: session.type === 'video' ? 'video' : 'audio',
          callDuration: durText,
          callStatus: isConnected ? 'completed' : session.status === 'rejected' ? 'declined' : 'missed',
        });
      }
    }
    // Always notify native TelecomModule to end call & finish lockscreen task if needed
    if (Platform.OS === 'android') {
      if (NativeModules.TelecomModule?.endCall) {
        NativeModules.TelecomModule.endCall().catch(() => {});
      }
    }
  };

  const handleMinimizeToChat = () => {
    if (!activeCall) return;
    const isVideo = activeCall.type === 'video' || activeCall.isVideoEnabled;
    const partnerId = activeCall.callerId === currentUser?.id ? activeCall.receiverId : activeCall.callerId;
    if (partnerId && currentUser) {
      navigateToChat(partnerId);
    }
    if (Platform.OS === 'android' && isVideo && NativeModules.TelecomModule?.enterPipMode) {
      // Always use native Android PiP for video calls — no JS floating PiP needed
      NativeModules.TelecomModule.enterPipMode().catch(() => {});
      setIsMinimized(false);
      WebRTCService.setMinimized(false);
    } else if (!isVideo) {
      // Audio-only calls: show the in-call pill
      WebRTCService.setMinimized(true);
      setIsMinimized(true);
    }
  };

  if (isMinimized) {
    // Audio-only minimized call: show floating pill (video uses native Android PiP)
    return (
      <FloatingInCallPill
        session={activeCall}
        onExpand={() => {
          WebRTCService.setMinimized(false);
          setIsMinimized(false);
        }}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <CallModal
      session={activeCall}
      onEndCall={handleEndCall}
      onMinimize={handleMinimizeToChat}
      onAcceptCall={() => WebRTCService.acceptCall()}
      onToggleMute={() => WebRTCService.toggleMute()}
      onToggleVideo={() => WebRTCService.toggleVideo()}
      onToggleSpeaker={() => WebRTCService.toggleSpeaker()}
    />
  );
}

function RootLayoutContent() {
  const { isDarkMode } = useApp();

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        RNStatusBar.setBackgroundColor(isDarkMode ? '#000000' : '#FFFFFF', true);
        RNStatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
      } catch (e) {}
    }
  }, [isDarkMode]);

  return (
    <>
      <RNStatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
        translucent={false}
      />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.outerContainer, { backgroundColor: isDarkMode ? '#000000' : '#F8FAFC' }]}>
        <View style={[styles.mobileFrame, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDarkMode ? '#000000' : '#F8FAFC' },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="vip-membership"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="verify-selfie"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="chat/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="plan-date/[userId]"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="date-pass/[bookingId]"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="feedback/[bookingId]"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <GlobalCallOverlay />
          <InAppNotificationBanner />
        </View>
      </View>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    // 1. Register Telecom Phone Account for Lockscreen / VoIP
    if (Platform.OS === 'android') {
      if (NativeModules.TelecomModule?.registerPhoneAccount) {
        NativeModules.TelecomModule.registerPhoneAccount().catch((e: any) => console.log('Telecom Register Error:', e));
      }
    }

    async function checkOTA() {
      if (__DEV__) return;
      try {
        if (Updates && Updates.isEnabled && typeof Updates.checkForUpdateAsync === 'function') {
          const update = await Updates.checkForUpdateAsync().catch(() => null);
          if (update && update.isAvailable) {
            await Updates.fetchUpdateAsync().catch(() => null);
            await Updates.reloadAsync().catch(() => null);
          }
        }
      } catch (e) {}
    }
    checkOTA();

    // Web Font Injection: Ensure Poppins is immediately active across all web browsers
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'poppins-web-font';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <AppProvider>
      <RootLayoutContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
