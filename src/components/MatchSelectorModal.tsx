import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Venue, UserProfile } from '../types';
import { useApp } from '../contexts/AppContext';

interface Props {
  visible: boolean;
  venue: Venue | null;
  onClose: () => void;
  onSelectMatch: (match: UserProfile) => void;
  onGoToSwipe: () => void;
}

export const MatchSelectorModal: React.FC<Props> = ({
  visible,
  venue,
  onClose,
  onSelectMatch,
  onGoToSwipe,
}) => {
  const { matches, isDarkMode, wishlistVenueIds, toggleVenueWishlist } = useApp();

  if (!venue) return null;

  const isWishlisted = wishlistVenueIds.has(venue.id);
  const bg = isDarkMode ? '#0F1019' : '#FFFFFF';
  const cardBg = isDarkMode ? '#171926' : '#F8FAFC';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleToggleWishlist = () => {
    toggleVenueWishlist(venue.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: bg, borderColor: borderCol }]}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: textColor }]}>Plan 1st Date 🎟️</Text>
              <Text style={[styles.subtitle, { color: subText }]}>
                Select who to invite to {venue.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Venue Preview Pill */}
          <View style={[styles.venuePill, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Image source={{ uri: venue.image }} style={styles.venueThumb} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.venueName, { color: textColor }]} numberOfLines={1}>
                {venue.name}
              </Text>
              <Text style={[styles.venuePerk, { color: '#FD3A73' }]} numberOfLines={1}>
                🎁 {venue.perks}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleWishlist}
              style={[styles.wishlistBtn, isWishlisted && styles.wishlistBtnActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={isWishlisted ? '#FD3A73' : subText}
              />
            </TouchableOpacity>
          </View>

          {/* Matches List or Empty State */}
          {matches.length > 0 ? (
            <View style={styles.listContainer}>
              <Text style={[styles.sectionLabel, { color: subText }]}>
                YOUR ACTIVE MATCHES ({matches.length})
              </Text>
              <FlatList
                data={matches}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.matchCard, { backgroundColor: cardBg, borderColor: borderCol }]}
                    onPress={() => onSelectMatch(item)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.photo }} style={styles.matchAvatar} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.matchName, { color: textColor }]}>
                          {item.name}, {item.age}
                        </Text>
                        {item.isVerified && (
                          <Ionicons name="checkmark-circle" size={14} color="#00E5FF" />
                        )}
                      </View>
                      <Text style={[styles.matchCompat, { color: '#10B981' }]}>
                        ⚡ {item.compatibility || 92}% Synk Compatibility
                      </Text>
                    </View>

                    <View style={styles.inviteAction}>
                      <Text style={styles.inviteText}>Invite 💌</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? 'rgba(253, 58, 115, 0.12)' : '#FFE4E6' }]}>
                <Ionicons name="sparkles" size={32} color="#FD3A73" />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>No Matches Yet!</Text>
              <Text style={[styles.emptyDesc, { color: subText }]}>
                Save this venue to your Date Wishlist so potential matches see your ideal 1st date spot while swiping.
              </Text>

              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={[styles.wishlistActionBtn, isWishlisted && { backgroundColor: '#10B981' }]}
                  onPress={handleToggleWishlist}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isWishlisted ? 'checkmark' : 'heart'} size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>
                    {isWishlisted ? 'Saved to Wishlist ❤️' : 'Save to Date Wishlist'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.swipeActionBtn}
                  onPress={() => {
                    onClose();
                    onGoToSwipe();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame" size={16} color="#FD3A73" />
                  <Text style={[styles.swipeBtnText, { color: '#FD3A73' }]}>Find Matches Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  venuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 18,
  },
  venueThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  venueName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  venuePerk: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    marginTop: 2,
  },
  wishlistBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  wishlistBtnActive: {
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
  },
  listContainer: {
    maxHeight: 320,
  },
  sectionLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  matchAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  matchName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14.5,
  },
  matchCompat: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    marginTop: 2,
  },
  inviteAction: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inviteText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActions: {
    width: '100%',
    gap: 10,
  },
  wishlistActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FD3A73',
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  swipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  swipeBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
  },
});
