import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AppProvider, useApp } from '../contexts/AppContext';
import { Colors } from '../constants/theme';

import { CallModal } from '../components/CallModal';
import { InAppNotificationBanner } from '../components/InAppNotificationBanner';
import { WebRTCService } from '../services/webrtcService';
import { CallSession } from '../types';

function GlobalCallOverlay() {
  const [activeCall, setActiveCall] = React.useState<CallSession | null>(null);
  const { sendMessage, currentUser } = useApp();

  React.useEffect(() => {
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
    });
    return () => unsubscribe();
  }, []);

  if (!activeCall) return null;

  const handleEndCall = () => {
    const result = WebRTCService.endCall();
    if (result && result.session && currentUser) {
      const { session, durationFormatted } = result;
      const targetId = session.callerUser?.id === currentUser.id ? session.targetUser?.id : session.callerUser?.id;
      if (targetId) {
        const callLogText =
          session.type === 'video'
            ? `📹 Video Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`
            : `📞 Voice Call · ${session.durationSeconds > 0 ? durationFormatted : 'Missed'}`;
        sendMessage(targetId, callLogText, 'call');
      }
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