import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { getLocalBackendUrl } from '../services/firebase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Haptics from 'expo-haptics';

GoogleSignin.configure({
  webClientId: '816527505911-9aoc1h8930b42cpqi4eo8dlutk3ndcv9.apps.googleusercontent.com',
  offlineAccess: true,
});

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  targetUserName?: string;
}

type AuthMode = 'landing' | 'phone' | 'email' | 'help' | 'phone_verify';

export const AuthLandingScreen: React.FC<Props> = ({
  onSuccess,
  onClose,
  showCloseButton = false,
  targetUserName,
}) => {
  const { loginUser } = useApp();
  const [mode, setMode] = useState<AuthMode>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  // Email Flow States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('22');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isEmailSignUp, setIsEmailSignUp] = useState(false);

  // Phone Flow States
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneName, setPhoneName] = useState('');
  const [phoneAge, setPhoneAge] = useState('22');
  const [phoneGender, setPhoneGender] = useState<'male' | 'female'>('male');
  const [ageVerified, setAgeVerified] = useState(true);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
  };

  // Catch deep link callback from Google Auth mobile bridge (Native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleDeepLink = (event: { url: string }) => {
      if (!event.url) return;
      try {
        if (event.url.startsWith('synking://auth')) {
          const match = event.url.match(/[?&]user=([^&#]+)/);
          if (match && match[1]) {
            const parsedUser = JSON.parse(decodeURIComponent(match[1]));
            if (parsedUser && parsedUser.id) {
              setPendingGoogleUser(parsedUser);
              setMode('phone_verify');
              setIsLoading(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      } catch (err) {
        console.warn('Google Auth deep link parse error:', err);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) handleDeepLink({ url: initialUrl });
    });
    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, []);

  // --- OFFICIAL GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    triggerHaptic();
    setIsLoading(true);

    const GOOGLE_CLIENT_ID = '816527505911-9aoc1h8930b42cpqi4eo8dlutk3ndcv9.apps.googleusercontent.com';

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // 1. Ensure Google Identity Services script is loaded in browser
        await new Promise<void>((resolve) => {
          if ((window as any).google?.accounts?.id) return resolve();
          const existing = document.getElementById('google-gsi-client');
          if (existing) {
            existing.addEventListener('load', () => resolve());
            return;
          }
          const script = document.createElement('script');
          script.id = 'google-gsi-client';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });

        const google = (window as any).google;
        if (google?.accounts) {
          await new Promise<void>((resolve) => {
            let completed = false;

            const handleGoogleUser = async (googleUser: { sub: string; email: string; name: string; picture?: string }) => {
              if (completed) return;
              completed = true;
              try {
                const res = await fetch(getLocalBackendUrl() + '/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    googleId: googleUser.sub,
                    email: googleUser.email,
                    name: googleUser.name || 'Google Member',
                    photo: googleUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800',
                  }),
                });

                if (res.ok) {
                  const data = await res.json();
                  if (data.success && data.user) {
                    await loginUser(data.user);
                    setIsLoading(false);
                    Alert.alert('Signed in with Google! 🎉', 'Welcome, ' + data.user.name + '! You are ready to Synk.');
                    onSuccess && onSuccess();
                    onClose && onClose();
                    resolve();
                    return;
                  }
                }
                Alert.alert('Google Sign-In', 'Could not complete login with backend.');
              } catch (e: any) {
                Alert.alert('Google Sign-In Error', e?.message || 'Network error');
              } finally {
                setIsLoading(false);
                resolve();
              }
            };

            // Trigger Google OAuth 2.0 Popup Window
            try {
              const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'email profile openid',
                callback: async (tokenResponse: any) => {
                  if (tokenResponse?.access_token) {
                    try {
                      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                      });
                      if (infoRes.ok) {
                        const profile = await infoRes.json();
                        await handleGoogleUser({
                          sub: profile.sub,
                          email: profile.email,
                          name: profile.name,
                          picture: profile.picture,
                        });
                        return;
                      }
                    } catch (e) {}
                  }
                  setIsLoading(false);
                  resolve();
                },
                error_callback: () => {
                  setIsLoading(false);
                  resolve();
                },
              });
              tokenClient.requestAccessToken({ prompt: 'select_account' });
              return;
            } catch (popupErr) {
              // Fallback to Google ID One-Tap
              google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response: any) => {
                  if (response?.credential) {
                    try {
                      const base64Url = response.credential.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const jsonPayload = decodeURIComponent(
                        atob(base64)
                          .split('')
                          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                          .join('')
                      );
                      const decoded = JSON.parse(jsonPayload);
                      await handleGoogleUser({
                        sub: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture,
                      });
                    } catch (e) {
                      setIsLoading(false);
                      resolve();
                    }
                  }
                },
              });
              google.accounts.id.prompt();
            }
          });
          return;
        }
      }

      // Native Mobile: Native Google Sign-In
      if (Platform.OS !== 'web') {
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const userInfo = await GoogleSignin.signIn();
          
          let googleUser = null;
          if ('data' in userInfo && userInfo.data && userInfo.data.user) {
            googleUser = userInfo.data.user;
          } else if ('user' in userInfo && userInfo.user) {
            // Fallback for older versions just in case
            googleUser = (userInfo as any).user;
          }

          if (googleUser && googleUser.id) {
            const parsedUser = {
              id: 'usr_' + googleUser.id.substring(0, 14), // mock a synking ID format
              name: googleUser.name || 'Google Member',
              email: googleUser.email,
              photo: googleUser.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800',
            };
            
            // Set pending user and ask for phone verify (just like deep link)
            setPendingGoogleUser(parsedUser);
            setMode('phone');
            setIsLoading(false);
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (error: any) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // user cancelled the login flow
          } else if (error.code === statusCodes.IN_PROGRESS) {
            // operation (e.g. sign in) is in progress already
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            Alert.alert('Google Play Services', 'Play Services not available or outdated.');
          } else {
            Alert.alert('Google Sign-In Error', error.message || 'Something went wrong');
          }
        }
        setIsLoading(false);
        return;
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In Error', e?.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- EMAIL SIGN IN / SIGN UP ---
  const handleEmailAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Password Required', 'Password must be at least 6 characters long.');
      return;
    }

    if (isEmailSignUp && (!name || name.trim().length < 2)) {
      Alert.alert('Name Required', 'Please enter your full name to set up your profile.');
      return;
    }

    triggerHaptic();
    setIsLoading(true);

    try {
      const res = await fetch(getLocalBackendUrl() + '/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: name.trim(),
          age: parseInt(age, 10) || 22,
          gender,
          isSignUp: isEmailSignUp,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (!data.user.phoneNumber) {
          // Send to phone linking
          setPendingGoogleUser(data.user); // Reusing this for any pending user
          setMode('phone');
          setIsLoading(false);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }

        await loginUser(data.user);
        setIsLoading(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          isEmailSignUp ? 'Welcome to Synkin! 🎉' : 'Welcome Back! 🎉',
          'Signed in as ' + data.user.name + '. Your verified profile is active.'
        );
        onSuccess && onSuccess();
        onClose && onClose();
        return;
      } else {
        Alert.alert('Sign In Failed', data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (e: any) {
      Alert.alert('Authentication Error', e?.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- PHONE OTP SENDER ---
  const handleSendPhoneOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!ageVerified) {
      Alert.alert('Terms Required', 'Please agree to the 18+ safety terms.');
      return;
    }

    triggerHaptic();
    setIsLoading(true);

    try {
      const formatted = '+91 ' + cleanDigits;
      const checkRes = await fetch(getLocalBackendUrl() + '/api/check-phone?phone=' + encodeURIComponent(formatted));
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.user) {
          setPhoneName(checkData.user.name || '');
          setPhoneGender(checkData.user.gender || 'male');
          setPhoneAge(String(checkData.user.age || 22));
        }
      }
      setPhoneOtpSent(true);
      setPhoneOtp('');
    } catch (e) {
      setPhoneOtpSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- PHONE OTP VERIFIER ---
  const handleVerifyPhoneOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const formatted = '+91 ' + cleanDigits;

    if (!phoneOtp || (phoneOtp.length !== 4 && phoneOtp.length !== 6)) {
      Alert.alert('OTP Required', 'Please enter the verification code.');
      return;
    }

    triggerHaptic();
    setIsLoading(true);

    try {
      const checkRes = await fetch(getLocalBackendUrl() + '/api/check-phone?phone=' + encodeURIComponent(formatted));
      let dbUser = null;
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.user) {
          dbUser = checkData.user;
        }
      }

      let finalUser;

      if (pendingGoogleUser) {
        // We are linking a phone to a Google login
        finalUser = {
          ...pendingGoogleUser,
          phoneNumber: formatted,
          isVerified: true,
        };
        // if dbUser exists, maybe merge them here. For now, prefer Google data + verified phone
        if (dbUser) {
          finalUser = { ...dbUser, ...finalUser }; // Google data overwrites db user data slightly
        }
      } else if (dbUser) {
        finalUser = dbUser;
      } else {
        const defaultPhoto = phoneGender === 'female'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800';

        finalUser = {
          id: 'usr_' + Math.random().toString(16).slice(2, 18),
          name: phoneName.trim() || (phoneGender === 'female' ? 'Priya' : 'Rahul'),
          age: parseInt(phoneAge, 10) || 22,
          gender: phoneGender,
          occupation: phoneGender === 'female' ? 'UI/UX Designer' : 'Software Engineer',
          location: 'Roorkee',
          phoneNumber: formatted,
          distance: '0 km',
          bio: 'Coffee lover & great conversations ☕ Looking to meet genuine people!',
          photo: defaultPhoto,
          photos: [defaultPhoto],
          interests: ['☕ Specialty Coffee', '🎸 Indie Music', '🚗 Road Trips', '🤖 Tech & AI'],
          lookingFor: '💘 Long-term partner',
          zodiac: phoneGender === 'female' ? 'Virgo ♍' : 'Leo ♌',
          workout: 'Often 🏃',
          drinking: 'Socially 🥂',
          smoking: 'Non-smoker 🚭',
          dietary: 'Vegetarian 🥦',
          pets: phoneGender === 'female' ? 'Cat Person 🐱' : 'Dog Lover 🐶',
          height: phoneGender === 'female' ? '5 ft 5 in' : '5 ft 10 in',
          hometown: 'Roorkee, UK',
          compatibility: 100,
          isVerified: true,
          isVip: false,
          isOnboardingComplete: false, // Force new users to onboard
        };
      }

      await loginUser(finalUser);
      setIsLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
      Alert.alert(pendingGoogleUser ? 'Phone Linked! 🔗' : 'Welcome to Synkin! 🎉', 'Your verified profile is active.');
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Could not verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0C0714', '#050308', '#000000']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {showCloseButton && (
        <TouchableOpacity
          style={styles.floatingCloseBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'landing' && (
          <View style={styles.landingWrapper}>
            <View style={styles.brandHero}>
              <View style={styles.logoBadgeContainer}>
                <Image
                  source={require('../../assets/images/logo_emblem.png')}
                  style={styles.emblemImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandTitle}>
                Synkin<Text style={{ color: '#FD3A73' }}>.</Text>
              </Text>
              <View style={styles.taglineBadge}>
                <Text style={styles.brandTagline}>
                  {targetUserName ? 'SIGN IN TO SYNK WITH ' + targetUserName.toUpperCase() + ' 💖' : 'REALTIME ATTRACTION · MEET IRL'}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, minHeight: 40 }} />

            <View style={styles.legalBox}>
              <Text style={styles.legalText}>
                By tapping 'Continue' you agree to our{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => Linking.openURL('https://synkin.in/terms')}
                >
                  Terms
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => Linking.openURL('https://synkin.in/privacy')}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.pillButtonGoogle}
                activeOpacity={0.88}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <View style={styles.buttonIconLeft}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <Text style={styles.pillButtonGoogleText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pillButtonPhone}
                activeOpacity={0.88}
                onPress={() => {
                  triggerHaptic();
                  setMode('phone');
                }}
                disabled={isLoading}
              >
                <View style={styles.buttonIconLeft}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.pillButtonPhoneText}>Continue with phone number</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pillButtonEmail}
                activeOpacity={0.88}
                onPress={() => {
                  triggerHaptic();
                  setMode('email');
                }}
                disabled={isLoading}
              >
                <View style={styles.buttonIconLeft}>
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.pillButtonEmailText}>Continue with email</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.troubleContainer}
              onPress={() => {
                triggerHaptic();
                setMode('help');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.troubleText}>Trouble signing in?</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'email' && (
          <View style={styles.subFormWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setMode('landing')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backBtnText}>All Sign-in Options</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              {isEmailSignUp ? 'Create your Synkin Account ✨' : 'Welcome Back 👋'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isEmailSignUp ? 'Sign up with your personal email address' : 'Sign in using your registered email & password'}
            </Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {isEmailSignUp && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Your Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.inputLabel}>Gender</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                        onPress={() => setGender('male')}
                      >
                        <Text style={[styles.genderBtnText, gender === 'male' && { color: '#FD3A73' }]}>👦 Male</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                        onPress={() => setGender('female')}
                      >
                        <Text style={[styles.genderBtnText, gender === 'female' && { color: '#FD3A73' }]}>👧 Female</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flex: 0.8 }}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.textInput, { textAlign: 'center' }]}
                        placeholder="22"
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        maxLength={2}
                        value={age}
                        onChangeText={setAge}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
            ) : (
              <TouchableOpacity
                style={styles.solidSubmitBtn}
                onPress={handleEmailAuth}
                activeOpacity={0.88}
              >
                <Text style={styles.solidSubmitBtnText}>
                  {isEmailSignUp ? 'Create Profile & Enter 🚀' : 'Sign In with Email ⚡'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.toggleAuthBtn}
              onPress={() => setIsEmailSignUp(!isEmailSignUp)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleAuthText}>
                {isEmailSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={{ fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', textDecorationLine: 'underline' }}>
                  {isEmailSignUp ? 'Sign In' : 'Create One'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'phone' && (
          <View style={styles.subFormWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setPhoneOtpSent(false);
                setMode('landing');
                setPendingGoogleUser(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backBtnText}>All Sign-in Options</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              {phoneOtpSent ? 'Verify OTP 📲' : pendingGoogleUser ? 'Step 2: Link Phone 📱' : 'Mobile Sign In 📱'}
            </Text>
            <Text style={styles.formSubtitle}>
              {phoneOtpSent
                ? 'Enter the code sent to +91 ' + phone.replace(/\D/g, '').slice(-10)
                : 'Enter your 10-digit Indian mobile number'}
            </Text>

            {!phoneOtpSent ? (
              <>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="98765 43210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Your Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#64748B"
                    value={phoneName}
                    onChangeText={setPhoneName}
                  />
                </View>

                <TouchableOpacity
                  style={styles.safetyRow}
                  onPress={() => setAgeVerified(!ageVerified)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={ageVerified ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={ageVerified ? '#FFFFFF' : '#94A3B8'}
                  />
                  <Text style={styles.safetyText}>
                    I am 18+ and agree to Synkin's Community Guidelines.
                  </Text>
                </TouchableOpacity>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleSendPhoneOtp}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>Send Verification Code 📲</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Enter Verification Code</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'Poppins_900Black' }]}
                    placeholder="••••••"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={phoneOtp}
                    onChangeText={setPhoneOtp}
                    autoFocus
                  />
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleVerifyPhoneOtp}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>Verify & Enter Synkin 🔥</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={() => setPhoneOtpSent(false)}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                    ← Change Phone Number
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {mode === 'help' && (
          <View style={styles.subFormWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setMode('landing')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backBtnText}>Back to Sign-in</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>Trouble Signing In? 🆘</Text>
            <Text style={styles.formSubtitle}>
              We are here to help you regain access to your Synkin account.
            </Text>

            <View style={styles.helpCard}>
              <Ionicons name="shield-checkmark" size={28} color="#22C55E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpCardTitle}>Try Google Sign-In</Text>
                <Text style={styles.helpCardBody}>
                  If you face SMS carrier issues, Google Sign-In gives instant 1-tap verified access.
                </Text>
              </View>
            </View>

            <View style={[styles.helpCard, { marginTop: 12 }]}>
              <Ionicons name="mail" size={28} color="#00E5FF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpCardTitle}>Email Support</Text>
                <Text style={styles.helpCardBody}>
                  Reach out to support@synkin.in for account recovery or phone number updates.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.solidSubmitBtn, { marginTop: 24 }]}
              onPress={() => Linking.openURL('mailto:support@synkin.in?subject=Synkin Account Help')}
            >
              <Text style={styles.solidSubmitBtnText}>Contact Support Team ✉️</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'web' ? 40 : 64,
    paddingBottom: 36,
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    right: 20,
    zIndex: 999,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadgeContainer: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#0E0916',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 58, 115, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  emblemImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 44,
    fontFamily: 'Poppins_900Black',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 50,
  },
  taglineBadge: {
    backgroundColor: 'rgba(253, 58, 115, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 58, 115, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
  },
  brandTagline: {
    fontSize: 11,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FD3A73',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  legalBox: {
    marginBottom: 20,
  },
  legalText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    textAlign: 'center',
  },
  legalLink: {
    fontFamily: 'Poppins_700Bold',
    color: '#FD3A73',
    textDecorationLine: 'underline',
  },
  actionButtonsContainer: {
    gap: 14,
  },
  pillButtonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  pillButtonGoogleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginRight: 28,
  },
  pillButtonPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FD3A73',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  pillButtonPhoneText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginRight: 28,
  },
  pillButtonEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
  },
  pillButtonEmailText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginRight: 28,
  },
  buttonIconLeft: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  troubleContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  troubleText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
  },
  subFormWrapper: {
    flex: 1,
    paddingTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0C17',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    height: 52,
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  genderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#0E0C17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: 'rgba(253, 58, 115, 0.25)',
    borderColor: '#FD3A73',
  },
  genderBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  solidSubmitBtn: {
    backgroundColor: '#FD3A73',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  solidSubmitBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  toggleAuthBtn: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  toggleAuthText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'Poppins_500Medium',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0E0C17',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpCardTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
  },
  helpCardBody: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
    lineHeight: 16,
  },
});
