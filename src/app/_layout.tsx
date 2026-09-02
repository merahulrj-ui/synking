import '../services/telecomBridge';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Alert, NativeModules } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AppProvider, useApp } from '../contexts/AppContext';
import { Colors } from '../constants/theme';

import { CallModal } from '../components/CallModal';
import { InAppNotificationBanner } from '../components/InAppNotificationBanner';
import { WebRTCService } from '../services/webrtcService';
import { CallSession } from '../types';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeBridge } from '../services/realtimeBridge';
import { getPendingCall, clearPendingCall } from '../services/CallIntentService';


// --- HEADLESS BOOTER FOR KILLED STATE WAKEUP ---
// This runs immediately when JS boots (even in background without UI)
setTimeout(async () => {
  try {
    const stored = await AsyncStorage.getItem('synking_my_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) {
        RealtimeBridge.registerUser(parsed.id);
        WebRTCService.log('[HEADLESS_BOOT] Registered user: ' + parsed.id);
        
        // 1. Check Native PendingCallStore
        let pending = null;
        if (Platform.OS === 'android' && NativeModules.TelecomModule?.getPendingIncomingCall) {
          try {
            pending = await NativeModules.TelecomModule.getPendingIncomingCall();
          } catch (e) {}
        }
        if (!pending) {
          pending = await getPendingCall();
        }

        if (pending && pending.callId) {
          WebRTCService.log("[HEADLESS_BOOT] WOKE UP FOR CALL: " + pending.callId);
          const shouldAutoAccept = !!(pending as any).autoAccept;
          WebRTCService.receiveIncomingCall(
            {
              id: pending.callerId || 'caller',
              name: pending.callerName || 'Caller',
              age: 22,
              gender: 'other',
              occupation: '',
              location: '',
              distance: '',
              bio: '',
              photo: pending.callerPhoto || 'https://via.placeholder.com/150',
              photos: [],
              interests: [],
              compatibility: 100,
              isVerified: true,
              isVip: false,
            },
            (pending.callType || 'audio') as any,
            pending.callId,
            shouldAutoAccept
          );
          if (shouldAutoAccept) {
            await WebRTCService.acceptCall(pending.callId);
          }
          if (Platform.OS === 'android' && NativeModules.TelecomModule?.notifyBridgedToJs) {
            NativeModules.TelecomModule.notifyBridgedToJs(pending.callId).catch(() => {});
          }
          clearPendingCall();
        }
      }
    }
  } catch (e) {
    console.warn('Headless boot error:', e);
  }
}, 500); // Slight delay to let WebRTCService initialize fully


function GlobalCallOverlay() {
  const [activeCall, setActiveCall] = React.useState<CallSession | null>(null);
  const { sendMessage, currentUser } = useApp();

  React.useEffect(() => {
    // Pure UI Observer: listens to WebRTC session state changes
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isIncomingRinging = activeCall?.status === 'ringing';
  const isIncoming = activeCall ? activeCall.callerId !== currentUser?.id : false;

  React.useEffect(() => {
    // Single Unified Dialer: CallModal handles both in-app and lockscreen calls.
    // No more launching IncomingCallActivity!
  }, [isIncoming, isIncomingRinging, activeCall?.id]);

  if (!activeCall) return null;

  const handleEndCall = () => {
    const result = WebRTCService.endCall();
    if (result && result.session && currentUser) {
      const { session, durationFormatted } = result;
      const targetId = session.callerId === currentUser.id ? session.receiverId : session.callerId;
      if (targetId) {
        const callLogText =
          session.type === 'video'
            ? `📹 Video Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`
            : `📞 Voice Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`;
        sendMessage(targetId, callLogText, 'text');
      }
    }
    // Always notify native TelecomModule to end call & finish lockscreen task if needed
    if (Platform.OS === 'android' && NativeModules.TelecomModule?.endCall) {
      NativeModules.TelecomModule.endCall().catch(() => {});
    }
  };

  return (
    <CallModal
      session={activeCall}
      onEndCall={handleEndCall}
      onAcceptCall={() => WebRTCService.acceptCall()}
      onToggleMute={() => WebRTCService.toggleMute()}
      onToggleVideo={() => WebRTCService.toggleVideo()}
      onToggleSpeaker={() => WebRTCService.toggleSpeaker()}
    />
  );
}

export default function RootLayout() {
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
