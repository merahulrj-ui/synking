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
  const { isDarkMode, wishlistVenueIds, toggleVenueWishlist } = useApp();
  const isWishlisted = wishlistVenueIds.has(venue.id);

  const cardBg = isDarkMode ? '#11121E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#9CA3AF' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: isDarkMode ? 'rgba(253, 58, 115, 0.22)' : borderCol,
        },
        isDarkMode && {
          shadowColor: '#FD3A73',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
          elevation: 8,
        },
      ]}
    >
      {/* Venue Photo & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: venue.image }} style={styles.image} />

        {/* Category Pill */}
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{venue.tag}</Text>
        </View>

        {/* Top Right Actions: Verified Safe Badge & Wishlist Heart */}
        <View style={styles.topRightRow}>
          <View
            style={[
              styles.safeBadge,
              isDarkMode && {
                shadowColor: '#00E5FF',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={12} color="#00E5FF" />
            <Text style={styles.safeText}>Verified Safe</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.wishlistBtn,
              isWishlisted && styles.wishlistBtnActive,
            ]}
            onPress={() => toggleVenueWishlist(venue.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={isWishlisted ? '#FD3A73' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Body */}
      <View style={styles.body}>
        {/* Title & Rating */}
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={13} color="#FBBF24" />
            <Text style={[styles.ratingText, { color: textColor }]}>
              {venue.rating}
            </Text>
            <Text style={{ color: subText, fontSize: 11, fontFamily: 'Poppins_500Medium', includeFontPadding: false }}>
              ({venue.reviewsCount})
            </Text>
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
        <View
          style={[
            styles.perkBox,
            {
              backgroundColor: isDarkMode ? 'rgba(251, 133, 0, 0.12)' : '#FFFBEB',
              borderWidth: isDarkMode ? 1 : 0,
              borderColor: isDarkMode ? 'rgba(251, 133, 0, 0.3)' : 'transparent',
            },
          ]}
        >
          <Ionicons name="gift" size={15} color="#FB8500" />
          <Text style={styles.perkText} numberOfLines={1}>
            <Text style={{ fontFamily: 'Poppins_800ExtraBold', color: '#FB8500' }}>Perk: </Text>
            {venue.perks}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.planBtn,
            isDarkMode && {
              shadowColor: '#FD3A73',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 16,
              elevation: 10,
            },
          ]}
          onPress={() => onReserve(venue)}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.planBtnText}>Plan Date Here</Text>
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
    height: 175,
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
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
  },
  topRightRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  safeText: {
    color: '#00E5FF',
    fontSize: 11,
    fontFamily: 'Poppins_800ExtraBold',
    includeFontPadding: false,
  },
  wishlistBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wishlistBtnActive: {
    backgroundColor: 'rgba(253, 58, 115, 0.25)',
    borderColor: '#FD3A73',
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
    fontSize: 16.5,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
    includeFontPadding: false,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
  },
  priceText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
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
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    includeFontPadding: false,
  },
  planBtn: {
    flexDirection: 'row',
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
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
});
