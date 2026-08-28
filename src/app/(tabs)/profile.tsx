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
import { Ionicons } from '@expo/vector-icons';
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
  tips: string[];
} {
  if (!user) return { percentage: 0, missingCount: 8, tips: ['Sign in to your account'] };

  let score = 0;
  const tips: string[] = [];

  // 1. Main Photo (15%)
  if (user.photo && user.photo.length > 5) {
    score += 15;
  } else {
    tips.push('Add a main profile photo (+15%)');
  }

  // 2. Extra Gallery Photos (15%)
  const photosCount = (user.photos || []).filter(Boolean).length;
  if (photosCount >= 2) {
    score += 15;
  } else {
    tips.push('Add 2+ gallery photos (+15%)');
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
    tips.push('Add job or college (+10%)');
  }

  // 6. Dating Intentions / Looking For (10%)
  if (user.lookingFor) {
    score += 10;
  } else {
    tips.push('Set what you are looking for (+10%)');
  }

  // 7. Lifestyle Habits (10%)
  const lifestyleFilled = [user.zodiac, user.workout, user.drinking, user.smoking, user.dietary, user.pets, user.height].filter(Boolean).length;
  if (lifestyleFilled >= 2) {
    score += 10;
  } else {
    tips.push('Select lifestyle habits (+10%)');
  }

  // 8. Interests & Passions (10%)
  if (user.interests && user.interests.length >= 3) {
    score += 10;
  } else {
    tips.push('Pick at least 3 interests (+10%)');
  }

  return {
    percentage: Math.min(100, Math.max(0, score)),
    missingCount: tips.length,
    tips,
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
  const [activeEditTab, setActiveEditTab] = useState<'photos' | 'basics' | 'lifestyle' | 'passions' | 'prompts'>('photos');

  // Edit Form Fields
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAge, setEditAge] = useState((currentUser?.age || 22).toString());
  const [editGender, setEditGender] = useState<'male' | 'female' | 'nonbinary' | 'other'>(currentUser?.gender || 'male');
  const [editCity, setEditCity] = useState(
    typeof currentUser?.location === 'object' ? (currentUser?.location?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')
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
  const [editInterests, setEditInterests] = useState<string[]>(currentUser?.interests || ['Specialty Coffee', 'Indie Music']);
  const [editPhotos, setEditPhotos] = useState<string[]>(
    currentUser?.photos && currentUser.photos.length > 0
      ? currentUser.photos
      : currentUser?.photo
      ? [currentUser.photo]
      : []
  );
  const [editPrompts, setEditPrompts] = useState<{ question: string; answer: string }[]>(
    currentUser?.prompts || [
      { question: 'My simple pleasures in life are...', answer: '' },
      { question: 'Best date idea in town...', answer: '' },
    ]
  );

  // Sync state when currentUser changes
  const populateEditState = (user: UserProfile) => {
    setEditName(user.name || '');
    setEditAge((user.age || 22).toString());
    setEditGender(user.gender || 'male');
    setEditCity(typeof user.location === 'object' ? (user.location?.city || 'Roorkee') : (user.location || 'Roorkee'));
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
    setEditInterests(user.interests || ['Specialty Coffee', 'Indie Music']);
    setEditPhotos(user.photos && user.photos.length > 0 ? user.photos : user.photo ? [user.photo] : []);
    setEditPrompts(
      user.prompts && user.prompts.length > 0
        ? user.prompts
        : [
            { question: 'My simple pleasures in life are...', answer: '' },
            { question: 'Best date idea in town...', answer: '' },
          ]
    );
  };

  // Completion calculation
  const completionData = useMemo(() => calculateProfileCompletion(currentUser), [currentUser]);

  // Colors
  const bg = isDarkMode ? '#05060A' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : '#111827';
  const subText = isDarkMode ? '#9CA3AF' : '#6B7280';
  const cardBg = isDarkMode ? '#11121A' : '#FFFFFF';
  const innerBg = isDarkMode ? '#1A1B28' : '#F3F4F6';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

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
      prompts: editPrompts.filter(p => p.answer.trim().length > 0),
    };

    updateCurrentUser(updatedPayload);
    setEditModalVisible(false);
    if (Platform.OS === 'web') {
      window.alert('Profile Saved ✨\n\nYour profile details have been synced to the network!');
    } else {
      Alert.alert('Profile Saved ✨', 'Your profile details have been synced to the network!');
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
      bio: editBio.trim() || 'Tech nerd & specialty coffee lover ☕ Let’s meet at artisan cafes!',
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
      height: "5'10"",
      hometown: 'Roorkee, UK',
      compatibility: 100,
      isVerified: true,
      isVip: false,
    };
    loginUser(newUser);
    populateEditState(newUser);
    if (Platform.OS === 'web') {
      window.alert('Signed In! 🎉\n\nWelcome to SYNKING! Complete your profile to get matches.');
    } else {
      Alert.alert('Signed In! 🎉', 'Welcome to SYNKING! Complete your profile to get matches.');
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Delete Profile Permanently?\n\nThis will permanently remove your profile, match requests, and chat data from the database.'
      );
      if (confirmed) {
        await deleteAccount();
        window.alert('Profile Deleted: Your account has been deleted.');
      }
    } else {
      Alert.alert('⚠️ Delete Profile Permanently?', 'This will permanently remove your profile and chats from the database.', [
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
  const circleSize = 144;
  const strokeWidth = 6;
  const center = circleSize / 2;
  const radius = center - strokeWidth - 3; // radius = 63
  const circumference = 2 * Math.PI * radius; // ~395.8
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
          // Real Logged In User Profile
          <>
            {/* 1. HERO AVATAR WITH CIRCULAR COMPLETION PROGRESS RING */}
            <View style={styles.profileHeader}>
              <View style={styles.ringWrapper}>
                {/* SVG Circular Progress Ring */}
                <Svg width={circleSize} height={circleSize} style={styles.svgRing}>
                  <Defs>
                    <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FD3A73" />
                      <Stop offset="50%" stopColor="#FF6584" />
                      <Stop offset="100%" stopColor="#00E5FF" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Background Track Circle */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Glowing Dynamic Fill Circle */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#ringGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${center} ${center})`}
                  />
                </Svg>

                {/* Avatar Center */}
                <Image
                  source={{ uri: currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800' }}
                  style={styles.avatarImage}
                />

                {/* VIP Crown Badge */}
                {currentUser?.isVip && (
                  <View style={styles.crownBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                  </View>
                )}

                {/* Camera / Edit Overlay Button */}
                <TouchableOpacity
                  style={styles.avatarCameraBtn}
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('photos');
                    setEditModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Completion Percentage Badge */}
              <TouchableOpacity
                style={[
                  styles.completionBadge,
                  {
                    backgroundColor: completionData.percentage === 100 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(253, 58, 115, 0.15)',
                    borderColor: completionData.percentage === 100 ? '#22C55E' : '#FD3A73',
                  },
                ]}
                onPress={() => {
                  if (currentUser) populateEditState(currentUser);
                  setEditModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={completionData.percentage === 100 ? 'checkmark-circle' : 'sparkles'}
                  size={13}
                  color={completionData.percentage === 100 ? '#22C55E' : '#FD3A73'}
                />
                <Text
                  style={[
                    styles.completionBadgeText,
                    { color: completionData.percentage === 100 ? '#22C55E' : '#FD3A73' },
                  ]}
                >
                  {completionData.percentage === 100 ? '100% Synked & Complete!' : `${completionData.percentage}% Profile Completed`}
                </Text>
              </TouchableOpacity>

              {/* Name & Age */}
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: textColor }]}>
                  {currentUser?.name}, {currentUser?.age}
                </Text>
                {currentUser?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#00E5FF" />
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.occupation, { color: subText }]}>
                💼 {currentUser?.occupation || 'Member'} {currentUser?.company ? `at ${currentUser.company}` : ''}
              </Text>
              <Text style={[styles.locationText, { color: subText }]}>
                📍 {typeof currentUser?.location === 'object' ? (currentUser?.location?.city || 'Roorkee') : (currentUser?.location || 'Roorkee')}
                {currentUser?.hometown ? ` • 🏡 From ${currentUser.hometown}` : ''}
              </Text>

              {/* Edit Profile Action Button */}
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: cardBg, borderColor }]}
                onPress={() => {
                  if (currentUser) populateEditState(currentUser);
                  setEditModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color="#FD3A73" />
                <Text style={styles.editBtnText}>Edit Complete Profile ✏️</Text>
              </TouchableOpacity>
            </View>

            {/* 2. PROFILE COMPLETION CHECKLIST CARD (IF NOT 100%) */}
            {completionData.percentage < 100 && (
              <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.progressCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.progressCardTitle, { color: textColor }]}>Complete Your Dating Profile</Text>
                    <Text style={[styles.progressCardSub, { color: subText }]}>
                      Profiles above 80% get 4x more mutual match requests in Roorkee!
                    </Text>
                  </View>
                  <Text style={styles.progressPercentNum}>{completionData.percentage}%</Text>
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressBarTrack, { backgroundColor: innerBg }]}>
                  <LinearGradient
                    colors={['#FD3A73', '#FF6584', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${completionData.percentage}%` }]}
                  />
                </View>

                {/* Next Quick Tip */}
                {completionData.tips[0] && (
                  <TouchableOpacity
                    style={[styles.tipBanner, { backgroundColor: innerBg }]}
                    onPress={() => {
                      if (currentUser) populateEditState(currentUser);
                      setEditModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle" size={16} color="#FD3A73" />
                    <Text style={[styles.tipBannerText, { color: textColor }]}>Next: {completionData.tips[0]}</Text>
                    <Ionicons name="chevron-forward" size={14} color={subText} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 3. TINDER-STYLE PHOTO GALLERY PREVIEW */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>📸 Photo Gallery ({currentUser?.photos?.length || 1}/6)</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (currentUser) populateEditState(currentUser);
                    setActiveEditTab('photos');
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={styles.sectionActionText}>Manage Photos</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
                {(currentUser?.photos || [currentUser?.photo]).filter(Boolean).map((photoUrl, idx) => (
                  <View key={idx} style={styles.galleryPhotoWrapper}>
                    <Image source={{ uri: photoUrl }} style={styles.galleryPhoto} />
                    {idx === 0 && (
                      <View style={styles.mainPhotoTag}>
                        <Text style={styles.mainPhotoTagText}>Main</Text>
                      </View>
                    )}
                  </View>
                ))}
                {(currentUser?.photos?.length || 1) < 6 && (
                  <TouchableOpacity
                    style={[styles.addPhotoSlot, { backgroundColor: innerBg, borderColor }]}
                    onPress={() => {
                      if (currentUser) populateEditState(currentUser);
                      setActiveEditTab('photos');
                      setEditModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={28} color="#FD3A73" />
                    <Text style={[styles.addPhotoSlotText, { color: subText }]}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* 4. ABOUT ME / BIO */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>✨ About Me</Text>
              <Text style={[styles.bioContent, { color: currentUser?.bio ? textColor : subText }]}>
                {currentUser?.bio || 'No bio written yet. Tap edit to tell others about yourself!'}
              </Text>
            </View>

            {/* 5. RELATIONSHIP GOALS / LOOKING FOR */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>🎯 Relationship Goals</Text>
              <View style={[styles.goalPill, { backgroundColor: 'rgba(253, 58, 115, 0.1)', borderColor: 'rgba(253, 58, 115, 0.3)' }]}>
                <Text style={styles.goalPillText}>
                  {currentUser?.lookingFor || '💘 Long-term relationship'}
                </Text>
              </View>
            </View>

            {/* 6. LIFESTYLE & BASIC DETAILS GRID (TINDER STYLE) */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>🌿 Lifestyle & Details</Text>
              <View style={styles.chipsGrid}>
                {currentUser?.height && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="resize-outline" size={14} color="#38BDF8" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.height}</Text>
                  </View>
                )}
                {currentUser?.zodiac && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Text style={{ fontSize: 13 }}>♈</Text>
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.zodiac}</Text>
                  </View>
                )}
                {currentUser?.workout && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="barbell-outline" size={14} color="#22C55E" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.workout}</Text>
                  </View>
                )}
                {currentUser?.drinking && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="wine-outline" size={14} color="#F59E0B" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.drinking}</Text>
                  </View>
                )}
                {currentUser?.smoking && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="cloud-outline" size={14} color="#94A3B8" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.smoking}</Text>
                  </View>
                )}
                {currentUser?.dietary && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="nutrition-outline" size={14} color="#10B981" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.dietary}</Text>
                  </View>
                )}
                {currentUser?.pets && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="paw-outline" size={14} color="#EC4899" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.pets}</Text>
                  </View>
                )}
                {currentUser?.school && (
                  <View style={[styles.infoChip, { backgroundColor: innerBg }]}>
                    <Ionicons name="school-outline" size={14} color="#A855F7" />
                    <Text style={[styles.chipText, { color: textColor }]}>{currentUser.school}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 7. PASSIONS & INTERESTS */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>🎨 Passions & Interests</Text>
              <View style={styles.chipsGrid}>
                {(currentUser?.interests || ['☕ Specialty Coffee', 'Indie Music']).map((item, idx) => (
                  <View key={idx} style={[styles.interestBadge, { backgroundColor: innerBg }]}>
                    <Text style={[styles.interestText, { color: textColor }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 8. DATING PROMPTS (HINGE/TINDER STYLE) */}
            {currentUser?.prompts && currentUser.prompts.length > 0 && (
              <View style={{ gap: 12, marginBottom: 12 }}>
                {currentUser.prompts.map((p, idx) => (
                  <View key={idx} style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
                    <Text style={[styles.promptQuestion, { color: subText }]}>{p.question}</Text>
                    <Text style={[styles.promptAnswer, { color: textColor }]}>{p.answer}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 9. VIP BLACK UPGRADE CARD */}
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
                • Unlimited SuperSynks & See Who Liked You\n
                • Free Welcome Drinks & Reserved Tables in Roorkee\n
                • Incognito Browsing & 5x Discovery Boost
              </Text>
            </TouchableOpacity>

            {/* 10. APP SETTINGS & ACCOUNT OPTIONS */}
            <View style={styles.actionsContainer}>
              {/* Dark Theme Switch */}
              <View style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={isDarkMode ? '#A855F7' : '#F59E0B'} />
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

              {/* Selfie Verification */}
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}
                onPress={() => router.push('/verify-selfie')}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#00E5FF" />
                  <Text style={[styles.settingText, { color: textColor }]}>Identity & Facial Verification</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={subText} />
              </TouchableOpacity>

              {/* Delete Account */}
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor, marginTop: 8 }]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={[styles.settingText, { color: '#EF4444' }]}>Delete Account Permanently 🗑️</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={subText} />
              </TouchableOpacity>

              {/* Log Out */}
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor, marginTop: 8 }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="log-out-outline" size={20} color="#94A3B8" />
                  <Text style={[styles.settingText, { color: textColor }]}>Log Out</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={subText} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 🛠️ FULL TINDER-STYLE MULTI-SECTION EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: isDarkMode ? '#0F101A' : '#FFFFFF', borderColor }]}>
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
                        placeholder="e.g. 5'10\""
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
    paddingHorizontal: 16,
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  ringWrapper: {
    position: 'relative',
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  crownBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: '#F59E0B',
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#05060A',
  },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    backgroundColor: '#FD3A73',
    padding: 7,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#05060A',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  completionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
  },
  occupation: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
  },
  editBtnText: {
    color: '#FD3A73',
    fontSize: 13,
    fontWeight: '800',
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  progressPercentNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FD3A73',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  tipBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionActionText: {
    color: '#FD3A73',
    fontSize: 12,
    fontWeight: '800',
  },
  photosScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryPhotoWrapper: {
    position: 'relative',
    width: 90,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
  },
  mainPhotoTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FD3A73',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainPhotoTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  addPhotoSlot: {
    width: 90,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoSlotText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  bioContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  goalPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  goalPillText: {
    color: '#FD3A73',
    fontSize: 13,
    fontWeight: '800',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
  },
  promptQuestion: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  promptAnswer: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  vipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  vipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vipProBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vipProText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  vipPerks: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '700',
  },
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
