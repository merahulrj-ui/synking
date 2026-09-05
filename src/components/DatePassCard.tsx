import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateBooking } from '../types';
import { useRouter } from 'expo-router';
import { useApp } from '../contexts/AppContext';

interface Props {
  booking: DateBooking;
}

export const DatePassCard: React.FC<Props> = ({ booking }) => {
  const router = useRouter();
  const { isDarkMode } = useApp();

  const cardBg = isDarkMode ? '#1E121B' : '#FFF1F2';
  const borderCol = isDarkMode ? 'rgba(253, 58, 115, 0.4)' : '#FECDD3';
  const textColor = isDarkMode ? '#FFFFFF' : '#881337';
  const metaColor = isDarkMode ? '#E2E8F0' : '#4C0519';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => router.push(`/date-pass/${booking.id}`)}
      style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="shield-checkmark" size={12} color="#FD3A73" />
          <Text style={styles.badge}>CONFIRMED DATE PASS</Text>
        </View>
        <Text style={styles.qrText}>{booking.qrCode}</Text>
      </View>

      <Text style={[styles.title, { color: textColor }]}>Date with {booking.userName}</Text>
      <Text style={[styles.venue, { color: metaColor }]}>📍 {booking.venue.name}</Text>
      <Text style={[styles.time, { color: metaColor }]}>⏰ {booking.dateTime}</Text>

      <View style={[styles.footer, { borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFE4E6' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="gift" size={13} color="#F59E0B" />
          <Text style={styles.perk}>Free Perk Included</Text>
        </View>
        <Text style={styles.viewPass}>View Pass →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 12,
    width: 290,
    padding: 16,
    gap: 6,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badge: {
    color: '#FD3A73',
    fontSize: 10,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 0.8,
  },
  qrText: {
    color: '#D97706',
    fontSize: 10.5,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
    letterSpacing: -0.3,
  },
  venue: {
    fontSize: 12.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  time: {
    fontSize: 12.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  perk: {
    color: '#D97706',
    fontSize: 11.5,
    fontFamily: 'Poppins_700Bold',
  },
  viewPass: {
    color: '#FD3A73',
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
  },
});
