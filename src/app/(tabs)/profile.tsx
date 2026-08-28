import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch, TextInput, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { GradientButton } from '../../components/GradientButton';
import { AuthModal } from '../../components/AuthModal';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { currentUser, isLoggedIn, isDarkMode, toggleTheme, updateCurrentUser, loginUser, logoutUser, deleteAccount } = useApp();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAge, setEditAge] = useState((currentUser?.age || 22).toString());
  const [editCity, setEditCity] = useState(
    typeof currentUser?.location === 'object' ? (currentUser?.location?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')
  );
  const [editOccupation, setEditOccupation] = useState(currentUser?.occupation || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Delete Profile Permanently?\n\nThis will permanently remove your profile, match requests, and chat data from the database.'
      );
      if (confirmed) {
        await deleteAccount();
        window.alert('Profile Deleted: Your account has been deleted from the database.');
      }
    } else {
      Alert.alert(
        '⚠️ Delete Profile Permanently?',
        'This will permanently remove your profile, match requests, and chat data from the database.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently 🗑️',
            style: 'destructive',
            onPress: async () => {
              await deleteAccount();
              Alert.alert('Profile Deleted', 'Your account has been deleted from the database.');
            }
          }
        ]
      );
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of your account?');
      if (confirmed) {
        logoutUser();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out 🚪', style: 'destructive', onPress: () => logoutUser() }
        ]
      );
    }
  };

  const handleSendLoginOtp = () => {
    const digits = loginPhone.replace(/\D/g, '');
    if (!digits || digits.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      if (Platform.OS === 'web') window.alert(`Mobile Number Required\n\n${msg}`);
      else Alert.alert('Mobile Number Required', msg);
      return;
    }
    setIsOtpSent(true);
    setLoginOtp('1234');
    const msg = 'Testing verification code is: 1234';
    if (Platform.OS === 'web') window.alert(`OTP Sent 📲\n\n${msg}`);
    else Alert.alert('OTP Sent 📲', msg);
  };

  const handleVerifyLoginOtp = () => {
    const cleanPhone = loginPhone ? `+91 ${loginPhone.replace(/\D/g, '')}` : '+91 98765 43210';
    const newUser: UserProfile = {
      id: `user_${Date.now().toString(36)}`,
      name: editName.trim() || 'Rahul Member',
      age: parseInt(editAge, 10) || 24,
      gender: 'male',
      occupation: editOccupation.trim() || 'Software Engineer',
      location: editCity.trim() || 'Roorkee',
      phoneNumber: cleanPhone,
      distance: '0 km',
      bio: editBio.trim() || 'Ready to connect and meet at great venues ✨',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'],
      interests: ['Coffee', 'Music', 'Travel'],
      compatibility: 100,
      isVerified: true,
      isVip: false,
    };
    loginUser(newUser);
    setEditName(newUser.name);
    setEditAge(newUser.age.toString());
    setEditBio(newUser.bio);
    setEditCity(typeof newUser.location === 'object' ? (newUser.location?.city || 'Roorkee') : newUser.location);
    setEditModalVisible(true);
    if (Platform.OS === 'web') {
      window.alert('Signed In! 🎉\n\nWelcome to SYNKING! Please complete your profile details.');
    } else {
      Alert.alert('Signed In! 🎉', 'Welcome to SYNKING! Please complete your profile details.');
    }
  };

  const handleQuickCreateProfile = () => {
    handleVerifyLoginOtp();
  };

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
    if (Platform.OS === 'web') {
      window.alert(`Profile Saved ✨\n\nUpdated for ${editCity || 'Roorkee'} network.`);
    } else {
      Alert.alert('Profile Saved ✨', `Updated for ${editCity || 'Roorkee'} network.`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          // Direct Phone + OTP Login Card
          <View style={[styles.guestCard, { backgroundColor: cardBg, borderColor, padding: 24, gap: 14 }]}>
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Image
                source={require('../../../assets/images/logo_emblem.png')}
                style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 12 }}
                resizeMode="contain"
              />
              <Text style={[styles.guestTitle, { color: textColor, fontSize: 22, fontWeight: '900' }]}>Sign In with Phone ⚡</Text>
              <Text style={[styles.guestSub, { color: subText, textAlign: 'center', marginTop: 4 }]}>
                Enter your mobile number to sign in, verify your identity, and update your profile.
              </Text>
            </View>

            {/* Testing Mode Banner */}
            <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: 'rgba(0, 229, 255, 0.3)', borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '800' }}>🧪 TESTING MODE ACTIVE</Text>
              <Text style={{ color: subText, fontSize: 11, marginTop: 2 }}>Enter any 10-digit number & OTP (Default: 1234)</Text>
            </View>

            {!isOtpSent ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: subText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1A1B28' : '#F1F5F9', borderRadius: 14, borderWidth: 1, borderColor, paddingHorizontal: 12 }}>
                  <Text style={{ color: textColor, fontWeight: '800', fontSize: 15, marginRight: 8 }}>🇮🇳 +91</Text>
                  <TextInput
                    style={{ flex: 1, height: 48, color: textColor, fontSize: 16, fontWeight: '700' }}
                    placeholder="98765 43210"
                    placeholderTextColor={subText}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={loginPhone}
                    onChangeText={setLoginPhone}
                  />
                </View>

                <GradientButton
                  title="Send Verification OTP 📲"
                  onPress={handleSendLoginOtp}
                  style={{ marginTop: 6 }}
                />

                {/* 1-Tap Instant Guest Login Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(253, 58, 115, 0.12)',
                    borderColor: '#FD3A73',
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                  onPress={handleQuickCreateProfile}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FD3A73', fontWeight: '800', fontSize: 14 }}>⚡ 1-Tap Quick Setup Profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: subText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>Verification OTP</Text>
                  <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                    <Text style={{ color: '#FD3A73', fontSize: 12, fontWeight: '800' }}>Change Number</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={{
                    backgroundColor: isDarkMode ? '#1A1B28' : '#F1F5F9',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor,
                    color: textColor,
                    fontSize: 24,
                    fontWeight: '900',
                    textAlign: 'center',
                    letterSpacing: 10,
                    height: 54,
                  }}
                  placeholder="1234"
                  placeholderTextColor={subText}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={loginOtp}
                  onChangeText={setLoginOtp}
                />

                <GradientButton
                  title="Verify OTP & Sign In 🚀"
                  onPress={handleVerifyLoginOtp}
                  style={{ marginTop: 6 }}
                />
              </View>
            )}
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
                💼 {currentUser?.occupation} • 📍 {typeof currentUser?.location === 'object' ? (currentUser?.location?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')}
              </Text>

              {/* Edit Profile Button */}
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  const cityStr = typeof currentUser?.location === 'object' ? (currentUser?.location?.city || 'Roorkee') : (currentUser?.location || 'Roorkee');
                  setEditName(currentUser?.name || '');
                  setEditAge((currentUser?.age || 22).toString());
                  setEditCity(cityStr);
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

              {/* 🗑️ DELETE PROFILE BUTTON */}
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor, marginTop: 8 }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.settingText, { color: '#EF4444' }]}>
                    Delete Account Permanently 🗑️
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={subText} />
              </TouchableOpacity>

              {/* 🚪 LOGOUT BUTTON (AT THE VERY BOTTOM) */}
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor, marginTop: 8 }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="log-out-outline" size={20} color="#94A3B8" />
                  <Text style={[styles.settingText, { color: textColor }]}>
                    Log Out
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