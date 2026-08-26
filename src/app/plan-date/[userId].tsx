import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { GradientButton } from '../../components/GradientButton';
import { MOCK_PROFILES } from '../../constants/mockData';

const TIME_SLOTS = [
  '5:30 PM (Evening Coffee)',
  '7:00 PM (Dinner & Vibe)',
  '8:30 PM (Late Lounge)',
  '12:30 PM (Weekend Brunch)',
];

export default function PlanDateScreen() {
  const { userId, venueId } = useLocalSearchParams<{ userId: string; venueId?: string }>();
  const router = useRouter();
  const { matches, profiles, venues, bookDate, isDarkMode } = useApp();

  const targetUser =
    matches.find(m => m.id === userId) ||
    profiles.find(p => p.id === userId) ||
    MOCK_PROFILES[0];

  const [selectedVenue, setSelectedVenue] = useState(
    venues.find(v => v.id === venueId) || venues[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [splitType, setSplitType] = useState<'split_50_50' | 'i_treat'>('split_50_50');

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const handleConfirm = () => {
    if (!targetUser || !selectedVenue) return;

    const booking = bookDate({
      targetUser,
      venue: selectedVenue,
      dateTime: `Friday @ ${selectedSlot}`,
      splitType,
    });

    router.replace(`/date-pass/${booking.id}`);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/venues');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderCol }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sparkles" size={18} color="#FD3A73" />
          <Text style={[styles.title, { color: textColor }]}>Plan a Safe Public Date</Text>
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
        {/* Dating Partner */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: subText }]}>Dating Partner:</Text>
          <View style={[styles.userBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.userName, { color: textColor }]}>{targetUser?.name || 'Match'}</Text>
            <View style={styles.verifiedTag}>
              <Ionicons name="shield-checkmark" size={13} color="#0284C7" />
              <Text style={styles.userVerified}>Verified Profile</Text>
            </View>
          </View>
        </View>

        {/* Venue Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: subText }]}>Select Curated Public Venue:</Text>
          <View style={styles.venueList}>
            {venues.map(v => {
              const isSelected = selectedVenue.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.venueItem,
                    { backgroundColor: cardBg, borderColor: isSelected ? '#FD3A73' : borderCol },
                    isSelected && styles.venueItemActive,
                  ]}
                  onPress={() => setSelectedVenue(v)}
                  activeOpacity={0.8}
                >
                  <View style={styles.venueRow}>
                    <Text style={[styles.venueName, { color: textColor }]}>{v.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.venueRating}>{v.rating}</Text>
                    </View>
                  </View>
                  <Text style={[styles.venueMeta, { color: subText }]}>
                    📍 {v.address} · {v.priceForTwo}
                  </Text>
                  <View style={styles.perkBox}>
                    <Ionicons name="gift-outline" size={13} color="#FD3A73" />
                    <Text style={styles.venuePerk}>{v.perks}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: subText }]}>Schedule Slot (This Friday):</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map(slot => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotPill,
                    { backgroundColor: isSelected ? '#FD3A73' : cardBg, borderColor: isSelected ? '#FD3A73' : borderCol },
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.slotText,
                      { color: isSelected ? '#FFFFFF' : textColor },
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bill Preference */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: subText }]}>Bill Preference:</Text>
          <View style={styles.splitRow}>
            <TouchableOpacity
              style={[
                styles.splitBtn,
                { backgroundColor: splitType === 'split_50_50' ? '#FD3A73' : cardBg, borderColor: splitType === 'split_50_50' ? '#FD3A73' : borderCol },
              ]}
              onPress={() => setSplitType('split_50_50')}
              activeOpacity={0.8}
            >
              <Text style={[styles.splitBtnText, { color: splitType === 'split_50_50' ? '#FFFFFF' : textColor }]}>
                50-50 Split 🤝
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.splitBtn,
                { backgroundColor: splitType === 'i_treat' ? '#FD3A73' : cardBg, borderColor: splitType === 'i_treat' ? '#FD3A73' : borderCol },
              ]}
              onPress={() => setSplitType('i_treat')}
              activeOpacity={0.8}
            >
              <Text style={[styles.splitBtnText, { color: splitType === 'i_treat' ? '#FFFFFF' : textColor }]}>
                I'm Hosting 🍰
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <GradientButton
          title="Lock Date & Generate Safe Pass 🎟️"
          onPress={handleConfirm}
          style={{ marginVertical: 24 }}
        />
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
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  userBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userVerified: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
  },
  venueList: {
    gap: 10,
  },
  venueItem: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  venueItemActive: {
    borderWidth: 2,
  },
  venueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueName: {
    fontSize: 15,
    fontWeight: '800',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  venueRating: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  venueMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  perkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  venuePerk: {
    color: '#FD3A73',
    fontSize: 11.5,
    fontWeight: '700',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});