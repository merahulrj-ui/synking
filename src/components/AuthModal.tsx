import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from './GradientButton';
import { useApp } from '../contexts/AppContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetUserName?: string;
}

export const AuthModal: React.FC<Props> = ({ visible, onClose, targetUserName }) => {
  const { loginUser, isDarkMode } = useApp();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [ageVerified, setAgeVerified] = useState(true);

  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const inputBg = isDarkMode ? '#1A1B28' : '#F1F5F9';

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    setOtp('1234');
    Alert.alert('OTP Sent 📲', 'Testing OTP has been set to: 1234');
  };

  const handleVerifyOtp = () => {
    if (!ageVerified) {
      Alert.alert('Terms & Guidelines', 'Please agree to our community safety guidelines to continue.');
      return;
    }
    const formattedPhone = phone ? `+91 ${phone}` : '+91 98765 43210';
    loginUser({
      id: `user_${Date.now().toString(36)}`,
      name: 'New Member',
      age: 22,
      gender: 'male',
      occupation: 'Member',
      location: 'Roorkee',
      phoneNumber: formattedPhone,
      distance: '0 km',
      bio: 'Looking for great conversations at specialty cafes ✨',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'],
      interests: ['Coffee', 'Music', 'Travel'],
      compatibility: 100,
      isVerified: true,
      isVip: false,
    });
    onClose();
    Alert.alert('Welcome to SYNKING! 🎉', 'You are now signed in securely. Visit the Profile tab to update your details.');
  };

  const handleQuickDemoLogin = () => {
    handleVerifyOtp();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Close Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('../../assets/images/logo_emblem.png')}
                style={{ width: 28, height: 28, borderRadius: 8 }}
                resizeMode="contain"
              />
              <Text style={[styles.logo, { color: textColor }]}>SYNKING</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: textColor }]}>
              {targetUserName
                ? `Sign In to Synk with ${targetUserName} 💖`
                : 'Turn your SynkOn. Meet IRL.'}
            </Text>
            <Text style={[styles.subtitle, { color: subText }]}>
              Verified Profiles · Curated Safe Outlets · 1-on-1 Encrypted Chat
            </Text>

            {/* Safety Guarantee Chip */}
            <TouchableOpacity
              style={[styles.safetyCheckRow, { backgroundColor: isDarkMode ? 'rgba(0, 229, 255, 0.08)' : '#F0F9FF', borderColor: isDarkMode ? 'rgba(0, 229, 255, 0.3)' : '#BAE6FD' }]}
              activeOpacity={0.8}
              onPress={() => setAgeVerified(!ageVerified)}
            >
              <Text style={styles.checkIcon}>{ageVerified ? '✅' : '⬜'}</Text>
              <Text style={[styles.safetyText, { color: isDarkMode ? '#E5E7EB' : '#0369A1' }]}>
                I agree to the <Text style={{ fontWeight: '800' }}>Terms of Service</Text> & safe public dating rules.
              </Text>
            </TouchableOpacity>

            {!otpSent ? (
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: subText }]}>Enter Mobile Number</Text>
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

                <GradientButton
                  title="Send Verification OTP 📲"
                  onPress={handleSendOtp}
                  style={{ marginTop: 14 }}
                />

                <TouchableOpacity
                  style={[styles.quickDemoBtn, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', borderColor: borderCol }]}
                  onPress={handleQuickDemoLogin}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickDemoText, { color: textColor }]}>⚡ Fast Demo 1-Tap Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: subText }]}>Enter 4-Digit OTP (Demo: 1234)</Text>
                <TextInput
                  style={[styles.otpInput, { backgroundColor: inputBg, borderColor: borderCol, color: textColor }]}
                  placeholder="••••"
                  placeholderTextColor={subText}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                />

                <GradientButton
                  title="Verify & Enter SYNKING 🔥"
                  onPress={handleVerifyOtp}
                  style={{ marginTop: 14 }}
                />

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: 'center' }}
                  onPress={() => setOtpSent(false)}
                >
                  <Text style={{ color: '#FD3A73', fontSize: 12, fontWeight: '700' }}>
                    ← Edit Phone Number
                  </Text>
                </TouchableOpacity>
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
    maxHeight: '85%',
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
    marginBottom: 14,
  },
  safetyCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 14,
  },
  safetyText: {
    fontSize: 11.5,
    flex: 1,
    lineHeight: 15,
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
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
    fontWeight: '600',
  },
  otpInput: {
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 8,
  },
  quickDemoBtn: {
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickDemoText: {
    fontSize: 13,
    fontWeight: '800',
  },
});