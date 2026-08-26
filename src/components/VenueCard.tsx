import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Venue } from '../types';
import { useApp } from '../contexts/AppContext';

interface Props {
  venue: Venue;
  onReserve: (venue: Venue) => void;
}

export const VenueCard: React.FC<Props> = ({ venue, onReserve }) => {
  const { isDarkMode } = useApp();

  const cardBg = isDarkMode ? '#11121B' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#9CA3AF' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
      {/* Venue Photo & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: venue.image }} style={styles.image} />

        {/* Category Pill */}
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{venue.tag}</Text>
        </View>

        {/* Verified Badge */}
        <View style={styles.safeBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#00E5FF" />
          <Text style={styles.safeText}>Verified Safe</Text>
        </View>
      </View>

      {/* Details Body */}
      <View style={styles.body}>
        {/* Title & Rating */}
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: textColor }]}>{venue.name}</Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={13} color="#FBBF24" />
            <Text style={[styles.ratingText, { color: textColor }]}>{venue.rating}</Text>
            <Text style={{ color: subText, fontSize: 11 }}>({venue.reviewsCount})</Text>
          </View>
        </View>

        {/* Address & Price */}
        <View style={styles.metaRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <Ionicons name="location-outline" size={13} color="#FD3A73" />
            <Text style={[styles.addressText, { color: subText }]} numberOfLines={1}>
              {venue.address} • {venue.distance}
            </Text>
          </View>
          <Text style={[styles.priceText, { color: textColor }]}>{venue.priceForTwo}</Text>
        </View>

        {/* SYNKING Exclusive Perk Pill */}
        <View style={[styles.perkBox, { backgroundColor: isDarkMode ? 'rgba(251, 133, 0, 0.12)' : '#FFFBEB' }]}>
          <Ionicons name="gift" size={15} color="#FB8500" />
          <Text style={styles.perkText} numberOfLines={1}>
            <Text style={{ fontWeight: '800', color: '#FB8500' }}>Perk: </Text>
            {venue.perks}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => onReserve(venue)}
          activeOpacity={0.85}
        >
          <Text style={styles.planBtnText}>Plan Date Here ⚡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    height: 170,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  safeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  safeText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  perkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  perkText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  planBtn: {
    backgroundColor: '#FD3A73',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  planBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
