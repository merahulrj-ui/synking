import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../contexts/AppContext';

import { MatchCelebrationModal } from '../../components/MatchCelebrationModal';
import { CallModal } from '../../components/CallModal';
import { WebRTCService } from '../../services/webrtcService';
import { RealtimeBridge } from '../../services/realtimeBridge';
import { CallSession } from '../../types';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const { isDarkMode, incomingRequests, currentUser, acceptedMatchAlert, clearAcceptedMatchAlert, isSuspended, suspendedUntil } = useApp();
  const [activeCall, setActiveCall] = React.useState<CallSession | null>(null);
  const [timeLeft, setTimeLeft] = React.useState<string>('');
  const [unreadChatCount, setUnreadChatCount] = React.useState<number>(0);
  const seenBadgeIds = React.useRef(new Set<string>());

  React.useEffect(() => {
    const unsubscribeMsg = RealtimeBridge.subscribe(({ type, payload }) => {
      if (type === 'NEW_MESSAGE' && payload) {
        const msg = payload;
        
        // ⛔ Deduplicate badge increments
        if (seenBadgeIds.current.has(msg.id)) return;
        seenBadgeIds.current.add(msg.id);

        // Only count messages addressed to ME, not all broadcast messages
        if (msg.senderId && msg.senderId !== currentUser?.id && msg.receiverId === currentUser?.id) {
          setUnreadChatCount(prev => prev + 1);
        }
      }
    });
    return () => unsubscribeMsg();
  }, [currentUser]);

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
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: tabBarBg,
              borderTopColor: isDarkMode ? 'rgba(253, 58, 115, 0.18)' : borderCol,
              height: 56 + safeBottom,
              paddingBottom: safeBottom,
              ...(isDarkMode ? {
                shadowColor: '#FD3A73',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 14,
              } : {}),
            }
          ],
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
                <View style={[
                  styles.inSynkCircle,
                  focused ? styles.inSynkCircleActive : styles.inSynkCircleInactive,
                  focused && {
                    shadowColor: '#FD3A73',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                    elevation: 10,
                  }
                ]}>
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
          listeners={{
            tabPress: () => {
              setUnreadChatCount(0);
            },
          }}
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused, color }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
                {unreadChatCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{unreadChatCount}</Text>
                  </View>
                )}
              </View>
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
    paddingTop: 6,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inSynkCircleInactive: {
    opacity: 1,
  },
  inSynkCircleActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  inSynkTabIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
