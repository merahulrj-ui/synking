import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, NativeModules, StatusBar } from 'react-native';
import { CallModal } from './CallModal';
import { WebRTCService } from '../services/webrtcService';
import { CallSession } from '../types';
import '../services/telecomBridge';

/**
 * CallApp: Standalone Isolated Root Component for CallActivity.
 * Renders ONLY the incoming / live calling UI (CallModal).
 * Guaranteed 100% Dating Privacy: Zero tabs, zero chat histories, zero match profiles.
 */
export default function CallApp() {
  const [session, setSession] = useState<CallSession | null>(() => WebRTCService.getCurrentSession());

  useEffect(() => {
    const unsubscribe = WebRTCService.subscribe((newSession) => {
      setSession(newSession);
      if (!newSession && Platform.OS === 'android' && NativeModules.TelecomModule?.endCall) {
        NativeModules.TelecomModule.endCall().catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleEndCall = () => {
    WebRTCService.endCall();
    if (Platform.OS === 'android' && NativeModules.TelecomModule?.endCall) {
      NativeModules.TelecomModule.endCall().catch(() => {});
    }
  };

  const handleAcceptCall = () => {
    WebRTCService.acceptCall();
  };

  if (!session) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={false} barStyle="light-content" translucent backgroundColor="transparent" />
      <CallModal
        session={session}
        onEndCall={handleEndCall}
        onAcceptCall={handleAcceptCall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060A',
  },
});
