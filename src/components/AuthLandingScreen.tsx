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
  NativeModules,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { getLocalBackendUrl, saveUserProfileToFirestore } from '../services/firebase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as Haptics from 'expo-haptics';

GoogleSignin.configure({
  webClientId: '816527505911-9aoc1h8930b42cpqi4eo8dlutk3ndcv9.apps.googleusercontent.com',
  offlineAccess: true,
});

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA3ieppicAwwe0jx4SAKhD4meSdSBkOjCs';

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
  type EmailAuthStep = 'form' | 'email_otp' | 'phone_otp';
  const [emailStep, setEmailStep] = useState<EmailAuthStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [emailSignUpOtp, setEmailSignUpOtp] = useState('');
  const [phoneSignUpOtp, setPhoneSignUpOtp] = useState('');
  const [isEmailSignUp, setIsEmailSignUp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Phone Flow States
  type PhoneAuthStep = 'phone_input' | 'phone_otp' | 'email_input' | 'email_otp';
  const [phoneStep, setPhoneStep] = useState<PhoneAuthStep>('phone_input');
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneEmail, setPhoneEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
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
            if (userInfo && (userInfo as any).id) { googleUser = userInfo; }
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Alert.alert('Debug UserInfo', JSON.stringify(userInfo));
            setIsLoading(false);
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
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    if (isEmailSignUp) {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

      if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        Alert.alert(
          'Hard Password Required',
          'Password must be at least 8 characters long and include uppercase (A-Z), lowercase (a-z), numbers (0-9), and at least one special character (e.g. Synkin#9$Secure).'
        );
        return;
      }

      if (!name || name.trim().length < 2) {
        Alert.alert('Name Required', 'Please enter your full name to set up your profile.');
        return;
      }
      const cleanDigits = emailPhone.replace(/\D/g, '').slice(-10);
      if (!cleanDigits || cleanDigits.length !== 10) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }

      triggerHaptic();
      setIsLoading(true);

      // 1. Create User in Google Firebase Auth & Dispatch Live Verification Email
      try {
        let idToken = '';
        const signUpRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password,
              returnSecureToken: true,
            }),
          }
        );
        const signUpData = await signUpRes.json();

        if (signUpRes.ok && signUpData.idToken) {
          idToken = signUpData.idToken;
        } else if (signUpData?.error?.message?.includes('EMAIL_EXISTS')) {
          // If already registered in Firebase, sign in to acquire idToken
          const inRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: cleanEmail,
                password,
                returnSecureToken: true,
              }),
            }
          );
          const inData = await inRes.json();
          if (inRes.ok && inData.idToken) {
            idToken = inData.idToken;
          }
        }

        // 2. Dispatch Live Verification Email via Google Firebase Mail Servers
        if (idToken) {
          await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'VERIFY_EMAIL',
                idToken,
              }),
            }
          );
        }
      } catch (err) {
        console.warn('[FIREBASE_SIGNUP_ERROR]', err);
      } finally {
        setIsLoading(false);
      }

      // Stage 1: Move to Email Verification
      setEmailSignUpOtp('');
      setEmailStep('email_otp');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    // Existing User Direct Login via Google Firebase
    triggerHaptic();
    setIsLoading(true);

    try {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const fbData = await fbRes.json();

      if (fbRes.ok && fbData.idToken) {
        // Authenticated with Firebase! Sync profile with database
        let loggedInUser = null;
        try {
          const res = await fetch(getLocalBackendUrl() + '/api/auth/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password,
              isSignUp: false,
            }),
          });
          const data = await res.json();
          if (res.ok && data.user) {
            loggedInUser = data.user;
          }
        } catch (e) {}

        if (!loggedInUser) {
          loggedInUser = {
            id: 'usr_' + (fbData.localId || Math.random().toString(16).slice(2, 18)),
            name: fbData.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            age: 24,
            gender: 'male' as const,
            compatibility: 100,
            occupation: 'Synkin Member',
            location: 'Nearby',
            distance: '0 km',
            bio: 'Verified Synkin Member ✨',
            photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800',
            photos: ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800'],
            interests: ['☕ Coffee', '🎵 Music'],
            isVerified: true,
            isVip: false,
            authProvider: 'email',
            isOnboardingComplete: true,
          };
        }

        await saveUserProfileToFirestore(loggedInUser);
        await loginUser(loggedInUser);
        setIsLoading(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome Back! 🎉',
          'Signed in via Firebase as ' + (loggedInUser.name || 'Member') + '.'
        );
        onSuccess && onSuccess();
        onClose && onClose();
        return;
      } else {
        const errorMsg = fbData?.error?.message;
        let alertMsg = 'Invalid email or password. Please check your credentials.';
        if (errorMsg === 'EMAIL_NOT_FOUND') {
          alertMsg = 'No account found with this email. Please tap Create One below to sign up.';
        } else if (errorMsg === 'INVALID_PASSWORD' || errorMsg === 'INVALID_LOGIN_CREDENTIALS') {
          alertMsg = 'Incorrect password. Please try again.';
        } else if (errorMsg === 'USER_DISABLED') {
          alertMsg = 'This account has been disabled by security.';
        }
        Alert.alert('Sign In Failed', alertMsg);
      }
    } catch (e: any) {
      Alert.alert('Authentication Error', e?.message || 'Firebase connection error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADVANCE TO PHONE OTP STAGE ---
  const proceedToPhoneStep = () => {
    triggerHaptic();
    setPhoneSignUpOtp('');
    setEmailStep('phone_otp');

    const cleanDigits = emailPhone.replace(/\D/g, '').slice(-10);
    const isTestNumber = cleanDigits === '9999999999' || cleanDigits === '1234567890';
    if (!isTestNumber && Platform.OS === 'android' && NativeModules.NativeFirebaseAuth && cleanDigits.length === 10) {
      try {
        NativeModules.NativeFirebaseAuth.sendOtp('+91' + cleanDigits).then((nativeRes: any) => {
          if (nativeRes && nativeRes.autoVerified && nativeRes.code) {
            setPhoneSignUpOtp(nativeRes.code);
          }
        }).catch((err: any) => {
          console.warn('Firebase Phone Auth dispatch error:', err);
        });
      } catch (err) {
        console.warn('Firebase dispatch error:', err);
      }
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // --- EMAIL SIGN UP: VERIFY EMAIL LINK STATUS ---
  const handleCheckEmailVerification = async (silent = false) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanDigits = emailPhone.replace(/\D/g, '').slice(-10);
    const isTestNumber = cleanDigits === '9999999999' || cleanDigits === '1234567890' || cleanEmail === 'test@synkin.in';

    if (isTestNumber) {
      proceedToPhoneStep();
      return;
    }

    if (!silent) setIsLoading(true);

    try {
      // 1. Re-authenticate to get fresh token and latest verification status
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            returnSecureToken: true,
          }),
        }
      );
      const signInData = await signInRes.json();

      if (signInRes.ok && signInData.idToken) {
        // 2. Query Firebase to inspect live emailVerified flag
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: signInData.idToken }),
          }
        );
        const lookupData = await lookupRes.json();
        const userRecord = lookupData?.users?.[0];

        if (userRecord && userRecord.emailVerified) {
          proceedToPhoneStep();
          return;
        }
      }

      if (!silent) {
        Alert.alert(
          'Email Not Verified Yet',
          `We haven't detected your verification yet. Please open the email sent to ${cleanEmail}, click the verification link, and then tap "I've Verified My Email".`,
          [
            { text: 'Check Again', onPress: () => handleCheckEmailVerification(false) },
            { text: 'Resend Link', onPress: handleResendEmailVerification },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      console.warn('[CHECK_VERIFICATION_ERROR]', err);
      if (!silent) {
        Alert.alert('Verification Check', 'Could not verify status. Please check your internet connection and try again.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // --- EMAIL SIGN UP: RESEND EMAIL LINK ---
  const handleResendEmailVerification = async () => {
    if (resendCooldown > 0) return;
    triggerHaptic();
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            returnSecureToken: true,
          }),
        }
      );
      const signInData = await signInRes.json();

      if (signInRes.ok && signInData.idToken) {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestType: 'VERIFY_EMAIL',
              idToken: signInData.idToken,
            }),
          }
        );
        setResendCooldown(30);
        Alert.alert('Link Resent! 📩', `A fresh verification link has been sent to ${cleanEmail}. Please check your Inbox and Spam folder.`);
      } else {
        Alert.alert('Error', 'Unable to resend verification email right now. Please try again later.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to resend link');
    } finally {
      setIsLoading(false);
    }
  };

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Foreground auto-detection when user returns from email link
  useEffect(() => {
    if (emailStep !== 'email_otp') return;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        handleCheckEmailVerification(true);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [emailStep, email, password]);

  // --- EMAIL SIGN UP: VERIFY PHONE OTP & LAUNCH 8-STEP ONBOARDING ---
  const handleVerifyPhoneSignUpOtp = async () => {
    if (!phoneSignUpOtp || (phoneSignUpOtp.length !== 4 && phoneSignUpOtp.length !== 6)) {
      Alert.alert('OTP Required', 'Please enter the verification code sent to your mobile.');
      return;
    }

    const cleanDigits = emailPhone.replace(/\D/g, '').slice(-10);
    const isTestNumber = cleanDigits === '9999999999' || cleanDigits === '1234567890';

    if (!isTestNumber && Platform.OS === 'android' && NativeModules.NativeFirebaseAuth) {
      try {
        await NativeModules.NativeFirebaseAuth.verifyOtp(phoneSignUpOtp.trim());
      } catch (authErr: any) {
        Alert.alert('Invalid Code', authErr?.message || 'The SMS verification code is incorrect or expired.');
        return;
      }
    } else if (!isTestNumber && phoneSignUpOtp !== '123456') {
      Alert.alert('Invalid Code', 'The verification code is incorrect.');
      return;
    }

    triggerHaptic();
    setIsLoading(true);

    try {
      const cleanDigits = emailPhone.replace(/\D/g, '').slice(-10);
      const formatted = '+91 ' + cleanDigits;
      const cleanEmail = email.trim().toLowerCase();
      const defaultPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800';

      const finalUser = {
        id: 'usr_' + Math.random().toString(16).slice(2, 18),
        name: name.trim() || 'Synkin User',
        email: cleanEmail,
        phoneNumber: formatted,
        password: password,
        age: 22,
        gender: 'male' as const,
        compatibility: 100,
        occupation: 'Software Engineer',
        location: 'Roorkee',
        distance: '0 km',
        bio: 'Looking for meaningful connections on Synkin ✨',
        photo: defaultPhoto,
        photos: [defaultPhoto],
        interests: ['☕ Coffee', '🎵 Music', '🚗 Road Trips', '🤖 Tech'],
        isVerified: true,
        isVip: false,
        authProvider: 'email',
        isOnboardingComplete: false, // Forces immediate 9-step onboarding
      };

      // Register profile in backend database so future email login works
      try {
        const regRes = await fetch(getLocalBackendUrl() + '/api/auth/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password: password,
            name: name.trim(),
            phoneNumber: formatted,
            isSignUp: true,
          }),
        });
        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData?.user?.id) {
            finalUser.id = regData.user.id;
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, continuing locally:', err);
      }

      await saveUserProfileToFirestore(finalUser);
      await loginUser(finalUser);
      setIsLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
      Alert.alert('Welcome to Synkin! 🎉', 'Welcome ' + finalUser.name + '! Complete your profile.');
    } catch (e: any) {
      Alert.alert('Registration Error', e?.message || 'Could not complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  // --- PHONE OTP SENDER ---
  // --- PHONE OTP SENDER ---
  const handleSendPhoneOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!pendingGoogleUser && phoneName.trim().length < 2) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
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
          setPhoneName(checkData.user.name || phoneName);
          setPhoneGender(checkData.user.gender || 'male');
          setPhoneAge(String(checkData.user.age || 22));
          if (checkData.user.email) setPhoneEmail(checkData.user.email);
        }
      }

      // Real Firebase Native Phone Auth Trigger
      const isTestNumber = cleanDigits === '9999999999' || cleanDigits === '1234567890';
      if (!isTestNumber && Platform.OS === 'android' && NativeModules.NativeFirebaseAuth) {
        try {
          const nativeRes = await NativeModules.NativeFirebaseAuth.sendOtp('+91' + cleanDigits);
          if (nativeRes && nativeRes.autoVerified) {
            setPhoneStep('phone_otp');
            setPhoneOtpSent(true);
            setPhoneOtp(nativeRes.code || '123456');
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
        } catch (nativeErr: any) {
          setIsLoading(false);
          Alert.alert('SMS Delivery Error', nativeErr?.message || 'Could not send verification SMS. Please verify your phone number.');
          return;
        }
      }

      setPhoneStep('phone_otp');
      setPhoneOtpSent(true);
      setPhoneOtp('');
    } catch (e) {
      setPhoneStep('phone_otp');
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
      const isTestNumber = cleanDigits === '9999999999' || cleanDigits === '1234567890';
      if (!isTestNumber && Platform.OS === 'android' && NativeModules.NativeFirebaseAuth) {
        try {
          await NativeModules.NativeFirebaseAuth.verifyOtp(phoneOtp.trim());
        } catch (authErr: any) {
          setIsLoading(false);
          Alert.alert('Invalid Code', authErr?.message || 'The verification code entered is incorrect or expired.');
          return;
        }
      } else if (!isTestNumber && phoneOtp !== '123456') {
        setIsLoading(false);
        Alert.alert('Invalid Code', 'The verification code is incorrect.');
        return;
      }
      const checkRes = await fetch(getLocalBackendUrl() + '/api/check-phone?phone=' + encodeURIComponent(formatted));
      let dbUser = null;
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.user) {
          dbUser = checkData.user;
        }
      }

      if (pendingGoogleUser) {
        // We are linking a phone to a Google login
        let finalUser = {
          ...pendingGoogleUser,
          phoneNumber: formatted,
          isVerified: true,
          isOnboardingComplete: dbUser?.isOnboardingComplete === true ? true : false,
        };
        if (dbUser) {
          finalUser = {
            ...dbUser,
            ...finalUser,
            isOnboardingComplete: dbUser.isOnboardingComplete === true ? true : false,
          };
        }
        await loginUser(finalUser);
        setIsLoading(false);
        onSuccess && onSuccess();
        onClose && onClose();
        Alert.alert('Phone Linked! 🔗', 'Your verified profile is active.');
        return;
      }

      // Returning user who already completed onboarding and has email
      if (dbUser && dbUser.isOnboardingComplete === true && dbUser.email) {
        await loginUser(dbUser);
        setIsLoading(false);
        onSuccess && onSuccess();
        onClose && onClose();
        Alert.alert('Welcome Back! 🎉', 'Logged in as ' + dbUser.name);
        return;
      }

      // Fresh mobile flow: advance to Email step
      setPhoneStep('email_input');
      setIsLoading(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Could not verify code');
      setIsLoading(false);
    }
  };

  // --- COMPLETE PHONE SIGN UP PROFILE ---
  const handleCompletePhoneRegistration = async () => {
    const cleanEmail = phoneEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    triggerHaptic();
    setIsLoading(true);

    try {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      const formatted = '+91 ' + cleanDigits;

      const defaultPhoto = phoneGender === 'female'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800';

      const finalUser = {
        id: 'usr_' + Math.random().toString(16).slice(2, 18),
        name: phoneName.trim() || (phoneGender === 'female' ? 'Priya' : 'Rahul'),
        email: cleanEmail,
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
        isOnboardingComplete: false, // Forces immediate 9-step onboarding
      };

      await loginUser(finalUser);
      setIsLoading(false);
      onSuccess && onSuccess();
      onClose && onClose();
      Alert.alert('Welcome! 🎉', 'Welcome ' + finalUser.name + '! Let us complete your profile.');
    } catch (e: any) {
      Alert.alert('Setup Error', e?.message || 'Could not complete profile');
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
                  setEmailStep('form');
                  setIsEmailSignUp(false);
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
              onPress={() => {
                if (emailStep === 'phone_otp') {
                  setEmailStep('email_otp');
                } else if (emailStep === 'email_otp') {
                  setEmailStep('form');
                } else {
                  setMode('landing');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backBtnText}>
                {emailStep === 'phone_otp'
                  ? 'Back to Email Verification'
                  : emailStep === 'email_otp'
                  ? 'Edit Details'
                  : 'All Sign-in Options'}
              </Text>
            </TouchableOpacity>

            {/* STAGE HEADER */}
            <Text style={styles.formTitle}>
              {emailStep === 'form'
                ? (isEmailSignUp ? 'Create your Synkin Account ✨' : 'Welcome Back 👋')
                : emailStep === 'email_otp'
                ? 'Verify Your Email 📩'
                : 'Verify Mobile OTP 📲'}
            </Text>
            <Text style={styles.formSubtitle}>
              {emailStep === 'form'
                ? (isEmailSignUp
                    ? 'Enter your name, email, mobile & password to get started'
                    : 'Sign in using your registered email & password')
                : emailStep === 'email_otp'
                ? `Follow the link sent to ${email.trim().toLowerCase()} to continue`
                : `Enter the 6-digit SMS code sent to +91 ${emailPhone.replace(/\D/g, '').slice(-10)}`}
            </Text>

            {/* STAGE 1: INITIAL FORM (LOGIN OR SIGN UP) */}
            {emailStep === 'form' && (
              <>
                {isEmailSignUp && (
                  <>
                    <Text style={styles.inputLabel}>Your Name</Text>
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
                  </>
                )}

                <Text style={[styles.inputLabel, isEmailSignUp && { marginTop: 12 }]}>Email Address</Text>
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

                {isEmailSignUp && (
                  <>
                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Number</Text>
                    <View style={styles.inputRow}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="98765 43210"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={emailPhone}
                        onChangeText={setEmailPhone}
                      />
                    </View>
                  </>
                )}

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                  {isEmailSignUp ? 'Create Hard Password' : 'Password'}
                </Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={isEmailSignUp ? 'e.g. Synkin#9$Secure' : 'Enter your password'}
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                {isEmailSignUp && (
                  <View style={{ marginTop: 8, gap: 5 }}>
                    <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Poppins_500Medium' }}>
                      🔒 Hard Security Requirement (e.g. <Text style={{ color: '#FD3A73', fontFamily: 'Poppins_700Bold' }}>Synkin#9$Secure</Text>):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      <View style={[styles.ruleBadge, password.length >= 8 && styles.ruleBadgeActive]}>
                        <Ionicons name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} size={12} color={password.length >= 8 ? "#22C55E" : "#64748B"} />
                        <Text style={[styles.ruleBadgeText, password.length >= 8 && { color: '#22C55E' }]}>8+ Chars</Text>
                      </View>
                      <View style={[styles.ruleBadge, /[A-Z]/.test(password) && styles.ruleBadgeActive]}>
                        <Ionicons name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={12} color={/[A-Z]/.test(password) ? "#22C55E" : "#64748B"} />
                        <Text style={[styles.ruleBadgeText, /[A-Z]/.test(password) && { color: '#22C55E' }]}>A-Z</Text>
                      </View>
                      <View style={[styles.ruleBadge, /[a-z]/.test(password) && styles.ruleBadgeActive]}>
                        <Ionicons name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={12} color={/[a-z]/.test(password) ? "#22C55E" : "#64748B"} />
                        <Text style={[styles.ruleBadgeText, /[a-z]/.test(password) && { color: '#22C55E' }]}>a-z</Text>
                      </View>
                      <View style={[styles.ruleBadge, /[0-9]/.test(password) && styles.ruleBadgeActive]}>
                        <Ionicons name={/[0-9]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={12} color={/[0-9]/.test(password) ? "#22C55E" : "#64748B"} />
                        <Text style={[styles.ruleBadgeText, /[0-9]/.test(password) && { color: '#22C55E' }]}>0-9</Text>
                      </View>
                      <View style={[styles.ruleBadge, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) && styles.ruleBadgeActive]}>
                        <Ionicons name={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={12} color={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? "#22C55E" : "#64748B"} />
                        <Text style={[styles.ruleBadgeText, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) && { color: '#22C55E' }]}>Symbol (!@#$)</Text>
                      </View>
                    </View>
                  </View>
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
                      {isEmailSignUp ? 'Continue to Verification 🚀' : 'Sign In with Email ⚡'}
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
              </>
            )}

            {/* STAGE 2: EMAIL LINK VERIFICATION */}
            {emailStep === 'email_otp' && (
              <>
                <View style={[styles.googleUserBadge, { borderColor: 'rgba(253, 58, 115, 0.4)', marginBottom: 16 }]}>
                  <Ionicons name="mail-unread" size={24} color="#FD3A73" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleUserName}>Verification Link Sent</Text>
                    <Text style={styles.googleUserEmail}>{email.trim().toLowerCase()}</Text>
                  </View>
                </View>

                {/* Instructions Card */}
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: '#F1F5F9', fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 8 }}>
                    Follow these simple steps:
                  </Text>
                  <Text style={{ color: '#94A3B8', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 20, marginBottom: 4 }}>
                    1. Open the email sent to <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' }}>{email.trim().toLowerCase()}</Text>
                  </Text>
                  <Text style={{ color: '#94A3B8', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 20, marginBottom: 4 }}>
                    2. Tap the link: <Text style={{ color: '#FD3A73', fontStyle: 'italic' }}>Follow this link to verify...</Text>
                  </Text>
                  <Text style={{ color: '#94A3B8', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 20 }}>
                    3. Return here and tap the button below.
                  </Text>
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={() => handleCheckEmailVerification(false)}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>I've Verified My Email ✨</Text>
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 6 }}>
                  <TouchableOpacity
                    onPress={handleResendEmailVerification}
                    disabled={resendCooldown > 0 || isLoading}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: resendCooldown > 0 ? '#64748B' : '#FD3A73',
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 12.5,
                      }}
                    >
                      {resendCooldown > 0 ? `Resend Link (${resendCooldown}s)` : 'Resend Link 📩'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setEmailStep('form')}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#94A3B8', fontFamily: 'Poppins_600SemiBold', fontSize: 12.5 }}>
                      Change Email ✏️
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STAGE 3: PHONE OTP */}
            {emailStep === 'phone_otp' && (
              <>
                <View style={[styles.googleUserBadge, { borderColor: '#22C55E' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleUserName}>Email Verified</Text>
                    <Text style={styles.googleUserEmail}>{email.trim().toLowerCase()}</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Enter 6-Digit Mobile SMS Code</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'Poppins_900Black' }]}
                    placeholder="••••••"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={phoneSignUpOtp}
                    onChangeText={setPhoneSignUpOtp}
                    autoFocus
                  />
                </View>
                <Text style={{ fontSize: 11.5, color: '#94A3B8', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6 }}>
                  A 6-digit SMS code has been sent to your mobile.
                </Text>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleVerifyPhoneSignUpOtp}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>Complete Registration & Enter 🚀</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={() => setEmailStep('email_otp')}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                    ← Back to Email Code
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {mode === 'phone' && (
          <View style={styles.subFormWrapper}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setPhoneStep('phone_input');
                setPhoneOtpSent(false);
                setMode('landing');
                setPendingGoogleUser(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backBtnText}>All Sign-in Options</Text>
            </TouchableOpacity>

            {/* STAGE HEADER */}
            <Text style={styles.formTitle}>
              {phoneStep === 'phone_input'
                ? (pendingGoogleUser ? `Welcome, ${pendingGoogleUser.name || 'there'}! 👋` : 'Mobile Sign In 📱')
                : phoneStep === 'phone_otp'
                ? 'Verify Mobile OTP 📲'
                : phoneStep === 'email_input'
                ? 'Link your Email ✉️'
                : 'Verify Email Code 📩'}
            </Text>
            <Text style={styles.formSubtitle}>
              {phoneStep === 'phone_input'
                ? (pendingGoogleUser
                    ? 'Enter your mobile number to link your account & continue'
                    : 'Enter your name and mobile number to get started')
                : phoneStep === 'phone_otp'
                ? `Enter the 6-digit code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`
                : phoneStep === 'email_input'
                ? `Phone verified! Enter your email address to secure your profile`
                : `Enter the 6-digit code sent to ${phoneEmail}`}
            </Text>

            {/* STAGE 1: PHONE & NAME INPUT */}
            {phoneStep === 'phone_input' && (
              <>
                {pendingGoogleUser && (
                  <View style={styles.googleUserBadge}>
                    <Image
                      source={{ uri: pendingGoogleUser.photo }}
                      style={styles.googleUserAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.googleUserName}>{pendingGoogleUser.name}</Text>
                      <Text style={styles.googleUserEmail}>{pendingGoogleUser.email}</Text>
                    </View>
                    <Ionicons name="logo-google" size={18} color="#EA4335" />
                  </View>
                )}

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

                {!pendingGoogleUser && (
                  <>
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
                  </>
                )}

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
            )}

            {/* STAGE 2: PHONE OTP */}
            {phoneStep === 'phone_otp' && (
              <>
                <Text style={styles.inputLabel}>Enter 6-Digit SMS Code</Text>
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
                <Text style={{ fontSize: 11.5, color: '#94A3B8', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6 }}>
                  A 6-digit SMS code has been sent to your mobile.
                </Text>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleVerifyPhoneOtp}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>
                      {pendingGoogleUser ? 'Verify & Enter Synkin 🔥' : 'Verify Phone Code ⚡'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={() => setPhoneStep('phone_input')}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                    ← Change Phone Number
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE 3: EMAIL INPUT (FOR MOBILE FLOW) */}
            {phoneStep === 'email_input' && (
              <>
                <View style={[styles.googleUserBadge, { borderColor: '#22C55E' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleUserName}>Phone Verified</Text>
                    <Text style={styles.googleUserEmail}>+91 {phone.replace(/\D/g, '').slice(-10)}</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Your Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={phoneEmail}
                    onChangeText={setPhoneEmail}
                    autoFocus
                  />
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleCompletePhoneRegistration}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>Continue to Profile Setup 🚀</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={() => setPhoneStep('phone_otp')}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                    ← Back to Phone Verification
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE 4: FALLBACK (FOR MOBILE FLOW) */}
            {phoneStep === 'email_otp' && (
              <>
                <View style={[styles.googleUserBadge, { borderColor: '#22C55E', marginBottom: 16 }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleUserName}>Phone Verified</Text>
                    <Text style={styles.googleUserEmail}>+91 {phone.replace(/\D/g, '').slice(-10)}</Text>
                  </View>
                </View>

                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" style={{ marginVertical: 24 }} />
                ) : (
                  <TouchableOpacity
                    style={styles.solidSubmitBtn}
                    onPress={handleCompletePhoneRegistration}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.solidSubmitBtnText}>Complete Profile Setup 🚀</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 14 }}
                  onPress={() => setPhoneStep('email_input')}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                    ← Change Email Address
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
    width: '100%',
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
    width: '100%',
    textAlign: 'center',
    fontSize: 44,
    fontFamily: 'Poppins_900Black',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 50,
  },
  taglineBadge: {
    alignSelf: 'center',
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
    width: '100%',
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
  googleUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  googleUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FD3A73',
  },
  googleUserName: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  googleUserEmail: {
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ruleBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  ruleBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#94A3B8',
  },
});
