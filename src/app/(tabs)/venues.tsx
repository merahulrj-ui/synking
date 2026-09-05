import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { VenueCard } from '../../components/VenueCard';
import { MatchSelectorModal } from '../../components/MatchSelectorModal';
import { Venue, UserProfile } from '../../types';

const { width } = Dimensions.get('window');

const VIBES = [
  { id: 'all', label: 'All Vibes', icon: 'sparkles' },
  { id: 'Artisan Cafe', label: 'First Coffee ☕', icon: 'cafe' },
  { id: 'Rooftop & Cocktails', label: 'Rooftops & Drinks 🍸', icon: 'wine' },
  { id: 'Casual Foodie', label: 'Casual Bites 🍕', icon: 'pizza' },
  { id: 'Activity Date', label: 'Games & Fun 🎳', icon: 'game-controller' },
  { id: 'Romantic Diners', label: 'Romantic Diners ✨', icon: 'restaurant' },
  { id: 'Jazz & Lounges', label: 'Live Soul Music 🎷', icon: 'musical-notes' },
  { id: 'Creative Workshops', label: 'Art & Workshops 🎨', icon: 'color-palette' },
];

export default function VenuesScreen() {
  const { venues, isDarkMode, wishlistVenueIds, toggleVenueWishlist } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'wishlist'>('all');
  const [selectedVibe, setSelectedVibe] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenueForModal, setSelectedVenueForModal] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#9CA3AF' : '#64748B';
  const pillBg = isDarkMode ? '#13141E' : '#FFFFFF';
  const cardBg = isDarkMode ? '#11121E' : '#FFFFFF';
  const pillBorder = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Filtered venues based on tab, vibe, and search query
  const filteredVenues = useMemo(() => {
    let list = venues;

    // Filter by Wishlist tab
    if (activeTab === 'wishlist') {
      list = list.filter((v) => wishlistVenueIds.has(v.id));
    }

    // Filter by Vibe
    if (selectedVibe !== 'all') {
      list = list.filter((v) => v.category === selectedVibe);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.tag.toLowerCase().includes(q) ||
          v.perks.toLowerCase().includes(q)
      );
    }

    return list;
  }, [venues, activeTab, selectedVibe, searchQuery, wishlistVenueIds]);

  // Spotlight featured venue (e.g. top venue)
  const spotlightVenue = venues[0];

  const handleOpenReserve = (venue: Venue) => {
    setSelectedVenueForModal(venue);
    setIsModalOpen(true);
  };

  const handleSelectMatch = (match: UserProfile) => {
    if (!selectedVenueForModal) return;
    setIsModalOpen(false);
    router.push(`/plan-date/${match.id}?venueId=${selectedVenueForModal.id}`);
  };

  const handleGoToSwipe = () => {
    router.push('/(tabs)');
  };

  const renderHeaderComponent = () => (
    <View>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.title, { color: textColor }]}>Curated 1st Dates</Text>
          <View style={styles.verifiedSafeShield}>
            <Ionicons name="shield-checkmark" size={13} color="#00E5FF" />
            <Text style={styles.verifiedSafeShieldText}>Safe & Verified</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: subText }]}>
          Handpicked public cafes & spots with verified safety, split bills & exclusive perks.
        </Text>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDarkMode ? '#131422' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <Ionicons name="search" size={18} color="#FD3A73" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cafes, Cyber Hub, CP, vibes..."
          placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
          style={[styles.searchInput, { color: textColor }]}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Tab Control: All Spots vs My Wishlist */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? '#10111A' : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'all' && [
              styles.tabButtonActive,
              { backgroundColor: isDarkMode ? '#1E2032' : '#FFFFFF' },
            ],
          ]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="compass-outline"
            size={16}
            color={activeTab === 'all' ? '#FD3A73' : subText}
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color: activeTab === 'all' ? textColor : subText,
                fontFamily: activeTab === 'all' ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
              },
            ]}
          >
            All Spots ({venues.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'wishlist' && [
              styles.tabButtonActive,
              { backgroundColor: isDarkMode ? '#1E2032' : '#FFFFFF' },
            ],
          ]}
          onPress={() => setActiveTab('wishlist')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'wishlist' ? 'heart' : 'heart-outline'}
            size={16}
            color={activeTab === 'wishlist' ? '#FD3A73' : subText}
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color: activeTab === 'wishlist' ? textColor : subText,
                fontFamily: activeTab === 'wishlist' ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
              },
            ]}
          >
            My Wishlist ({wishlistVenueIds.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Featured Spotlight Card (Only in 'all' tab & when no active search) */}
      {activeTab === 'all' && searchQuery.trim() === '' && selectedVibe === 'all' && spotlightVenue && (
        <View style={styles.spotlightWrapper}>
          <Text style={[styles.sectionHeading, { color: subText }]}>
            🔥 #1 TRENDING FIRST DATE SPOT
          </Text>
          <TouchableOpacity
            style={[
              styles.spotlightCard,
              isDarkMode && {
                shadowColor: '#FD3A73',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 10,
              },
            ]}
            onPress={() => handleOpenReserve(spotlightVenue)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: spotlightVenue.image }} style={styles.spotlightImage} />
            <LinearGradient
              colors={['transparent', 'rgba(5, 6, 10, 0.85)', 'rgba(5, 6, 10, 0.98)']}
              style={styles.spotlightGradient}
            />

            {/* Top Badges */}
            <View style={styles.spotlightTopRow}>
              <View style={styles.trendingBadge}>
                <Ionicons name="flame" size={13} color="#FFFFFF" />
                <Text style={styles.trendingBadgeText}>Top Pick This Week</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.spotlightHeartBtn,
                  wishlistVenueIds.has(spotlightVenue.id) && styles.spotlightHeartBtnActive,
                ]}
                onPress={() => toggleVenueWishlist(spotlightVenue.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={wishlistVenueIds.has(spotlightVenue.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={wishlistVenueIds.has(spotlightVenue.id) ? '#FD3A73' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Content */}
            <View style={styles.spotlightBottom}>
              <View style={styles.spotlightTitleRow}>
                <Text style={styles.spotlightTitle} numberOfLines={1}>
                  {spotlightVenue.name}
                </Text>
                <View style={styles.spotlightRating}>
                  <Ionicons name="star" size={13} color="#FBBF24" />
                  <Text style={styles.spotlightRatingText}>{spotlightVenue.rating}</Text>
                </View>
              </View>

              <Text style={styles.spotlightMeta}>
                📍 {spotlightVenue.address} • {spotlightVenue.distance} • {spotlightVenue.priceForTwo}
              </Text>

              <View style={styles.spotlightPerkRow}>
                <Ionicons name="gift" size={14} color="#FB8500" />
                <Text style={styles.spotlightPerkText} numberOfLines={1}>
                  {spotlightVenue.perks}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.spotlightCtaBtn}
                onPress={() => handleOpenReserve(spotlightVenue)}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.spotlightCtaText}>Plan Date Here ⚡</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Vibes Pill Selector */}
      {activeTab === 'all' && (
        <View style={styles.vibeSection}>
          <Text style={[styles.sectionHeading, { color: subText }]}>EXPLORE BY VIBE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibeScroll}
          >
            {VIBES.map((vibe) => {
              const isActive = selectedVibe === vibe.id;
              return (
                <TouchableOpacity
                  key={vibe.id}
                  style={[
                    styles.vibePill,
                    {
                      backgroundColor: isActive ? '#FD3A73' : pillBg,
                      borderColor: isActive
                        ? '#FD3A73'
                        : isDarkMode
                        ? 'rgba(255,255,255,0.08)'
                        : pillBorder,
                      shadowColor: isActive ? '#FD3A73' : 'transparent',
                      shadowOpacity: isActive ? 0.45 : 0,
                      shadowRadius: 10,
                      elevation: isActive ? 6 : 0,
                    },
                  ]}
                  onPress={() => setSelectedVibe(vibe.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={vibe.icon as any}
                    size={14}
                    color={isActive ? '#FFFFFF' : isDarkMode ? '#D1D5DB' : '#4B5563'}
                  />
                  <Text
                    style={[
                      styles.vibeText,
                      {
                        color: isActive ? '#FFFFFF' : textColor,
                        fontFamily: isActive ? 'Poppins_800ExtraBold' : 'Poppins_600SemiBold',
                      },
                    ]}
                  >
                    {vibe.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Spots List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionHeading, { color: subText }]}>
          {activeTab === 'wishlist'
            ? `SAVED FIRST DATE SPOTS (${filteredVenues.length})`
            : `CURATED PARTNER SPOTS (${filteredVenues.length})`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <FlatList
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VenueCard venue={item} onReserve={handleOpenReserve} />
        )}
        ListHeaderComponent={renderHeaderComponent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDarkMode ? 'rgba(253, 58, 115, 0.12)' : '#FFE4E6' },
              ]}
            >
              <Ionicons
                name={activeTab === 'wishlist' ? 'heart-dislike-outline' : 'search-outline'}
                size={32}
                color="#FD3A73"
              />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {activeTab === 'wishlist' ? 'No Saved Date Spots Yet' : 'No Date Spots Found'}
            </Text>
            <Text style={[styles.emptyDesc, { color: subText }]}>
              {activeTab === 'wishlist'
                ? 'Tap the ❤️ icon on any venue card to add it to your wishlist. Your matches will see your favorite 1st date spots!'
                : 'Try clearing your search or picking a different vibe category above.'}
            </Text>
            {activeTab === 'wishlist' ? (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>Browse All Spots</Text>
              </TouchableOpacity>
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>Clear Search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Match Selector Modal */}
      <MatchSelectorModal
        visible={isModalOpen}
        venue={selectedVenueForModal}
        onClose={() => setIsModalOpen(false)}
        onSelectMatch={handleSelectMatch}
        onGoToSwipe={handleGoToSwipe}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  titleSection: {
    marginTop: 6,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Poppins_900Black',
    fontSize: 22,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  verifiedSafeShield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  verifiedSafeShieldText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#00E5FF',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
    includeFontPadding: false,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    padding: 0,
    includeFontPadding: false,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  sectionHeading: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
    includeFontPadding: false,
  },
  spotlightWrapper: {
    marginBottom: 18,
  },
  spotlightCard: {
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(253, 58, 115, 0.3)',
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  spotlightGradient: {
    ...StyleSheet.absoluteFill,
  },
  spotlightTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  trendingBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 11,
    includeFontPadding: false,
  },
  spotlightHeartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spotlightHeartBtnActive: {
    backgroundColor: 'rgba(253, 58, 115, 0.25)',
    borderColor: '#FD3A73',
  },
  spotlightBottom: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    gap: 6,
  },
  spotlightTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 18,
    flex: 1,
    marginRight: 8,
    includeFontPadding: false,
  },
  spotlightRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  spotlightRatingText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    includeFontPadding: false,
  },
  spotlightMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    includeFontPadding: false,
  },
  spotlightPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 133, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  spotlightPerkText: {
    color: '#FFA726',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    includeFontPadding: false,
  },
  spotlightCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FD3A73',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  spotlightCtaText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 13,
    includeFontPadding: false,
  },
  vibeSection: {
    marginBottom: 16,
  },
  vibeScroll: {
    gap: 8,
    paddingRight: 16,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  listHeaderRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    includeFontPadding: false,
  },
  emptyDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    includeFontPadding: false,
  },
  emptyActionBtn: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    includeFontPadding: false,
  },
});
