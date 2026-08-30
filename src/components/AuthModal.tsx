import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from './GradientButton';
import { useApp } from '../contexts/AppContext';
import { getLocalBackendUrl } from '../services/firebase';
import { UserProfile } from '../types';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetUserName?: string;
}

export const AuthModal: React.FC<Props> = ({ visible, onClose, targetUserName }) => {
  const { loginUser, isDarkMode } = useApp();

  // Form States
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('22');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [ageVerified, setAgeVerified] = useState(true);

  // Flow State
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserProfile, setExistingUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Theme Colors
  const cardBg = isDarkMode ? '#11141E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const inputBg = isDarkMode ? '#181C28' : '#F1F5F9';

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  // Reset Form on Open
  useEffect(() => {
    if (visible) {
      setOtpSent(false);
      setOtp('');
      setIsExistingUser(false);
      setExistingUserProfile(null);
      setIsLoading(false);
      setResendTimer(30);
    }
  }, [visible]);

  // Step 1: Send OTP & Auto-Detect Existing Account
  const handleSendOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!ageVerified) {
      Alert.alert('Terms Required', 'Please agree to the community guidelines & 18+ safety terms.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = `+91 ${cleanDigits.slice(-10)}`;
      const res = await fetch(`${getLocalBackendUrl()}/api/check-phone?phone=${encodeURIComponent(formattedPhone)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.user) {
          setIsExistingUser(true);
          setExistingUserProfile(data.user);
          setName(data.user.name || '');
          setGender(data.user.gender || 'male');
          setAge(String(data.user.age || 22));
        } else {
          setIsExistingUser(false);
          setExistingUserProfile(null);
          // If new user, ensure name is entered
          if (!name || name.trim().length < 2) {
            setIsLoading(false);
            Alert.alert('Welcome to SYNKING! 🎉', 'Please enter your Full Name and Age to set up your profile.');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[AUTH_CHECK_PHONE_ERROR]', e);
    } finally {
      setIsLoading(false);
    }

    setOtpSent(true);
    setOtp('1234');
    setResendTimer(30);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Step 2: Verify OTP & Sign In
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 4) {
      Alert.alert('OTP Required', 'Please enter the 4-digit verification code.');
      return;
    }

    setIsLoading(true);
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91 ${cleanDigits}`;

    try {
      // 1. If Existing User: Login with full saved profile from Turso
      if (isExistingUser && existingUserProfile) {
        await loginUser(existingUserProfile);
        setIsLoading(false);
        onClose();
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Welcome Back! 🎉', `Signed in as ${existingUserProfile.name}. All matches & chats restored.`);
        return;
      }

      // 2. If New User: Create fresh profile with user-selected details
      const defaultMalePhoto = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800';
      const defaultFemalePhoto = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';
      const finalPhoto = gender === 'female' ? defaultFemalePhoto : defaultMalePhoto;

      const newUser: UserProfile = {
        id: `user_${cleanDigits}`,
        name: name.trim() || (gender === 'female' ? 'Priya' : 'Rahul'),
        age: parseInt(age, 10) || 22,
        gender: gender,
        occupation: gender === 'female' ? 'UI/UX Designer' : 'Software Engineer',
        location: 'Roorkee',
        phoneNumber: formattedPhone,
        distance: '0 km',
        bio: 'Coffee lover & great conversations ☕ Looking to meet genuine people!',
        photo: finalPhoto,
        photos: [finalPhoto],
        interests: ['☕ Specialty Coffee', '🎸 Indie Music', '🚗 Road Trips', '🤖 Tech & AI'],
        lookingFor: '💘 Long-term partner',
        zodiac: gender === 'female' ? 'Virgo ♍' : 'Leo ♌',
        workout: 'Often (3-4x/wk) 🏃',
        drinking: 'Socially 🥂',
        smoking: 'Non-smoker 🚭',
        dietary: 'Vegetarian 🥦',
        pets: gender === 'female' ? 'Cat Person 🐱' : 'Dog Lover 🐶',
        height: gender === 'female' ? '5 ft 5 in' : '5 ft 10 in',
        hometown: 'Roorkee, UK',
        compatibility: 100,
        isVerified: true,
        isVip: false,
      };

      await loginUser(newUser);
      setIsLoading(false);
      onClose();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome to SYNKING! 🎉', `Welcome, ${newUser.name}! Your verified profile is active.`);
    } catch (e) {
      setIsLoading(false);
      Alert.alert('Login Error', 'Unable to complete sign-in. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
                source={require('../../assets/images/logo_emblem.png')}
                style={{ width: 32, height: 32, borderRadius: 10 }}
                resizeMode="contain"
              />
              <View>
                <Text style={[styles.logo, { color: textColor }]}>SYNKING</Text>
                <Text style={{ fontSize: 10, color: '#FD3A73', fontWeight: '800' }}>IRL DATING · SECURE P2P</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: textColor }]}>
              {targetUserName
                ? `Sign In to Synk with ${targetUserName} 💖`
                : otpSent
                ? 'Verify Your Mobile 📲'
                : 'Welcome to SYNKING. Meet IRL. 🔥'}
            </Text>
            <Text style={[styles.subtitle, { color: subText }]}>
              {otpSent
                ? `Enter the 4-digit code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
                : 'Instant verified profiles · Curated cafes · 1-on-1 Encrypted calling'}
            </Text>

            {/* STEP 1: PHONE & PROFILE SETUP */}
            {!otpSent ? (
              <View style={styles.formGroup}>
                {/* Mobile Number Input */}
                <Text style={[styles.inputLabel, { color: subText }]}>Mobile Number</Text>
                <View style={[styles.phoneInputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <Text style={[styles.countryCode, { color: textColor }]}>🇮🇳 +91</Text>
                  <TextInput
                    style={[styles.phoneInput, { color: textColor }]}
                    placeholder="98765 43210"
                    placeholderTextColor={subText}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* Name Input */}
                <Text style={[styles.inputLabel, { color: subText, marginTop: 6 }]}>Your Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor }]}
                  placeholder="e.g. Rahul Kumar"
                  placeholderTextColor={subText}
                  value={name}
                  onChangeText={setName}
                />

                {/* Gender & Age Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                  {/* Gender Selector */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={[styles.inputLabel, { color: subText }]}>I am</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[
                          styles.genderBtn,
                          { backgroundColor: inputBg, borderColor: gender === 'male' ? '#FD3A73' : borderCol },
                          gender === 'male' && styles.genderBtnActive,
                        ]}
                        onPress={() => setGender('male')}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: gender === 'male' ? '#FFF' : textColor }}>
                          👦 Male
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genderBtn,
                          { backgroundColor: inputBg, borderColor: gender === 'female' ? '#FD3A73' : borderCol },
                          gender === 'female' && styles.genderBtnActive,
                        ]}
                        onPress={() => setGender('female')}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: gender === 'female' ? '#FFF' : textColor }}>
                          👧 Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Age Input */}
                  <View style={{ flex: 0.8 }}>
                    <Text style={[styles.inputLabel, { color: subText }]}>Age</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor, textAlign: 'center' }]}
                      placeholder="22"
                      placeholderTextColor={subText}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                </View>

                {/* Safety Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.safetyCheckRow,
                    {
                      backgroundColor: isDarkMode ? 'rgba(0, 229, 255, 0.08)' : '#F0F9FF',
                      borderColor: isDarkMode ? 'rgba(0, 229, 255, 0.25)' : '#BAE6FD',
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setAgeVerified(!ageVerified)}
                >
                  <Ionicons
                    name={ageVerified ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={ageVerified ? '#00E5FF' : subText}
                  />
                  <Text style={[styles.safetyText, { color: isDarkMode ? '#E5E7EB' : '#0369A1' }]}>
                    I am 18+ and agree to SYNKING's <Text style={{ fontWeight: '800' }}>Terms of Service</Text> & safe dating rules.
                  </Text>
                </TouchableOpacity>

                {/* Send OTP Button */}
                {isLoading ? (
                  <ActivityIndicator size="large" color="#FD3A73" style={{ marginVertical: 14 }} />
                ) : (
                  <GradientButton
                    title="Send Verification OTP 📲"
                    onPress={handleSendOtp}
                    style={{ marginTop: 8 }}
                  />
                )}
              </View>
            ) : (
              /* STEP 2: OTP VERIFICATION */
              <View style={styles.formGroup}>
                {/* Account Status Badge */}
                {isExistingUser && existingUserProfile ? (
                  <View style={[styles.existingUserBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: borderCol }]}>
                    <Image source={{ uri: existingUserProfile.photo }} style={styles.badgeAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontWeight: '900', fontSize: 14 }}>
                        Welcome back, {existingUserProfile.name}! 👋
                      </Text>
                      <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 11 }}>
                        Account Verified & Synked
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.existingUserBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: borderCol }]}>
                    <Text style={{ fontSize: 20 }}>✨</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontWeight: '900', fontSize: 14 }}>
                        Creating New Profile for {name || 'You'}
                      </Text>
                      <Text style={{ color: '#FD3A73', fontWeight: '700', fontSize: 11 }}>
                        {gender === 'female' ? '👧 Female' : '👦 Male'} · {age} yrs · Roorkee
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: subText, marginTop: 10 }]}>
                  Enter 4-Digit OTP (Demo Code: 1234)
                </Text>

                <TextInput
                  style={[styles.otpInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor }]}
                  placeholder="••••"
                  placeholderTextColor={subText}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FD3A73" style={{ marginVertical: 14 }} />
                ) : (
                  <GradientButton
                    title="Verify & Enter SYNKING 🔥"
                    onPress={handleVerifyOtp}
                    style={{ marginTop: 14 }}
                  />
                )}

                {/* Resend & Change Number Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <TouchableOpacity onPress={() => setOtpSent(false)}>
                    <Text style={{ color: '#FD3A73', fontSize: 12, fontWeight: '800' }}>
                      ← Change Phone
                    </Text>
                  </TouchableOpacity>

                  {resendTimer > 0 ? (
                    <Text style={{ color: subText, fontSize: 12, fontWeight: '600' }}>
                      Resend in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '800' }}>
                        Resend OTP 🔄
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    fontWeight: '700',
  },
  genderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#FD3A73',
    borderColor: '#FD3A73',
  },
  safetyCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  existingUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
  },
  badgeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  otpInput: {
    borderRadius: 16,
    borderWidth: 1.5,
    height: 54,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 10,
  },
});