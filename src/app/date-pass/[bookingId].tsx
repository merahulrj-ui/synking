import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { GradientButton } from '../../components/GradientButton';

export default function DatePassScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { activeBookings, isDarkMode } = useApp();

  const booking = activeBookings.find(b => b.id === bookingId) || activeBookings[0];

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  if (!booking) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
        <Text style={{ color: textColor, padding: 20 }}>No active pass found.</Text>
      </SafeAreaView>
    );
  }

  const handleShareDate = async () => {
    try {
      const message = `✨ SYNKING Date Details:\n\nHey! I'm meeting ${booking.userName} for a date planned on SYNKING.\n📍 Venue: ${booking.venue.name} (${booking.venue.address})\n⏰ Time: ${booking.dateTime}\n🎟️ Pass: ${booking.qrCode}\n🛡️ (Verified Safe Partner)`;
      await Share.share({ message });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/matches');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderCol }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="ticket" size={20} color="#FD3A73" />
          <Text style={[styles.headerTitle, { color: textColor }]}>SYNKING Date Pass</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.passCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={styles.passEmoji}>🎟️</Text>
          <Text style={styles.passStatus}>PROTECTED & CONFIRMED</Text>

          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>DATE PARTNER:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{booking.userName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>PUBLIC VENUE:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{booking.venue.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>ADDRESS:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{booking.venue.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>SCHEDULE:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{booking.dateTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>BILL TYPE:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {booking.splitType === 'split_50_50' ? '50-50 Split 🤝' : "Host's Treat 🍰"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subText }]}>EXCLUSIVE PERK:</Text>
              <Text style={[styles.detailValue, { color: '#F59E0B' }]}>
                {booking.venue.perks}
              </Text>
            </View>

            {/* QR Pass Box */}
            <View style={[styles.qrContainer, { backgroundColor: isDarkMode ? '#1A1B28' : '#F1F5F9', borderColor: borderCol }]}>
              <View style={styles.qrBox}>
                <Text style={styles.qrCodeText}>{booking.qrCode}</Text>
              </View>
              <Text style={[styles.qrHelpText, { color: subText }]}>
                Show this pass at venue counter for table & dessert perk.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnStack}>
          <GradientButton
            title="Share Date Details 📤"
            onPress={handleShareDate}
          />

          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: cardBg, borderColor: borderCol }]}
            onPress={() => router.push(`/feedback/${booking.id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbox-ellipses-outline" size={16} color="#FD3A73" />
            <Text style={[styles.feedbackBtnText, { color: textColor }]}>Leave Post-Date Feedback ⭐</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  passCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  passStatus: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  ticketDetails: {
    width: '100%',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: '38%',
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '800',
    width: '60%',
    textAlign: 'right',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  qrBox: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  qrCodeText: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  qrHelpText: {
    fontSize: 11,
    textAlign: 'center',
  },
  btnStack: {
    gap: 10,
    marginVertical: 20,
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  feedbackBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});