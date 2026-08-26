import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, UserProfile } from '../types';

interface Props {
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  localCount: number;
  cloudCount: number;
  lastMessage?: ChatMessage;
  onForceSync: () => void;
  onSendTestPing: () => void;
}

export const ChatDebugger: React.FC<Props> = ({
  currentUserId,
  partnerId,
  partnerName,
  localCount,
  cloudCount,
  lastMessage,
  onForceSync,
  onSendTestPing,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {/* Mini Debugger Bar */}
      <TouchableOpacity
        style={styles.bar}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.leftRow}>
          <View style={styles.liveDot} />
          <Text style={styles.barTitle}>LIVE DEBUGGER</Text>
          <Text style={styles.idBadge}>{currentUserId} ➔ {partnerId}</Text>
        </View>

        <View style={styles.rightRow}>
          <Text style={styles.countText}>Cloud: {cloudCount} | Local: {localCount}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#00E5FF" />
        </View>
      </TouchableOpacity>

      {/* Expanded Debug Panel */}
      {expanded && (
        <View style={styles.expandedPanel}>
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Sender (Me):</Text>
              <Text style={styles.value}>{currentUserId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Receiver (Partner):</Text>
              <Text style={styles.value}>{partnerName} ({partnerId})</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Cloud Messages:</Text>
              <Text style={[styles.value, { color: '#22C55E' }]}>{cloudCount} retrieved</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Message:</Text>
              <Text style={styles.value} numberOfLines={1}>
                {lastMessage ? `[${lastMessage.senderId}]: "${lastMessage.text}"` : 'No messages yet'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={onForceSync} activeOpacity={0.8}>
                <Ionicons name="refresh" size={13} color="#FFF" />
                <Text style={styles.actionBtnText}>Force Cloud Sync</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A855F7' }]} onPress={onSendTestPing} activeOpacity={0.8}>
                <Ionicons name="paper-plane" size={13} color="#FFF" />
                <Text style={styles.actionBtnText}>Send Test Ping</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.3)',
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  barTitle: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  idBadge: {
    color: '#94A3B8',
    fontSize: 9.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '700',
  },
  expandedPanel: {
    padding: 10,
    backgroundColor: '#0A0F1D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
