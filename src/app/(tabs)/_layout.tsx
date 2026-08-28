import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';

import { MatchCelebrationModal } from '../../components/MatchCelebrationModal';
import { CallModal } from '../../components/CallModal';
import { WebRTCService } from '../../services/webrtcService';
import { CallSession } from '../../types';

export default function TabsLayout() {
  const { isDarkMode, incomingRequests, currentUser, acceptedMatchAlert, clearAcceptedMatchAlert, isSuspended, suspendedUntil } = useApp();
  const [activeCall, setActiveCall] = React.useState<CallSession | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (!isSuspended || !suspendedUntil) return;
    const update = () => {
      const diff = suspendedUntil - Date.now();
      if (diff <= 0) {
        setTimeLeft('Unlocking...');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isSuspended, suspendedUntil]);

  React.useEffect(() => {
    const unsubscribe = WebRTCService.subscribe(session => {
      setActiveCall(session);
    });
    return () => unsubscribe();
  }, []);

  const tabBarBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const activeColor = '#FD3A73';
  const inactiveColor = isDarkMode ? '#94A3B8' : '#64748B';

  return (
    <>
      {isSuspended && (
        <View style={styles.globalSuspensionBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
            <Text style={styles.suspensionBannerTitle}>ENTIRE ACCOUNT SUSPENDED (3 DAYS)</Text>
          </View>
          <Text style={styles.suspensionBannerSub}>
            Swipes, InSynk, Calls & Chats locked due to contact sharing violation. ⏳ Unlocks in {timeLeft}
          </Text>
        </View>
      )}
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { backgroundColor: tabBarBg, borderTopColor: borderCol }],
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        {/* 1. Swipe */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Swipe',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'flame' : 'flame-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* 2. Explore / Spots */}
        <Tabs.Screen
          name="venues"
          options={{
            title: 'Explore',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* 3. InSynk */}
        <Tabs.Screen
          name="matches"
          options={{
            title: 'InSynk',
            tabBarIcon: ({ focused }) => (
              <View style={styles.inSynkTabIconWrapper}>
                <View style={[styles.inSynkCircle, focused ? styles.inSynkCircleActive : styles.inSynkCircleInactive]}>
                  <Image
                    source={require('../../../assets/images/logo_emblem.png')}
                    style={styles.inSynkTabIcon}
                    resizeMode="contain"
                  />
                </View>
                {incomingRequests.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{incomingRequests.length}</Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        {/* 4. Chat */}
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* 5. Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Live "Request Accepted" Celebration Alert (Triggers in 0ms when other user accepts) */}
      <MatchCelebrationModal
        matchedUser={acceptedMatchAlert}
        onClose={clearAcceptedMatchAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  tabItem: {
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  inSynkTabIconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inSynkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inSynkCircleInactive: {
    opacity: 0.7,
  },
  inSynkCircleActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FD3A73',
    transform: [{ scale: 1.05 }],
  },
  inSynkTabIcon: {
    width: '100%',
    height: '100%',
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -5,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#05060A',
    zIndex: 10,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  globalSuspensionBanner: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
  },
  suspensionBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12.5,
    letterSpacing: 0.5,
  },
  suspensionBannerSub: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
