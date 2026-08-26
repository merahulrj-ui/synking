import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLocalBackendUrl } from '../services/firebase';

const CURRENT_APP_BUILD = 101; // Current local build number

export const OTAUpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch(`${getLocalBackendUrl()}/api/version`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.buildNumber > CURRENT_APP_BUILD) {
            setUpdateInfo(data);
            setUpdateAvailable(true);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        }
      } catch (e) {}
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    }, 800);
  };

  if (!updateAvailable) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={18} color="#FD3A73" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>🚀 Live OTA Update Available</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{updateInfo?.version || '1.0.2'}</Text>
            </View>
          </View>
          <Text style={styles.subText} numberOfLines={1}>
            {updateInfo?.notes || 'Zomato-speed instant live update ready!'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={handleApplyUpdate}
          activeOpacity={0.8}
          disabled={isUpdating}
        >
          <Ionicons name={isUpdating ? 'refresh' : 'flash'} size={14} color="#FFF" />
          <Text style={styles.updateBtnText}>
            {isUpdating ? 'Syncing...' : 'Update ⚡'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 999,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FD3A73',
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  versionBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  versionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  subText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  updateBtn: {
    backgroundColor: '#FD3A73',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
