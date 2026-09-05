import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../types';
import { useApp } from '../contexts/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  profile: UserProfile | null;
  visible: boolean;
  onClose: () => void;
  onSwipe: (action: 'like' | 'pass' | 'supersynk') => void;
}

export const FullProfileModal: React.FC<Props> = ({ profile, visible, onClose, onSwipe }) => {
  const { isDarkMode } = useApp();
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!profile) return null;

  const photos = (profile.photos && profile.photos.length > 0) ? profile.photos : [profile.photo];
  const bgTheme = isDarkMode ? '#000000' : '#F8FAFC';
  const cardTheme = isDarkMode ? '#000000' : '#FFFFFF';
  const textTheme = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subTextTheme = isDarkMode ? '#94A3B8' : '#64748B';

  const handlePhotoTap = (direction: 'left' | 'right') => {
    if (direction === 'right' && photoIndex < photos.length - 1) {
      setPhotoIndex(prev => prev + 1);
    } else if (direction === 'left' && photoIndex > 0) {
      setPhotoIndex(prev => prev - 1);
    }
  };

  const handleAction = (action: 'like' | 'pass' | 'supersynk') => {
    onSwipe(action);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bgTheme }]}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 120 }} bounces={false}>
          
          {/* Photos Carousel Section */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: photos[photoIndex] || profile.photo }} style={styles.photo} contentFit="cover" transition={200} />
            
            <View style={styles.tapNavigationOverlay} pointerEvents="box-none">
              <TouchableOpacity style={styles.tapLeft} activeOpacity={1} onPress={() => handlePhotoTap('left')} />
              <TouchableOpacity style={styles.tapRight} activeOpacity={1} onPress={() => handlePhotoTap('right')} />
            </View>

            {/* Photo Pagination Dots */}
            {photos.length > 1 && (
              <View style={styles.dotContainer}>
                {photos.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      { backgroundColor: idx === photoIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' }
                    ]}
                  />
                ))}
              </View>
            )}

          </View>

          {/* Profile Details Section */}
          <View style={[styles.detailsCard, { backgroundColor: cardTheme }]}>
            {/* Close Button floating exactly on the border of Photo and Card */}
            <TouchableOpacity style={styles.closeBtnOverlay} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="chevron-down" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.nameRow}>
              <Text style={[styles.nameText, { color: textTheme }]}>
                {profile.name}, <Text style={styles.ageText}>{profile.age}</Text>
              </Text>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={20} color="#00E5FF" />
                </View>
              )}
            </View>

            {/* Profession & Distance 1-Liner (Strict Dating Privacy: Distance only, no city name) */}
            {(profile.occupation || profile.distance) && (
              <Text style={[styles.subtitleText, { color: subTextTheme }]}>
                {[
                  profile.occupation,
                  profile.distance || 'Nearby'
                ].filter(Boolean).join(' • ')}
              </Text>
            )}

            {/* Bio */}
            {profile.bio ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textTheme }]}>About Me</Text>
                <Text style={[styles.bioText, { color: subTextTheme }]}>{profile.bio}</Text>
              </View>
            ) : null}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textTheme }]}>Passions</Text>
                <View style={styles.interestsGrid}>
                    {profile.interests.map((item, idx) => (
                      <View key={idx} style={[styles.chip, { 
                        borderColor: isDarkMode ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0,0,0,0.1)',
                        shadowColor: '#00E5FF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isDarkMode ? 0.4 : 0,
                        shadowRadius: 8,
                        backgroundColor: isDarkMode ? 'rgba(0, 229, 255, 0.05)' : 'transparent'
                      }]}>
                        <Text style={[styles.chipText, { color: isDarkMode ? '#00E5FF' : '#334155' }]}>{item}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
            
            {/* Report/Block */}
            <TouchableOpacity style={styles.reportBtn}>
              <Text style={styles.reportText}>REPORT {profile.name.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Action Buttons at Bottom */}
        <View style={styles.floatingActions}>
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
            onPress={() => handleAction('pass')}
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
            onPress={() => handleAction('supersynk')}
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
                borderColor: isDarkMode ? 'rgba(253,58,115,0.3)' : 'rgba(0,0,0,0.05)',
                shadowColor: '#FD3A73',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDarkMode ? 0.6 : 0.3,
                shadowRadius: 20,
                elevation: 14
              }
            ]}
            activeOpacity={0.6}
            onPress={() => handleAction('like')}
          >
            <Ionicons name="heart" size={36} color="#FD3A73" />
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
  photoContainer: {
    width: '100%',
    height: Math.min(SCREEN_HEIGHT * 0.65, 600),
    position: 'relative',
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  tapNavigationOverlay: {
    ...StyleSheet.absoluteFill as any,
    flexDirection: 'row',
    zIndex: 5,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
  dotContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    zIndex: 10,
  },
  dot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    maxWidth: 40,
  },
  closeBtnOverlay: {
    position: 'absolute',
    top: -24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FD3A73',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  detailsCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: 400,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nameText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 229, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  ageText: {
    fontFamily: 'Poppins_400Regular',
  },
  verifiedBadge: {
    marginTop: 4,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  subtitleText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bioText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  reportBtn: {
    marginTop: 40,
    alignSelf: 'center',
    paddingVertical: 12,
  },
  reportText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(239, 68, 68, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: 480,
    // This perfectly centers absolute elements in React Native Web
    left: '50%',
    transform: [{ translateX: '-50%' }],
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
});

