import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../contexts/AppContext';

interface HeaderProps {
  onOpenFilter?: () => void;
  hasActiveFilters?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFilter, hasActiveFilters }) => {
  const router = useRouter();
  const { currentLocation, refreshLocation, isDarkMode } = useApp();

  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const logoTextColor = isDarkMode ? '#FFFFFF' : '#111827';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={[
      styles.header,
      { backgroundColor: headerBg, borderBottomColor: isDarkMode ? 'rgba(253, 58, 115, 0.15)' : borderCol },
      isDarkMode && {
        shadowColor: '#FD3A73',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
      }
    ]}>
      {/* Brand: Official Glowing Logo + SYNKING */}
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/images/logo_emblem.png')}
          style={[
            styles.logoImg,
            isDarkMode && {
              shadowColor: '#FD3A73',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
            }
          ]}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { color: logoTextColor }]}>SYNKING</Text>
      </View>

      {/* Right: Discovery Filter + VIP Crown Actions */}
      <View style={styles.rightActions}>
        {onOpenFilter && (
          <TouchableOpacity
            style={[
              styles.iconBtn,
              hasActiveFilters && styles.filterBtnActive,
              { borderColor: hasActiveFilters ? '#FD3A73' : (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)') }
            ]}
            activeOpacity={0.7}
            onPress={onOpenFilter}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasActiveFilters ? '#FD3A73' : (isDarkMode ? '#FFFFFF' : '#0F172A')}
            />
            {hasActiveFilters && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.vipBtn,
            isDarkMode && {
              shadowColor: '#FBBF24',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 5,
            }
          ]}
          activeOpacity={0.7}
          onPress={() => router.push('/vip-membership')}
        >
          <MaterialCommunityIcons name="crown" size={17} color="#FBBF24" />
        </TouchableOpacity>
      </View>
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
    letterSpacing: 1.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
    borderColor: '#FD3A73',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FD3A73',
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
