import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../contexts/AppContext';
import { Header } from '../../components/Header';
import { GradientButton } from '../../components/GradientButton';
import { UserProfile } from '../../types';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tinder / Dating App Lifestyle & Passion Presets
export const ALL_INTERESTS = [
  '☕ Specialty Coffee',
  '🎸 Indie Music',
  '🚗 Road Trips',
  '🏋️ Gym & Fitness',
  '🤖 Tech & AI',
  '🍜 Anime & Ramen',
  '🍕 Sourdough Pizza',
  '✈️ Solo Travel',
  '📸 Photography',
  '🎲 Board Games',
  '🎨 Art & Museums',
  '🎤 Live Concerts',
  '🌲 Hiking & Nature',
  '🐶 Dog Lover',
  '🐱 Cat Person',
  '📚 Reading Books',
  '🍷 Wine & Dine',
  '🎬 Cinema & Movies',
  '🏸 Badminton',
  '🧘 Yoga & Mindfulness',
];

export const LOOKING_FOR_OPTIONS = [
  { key: 'long_term', label: '💘 Long-term partner', emoji: '💘', title: 'Long-term relationship' },
  { key: 'short_term', label: '🥂 Long-term, open to short', emoji: '🥂', title: 'Long-term, open to short' },
  { key: 'casual', label: '🎉 Casual dating & fun', emoji: '🎉', title: 'Casual dating' },
  { key: 'friends', label: '☕ New friends & hangout', emoji: '☕', title: 'New friends' },
  { key: 'figuring_out', label: '💭 Still figuring it out', emoji: '💭', title: 'Still figuring it out' },
];

export const WORKOUT_OPTIONS = ['Everyday 🏋️', 'Often (3-4x/wk) 🏃', 'Sometimes 🚶', 'Never 🛋️'];
export const DRINKING_OPTIONS = ['Socially 🥂', 'Never / Teetotaler 🧃', 'Frequently 🍻', 'Sober ✨'];
export const SMOKING_OPTIONS = ['Non-smoker 🚭', 'Socially 💨', 'Regular smoker 🚬'];
export const DIET_OPTIONS = ['Vegetarian 🥦', 'Non-Vegetarian 🍗', 'Vegan 🌱', 'Eggetarian 🥚', 'Jain 🍃'];
export const PETS_OPTIONS = ['Dog Lover 🐶', 'Cat Person 🐱', 'Want Pets 🐾', 'No Pets 🚫', 'Birds 🦜'];
export const ZODIAC_OPTIONS = [
  'Aries ♈', 'Taurus ♉', 'Gemini ♊', 'Cancer ♋',
  'Leo ♌', 'Virgo ♍', 'Libra ♎', 'Scorpio ♏',
  'Sagittarius ♐', 'Capricorn ♑', 'Aquarius ♒', 'Pisces ♓'
];

// Profile Completion Calculator
export function calculateProfileCompletion(user: UserProfile | null): {
  percentage: number;
  missingCount: number;
  nextTip: string;
} {
  if (!user) return { percentage: 0, missingCount: 8, nextTip: 'Sign in to your account' };

  let score = 0;
  const tips: string[] = [];

  // 1. Main Photo (20%)
  if (user.photo && user.photo.length > 5) {
    score += 20;
  } else {
    tips.push('Add a main profile photo (+20%)');
  }

  // 2. Extra Gallery Photos (20%)
  const photosCount = (user.photos || []).filter(Boolean).length;
  if (photosCount >= 2) {
    score += 20;
  } else {
    tips.push('Add 2+ gallery photos (+20%)');
  }

  // 3. Basic Info (15%)
  if (user.name && user.age && user.gender) {
    score += 15;
  } else {
    tips.push('Complete basic info (+15%)');
  }

  // 4. Bio / About Me (15%)
  if (user.bio && user.bio.trim().length >= 10) {
    score += 15;
  } else {
    tips.push('Write a short bio (+15%)');
  }

  // 5. Work & College (10%)
  if (user.occupation || user.company || user.school) {
    score += 10;
  } else {
    tips.push('Add occupation / college (+10%)');
  }

  // 6. Dating Intentions (10%)
  if (user.lookingFor) {
    score += 10;
  } else {
    tips.push('Select dating intentions (+10%)');
  }

  // 7. Lifestyle Habits (10%)
  const lifestyleFilled = [user.zodiac, user.workout, user.drinking, user.smoking, user.dietary, user.pets, user.height].filter(Boolean).length;
  if (lifestyleFilled >= 2) {
    score += 10;
  } else {
    tips.push('Add lifestyle habits (+10%)');
  }

  return {
    percentage: Math.min(100, Math.max(0, score)),
    missingCount: tips.length,
    nextTip: tips[0] || 'Profile is 100% complete!',
  };
}

export default function ProfileScreen() {
  const { currentUser, isLoggedIn, isDarkMode, toggleTheme, updateCurrentUser, loginUser, logoutUser, deleteAccount } = useApp();
  const router = useRouter();

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'photos' | 'basics' | 'lifestyle' | 'passions'>('photos');

  // Edit Form Fields
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAge, setEditAge] = useState((currentUser?.age || 22).toString());
  const [editGender, setEditGender] = useState<'male' | 'female' | 'nonbinary' | 'other'>(currentUser?.gender || 'male');
  const [editCity, setEditCity] = useState(
    typeof (currentUser?.location as any) === 'object' ? ((currentUser?.location as any)?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')
  );
  const [editHometown, setEditHometown] = useState(currentUser?.hometown || '');
  const [editHeight, setEditHeight] = useState(currentUser?.height || '');
  const [editOccupation, setEditOccupation] = useState(currentUser?.occupation || '');
  const [editCompany, setEditCompany] = useState(currentUser?.company || '');
  const [editSchool, setEditSchool] = useState(currentUser?.school || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editLookingFor, setEditLookingFor] = useState(currentUser?.lookingFor || '');
  const [editZodiac, setEditZodiac] = useState(currentUser?.zodiac || '');
  const [editWorkout, setEditWorkout] = useState(currentUser?.workout || '');
  const [editDrinking, setEditDrinking] = useState(currentUser?.drinking || '');
  const [editSmoking, setEditSmoking] = useState(currentUser?.smoking || '');
  const [editDietary, setEditDietary] = useState(currentUser?.dietary || '');
  const [editPets, setEditPets] = useState(currentUser?.pets || '');
  const [editInterests, setEditInterests] = useState<string[]>(currentUser?.interests || ['☕ Specialty Coffee', 'Indie Music']);
  const [editPhotos, setEditPhotos] = useState<string[]>(
    currentUser?.photos && currentUser.photos.length > 0
      ? currentUser.photos
      : currentUser?.photo
      ? [currentUser.photo]
      : []
  );

  // Sync state when currentUser changes
  const populateEditState = (user: UserProfile) => {
    setEditName(user.name || '');
    setEditAge((user.age || 22).toString());
    setEditGender(user.gender || 'male');
    setEditCity(typeof (user.location as any) === 'object' ? ((user.location as any)?.city || 'Roorkee') : (user.location || 'Roorkee'));
    setEditHometown(user.hometown || '');
    setEditHeight(user.height || '');
    setEditOccupation(user.occupation || '');
    setEditCompany(user.company || '');
    setEditSchool(user.school || '');
    setEditBio(user.bio || '');
    setEditLookingFor(user.lookingFor || '');
    setEditZodiac(user.zodiac || '');
    setEditWorkout(user.workout || '');
    setEditDrinking(user.drinking || '');
    setEditSmoking(user.smoking || '');
    setEditDietary(user.dietary || '');
    setEditPets(user.pets || '');
    setEditInterests(user.interests || ['☕ Specialty Coffee', 'Indie Music']);
    setEditPhotos(user.photos && user.photos.length > 0 ? user.photos : user.photo ? [user.photo] : []);
  };

  // Completion calculation
  const completionData = useMemo(() => calculateProfileCompletion(currentUser), [currentUser]);

  // Luxury Dark & Modern Theme Colors
  const bg = isDarkMode ? '#07090E' : '#F8FAFC';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#8E9AA8' : '#64748B';
  const cardBg = isDarkMode ? '#11141E' : '#FFFFFF';
  const innerBg = isDarkMode ? '#181C28' : '#F1F5F9';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // Pick Photo
  const handlePickPhoto = async (index: number) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        const newPhotos = [...editPhotos];
        if (index < newPhotos.length) {
          newPhotos[index] = uri;
        } else {
          newPhotos.push(uri);
        }
        setEditPhotos(newPhotos);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = editPhotos.filter((_, i) => i !== index);
    setEditPhotos(updated);
  };

  const toggleInterest = (interest: string) => {
    if (editInterests.includes(interest)) {
      setEditInterests(prev => prev.filter(i => i !== interest));
    } else {
      if (editInterests.length >= 8) {
        Alert.alert('Limit Reached', 'You can select up to 8 passion interests.');
        return;
      }
      setEditInterests(prev => [...prev, interest]);
    }
  };

  const handleSaveProfile = () => {
    const mainPhoto = editPhotos[0] || currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';
    const updatedPayload: Partial<UserProfile> = {
      name: editName.trim() || 'Member',
      age: parseInt(editAge, 10) || 22,
      gender: editGender,
      location: editCity.trim() || 'Roorkee',
      hometown: editHometown.trim(),
      height: editHeight.trim(),
      occupation: editOccupation.trim() || 'Member',
      company: editCompany.trim(),
      school: editSchool.trim(),
      bio: editBio.trim(),
      lookingFor: editLookingFor,
      zodiac: editZodiac,
      workout: editWorkout,
      drinking: editDrinking,
      smoking: editSmoking,
      dietary: editDietary,
      pets: editPets,
      interests: editInterests,
      photo: mainPhoto,
      photos: editPhotos.length > 0 ? editPhotos : [mainPhoto],
    };

    updateCurrentUser(updatedPayload);
    setEditModalVisible(false);
    if (Platform.OS === 'web') {
      window.alert('Profile Updated ✨\n\nYour profile changes are saved & synced!');
    } else {
      Alert.alert('Profile Updated ✨', 'Your profile changes are saved & synced!');
    }
  };

  // Login Handlers
  const handleSendLoginOtp = () => {
    const digits = loginPhone.replace(/\D/g, '');
    if (!digits || digits.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      if (Platform.OS === 'web') window.alert('Mobile Number Required\n\n' + msg);
      else Alert.alert('Mobile Number Required', msg);
      return;
    }
    setIsOtpSent(true);
    setLoginOtp('1234');
    const msg = 'Testing verification code is: 1234';
    if (Platform.OS === 'web') window.alert('OTP Sent 📲\n\n' + msg);
    else Alert.alert('OTP Sent 📲', msg);
  };

  const handleVerifyLoginOtp = () => {
    const cleanPhone = loginPhone ? '+91 ' + loginPhone.replace(/\D/g, '') : '+91 98765 43210';
    const newUser: UserProfile = {
      id: 'user_' + Date.now().toString(36),
      name: editName.trim() || 'Rahul',
      age: parseInt(editAge, 10) || 24,
      gender: 'male',
      occupation: editOccupation.trim() || 'Software Engineer',
      location: editCity.trim() || 'Roorkee',
      phoneNumber: cleanPhone,
      distance: '0 km',
      bio: editBio.trim() || 'Specialty coffee lover & indie music enthusiast ☕ Let’s explore artisan cafes in town!',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800'
      ],
      interests: ['☕ Specialty Coffee', '🎸 Indie Music', '🤖 Tech & AI', '🚗 Road Trips'],
      lookingFor: '💘 Long-term partner',
      zodiac: 'Leo ♌',
      workout: 'Often (3-4x/wk) 🏃',
      drinking: 'Socially 🥂',
      smoking: 'Non-smoker 🚭',
      dietary: 'Vegetarian 🥦',
      pets: 'Dog Lover 🐶',
      height: '5 ft 10 in',
      hometown: 'Roorkee, UK',
      compatibility: 100,
      isVerified: true,
      isVip: false,
    };
    loginUser(newUser);
    populateEditState(newUser);
    if (Platform.OS === 'web') {
      window.alert('Signed In! 🎉\n\nWelcome to SYNKING!');
    } else {
      Alert.alert('Signed In! 🎉', 'Welcome to SYNKING!');
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Delete Profile Permanently?\n\nThis will permanently remove your profile, match requests, and chat data.'
      );
      if (confirmed) {
        await deleteAccount();
        window.alert('Profile Deleted: Your account has been deleted.');
      }
    } else {
      Alert.alert('⚠️ Delete Profile Permanently?', 'This will permanently remove your profile and chats.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently 🗑️',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            Alert.alert('Profile Deleted', 'Your account has been deleted.');
          },
        },
      ]);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logoutUser();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out 🚪', style: 'destructive', onPress: () => logoutUser() },
      ]);
    }
  };

  // SVG Circular Progress Constants
  const circleSize = 136;
  const strokeWidth = 5;
  const center = circleSize / 2;
  const radius = center - strokeWidth - 2; // radius = 61
  const circumference = 2 * Math.PI * radius; // ~383.27
  const strokeDashoffset = circumference - (circumference * completionData.percentage) / 100;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <Header />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          // Direct Phone Login Card
          <View style={[styles.guestCard, { backgroundColor: cardBg, borderColor, padding: 24, gap: 14 }]}>
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Image
                source={require('../../../assets/images/logo_emblem.png')}
                style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 12 }}
                resizeMode="contain"
              />
              <Text style={[styles.guestTitle, { color: textColor, fontSize: 22, fontWeight: '900' }]}>
                Sign In with Phone ⚡
              </Text>
              <Text style={[styles.guestSub, { color: subText, textAlign: 'center', marginTop: 4 }]}>
                Enter your mobile number to sign in and personalize your dating profile.
              </Text>
            </View>

            <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: 'rgba(0, 229, 255, 0.3)', borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '800' }}>🧪 TESTING MODE ACTIVE</Text>
              <Text style={{ color: subText, fontSize: 11, marginTop: 2 }}>Enter any 10-digit number & OTP (Default: 1234)</Text>
            </View>

            {!isOtpSent ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: subText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: innerBg, borderRadius: 14, borderWidth: 1, borderColor, paddingHorizontal: 12 }}>
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

                <GradientButton title="Send Verification OTP 📲" onPress={handleSendLoginOtp} style={{ marginTop: 6 }} />

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
                  onPress={handleVerifyLoginOtp}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FD3A73', fontWeight: '800', fontSize: 14 }}>⚡ 1-Tap Instant Sign In (Rahul)</Text>
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
                    backgroundColor: innerBg,
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

                <GradientButton title="Verify OTP & Sign In 🚀" onPress={handleVerifyLoginOtp} style={{ marginTop: 6 }} />
              </View>
            )}
          </View>
        ) : (
          // =========================================================================
          // 💎 LUXURY PREMIUM DATING PROFILE VIEW (TINDER PLATINUM / RAYA STYLE)
          // =========================================================================
          <View style={styles.contentWrap}>
            {/* 1. HERO AVATAR & GLOWING PRECISION RING */}
            <View style={styles.heroSection}>
              {/* Background Ambient Glow */}
              <View style={styles.ambientGlow} />

              <View style={styles.ringContainer}>
                <Svg width={circleSize} height={circleSize} style={styles.svgRing}>
                  <Defs>
                    <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FD3A73" />
                      <Stop offset="50%" stopColor="#FF7A00" />
                      <Stop offset="100%" stopColor="#00E5FF" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Outer Track */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Glowing Fill Circle */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#heroGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${center} ${center})`}
                  />
                </Svg>

                <Image
                  source={{ uri: currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' }}
                  style={styles.avatarImg}
                />

                {/* Micro Percentage Bubble on Ring */}
                <View style={styles.ringPercentageBadge}>
                  <Text style={styles.ringPercentageText}>{completionData.percentage}%</Text>
                </View>

                {/* Edit Photo Icon Overlay */}
                <TouchableOpacity
                  style={styles.editPhotoFab}
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('photos');
                    setEditModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name="camera" size={13} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Identity Row */}
              <View style={styles.identityRow}>
                <Text style={[styles.userNameText, { color: textColor }]}>
                  {currentUser?.name}, <Text style={styles.userAgeText}>{currentUser?.age}</Text>
                </Text>
                {currentUser?.isVerified && (
                  <LinearGradient
                    colors={['#00E5FF', '#0284C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.verifiedShield}
                  >
                    <Ionicons name="checkmark-sharp" size={11} color="#000" />
                  </LinearGradient>
                )}
                {currentUser?.isVip && (
                  <View style={styles.vipCrownBadge}>
                    <Ionicons name="sparkles" size={10} color="#FFD700" />
                    <Text style={styles.vipCrownText}>VIP</Text>
                  </View>
                )}
              </View>

              {/* Sub-headline */}
              <Text style={[styles.subHeadline, { color: subText }]}>
                {currentUser?.occupation || 'Member'} {currentUser?.company ? `@ ${currentUser.company}` : ''} • 📍 {typeof (currentUser?.location as any) === 'object' ? ((currentUser?.location as any)?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')}
              </Text>

              {/* QUICK ACTION BUTTONS ROW (3 SLEEK PILLS) */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setEditModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FD3A73', '#E11D48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryActionGradient}
                  >
                    <Feather name="edit-3" size={14} color="#FFF" />
                    <Text style={styles.primaryActionText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => router.push('/vip-membership')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={14} color="#F59E0B" />
                  <Text style={[styles.secondaryActionText, { color: isDarkMode ? '#FDE047' : '#D97706' }]}>VIP Crown</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconActionBtn, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => router.push('/verify-selfie')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shield-checkmark-outline" size={16} color="#00E5FF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. COMPACT COMPLETION BOOST PILL (IF NOT 100%) */}
            {completionData.percentage < 100 && (
              <TouchableOpacity
                style={[styles.boostPillCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  if (currentUser) populateEditState(currentUser);
                  setEditModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.boostIconBox}>
                  <Ionicons name="flash" size={14} color="#FD3A73" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.boostTitle, { color: textColor }]}>
                    Profile {completionData.percentage}% Synked
                  </Text>
                  <Text style={[styles.boostSub, { color: subText }]}>
                    {completionData.nextTip}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={subText} />
              </TouchableOpacity>
            )}

            {/* 3. TINDER-STYLE PHOTO COLLAGE (COLLAGE GRID) */}
            <View style={[styles.luxuryCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="images-outline" size={16} color="#FD3A73" />
                  <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Photo Showcase</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('photos');
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.cardActionLink}>Edit Photos ({currentUser?.photos?.length || 1}/6)</Text>
                </TouchableOpacity>
              </View>

              {/* Photo Showcase Horizontal Scroll */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                {(currentUser?.photos || [currentUser?.photo]).filter(Boolean).map((uri, idx) => (
                  <View key={idx} style={styles.luxuryPhotoSlot}>
                    <Image source={{ uri }} style={styles.luxuryPhoto} />
                    {idx === 0 && (
                      <View style={styles.mainTagBadge}>
                        <Text style={styles.mainTagText}>MAIN</Text>
                      </View>
                    )}
                  </View>
                ))}
                {(currentUser?.photos?.length || 1) < 6 && (
                  <TouchableOpacity
                    style={[styles.addPhotoSlotLuxury, { backgroundColor: innerBg, borderColor }]}
                    onPress={() => {
                      if (currentUser) populateEditState(currentUser);
                      setActiveEditTab('photos');
                      setEditModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={24} color="#FD3A73" />
                    <Text style={[styles.addPhotoSlotText, { color: subText }]}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* 4. ABOUT ME & BIO */}
            <View style={[styles.luxuryCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="user" size={15} color="#00E5FF" />
                  <Text style={[styles.cardHeaderTitle, { color: textColor }]}>About Me</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('basics');
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.cardActionLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.bioBodyText, { color: currentUser?.bio ? textColor : subText }]}>
                {currentUser?.bio || 'No bio written yet. Tap edit to introduce yourself to matches!'}
              </Text>
            </View>

            {/* 5. DATING INTENTIONS (LOOKING FOR) */}
            <View style={[styles.luxuryCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="target" size={15} color="#FD3A73" />
                  <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Looking For</Text>
                </View>
              </View>
              <View style={[styles.intentionCapsule, { backgroundColor: innerBg, borderColor }]}>
                <Text style={{ fontSize: 16 }}>💘</Text>
                <Text style={[styles.intentionText, { color: textColor }]}>
                  {currentUser?.lookingFor || 'Long-term relationship'}
                </Text>
              </View>
            </View>

            {/* 6. LIFESTYLE & DETAILS (CLEAN GLASS PILLS) */}
            <View style={[styles.luxuryCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="compass" size={15} color="#10B981" />
                  <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Lifestyle & Basics</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('lifestyle');
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.cardActionLink}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.lifestyleGrid}>
                {currentUser?.height ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="resize-outline" size={13} color="#38BDF8" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.height}</Text>
                  </View>
                ) : null}
                {currentUser?.zodiac ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Text style={{ fontSize: 12 }}>✨</Text>
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.zodiac}</Text>
                  </View>
                ) : null}
                {currentUser?.workout ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="barbell-outline" size={13} color="#22C55E" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.workout}</Text>
                  </View>
                ) : null}
                {currentUser?.drinking ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="wine-outline" size={13} color="#F59E0B" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.drinking}</Text>
                  </View>
                ) : null}
                {currentUser?.smoking ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="cloud-outline" size={13} color="#94A3B8" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.smoking}</Text>
                  </View>
                ) : null}
                {currentUser?.dietary ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="nutrition-outline" size={13} color="#10B981" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.dietary}</Text>
                  </View>
                ) : null}
                {currentUser?.pets ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="paw-outline" size={13} color="#EC4899" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.pets}</Text>
                  </View>
                ) : null}
                {currentUser?.school ? (
                  <View style={[styles.lifestylePill, { backgroundColor: innerBg, borderColor }]}>
                    <Ionicons name="school-outline" size={13} color="#A855F7" />
                    <Text style={[styles.lifestylePillText, { color: textColor }]}>{currentUser.school}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 7. PASSIONS & INTERESTS */}
            <View style={[styles.luxuryCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="heart" size={15} color="#EC4899" />
                  <Text style={[styles.cardHeaderTitle, { color: textColor }]}>Passions & Vibes</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('passions');
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.cardActionLink}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.lifestyleGrid}>
                {(currentUser?.interests || ['☕ Specialty Coffee', '🎸 Indie Music']).map((item, idx) => (
                  <View key={idx} style={[styles.passionChip, { backgroundColor: innerBg, borderColor }]}>
                    <Text style={[styles.passionChipText, { color: textColor }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 8. LUXURY VIP BLACK PROMO BANNER */}
            <TouchableOpacity
              style={styles.vipLuxuryBanner}
              onPress={() => router.push('/vip-membership')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1E1308', '#2D1B0B', '#0D0803']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.vipBannerGrad}
              >
                <View style={styles.vipBannerHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={18} color="#FFD700" />
                    <Text style={styles.vipBannerTitle}>SYNKING BLACK VIP</Text>
                  </View>
                  <View style={styles.vipBannerTag}>
                    <Text style={styles.vipBannerTagText}>UPGRADE</Text>
                  </View>
                </View>
                <Text style={styles.vipBannerSub}>
                  • See who liked your profile & unlimited SuperSynks\n
                  • 5x Discovery Boost in Roorkee • Free reserved tables
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 9. SETTINGS & APP CONTROLS (IOS GROUPED STYLE) */}
            <View style={[styles.groupedSettings, { backgroundColor: cardBg, borderColor }]}>
              {/* Dark Mode */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={16} color="#A855F7" />
                  </View>
                  <Text style={[styles.settingItemTitle, { color: textColor }]}>Dark OLED Theme</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#CBD5E1', true: '#A855F7' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingDivider, { backgroundColor: borderColor }]} />

              {/* Facial Verification */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/verify-selfie')}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#00E5FF" />
                  </View>
                  <Text style={[styles.settingItemTitle, { color: textColor }]}>Identity & Facial Verification</Text>
                </View>
                <Feather name="chevron-right" size={16} color={subText} />
              </TouchableOpacity>

              <View style={[styles.settingDivider, { backgroundColor: borderColor }]} />

              {/* Log Out */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                    <Ionicons name="log-out-outline" size={16} color="#94A3B8" />
                  </View>
                  <Text style={[styles.settingItemTitle, { color: textColor }]}>Log Out</Text>
                </View>
                <Feather name="chevron-right" size={16} color={subText} />
              </TouchableOpacity>

              <View style={[styles.settingDivider, { backgroundColor: borderColor }]} />

              {/* Delete Account */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </View>
                  <Text style={[styles.settingItemTitle, { color: '#EF4444' }]}>Delete Account Permanently</Text>
                </View>
                <Feather name="chevron-right" size={16} color={subText} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 🛠️ FULL TINDER-STYLE MULTI-SECTION EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: isDarkMode ? '#0E1118' : '#FFFFFF', borderColor }]}>
            {/* Modal Top Header */}
            <View style={styles.editModalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Edit Dating Profile 🎨</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={subText} />
              </TouchableOpacity>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.editTabsRow}>
              {[
                { key: 'photos', label: '📸 Photos' },
                { key: 'basics', label: '👤 Basics' },
                { key: 'lifestyle', label: '🌿 Lifestyle' },
                { key: 'passions', label: '🎨 Passions' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.editTabBtn,
                    activeEditTab === tab.key && { borderBottomColor: '#FD3A73', borderBottomWidth: 3 },
                  ]}
                  onPress={() => setActiveEditTab(tab.key as any)}
                >
                  <Text
                    style={[
                      styles.editTabText,
                      { color: activeEditTab === tab.key ? '#FD3A73' : subText, fontWeight: activeEditTab === tab.key ? '800' : '600' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              {/* TAB 1: PHOTOS MANAGER (6 SLOTS) */}
              {activeEditTab === 'photos' && (
                <View style={{ gap: 14, paddingBottom: 20 }}>
                  <Text style={[styles.tabSectionTitle, { color: textColor }]}>Profile Photos (Up to 6)</Text>
                  <Text style={{ color: subText, fontSize: 12 }}>
                    The first photo will be your main card photo. High quality smiling photos get 5x more synks!
                  </Text>

                  <View style={styles.photoSlotsGrid}>
                    {[0, 1, 2, 3, 4, 5].map(idx => {
                      const photoUri = editPhotos[idx];
                      return (
                        <View key={idx} style={[styles.photoSlot, { backgroundColor: innerBg, borderColor }]}>
                          {photoUri ? (
                            <>
                              <Image source={{ uri: photoUri }} style={styles.slotImage} />
                              {idx === 0 && (
                                <View style={styles.mainBadge}>
                                  <Text style={styles.mainBadgeText}>Main</Text>
                                </View>
                              )}
                              <TouchableOpacity
                                style={styles.removePhotoBtn}
                                onPress={() => handleRemovePhoto(idx)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="close" size={14} color="#FFF" />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <TouchableOpacity
                              style={styles.emptySlotBtn}
                              onPress={() => handlePickPhoto(idx)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="add-circle" size={32} color="#FD3A73" />
                              <Text style={{ color: subText, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Add Photo</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* TAB 2: BASIC INFO */}
              {activeEditTab === 'basics' && (
                <View style={{ gap: 14, paddingBottom: 20 }}>
                  <Text style={[styles.tabSectionTitle, { color: textColor }]}>Basic Personal Details</Text>

                  <Text style={[styles.fieldLabel, { color: subText }]}>Display Name</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={subText}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: subText }]}>Age</Text>
                      <TextInput
                        style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                        value={editAge}
                        onChangeText={setEditAge}
                        keyboardType="number-pad"
                        placeholder="24"
                        placeholderTextColor={subText}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: subText }]}>Height</Text>
                      <TextInput
                        style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                        value={editHeight}
                        onChangeText={setEditHeight}
                        placeholder="e.g. 5ft 10in"
                        placeholderTextColor={subText}
                      />
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { color: subText }]}>Current City</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="e.g. Roorkee"
                    placeholderTextColor={subText}
                  />

                  <Text style={[styles.fieldLabel, { color: subText }]}>Hometown</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editHometown}
                    onChangeText={setEditHometown}
                    placeholder="e.g. Dehradun, Uttarakhand"
                    placeholderTextColor={subText}
                  />

                  <Text style={[styles.fieldLabel, { color: subText }]}>Job Title / Profession</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editOccupation}
                    onChangeText={setEditOccupation}
                    placeholder="e.g. Software Engineer / Student"
                    placeholderTextColor={subText}
                  />

                  <Text style={[styles.fieldLabel, { color: subText }]}>Company</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editCompany}
                    onChangeText={setEditCompany}
                    placeholder="e.g. Tech Startup"
                    placeholderTextColor={subText}
                  />

                  <Text style={[styles.fieldLabel, { color: subText }]}>College / University</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor }]}
                    value={editSchool}
                    onChangeText={setEditSchool}
                    placeholder="e.g. IIT Roorkee"
                    placeholderTextColor={subText}
                  />

                  <Text style={[styles.fieldLabel, { color: subText }]}>About Me (Bio)</Text>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: innerBg, color: textColor, borderColor, minHeight: 70 }]}
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Tell your story, what you vibe with, favorite date spots..."
                    placeholderTextColor={subText}
                    multiline
                  />
                </View>
              )}

              {/* TAB 3: RELATIONSHIP GOALS & LIFESTYLE */}
              {activeEditTab === 'lifestyle' && (
                <View style={{ gap: 16, paddingBottom: 20 }}>
                  <Text style={[styles.tabSectionTitle, { color: textColor }]}>What are you looking for?</Text>
                  <View style={{ gap: 8 }}>
                    {LOOKING_FOR_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.optionCard,
                          { backgroundColor: innerBg, borderColor },
                          editLookingFor === opt.label && styles.optionCardSelected,
                        ]}
                        onPress={() => setEditLookingFor(opt.label)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                        <Text style={[styles.optionCardText, { color: textColor }]}>{opt.title}</Text>
                        {editLookingFor === opt.label && <Ionicons name="checkmark-circle" size={18} color="#FD3A73" style={{ marginLeft: 'auto' }} />}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Zodiac Sign</Text>
                  <View style={styles.chipsGrid}>
                    {ZODIAC_OPTIONS.map(z => (
                      <TouchableOpacity
                        key={z}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editZodiac === z && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditZodiac(z)}
                      >
                        <Text style={[styles.selectorChipText, { color: editZodiac === z ? '#FFF' : textColor }]}>{z}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Workout Routine</Text>
                  <View style={styles.chipsGrid}>
                    {WORKOUT_OPTIONS.map(w => (
                      <TouchableOpacity
                        key={w}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editWorkout === w && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditWorkout(w)}
                      >
                        <Text style={[styles.selectorChipText, { color: editWorkout === w ? '#FFF' : textColor }]}>{w}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Drinking Habits</Text>
                  <View style={styles.chipsGrid}>
                    {DRINKING_OPTIONS.map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editDrinking === d && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditDrinking(d)}
                      >
                        <Text style={[styles.selectorChipText, { color: editDrinking === d ? '#FFF' : textColor }]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Smoking Habits</Text>
                  <View style={styles.chipsGrid}>
                    {SMOKING_OPTIONS.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editSmoking === s && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditSmoking(s)}
                      >
                        <Text style={[styles.selectorChipText, { color: editSmoking === s ? '#FFF' : textColor }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Dietary Preference</Text>
                  <View style={styles.chipsGrid}>
                    {DIET_OPTIONS.map(diet => (
                      <TouchableOpacity
                        key={diet}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editDietary === diet && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditDietary(diet)}
                      >
                        <Text style={[styles.selectorChipText, { color: editDietary === diet ? '#FFF' : textColor }]}>{diet}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.tabSectionTitle, { color: textColor, marginTop: 10 }]}>Pets</Text>
                  <View style={styles.chipsGrid}>
                    {PETS_OPTIONS.map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.selectorChip,
                          { backgroundColor: innerBg, borderColor },
                          editPets === p && styles.selectorChipActive,
                        ]}
                        onPress={() => setEditPets(p)}
                      >
                        <Text style={[styles.selectorChipText, { color: editPets === p ? '#FFF' : textColor }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* TAB 4: PASSIONS & INTERESTS */}
              {activeEditTab === 'passions' && (
                <View style={{ gap: 14, paddingBottom: 20 }}>
                  <Text style={[styles.tabSectionTitle, { color: textColor }]}>
                    Select Your Passions ({editInterests.length}/8)
                  </Text>
                  <Text style={{ color: subText, fontSize: 12 }}>
                    Pick your passions to help matching algorithms find compatible people with shared vibes.
                  </Text>

                  <View style={styles.chipsGrid}>
                    {ALL_INTERESTS.map(interest => {
                      const isSelected = editInterests.includes(interest);
                      return (
                        <TouchableOpacity
                          key={interest}
                          style={[
                            styles.interestToggleChip,
                            { backgroundColor: isSelected ? '#FD3A73' : innerBg, borderColor: isSelected ? '#FD3A73' : borderColor },
                          ]}
                          onPress={() => toggleInterest(interest)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.interestToggleText, { color: isSelected ? '#FFF' : textColor }]}>
                            {interest}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Bottom Save Action Button */}
            <View style={[styles.editModalFooter, { borderTopColor: borderColor }]}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FD3A73', '#FF6584']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>Save & Sync Profile ✨</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  guestCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 30,
  },
  guestTitle: {
    letterSpacing: -0.4,
  },
  guestSub: {
    fontSize: 13,
    lineHeight: 18,
  },

  // 1. HERO SECTION
  heroSection: {
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: 10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
    filter: 'blur(30px)',
  },
  ringContainer: {
    position: 'relative',
    width: 136,
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarImg: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  ringPercentageBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#0F172A',
    borderColor: '#FD3A73',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  ringPercentageText: {
    color: '#FD3A73',
    fontSize: 11,
    fontWeight: '900',
  },
  editPhotoFab: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FD3A73',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#07090E',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  userAgeText: {
    fontWeight: '500',
  },
  verifiedShield: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vipCrownText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
  },
  subHeadline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.2,
  },

  // Quick Action Row (3 Modern Pills)
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    width: '100%',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Boost Pill Card (Compact)
  boostPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  boostIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  boostSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Luxury Card Container
  luxuryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardActionLink: {
    color: '#FD3A73',
    fontSize: 12,
    fontWeight: '700',
  },

  // Photo Showcase Gallery
  galleryScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  luxuryPhotoSlot: {
    width: 96,
    height: 128,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  luxuryPhoto: {
    width: '100%',
    height: '100%',
  },
  mainTagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  addPhotoSlotLuxury: {
    width: 96,
    height: 128,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoSlotText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Bio
  bioBodyText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Intention Capsule
  intentionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  intentionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Lifestyle & Passion Grid
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lifestylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  lifestylePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  passionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  passionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Luxury VIP Black Banner
  vipLuxuryBanner: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  vipBannerGrad: {
    padding: 16,
    gap: 8,
  },
  vipBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipBannerTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipBannerTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vipBannerTagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  vipBannerSub: {
    color: '#FEF08A',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  // iOS Grouped Settings Section
  groupedSettings: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingDivider: {
    height: 1,
    marginLeft: 58,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  editModalContainer: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  editTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
  },
  editTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  editTabText: {
    fontSize: 12,
  },
  modalBodyScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  photoSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoSlot: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3 * 1.3,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionCardSelected: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
  },
  optionCardText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectorChipActive: {
    backgroundColor: '#FD3A73',
    borderColor: '#FD3A73',
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestToggleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
