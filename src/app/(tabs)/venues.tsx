import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { VenueCard } from '../../components/VenueCard';
import { Venue } from '../../types';
import { useRouter } from 'expo-router';

const CATEGORIES = [
  { id: 'all', label: 'All Spots', icon: 'sparkles' },
  { id: 'Artisan Cafe', label: 'Artisan Cafes', icon: 'cafe' },
  { id: 'Activity Date', label: 'Games & Fun', icon: 'game-controller' },
  { id: 'Romantic Diners', label: 'Romantic Diners', icon: 'restaurant' },
  { id: 'Jazz & Lounges', label: 'Live Music', icon: 'musical-notes' },
  { id: 'Creative Workshops', label: 'Workshops', icon: 'color-palette' },
];

export default function VenuesScreen() {
  const { venues, matches, profiles, isDarkMode } = useApp();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('all');

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#9CA3AF' : '#64748B';
  const pillBg = isDarkMode ? '#13141E' : '#FFFFFF';
  const pillBorder = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const filteredVenues =
    selectedCat === 'all'
      ? venues
      : venues.filter(v => v.category === selectedCat);

  const handleReserve = (venue: Venue) => {
    const target = matches[0] || profiles[0];
    if (target) {
      router.push(`/plan-date/${target.id}?venueId=${venue.id}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <View style={styles.container}>
        {/* Title Header */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: textColor }]}>Curated Date Spots</Text>
          <Text style={[styles.subtitle, { color: subText }]}>
            Verified partner cafes & lounges with exclusive dessert perks & split bills.
          </Text>
        </View>

        {/* Clean Category Capsule Scroll */}
        <View style={styles.scrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(cat => {
              const isActive = selectedCat === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isActive ? '#FD3A73' : pillBg,
                      borderColor: isActive ? '#FD3A73' : (isDarkMode ? 'rgba(255,255,255,0.1)' : pillBorder),
                      shadowColor: isActive ? '#FD3A73' : 'transparent',
                      shadowOpacity: isActive ? 0.45 : 0,
                      shadowRadius: isActive ? 10 : 0,
                      elevation: isActive ? 6 : 0,
                    },
                    isActive && styles.catPillActiveShadow,
                  ]}
                  onPress={() => setSelectedCat(cat.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#4B5563')}
                  />
                  <Text
                    style={[
                      styles.catText,
                      {
                        color: isActive ? '#FFFFFF' : textColor,
                        fontFamily: isActive ? 'Poppins_800ExtraBold' : 'Poppins_600SemiBold',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Venue List */}
        <FlatList
          data={filteredVenues}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <VenueCard venue={item} onReserve={handleReserve} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Poppins_900Black',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  scrollWrapper: {
    marginHorizontal: -16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillActiveShadow: {
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  catText: {
    fontSize: 12.5,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});
