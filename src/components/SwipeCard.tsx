import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UserProfile } from '../types';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 8, 440);
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.74, 700);
// Reduced threshold so it's much easier to physically swipe without it bouncing back
const SWIPE_THRESHOLD = CARD_WIDTH * 0.15;

interface Props {
  profile: UserProfile;
  isFirst?: boolean;
  onSwipe?: (action: 'like' | 'pass' | 'supersynk', profileId?: string) => void;
  onShowProfile?: () => void;
}

export interface SwipeCardHandle {
  triggerSwipe: (action: 'like' | 'pass' | 'supersynk') => void;
}

export const SwipeCard = React.forwardRef(({ profile, isFirst = true, onSwipe, onShowProfile }: Props, ref: React.Ref<SwipeCardHandle>) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = (profile.photos && profile.photos.length > 0) ? profile.photos : [profile.photo];
  const position = useRef(new Animated.ValueXY()).current;

  // Reset position and photo when profile changes
  React.useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    setPhotoIndex(0);
  }, [profile.id, position]);

  const isFirstRef = useRef(isFirst);
  isFirstRef.current = isFirst;
  const profileIdRef = useRef(profile.id);
  profileIdRef.current = profile.id;
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  // Touch gesture physics
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirstRef.current,
      onMoveShouldSetPanResponder: (_, gesture) => isFirstRef.current && (Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6),
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          triggerSwipe('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          triggerSwipe('pass');
        } else if (gesture.dy < -SWIPE_THRESHOLD * 1.3) {
          triggerSwipe('supersynk');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const forceSwipe = (action: 'like' | 'pass' | 'supersynk', toX: number, toY: number, duration = 450) => {
    Animated.timing(position, {
      toValue: { x: toX, y: toY },
      duration,
      useNativeDriver: true,
    }).start(() => {
      onSwipeRef.current && onSwipeRef.current(action, profileIdRef.current);
    });
  };

  const triggerSwipe = (action: 'like' | 'pass' | 'supersynk') => {
    if (action === 'like') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
      forceSwipe('like', SCREEN_WIDTH + 100, 0, 450);
    } else if (action === 'pass') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
      forceSwipe('pass', -SCREEN_WIDTH - 100, 0, 450);
    } else if (action === 'supersynk') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      forceSwipe('supersynk', 0, -SCREEN_HEIGHT, 450);
    }
  };

  React.useImperativeHandle(ref, () => ({
    triggerSwipe: (action: 'like' | 'pass' | 'supersynk') => {
      triggerSwipe(action);
    }
  }));

  // Tap photo left / right like Tinder & Instagram
  const handlePhotoTap = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (photoIndex < photos.length - 1) {
        setPhotoIndex(prev => prev + 1);
      } else if (onShowProfile) {
        onShowProfile();
      }
    } else {
      if (photoIndex > 0) {
        setPhotoIndex(prev => prev - 1);
      }
    }
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-18deg', '0deg', '18deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superOpacity = position.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 1.2, -30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardStyle = isFirst
    ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      }
    : {
        transform: [{ scale: 0.96 }, { translateY: 8 }],
        opacity: 0.9,
      };

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <Image source={{ uri: photos[photoIndex] || profile.photo }} style={styles.photo} contentFit="cover" transition={200} />

      {/* Top Dot Progress Indicators (Exact Tinder Dot Bars) */}
      <View style={styles.dotContainer}>
        {photos.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              { backgroundColor: idx === photoIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)' }
            ]}
          />
        ))}
      </View>

      {/* Tap Left / Right for Photo Flipping */}
      {isFirst && (
        <View style={styles.tapNavigationOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.tapLeft} activeOpacity={1} onPress={() => handlePhotoTap('left')} />
          <TouchableOpacity style={styles.tapRight} activeOpacity={1} onPress={() => handlePhotoTap('right')} />
        </View>
      )}

      {/* Subtle Vignette Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
        locations={[0, 0.6, 1]}
        style={styles.gradientOverlay}
      />

      {/* BRAND-SPECIFIC SYNK STAMP */}
      {isFirst && (
        <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
          <Text style={styles.likeStampText}>SYNK!</Text>
        </Animated.View>
      )}

      {/* BRAND-SPECIFIC PASS STAMP */}
      {isFirst && (
        <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
          <Text style={styles.nopeStampText}>PASS</Text>
        </Animated.View>
      )}

      {/* Ultra-Clean Modern Profile Details */}
      <View style={styles.infoContainer}>
        {/* Sleek Pull Handle Bar ("danda") for viewing profile */}
        <TouchableOpacity 
          style={styles.handleContainer} 
          onPress={onShowProfile}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>

        <View style={styles.infoHeaderRow}>
          <View style={styles.nameContent}>
            {/* Name, Age & Verified Shield */}
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>
                {profile.name}, <Text style={styles.ageText}>{profile.age}</Text>
              </Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={18} color="#00E5FF" />
                </View>
              )}
            </View>

            {/* Profession & Distance 1-Liner (Strict Dating Privacy: Distance only, no city name) */}
            {(profile.occupation || profile.distance) && (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {[
                  profile.occupation,
                  profile.distance || 'Nearby'
                ].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>

          {/* Info (i) Button for Full Profile Modal */}
          <TouchableOpacity 
            style={styles.infoBtn} 
            activeOpacity={0.8} 
            onPress={onShowProfile}
          >
            <Ionicons name="information" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* 3 Clean Subtle Glass Tag Chips */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsGrid}>
            {profile.interests.slice(0, 3).map((item, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0F1017',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dotContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tapNavigationOverlay: {
    ...StyleSheet.absoluteFill as any,
    flexDirection: 'row',
    zIndex: 5,
  },
  tapLeft: {
    flex: 1,
    height: '75%',
  },
  tapRight: {
    flex: 1,
    height: '75%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  stamp: {
    position: 'absolute',
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 100,
  },
  likeStamp: {
    top: 50,
    left: 20,
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.2)',
    transform: [{ rotate: '-12deg' }],
  },
  likeStampText: {
    color: '#FD3A73',
    fontSize: 40,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 4,
  },
  nopeStamp: {
    top: 50,
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    transform: [{ rotate: '12deg' }],
  },
  nopeStampText: {
    color: '#EF4444',
    fontSize: 40,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 4,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 6,
    zIndex: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 2,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nameContent: {
    flex: 1,
    paddingRight: 8,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Poppins_900Black',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ageText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_400Regular',
  },
  verifiedBadge: {
    marginTop: 4,
  },
  subtitleText: {
    color: '#D1D5DB',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.2,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
});
