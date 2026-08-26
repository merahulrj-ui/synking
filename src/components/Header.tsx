import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../contexts/AppContext';

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentLocation, refreshLocation, isDarkMode } = useApp();

  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const logoTextColor = isDarkMode ? '#FFFFFF' : '#111827';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderCol }]}>
      {/* Brand: Official Glowing Logo + SYNKING */}
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/images/logo_emblem.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { color: logoTextColor }]}>SYNKING</Text>
      </View>

      {/* Right: VIP Crown Membership Action */}
      <TouchableOpacity
        style={styles.vipBtn}
        activeOpacity={0.7}
        onPress={() => router.push('/vip-membership')}
      >
        <Ionicons name="sparkles" size={15} color="#FBBF24" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#05060A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImg: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  vipBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
