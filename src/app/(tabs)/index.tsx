import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
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
  const { profiles, matches, sentRequests, incomingRequests, passedProfiles, currentUser, swipeProfile, isLoggedIn, isDarkMode, refreshDiscoverFeed } = useApp();
  const router = useRouter();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [requestSentProfile, setRequestSentProfile] = useState<any>(null);

  // Strictly filter out:
  // 1. Own profile
  // 2. Already matched users (Accepted requests)
  // 3. Users you have already liked / sent requests to
  // 4. Users who have sent incoming requests to you
  // 5. Users you have already passed / swiped left on
  const availableProfiles = profiles.filter(p => {
    if (!p || p.id === currentUser?.id || p.name === currentUser?.name) return false;
    if (matches.some(m => m && (m.id === p.id || m.name === p.name))) return false;
    if (sentRequests.some(r => r && (r.toUserId === p.id || r.toUserName === p.name || r.fromUser?.id === p.id))) return false;
    if (incomingRequests.some(r => r && (r.fromUser?.id === p.id || r.fromUser?.name === p.name))) return false;
    if (passedProfiles.has(p.id)) return false;
    return true;
  });
  const currentProfile = availableProfiles[0];
  const nextProfile = availableProfiles[1];

  const isProcessingSwipe = React.useRef(false);

  const handleSwipe = (action: 'like' | 'pass' | 'supersynk') => {
    if (!isLoggedIn) {
      setAuthModalVisible(true);
      return;
    }

    if (!currentProfile || isProcessingSwipe.current) return;
    isProcessingSwipe.current = true;

    const res = swipeProfile(currentProfile.id, action);
    if (res.requestSent && res.profile) {
      setRequestSentProfile(res.profile);
      setTimeout(() => {
        setRequestSentProfile(null);
      }, 2000);
    }
    
    // Release lock immediately after sync function completes
    isProcessingSwipe.current = false;
  };

  const handleBoostProfile = () => {
    if (!isLoggedIn) {
      setAuthModalVisible(true);
      return;
    }
    Alert.alert(
      '⚡ Profile Boost Activated!',
      'Your profile is now boosted to #1 in your city for the next 30 minutes! You will appear first to all nearby singles.',
      [{ text: 'Awesome 🚀' }]
    );
  };

  const bgTheme = isDarkMode ? '#000000' : '#F3F4F6';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme }]}>
        <Header />

      <View style={styles.container}>
        {currentProfile ? (
          <>
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

            </View>
            
            {/* SLEEK GLASS FLOATING ACTION BUTTONS */}
            <View style={styles.actionControls}>
              {/* 1. Rewind */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                ]}
                activeOpacity={0.6}
                onPress={() => handleSwipe('pass')}
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
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 10
                  }
                ]}
                activeOpacity={0.6}
                onPress={() => handleSwipe('pass')}
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
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#00E5FF',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 8
                  }
                ]}
                activeOpacity={0.6}
                onPress={() => handleSwipe('supersynk')}
              >
                <Ionicons name="star" size={28} color="#00E5FF" />
              </TouchableOpacity>

              {/* 4. Synk / Like */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.largeBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', 
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#FD3A73',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 12
                  }
                ]}
                activeOpacity={0.6}
                onPress={() => handleSwipe('like')}
              >
                <Ionicons name="heart" size={36} color="#FD3A73" />
              </TouchableOpacity>

              {/* 5. Boost */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.smallBtn,
                  { backgroundColor: isDarkMode ? '#1E202B' : '#FFFFFF', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
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