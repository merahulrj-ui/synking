import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { GradientButton } from '../../components/GradientButton';
import { AuthModal } from '../../components/AuthModal';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { currentUser, isLoggedIn, isDarkMode, toggleTheme, updateCurrentUser } = useApp();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAge, setEditAge] = useState((currentUser?.age || 22).toString());
  const [editCity, setEditCity] = useState(currentUser?.location || 'Roorkee');
  const [editOccupation, setEditOccupation] = useState(currentUser?.occupation || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const router = useRouter();

  const bg = isDarkMode ? '#05060A' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : '#111827';
  const subText = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cardBg = isDarkMode ? '#11121A' : '#FFFFFF';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const handleSaveProfile = () => {
    updateCurrentUser({
      name: editName.trim() || 'Member',
      age: parseInt(editAge, 10) || 22,
      location: editCity.trim() || 'Roorkee',
      occupation: editOccupation.trim() || 'Member',
      bio: editBio.trim(),
    });
    setEditModalVisible(false);
    Alert.alert('Profile Saved ✨', `Updated for ${editCity || 'Roorkee'} network.`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          // Guest State Card
          <View style={[styles.guestCard, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="person-circle-outline" size={56} color="#FD3A73" />
            <Text style={[styles.guestTitle, { color: textColor }]}>Welcome to SYNKING</Text>
            <Text style={[styles.guestSub, { color: subText }]}>
              Sign in to verify your identity, send Synk requests, and plan safe dates in Roorkee.
            </Text>
            <GradientButton
              title="Sign In with Phone / OTP ⚡"
              onPress={() => setAuthModalVisible(true)}
              style={{ marginTop: 10, width: '100%' }}
            />
          </View>
        ) : (
          // Real Logged In User Profile
          <>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarRing, currentUser?.isVip && styles.avatarRingVip]}>
                <Image
                  source={{ uri: currentUser?.photo }}
                  style={styles.avatar}
                />
                {currentUser?.isVip && (
                  <View style={styles.crownBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                  </View>
                )}
              </View>

              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: textColor }]}>{currentUser?.name}, {currentUser?.age}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#0284C7" />
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              </View>

              <Text style={[styles.occupation, { color: subText }]}>
                💼 {currentUser?.occupation} • 📍 {currentUser?.location || 'Roorkee'}
              </Text>

              {/* Edit Profile Button */}
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  setEditName(currentUser?.name || '');
                  setEditAge((currentUser?.age || 22).toString());
                  setEditCity(currentUser?.location || 'Roorkee');
                  setEditOccupation(currentUser?.occupation || '');
                  setEditBio(currentUser?.bio || '');
                  setEditModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={14} color="#FD3A73" />
                <Text style={styles.editBtnText}>Edit Profile Info</Text>
              </TouchableOpacity>
            </View>

            {/* VIP Card */}
            <TouchableOpacity
              style={[
                styles.vipCard,
                {
                  backgroundColor: isDarkMode ? '#1E120A' : '#FEF3C7',
                  borderColor: isDarkMode ? '#FB8500' : '#F59E0B',
                },
              ]}
              onPress={() => router.push('/vip-membership')}
              activeOpacity={0.85}
            >
              <View style={styles.vipHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={18} color="#D97706" />
                  <Text style={[styles.vipTitle, { color: isDarkMode ? '#FB8500' : '#B45309' }]}>
                    {currentUser?.isVip ? 'SYNKING BLACK VIP (ACTIVE) 👑' : 'UPGRADE TO VIP CROWN ✨'}
                  </Text>
                </View>
                <View style={[styles.vipProBadge, { backgroundColor: isDarkMode ? '#FB8500' : '#F59E0B' }]}>
                  <Text style={styles.vipProText}>{currentUser?.isVip ? 'ACTIVE' : 'PRO'}</Text>
                </View>
              </View>
              <Text style={[styles.vipPerks, { color: isDarkMode ? '#E5E7EB' : '#451A03' }]}>
                • Unlimited SuperSynks & See Who Liked You{'\n'}
                • Free Welcome Drinks & Reserved Tables in Roorkee{'\n'}
                • Incognito Browsing & 5x Discovery Boost
              </Text>
              <View style={[styles.vipActionRow, { borderTopColor: isDarkMode ? 'rgba(251, 133, 0, 0.2)' : '#FDE68A' }]}>
                <Text style={[styles.vipActionText, { color: isDarkMode ? '#FB8500' : '#B45309' }]}>
                  {currentUser?.isVip ? 'Manage VIP Membership →' : 'View VIP Plans (from ₹199/mo) →'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* App Preferences & Settings */}
            <View style={styles.actionsContainer}>
              {/* Light / Dark Mode Toggle */}
              <View style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons
                    name={isDarkMode ? 'moon' : 'sunny'}
                    size={20}
                    color={isDarkMode ? '#A855F7' : '#F59E0B'}
                  />
                  <Text style={[styles.settingText, { color: textColor }]}>
                    {isDarkMode ? 'Dark Theme (OLED)' : 'Light Theme (Clean)'}
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E2E8F0', true: '#A855F7' }}
                  thumbColor={isDarkMode ? '#A855F7' : '#FFFFFF'}
                />
              </View>

              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}
                onPress={() => router.push('/verify-selfie')}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#00E5FF" />
                  <Text style={[styles.settingText, { color: textColor }]}>
                    Identity & Live Facial Verification
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={subText} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.editCard, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Edit Profile Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={subText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: subText }]}>Your Name</Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1E202B' : '#F1F5F9', color: textColor, borderColor }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Rahul / Tanya"
              placeholderTextColor={subText}
            />

            <Text style={[styles.fieldLabel, { color: subText }]}>City / Location</Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1E202B' : '#F1F5F9', color: textColor, borderColor }]}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="e.g. Roorkee"
              placeholderTextColor={subText}
            />

            <Text style={[styles.fieldLabel, { color: subText }]}>Occupation</Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1E202B' : '#F1F5F9', color: textColor, borderColor }]}
              value={editOccupation}
              onChangeText={setEditOccupation}
              placeholder="e.g. Student at IIT Roorkee"
              placeholderTextColor={subText}
            />

            <Text style={[styles.fieldLabel, { color: subText }]}>Bio</Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: isDarkMode ? '#1E202B' : '#F1F5F9', color: textColor, borderColor, minHeight: 60 }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell others what you like..."
              placeholderTextColor={subText}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save & Sync Profile ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guestCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  guestSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 270,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    backgroundColor: '#FD3A73',
    position: 'relative',
    marginBottom: 4,
  },
  avatarRingVip: {
    backgroundColor: '#FB8500',
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FB8500',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05060A',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  verifiedText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  occupation: {
    fontSize: 13,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  editBtnText: {
    color: '#FD3A73',
    fontSize: 12,
    fontWeight: '800',
  },
  vipCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginVertical: 10,
    gap: 8,
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  vipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipProBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vipProText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  vipPerks: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  vipActionRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  vipActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionsContainer: {
    marginVertical: 10,
    gap: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editCard: {
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#FD3A73',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});