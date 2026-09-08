import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, NativeModules } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { WebRTCService } from '../services/webrtcService';
import { CallSession } from '../types';

let NativeRTCView: any = null;
if (Platform.OS !== 'web') {
  try {
    const webrtc = require('react-native-webrtc');
    NativeRTCView = webrtc.RTCView;
  } catch (e) {}
}

interface Props {
  session: CallSession;
  onEndCall: () => void;
}

/**
 * 🎬 NativeFloatingPipContainer:
 * Completely separate, dedicated UI container for Android Native Picture-in-Picture mode.
 * Activates ONLY when the user presses the Home button during an active video call.
 * ZERO dialer UI • Pure Edge-to-Edge live video • Self corner preview • Minimalist controls.
 */
export const NativeFloatingPipContainer: React.FC<Props> = ({ session, onEndCall }) => {
  const [sec, setSec] = useState<number>(session.durationSeconds || 0);
  const [remoteStream, setRemoteStream] = useState<any>(() => WebRTCService.getRemoteStream());
  const [localStream, setLocalStream] = useState<any>(() => WebRTCService.getLocalStream());
  const webVideoRef = useRef<any>(null);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSec(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 💡 Keep Screen Awake during PiP mode
  useEffect(() => {
    activateKeepAwakeAsync('synkin_pip_screen').catch(() => {});
    if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.acquireScreenWakeLock) {
      NativeModules.CallWakeLockModule.acquireScreenWakeLock().catch(() => {});
    }
    return () => {
      deactivateKeepAwake('synkin_pip_screen').catch(() => {});
      if (Platform.OS === 'android' && NativeModules.CallWakeLockModule?.releaseScreenWakeLock) {
        NativeModules.CallWakeLockModule.releaseScreenWakeLock().catch(() => {});
      }
    };
  }, []);

  // Subscribe to live WebRTC stream updates
  useEffect(() => {
    const updateStreams = () => {
      setRemoteStream(WebRTCService.getRemoteStream());
      setLocalStream(WebRTCService.getLocalStream());
    };
    updateStreams();
    const unsub = WebRTCService.subscribe(updateStreams);
    const interval = setInterval(updateStreams, 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Web video stream fallback
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (remoteStream && webVideoRef.current && webVideoRef.current.srcObject !== remoteStream) {
      webVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const mins = Math.floor(sec / 60).toString().padStart(2, '0');
  const secs = (sec % 60).toString().padStart(2, '0');
  const durationText = `${mins}:${secs}`;

  const callerPhoto = session.callerPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';
  const partnerName = (session.callerName || 'Live').split(' ')[0];

  return (
    <View style={styles.pipRootContainer}>
      {/* 1. Main Fullscreen Remote Video (Fills 100% of PiP Window) */}
      <View style={styles.remoteVideoWrapper}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <video
            ref={webVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000000' }}
          />
        ) : NativeRTCView && remoteStream ? (
          <NativeRTCView
            streamURL={typeof remoteStream.toURL === 'function' ? remoteStream.toURL() : remoteStream}
            style={styles.nativeVideoSurface}
            objectFit="cover"
            zOrder={0}
            zOrderMediaOverlay={false}
          />
        ) : (
          <Image source={{ uri: callerPhoto }} style={styles.fallbackImage} resizeMode="cover" />
        )}
      </View>

      {/* 2. Tiny PiP Corner Self Camera Preview (Top Right) */}
      {Platform.OS !== 'web' && NativeRTCView && localStream && (
        <View style={styles.selfPipCorner}>
          <NativeRTCView
            streamURL={typeof localStream.toURL === 'function' ? localStream.toURL() : localStream}
            style={styles.selfVideoSurface}
            objectFit="cover"
            zOrder={1}
            zOrderMediaOverlay={true}
          />
        </View>
      )}

      {/* 3. Sleek Floating Header Badge (Top Left): Live Pulsing Dot + Timer + Name */}
      <View style={styles.topBadgeRow} pointerEvents="none">
        <View style={styles.livePill}>
          <View style={styles.pulseDot} />
          <Text style={styles.partnerNameText} numberOfLines={1}>
            {partnerName}
          </Text>
          <Text style={styles.timerText}>{durationText}</Text>
        </View>
      </View>

      {/* 4. Tiny Sleek Hangup Red Button (Bottom Right) */}
      <TouchableOpacity
        style={styles.hangupButton}
        onPress={onEndCall}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="call" size={15} color="#FFFFFF" style={styles.hangupIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pipRootContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 9999999,
  },
  remoteVideoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  nativeVideoSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
  },
  selfPipCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: '28%',
    height: '24%',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#000000',
    zIndex: 10,
    elevation: 6,
  },
  selfVideoSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  topBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  partnerNameText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    maxWidth: 55,
  },
  timerText: {
    color: '#86EFAC',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  hangupButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 30,
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
