import '../services/telecomBridge';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, NativeModules, TouchableOpacity, Text, Animated, PanResponder, Dimensions, Image, DeviceEventEmitter } from 'react-native';
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

const pipStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 118,
    height: 168,
    borderRadius: 16,
    zIndex: 9999999,
    elevation: 9999999,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#22C55E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  innerTouch: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#000000',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  topOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
  },
  expandBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 4,
    borderRadius: 8,
  },
  hangupBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    zIndex: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'Poppins_800ExtraBold',
  },
});

function FloatingVideoPiP({
  session,
  onExpand,
  onEndCall,
}: {
  session: CallSession;
  onExpand: () => void;
  onEndCall: () => void;
}) {
  const [sec, setSec] = React.useState(session.durationSeconds || 0);
  const videoRef = React.useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;

  // Draggable PanResponder
  const pan = React.useRef(new Animated.ValueXY({ x: screenWidth - 134, y: 70 })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Live Timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSec(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Video Stream Attacher
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const attach = () => {
      const stream = WebRTCService.getRemoteStream();
      if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
      }
    };
    attach();
    const interval = setInterval(attach, 500);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(sec / 60).toString().padStart(2, '0');
  const secs = (sec % 60).toString().padStart(2, '0');
  const durStr = `${mins}:${secs}`;
  const remoteStream = WebRTCService.getRemoteStream();

  return (
    <Animated.View
      style={[
        pipStyles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={pipStyles.innerTouch}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        {/* Remote Video Surface */}
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 14,
              backgroundColor: '#000000',
            }}
          />
        ) : NativeRTCView && remoteStream ? (
          <NativeRTCView
            streamURL={typeof remoteStream.toURL === 'function' ? remoteStream.toURL() : remoteStream}
            style={pipStyles.nativeVideo}
            objectFit="cover"
            zOrder={9999}
          />
        ) : (
          <Image
            source={{ uri: session.callerPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' }}
            style={pipStyles.fallbackImage}
          />
        )}

        {/* Top Badges: Maximize / Return */}
        <View style={pipStyles.topOverlay} pointerEvents="none">
          <View style={pipStyles.expandBadge}>
            <Ionicons name="expand" size={11} color="#FFFFFF" />
          </View>
        </View>

        {/* Hangup Red Button (Top-Right) */}
        <TouchableOpacity
          style={pipStyles.hangupBtn}
          onPress={(e) => {
            e.stopPropagation();
            onEndCall();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="call" size={11} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>

        {/* Bottom Bar: Live Timer & Partner Name */}
        <View style={pipStyles.bottomOverlay} pointerEvents="none">
          <View style={pipStyles.dot} />
          <Text style={pipStyles.timerText}>{durStr}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

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
          onPress={onEndCall}
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
  const [isMinimized, setIsMinimized] = React.useState<boolean>(false);
  const { sendMessage, currentUser } = useApp();
  const router = useRouter();

  React.useEffect(() => {
    const chatSub = DeviceEventEmitter.addListener('onOpenChatRequested', (event: any) => {
      const partnerId = event?.partnerId;
      if (partnerId) {
        console.log('[GlobalCallOverlay] 💬 onOpenChatRequested received for partnerId:', partnerId);
        setIsMinimized(true);
        router.push(`/chat/${partnerId}`);
      }
    });
    return () => {
      chatSub.remove();
    };
  }, []);

  React.useEffect(() => {
    // Pure UI Observer: listens to WebRTC session state changes
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
      if (!session) {
        setIsMinimized(false);
      } else if (session.status === 'rejected' || session.status === 'ended') {
        setIsMinimized(false);
      } else if (session.status === 'connected') {
        if (Platform.OS === 'android') {
          if (NativeModules.TelecomModule?.startOngoingCall) {
            NativeModules.TelecomModule.startOngoingCall(session.callerName || 'Synkin Call').catch(() => {});
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
        sendMessage(targetId, callLogText, 'text');
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
    const partnerId = activeCall.callerId === currentUser?.id ? activeCall.receiverId : activeCall.callerId;
    if (Platform.OS === 'android' && NativeModules.TelecomModule?.openChatFromCall && partnerId) {
      NativeModules.TelecomModule.openChatFromCall(partnerId).catch(() => {});
    }
    setIsMinimized(true);
    if (partnerId && currentUser) {
      router.push(`/chat/${partnerId}`);
    }
  };

  if (isMinimized) {
    const isVideo = activeCall.type === 'video' || activeCall.isVideoEnabled;
    if (isVideo) {
      return (
        <FloatingVideoPiP
          session={activeCall}
          onExpand={() => setIsMinimized(false)}
          onEndCall={handleEndCall}
        />
      );
    }
    return (
      <FloatingInCallPill
        session={activeCall}
        onExpand={() => setIsMinimized(false)}
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
    // 1. Register Telecom Phone Account for Lockscreen / VoIP & Request VoIP Permissions
    if (Platform.OS === 'android') {
      if (NativeModules.TelecomModule?.registerPhoneAccount) {
        NativeModules.TelecomModule.registerPhoneAccount().catch((e: any) => console.log('Telecom Register Error:', e));
      }
      if (NativeModules.TelecomModule?.requestVoipPermissions) {
        NativeModules.TelecomModule.requestVoipPermissions().catch(() => {});
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
      <StatusBar style="auto" />
      <View style={styles.outerContainer}>
        <View style={styles.mobileFrame}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
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
    backgroundColor: '#05060A',
    overflow: 'hidden',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
