import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { SwipeCard } from '../../components/SwipeCard';
import { FullProfileModal } from '../../components/FullProfileModal';
import { AuthModal } from '../../components/AuthModal';
import { DiscoveryFilterModal, DiscoveryFilter, DEFAULT_DISCOVERY_FILTER } from '../../components/DiscoveryFilterModal';
import { Colors } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { calculateProfileDistance, getCoordinates } from '../../utils/distance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DiscoverScreen() {
  const {
    profiles,
    matches,
    sentRequests,
    incomingRequests,
    passedProfiles,
    currentUser,
    swipeProfile,
    isLoggedIn,
    isDarkMode,
    refreshDiscoverFeed,
    resetPassedProfiles,
    undoLastSwipe,
    superSynksRemaining,
    freeRewindsRemaining,
    boostActiveUntil,
    useSuperSynk,
    useRewind,
    activateBoost,
  } = useApp();

  const router = useRouter();
  const [requestSentProfile, setRequestSentProfile] = useState<any>(null);
  const [superSynkToastUser, setSuperSynkToastUser] = useState<any>(null);
  const [expandedProfile, setExpandedProfile] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [discoveryFilter, setDiscoveryFilter] = useState<DiscoveryFilter>(DEFAULT_DISCOVERY_FILTER);
  const [rewindToastUser, setRewindToastUser] = useState<any>(null);

  // Load persistent discovery filters from storage
  useEffect(() => {
    AsyncStorage.getItem('synking_discovery_filter').then(data => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            setDiscoveryFilter({ ...DEFAULT_DISCOVERY_FILTER, ...parsed });
          }
        } catch (e) {}
      }
    }).catch(() => {});
  }, []);

  const handleApplyFilter = (newFilter: DiscoveryFilter) => {
    setDiscoveryFilter(newFilter);
    AsyncStorage.setItem('synking_discovery_filter', JSON.stringify(newFilter)).catch(() => {});
  };

  const handleResetFilter = () => {
    setDiscoveryFilter(DEFAULT_DISCOVERY_FILTER);
    AsyncStorage.removeItem('synking_discovery_filter').catch(() => {});
  };

  const hasActiveFilters = useMemo(() => {
    return (
      discoveryFilter.maxDistanceKm < 9999 ||
      discoveryFilter.gender !== 'all' ||
      discoveryFilter.minAge > 18 ||
      discoveryFilter.maxAge < 50 ||
      discoveryFilter.verifiedOnly === true
    );
  }, [discoveryFilter]);

  // User GPS Coordinates from current user location or default origin
  const userCoords = useMemo<[number, number]>(() => {
    const coords = getCoordinates(currentUser?.location);
    if (coords && coords.length === 2) {
      return [coords[0], coords[1]];
    }
    return [29.8644, 77.8881];
  }, [currentUser?.location]);

  // Filter & Proximity Sort (Closest profiles appear first in Discover feed)
  // 1. Own profile (by ID)
  // 2. Already matched users (by ID)
  // 3. Already liked users with active pending sent request (by ID)
  // 4. Profiles passed during this session (by ID)
  // 5. Gender & Age & Verified & Distance preferences
  const availableProfiles = useMemo(() => {
    const filtered = profiles.filter(p => {
      if (!p || !p.id) return false;
      if (currentUser) {
        if (p.id === currentUser.id) return false;
        const myPhone = (currentUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
        const pPhone = (p.phoneNumber || '').replace(/\D/g, '').slice(-10);
        if (myPhone && pPhone && myPhone === pPhone) return false;
        if (currentUser.name && p.name && currentUser.name.trim().toLowerCase() === p.name.trim().toLowerCase()) return false;
      }
      if (matches.some(m => m && (m.id === p.id || (currentUser?.phoneNumber && m.phoneNumber === currentUser.phoneNumber)))) return false;
      if (sentRequests.some(r => r && r.toUserId === p.id && r.status === 'pending')) return false;
      if (passedProfiles.has(p.id)) return false;

      // Filter by Gender
      if (discoveryFilter.gender !== 'all') {
        if (p.gender && p.gender !== discoveryFilter.gender) return false;
      }

      // Filter by Age Range
      if (p.age && (p.age < discoveryFilter.minAge || p.age > discoveryFilter.maxAge)) return false;

      // Filter by Verified Badge
      if (discoveryFilter.verifiedOnly && !p.isVerified) return false;

      return true;
    });

    // Attach calculated distance to each profile
    const withDistance = filtered.map(p => {
      const { distanceKm, distanceLabel } = calculateProfileDistance(p.location, userCoords, p.id);
      return {
        ...p,
        distanceKm,
        distance: distanceLabel,
      };
    });

    // Filter by Maximum Distance radius
    const distanceFiltered = withDistance.filter(p => p.distanceKm <= discoveryFilter.maxDistanceKm);

    // Proximity Sorting: nearest profiles first
    distanceFiltered.sort((a, b) => a.distanceKm - b.distanceKm);

    return distanceFiltered;
  }, [profiles, currentUser, matches, sentRequests, passedProfiles, userCoords, discoveryFilter]);

  const currentProfile = availableProfiles[0];
  const nextProfile = availableProfiles[1];

  // Auto-recycle: If all cards have been swiped, auto-reset passed profiles so all 25+ users stay in the feed!
  useEffect(() => {
    if (profiles.length > 0 && availableProfiles.length === 0 && passedProfiles.size > 0) {
      resetPassedProfiles();
    }
  }, [availableProfiles.length, profiles.length, passedProfiles.size]);

  const isProcessingSwipe = React.useRef(false);
  const swipeCardRef = React.useRef<any>(null);

  const triggerButtonSwipe = (action: 'like' | 'pass' | 'supersynk') => {
    if (!isLoggedIn) {
      router.push('/(tabs)/profile');
      return;
    }
    if (!currentProfile || isProcessingSwipe.current) return;
    
    // Haptic Feedback
    if (action === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (action === 'supersynk') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Lock interaction
    isProcessingSwipe.current = true;
    
    // Trigger physical card animation FIRST
    // The card will call onSwipe (handleSwipe) when animation finishes (after ~250ms)
    swipeCardRef.current?.triggerSwipe(action);
  };

  const handleSwipe = (action: 'like' | 'pass' | 'supersynk', profileId?: string) => {
    const targetId = profileId || currentProfile?.id;
    if (!targetId) {
      isProcessingSwipe.current = false;
      return;
    }

    const res = swipeProfile(targetId, action);
    if (res.requestSent && res.profile) {
      if (action === 'supersynk') {
        setSuperSynkToastUser(res.profile);
        setTimeout(() => {
          setSuperSynkToastUser(null);
        }, 2200);
      } else {
        setRequestSentProfile(res.profile);
        setTimeout(() => {
          setRequestSentProfile(null);
        }, 2000);
      }
    }
    
    // Release lock IMMEDIATELY so the next swipe is ready with 0 delay!
    isProcessingSwipe.current = false;
  };

  const handleRewind = () => {
    if (!isLoggedIn) {
      router.push('/(tabs)/profile');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (!currentUser?.isVip && freeRewindsRemaining <= 0) {
      const title = '✨ 👑 VIP Exclusive Feature 👑 ✨';
      const msg = `⭐ You have used your 1 Free Daily Rewind.\n\n👑 Upgrade to SYNKING Black VIP to unlock 100% UNLIMITED Rewinds & undo accidental passes anytime!`;
      if (Platform.OS === 'web') {
        const upgrade = window.confirm(`${title}\n\n${msg}\n\nWould you like to upgrade to VIP now?`);
        if (upgrade) router.push('/vip-membership');
      } else {
        Alert.alert(title, msg, [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to VIP ✨', onPress: () => router.push('/vip-membership') }
        ]);
      }
      return;
    }

    const canRewind = useRewind();
    if (!canRewind) return;

    const restored = undoLastSwipe();
    if (restored) {
      setRewindToastUser(restored);
      setTimeout(() => setRewindToastUser(null), 2200);
    } else {
      Alert.alert('Rewind ⏪', 'No recently swiped profile to undo in this session!');
    }
  };

  const handleSuperSynk = () => {
    if (!isLoggedIn) {
      router.push('/(tabs)/profile');
      return;
    }
    if (!currentProfile || isProcessingSwipe.current) return;

    if (superSynksRemaining <= 0) {
      const title = '✨ ⭐ Out of Super Synks! ⭐ ✨';
      const msg = currentUser?.isVip
        ? '⭐ You have used all 5 of your daily Super Synks! Your quota resets tomorrow at midnight.'
        : '⭐ You have used your 1 Free Daily Super Synk.\n\n👑 Upgrade to SYNKING Black VIP to get 5 Super Synks every single day and 3x your matches!';
      if (Platform.OS === 'web') {
        if (!currentUser?.isVip) {
          const upgrade = window.confirm(`${title}\n\n${msg}\n\nWould you like to upgrade to VIP now?`);
          if (upgrade) router.push('/vip-membership');
        } else {
          window.alert(`${title}\n\n${msg}`);
        }
      } else {
        if (!currentUser?.isVip) {
          Alert.alert(title, msg, [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to VIP ✨', onPress: () => router.push('/vip-membership') }
          ]);
        } else {
          Alert.alert(title, msg, [{ text: 'OK' }]);
        }
      }
      return;
    }

    useSuperSynk();
    triggerButtonSwipe('supersynk');
  };

  const handleBoostProfile = () => {
    if (!isLoggedIn) {
      router.push('/(tabs)/profile');
      return;
    }

    const isBoostedNow = boostActiveUntil && Date.now() < boostActiveUntil;
    if (isBoostedNow) {
      const minsLeft = Math.ceil((boostActiveUntil - Date.now()) / (60 * 1000));
      Alert.alert(
        '⚡ Profile Boost Active!',
        `Your profile is currently boosted to #1 in your city! 🚀\n\n⏱️ Time remaining: ${minsLeft} minutes.`,
        [{ text: 'Awesome 👍' }]
      );
      return;
    }

    if (!currentUser?.isVip) {
      const title = '✨ 👑 VIP Profile Boost 👑 ✨';
      const msg = '⭐ Profile Boost places you at the #1 top spot in your city for 30 minutes, getting you up to 5x more profile views!\n\n👑 Upgrade to SYNKING Black VIP to unlock free monthly boosts!';
      if (Platform.OS === 'web') {
        const upgrade = window.confirm(`${title}\n\n${msg}\n\nWould you like to upgrade to VIP now?`);
        if (upgrade) router.push('/vip-membership');
      } else {
        Alert.alert(title, msg, [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade to VIP ✨', onPress: () => router.push('/vip-membership') }
        ]);
      }
      return;
    }

    activateBoost(30);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    Alert.alert(
      '⚡ Profile Boost Activated! 🚀',
      'Your profile is now boosted to #1 in your city for the next 30 minutes! You will appear first to all nearby singles.',
      [{ text: 'Enjoy Boost ✨' }]
    );
  };

  const bgTheme = isDarkMode ? '#000000' : '#F3F4F6';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme }]}>
      <Header onOpenFilter={() => setShowFilterModal(true)} hasActiveFilters={hasActiveFilters} />

      {/* ⚡ ACTIVE BOOST LIVE INDICATOR BADGE */}
      {boostActiveUntil && Date.now() < boostActiveUntil && (
        <View style={styles.activeBoostBanner}>
          <LinearGradient
            colors={['#9333EA', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeBoostGradient}
          >
            <Ionicons name="flash" size={13} color="#FFF" />
            <Text style={styles.activeBoostText}>
              ⚡ 30-MIN BOOST ACTIVE · #{currentUser?.name || 'You'} Ranked #1 Nearby
            </Text>
          </LinearGradient>
        </View>
      )}

      <View style={styles.container}>
        {currentProfile ? (
          <>
            <View style={styles.cardStack}>
              {/* PEEKING BACKGROUND CARD (STACK EFFECT) */}
              {nextProfile && (
                <View style={styles.nextCardWrapper} pointerEvents="none">
                  <SwipeCard
                    key={`next_${nextProfile.id}`}
                    profile={nextProfile}
                    isFirst={false}
                  />
                </View>
              )}

              {/* TOP ACTIVE CARD */}
              <View style={styles.topCardWrapper}>
                <SwipeCard
                  key={`top_${currentProfile.id}`}
                  ref={swipeCardRef}
                  profile={currentProfile}
                  isFirst={true}
                  onSwipe={handleSwipe}
                  onShowProfile={() => setExpandedProfile(currentProfile)}
                />
              </View>

            </View>
            
            {/* SLEEK GLASS FLOATING ACTION BUTTONS */}
            <View style={styles.actionControls}>
              {/* 1. Tinder-Style Single-Card Rewind / Undo */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                ]}
                activeOpacity={0.6}
                onPress={handleRewind}
              >
                <Ionicons name="refresh" size={24} color="#FBBF24" />
              </TouchableOpacity>

              {/* 2. Pass / Nope */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.largeBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', 
                    borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDarkMode ? 0.45 : 0.2,
                    shadowRadius: 16,
                    elevation: 12
                  }
                ]}
                activeOpacity={0.6}
                onPress={() => triggerButtonSwipe('pass')}
              >
                <Ionicons name="close" size={36} color="#EF4444" />
              </TouchableOpacity>

              {/* 3. Super Synk */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.midBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', 
                    borderColor: isDarkMode ? 'rgba(0,229,255,0.2)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#00E5FF',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDarkMode ? 0.5 : 0.2,
                    shadowRadius: 14,
                    elevation: 10
                  }
                ]}
                activeOpacity={0.6}
                onPress={handleSuperSynk}
              >
                <Ionicons name="star" size={28} color="#00E5FF" />
                <View style={styles.quotaPill}>
                  <Text style={styles.quotaPillText}>{superSynksRemaining}</Text>
                </View>
              </TouchableOpacity>

              {/* 4. Synk / Like */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.largeBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', 
                    borderColor: isDarkMode ? 'rgba(253,58,115,0.3)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#FD3A73',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDarkMode ? 0.6 : 0.3,
                    shadowRadius: 20,
                    elevation: 14
                  }
                ]}
                activeOpacity={0.6}
                onPress={() => triggerButtonSwipe('like')}
              >
                <Ionicons name="heart" size={36} color="#FD3A73" />
              </TouchableOpacity>

              {/* 5. Boost */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', 
                    borderColor: (boostActiveUntil && Date.now() < boostActiveUntil) ? '#A855F7' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    shadowColor: '#A855F7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: (boostActiveUntil && Date.now() < boostActiveUntil) ? 0.8 : 0.2,
                    shadowRadius: 12,
                    elevation: 8
                  }
                ]}
                activeOpacity={0.6}
                onPress={handleBoostProfile}
              >
                <Ionicons name="flash" size={24} color="#A855F7" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name={hasActiveFilters ? "filter-circle-outline" : "location-sharp"}
              size={54}
              color="#FD3A73"
            />
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
              {hasActiveFilters ? 'No Singles Match Filters 🔍' : 'Discovering Singles Nearby 📍'}
            </Text>
            <Text style={[styles.emptySub, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {hasActiveFilters
                ? 'Try expanding your distance radius or age range in Discovery Preferences to meet more people!'
                : 'Open the app on your Phone and Laptop to discover and match with each other!'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                if (hasActiveFilters) {
                  handleResetFilter();
                }
                resetPassedProfiles();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.exploreBtnText}>
                {hasActiveFilters ? 'Reset Filters & Refresh 🔄' : 'Refresh Discover Feed 🔄'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Toast Notification (Like) */}
      {requestSentProfile && (
        <View style={styles.toast}>
          <Ionicons name="heart" size={18} color="#22C55E" />
          <Text style={styles.toastText}>Liked {requestSentProfile.name}</Text>
        </View>
      )}

      {/* Toast Notification (Super Synk) */}
      {superSynkToastUser && (
        <View style={[styles.toast, { borderColor: 'rgba(0, 229, 255, 0.4)', backgroundColor: 'rgba(0, 229, 255, 0.2)' }]}>
          <Ionicons name="star" size={18} color="#00E5FF" />
          <Text style={styles.toastText}>Super Synked {superSynkToastUser.name}! ⭐</Text>
        </View>
      )}

      {/* Toast Notification (Rewind / Undo) */}
      {rewindToastUser && (
        <View style={[styles.toast, { borderColor: 'rgba(251, 191, 36, 0.4)', backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
          <Ionicons name="return-up-back" size={18} color="#FBBF24" />
          <Text style={styles.toastText}>Brought back {rewindToastUser.name} ⏪</Text>
        </View>
      )}

      {/* Full Expanded Profile Modal */}
      <FullProfileModal
        profile={expandedProfile}
        visible={!!expandedProfile}
        onClose={() => setExpandedProfile(null)}
        onSwipe={handleSwipe}
      />

      {/* Discovery Preferences & Distance Filter Modal */}
      <DiscoveryFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filter={discoveryFilter}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 20,
  },
  cardStack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10,
  },
  nextCardWrapper: {
    position: 'absolute',
    top: 4,
    zIndex: 1,
  },
  topCardWrapper: {
    position: 'absolute',
    top: 4,
    zIndex: 2,
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
    zIndex: 10,
  },
  actionBtn: {
    backgroundColor: '#22232B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  midBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  largeBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    color: '#9CA3AF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  quotaPill: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#05060A',
  },
  quotaPillText: {
    color: '#05060A',
    fontFamily: 'Poppins_900Black',
    fontSize: 9,
  },
  activeBoostBanner: {
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: -4,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 20,
  },
  activeBoostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  activeBoostText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});