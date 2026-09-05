import React from 'react';
import { View, StyleSheet, Image, Text, Platform } from 'react-native';
import { NativeRTCView } from '../services/webrtcCore';
import { CallSession } from '../types';

interface Props {
  session: CallSession;
  remoteStream: any;
}

/**
 * DedicatedPipView:
 * Isolated, 100% clean Picture-in-Picture window (WhatsApp & Google Meet style).
 * Completely separates PiP rendering from the full-screen call modal.
 * Contains ZERO control buttons, ZERO badges, ZERO headers, and ZERO floating cards.
 */
export const DedicatedPipView: React.FC<Props> = ({ session, remoteStream }) => {
  const isVideo = session.type === 'video' || session.isVideoEnabled;

  if (isVideo) {
    return (
      <View style={styles.container}>
        {Platform.OS !== 'web' && NativeRTCView && remoteStream ? (
          <NativeRTCView
            streamURL={typeof remoteStream.toURL === 'function' ? remoteStream.toURL() : remoteStream}
            style={styles.fullVideo}
            objectFit="cover"
            zOrder={0}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            {session.callerPhoto ? (
              <Image source={{ uri: session.callerPhoto }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, { backgroundColor: '#1E293B' }]} />
            )}
          </View>
        )}
      </View>
    );
  }

  // Pure Clean Voice Call PiP
  return (
    <View style={styles.container}>
      <View style={styles.voiceCenter}>
        {session.callerPhoto ? (
          <Image source={{ uri: session.callerPhoto }} style={styles.voiceAvatar} />
        ) : (
          <View style={[styles.voiceAvatar, { backgroundColor: '#1E293B' }]} />
        )}
        <Text style={styles.voiceName} numberOfLines={1}>
          {session.callerName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05060A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  placeholderContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05060A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  voiceCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  voiceAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#10B981',
    backgroundColor: '#1E293B',
  },
  voiceName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    marginTop: 6,
    textAlign: 'center',
  },
});
