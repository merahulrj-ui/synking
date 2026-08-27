import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { SwipeCard } from '../../components/SwipeCard';
import { AuthModal } from '../../components/AuthModal';
import { Colors } from '../../constants/theme';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { profiles, currentUser, swipeProfile, isLoggedIn, isDarkMode, refreshDiscoverFeed } = useApp();
  const router = useRouter();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [requestSentProfile, setRequestSentProfile] = useState<any>(null);

  // Strictly filter out own profile so user never sees themselves
  const availableProfiles = profiles.filter(p => p && p.id !== currentUser?.id && p.name !== currentUser?.name);
  const currentProfile = availableProfiles[0];
  const nextProfile = availableProfiles[1];

  const handleSwipe = (action: 'like' | 'pass' | 'supersynk') => {
    if (!isLoggedIn) {
      setAuthModalVisible(true);
      return;
    }

    if (!currentProfile) return;
    const res = swipeProfile(currentProfile.id, action);
    if (res.requestSent && res.profile) {
      setRequestSentProfile(res.profile);
      setTimeout(() => {
        setRequestSentProfile(null);
      }, 2000);
    }
  };

  const bgTheme = isDarkMode ? '#000000' : '#F3F4F6';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme }]}>
        <Header />

      <View style={styles.container}>
        {currentProfile ? (
          <View style={styles.cardStack}>
            {/* NEXT CARD UNDERNEATH */}
            {nextProfile && (
              <View style={styles.nextCardWrapper}>
                <SwipeCard profile={nextProfile} isFirst={false} />
              </View>
            )}

            {/* TOP ACTIVE CARD */}
            <View style={styles.topCardWrapper}>
              <SwipeCard
                profile={currentProfile}
                isFirst={true}
                onSwipe={handleSwipe}
              />
            </View>

            {/* SLEEK GLASS FLOATING ACTION BUTTONS */}
            <View style={styles.actionControls}>
              {/* 1. Rewind */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { backgroundColor: isDarkMode ? '#22232B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleSwipe('pass')}
              >
                <Ionicons name="refresh" size={18} color="#FBBF24" />
              </TouchableOpacity>

              {/* 2. Pass / Nope */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.largeBtn,
                  { backgroundColor: isDarkMode ? '#22232B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleSwipe('pass')}
              >
                <Ionicons name="close" size={30} color="#EF4444" />
              </TouchableOpacity>

              {/* 3. Super Synk */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.midBtn,
                  { backgroundColor: isDarkMode ? '#22232B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleSwipe('supersynk')}
              >
                <Ionicons name="star" size={20} color="#00E5FF" />
              </TouchableOpacity>

              {/* 4. Synk / Like */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.largeBtn,
                  { backgroundColor: isDarkMode ? '#22232B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleSwipe('like')}
              >
                <Ionicons name="heart" size={28} color="#FD3A73" />
              </TouchableOpacity>

              {/* 5. Boost */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { backgroundColor: isDarkMode ? '#22232B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleSwipe('supersynk')}
              >
                <Ionicons name="flash" size={18} color="#A855F7" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-sharp" size={54} color="#FD3A73" />
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FFFFFF' : '#0F172A' }]}>
              Discovering in Roorkee 📍
            </Text>
            <Text style={[styles.emptySub, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              Open the app on your Phone and Laptop to discover and match with each other!
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => refreshDiscoverFeed()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.exploreBtnText}>Refresh Discover Feed 🔄</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        targetUserName={currentProfile?.name}
      />

      {/* Toast Notification */}
      {requestSentProfile && (
        <View style={styles.toast}>
          <Ionicons name="heart" size={18} color="#22C55E" />
          <Text style={styles.toastText}>Liked {requestSentProfile.name}</Text>
        </View>
      )}
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  cardStack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  midBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  largeBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  exploreBtn: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#1E202B',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});