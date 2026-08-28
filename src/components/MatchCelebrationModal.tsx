import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../types';
import { useRouter } from 'expo-router';

interface Props {
  matchedUser: UserProfile | null;
  onClose: () => void;
}

export const MatchCelebrationModal: React.FC<Props> = ({ matchedUser, onClose }) => {
  const router = useRouter();
  if (!matchedUser) return null;

  const handleStartChat = () => {
    const targetId = matchedUser.id;
    onClose();
    router.push(`/chat/${targetId}`);
  };

  return (
    <Modal visible={!!matchedUser} animationType="fade" transparent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1E1017', '#0F172A', '#05060A']}
          style={styles.card}
        >
          <View style={styles.sparkleIconBox}>
            <Ionicons name="heart" size={32} color="#FD3A73" />
          </View>

          <Text style={styles.tagBadge}>IT'S A SYNK! 💖</Text>
          <Text style={styles.title}>Request Accepted!</Text>

          <View style={styles.avatarWrapper}>
            <View style={styles.pulseRing} />
            <Image
              source={{ uri: matchedUser.photo || matchedUser.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.userName}>{matchedUser.name}, {matchedUser.age}</Text>
          <Text style={styles.userLocation}>📍 {typeof (matchedUser.location as any) === 'object' ? ((matchedUser.location as any)?.city || 'Roorkee') : (matchedUser.location || 'Roorkee')} • {matchedUser.occupation}</Text>

          <View style={styles.noticeBox}>
            <Ionicons name="lock-closed" size={14} color="#22C55E" />
            <Text style={styles.noticeText}>
              {matchedUser.name} accepted your request! Your 1-on-1 Encrypted chat is now unlocked.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleStartChat} activeOpacity={0.85}>
              <Ionicons name="chatbubbles" size={18} color="#FFF" />
              <Text style={styles.chatBtnText}>Start Chatting Now 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.dismissBtnText}>Later</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(253, 58, 115, 0.4)',
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  sparkleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tagBadge: {
    color: '#FD3A73',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#FD3A73',
  },
  pulseRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(253, 58, 115, 0.5)',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  userLocation: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '500',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginVertical: 6,
  },
  noticeText: {
    color: '#4ADE80',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FD3A73',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },
  dismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});
