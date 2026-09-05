import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';

export interface DiscoveryFilter {
  maxDistanceKm: number; // e.g. 5, 15, 25, 50, 100, 9999 (Whole Country)
  gender: 'all' | 'female' | 'male';
  minAge: number;
  maxAge: number;
  verifiedOnly: boolean;
}

export const DEFAULT_DISCOVERY_FILTER: DiscoveryFilter = {
  maxDistanceKm: 9999,
  gender: 'all',
  minAge: 18,
  maxAge: 50,
  verifiedOnly: false,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  filter: DiscoveryFilter;
  onApply: (newFilter: DiscoveryFilter) => void;
  onReset: () => void;
}

const DISTANCE_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'All India 🇮🇳', value: 9999 },
];

const GENDER_OPTIONS: { label: string; value: 'all' | 'female' | 'male'; emoji: string }[] = [
  { label: 'Women', value: 'female', emoji: '👧' },
  { label: 'Men', value: 'male', emoji: '👦' },
  { label: 'Everyone', value: 'all', emoji: '🌟' },
];

const AGE_PRESETS = [
  { label: '18 - 25 (Gen Z 🔥)', min: 18, max: 25 },
  { label: '20 - 30 (Young Pros 💼)', min: 20, max: 30 },
  { label: '25 - 35 (Serious Dating 💍)', min: 25, max: 35 },
  { label: '18 - 50 (All Singles 🌍)', min: 18, max: 50 },
];

export const DiscoveryFilterModal: React.FC<Props> = ({
  visible,
  onClose,
  filter,
  onApply,
  onReset,
}) => {
  const { isDarkMode } = useApp();

  const [maxDistanceKm, setMaxDistanceKm] = useState(filter.maxDistanceKm);
  const [gender, setGender] = useState<'all' | 'female' | 'male'>(filter.gender);
  const [minAge, setMinAge] = useState(filter.minAge);
  const [maxAge, setMaxAge] = useState(filter.maxAge);
  const [verifiedOnly, setVerifiedOnly] = useState(filter.verifiedOnly);

  // Sync state when filter prop changes
  useEffect(() => {
    setMaxDistanceKm(filter.maxDistanceKm);
    setGender(filter.gender);
    setMinAge(filter.minAge);
    setMaxAge(filter.maxAge);
    setVerifiedOnly(filter.verifiedOnly);
  }, [filter, visible]);

  const handleApply = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    onApply({
      maxDistanceKm,
      gender,
      minAge,
      maxAge,
      verifiedOnly,
    });
    onClose();
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setMaxDistanceKm(DEFAULT_DISCOVERY_FILTER.maxDistanceKm);
    setGender(DEFAULT_DISCOVERY_FILTER.gender);
    setMinAge(DEFAULT_DISCOVERY_FILTER.minAge);
    setMaxAge(DEFAULT_DISCOVERY_FILTER.maxAge);
    setVerifiedOnly(DEFAULT_DISCOVERY_FILTER.verifiedOnly);
    onReset();
  };

  const bg = isDarkMode ? '#05060A' : '#F9FAFB';
  const cardBg = isDarkMode ? '#12131F' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: bg, borderColor: borderCol }]}>
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Discovery Filters</Text>
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* 1. MAXIMUM DISTANCE SECTION */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location" size={18} color="#FD3A73" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Maximum Distance</Text>
                </View>
                <Text style={styles.accentBadge}>
                  {maxDistanceKm >= 9999 ? 'Whole Country 🇮🇳' : `Within ${maxDistanceKm} km`}
                </Text>
              </View>

              <Text style={[styles.sectionHint, { color: subText }]}>
                Only discover singles within your chosen travel radius.
              </Text>

              <View style={styles.chipsRow}>
                {DISTANCE_OPTIONS.map(opt => {
                  const active = maxDistanceKm === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chip,
                        { borderColor: active ? '#FD3A73' : borderCol, backgroundColor: active ? 'rgba(253, 58, 115, 0.15)' : 'transparent' }
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setMaxDistanceKm(opt.value);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: active ? '#FD3A73' : textColor, fontFamily: active ? 'Poppins_700Bold' : 'Poppins_500Medium' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. INTERESTED IN (GENDER) */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="heart" size={18} color="#FD3A73" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Interested In</Text>
                </View>
                <Text style={styles.accentBadge}>
                  {gender === 'female' ? 'Women' : gender === 'male' ? 'Men' : 'Everyone'}
                </Text>
              </View>

              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(opt => {
                  const active = gender === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.genderBtn,
                        { borderColor: active ? '#00E5FF' : borderCol, backgroundColor: active ? 'rgba(0, 229, 255, 0.12)' : 'transparent' }
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setGender(opt.value);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 2 }}>{opt.emoji}</Text>
                      <Text style={[styles.genderLabel, { color: active ? '#00E5FF' : textColor, fontFamily: active ? 'Poppins_700Bold' : 'Poppins_500Medium' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. AGE RANGE SECTION */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar" size={18} color="#A855F7" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Age Range</Text>
                </View>
                <Text style={[styles.accentBadge, { color: '#A855F7', borderColor: 'rgba(168, 85, 247, 0.3)', backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                  {minAge} - {maxAge} yrs
                </Text>
              </View>

              {/* Age Presets */}
              <View style={styles.chipsRow}>
                {AGE_PRESETS.map((preset, idx) => {
                  const active = minAge === preset.min && maxAge === preset.max;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.chip,
                        { borderColor: active ? '#A855F7' : borderCol, backgroundColor: active ? 'rgba(168, 85, 247, 0.15)' : 'transparent' }
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setMinAge(preset.min);
                        setMaxAge(preset.max);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: active ? '#A855F7' : textColor, fontFamily: active ? 'Poppins_700Bold' : 'Poppins_500Medium' }]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Fine-Tuning Controls */}
              <View style={styles.fineTuneRow}>
                {/* Min Age Adjuster */}
                <View style={styles.tuneBox}>
                  <Text style={[styles.tuneLabel, { color: subText }]}>Minimum Age</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setMinAge(prev => Math.max(18, prev - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={[styles.counterValue, { color: textColor }]}>{minAge}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setMinAge(prev => Math.min(maxAge - 1, prev + 1))}
                    >
                      <Ionicons name="add" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Max Age Adjuster */}
                <View style={styles.tuneBox}>
                  <Text style={[styles.tuneLabel, { color: subText }]}>Maximum Age</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setMaxAge(prev => Math.max(minAge + 1, prev - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={[styles.counterValue, { color: textColor }]}>{maxAge}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => setMaxAge(prev => Math.min(70, prev + 1))}
                    >
                      <Ionicons name="add" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. VERIFIED PROFILES ONLY */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.toggleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.shieldIconBox}>
                    <Ionicons name="shield-checkmark" size={20} color="#00E5FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Verified Only 🛡️</Text>
                    <Text style={[styles.sectionHint, { color: subText, marginTop: 2 }]}>
                      Only show profiles who completed photo verification.
                    </Text>
                  </View>
                </View>

                <Switch
                  value={verifiedOnly}
                  onValueChange={val => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setVerifiedOnly(val);
                  }}
                  trackColor={{ false: '#334155', true: '#FD3A73' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.applyBtnText}>Apply Preferences ✨</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resetBtn: {
    padding: 6,
  },
  resetText: {
    color: '#FD3A73',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 15,
  },
  accentBadge: {
    color: '#FD3A73',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    borderColor: 'rgba(253, 58, 115, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  genderLabel: {
    fontSize: 12,
  },
  fineTuneRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tuneBox: {
    flex: 1,
    gap: 6,
  },
  tuneLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 6,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FD3A73',
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
