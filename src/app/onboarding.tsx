import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { ALL_INTERESTS, LOOKING_FOR_OPTIONS } from './(tabs)/profile';

export default function OnboardingScreen() {
  const { currentUser, updateCurrentUser } = useApp();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 9;

  // Form States
  const [name, setName] = useState(currentUser?.name || '');
  const [dob, setDob] = useState(''); // e.g. DD/MM/YYYY
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary' | 'other'>(currentUser?.gender || 'male');
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos?.length ? currentUser.photos : []);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [interests, setInterests] = useState<string[]>(() =>
    (currentUser?.interests || []).filter(i => ALL_INTERESTS.includes(i))
  );
  const [lookingFor, setLookingFor] = useState(currentUser?.lookingFor || '');
  const [userLocation, setUserLocation] = useState<string>(
    typeof currentUser?.location === 'string' ? currentUser.location : 'Roorkee'
  );

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = async () => {
    triggerHaptic();

    // Validations per step
    if (step === 1 && name.trim().length < 2) {
      Alert.alert('Oops', 'Please enter your first name.');
      return;
    }
    if (step === 2 && dob.length < 8) {
      Alert.alert('Oops', 'Please enter a valid Date of Birth.');
      return;
    }
    if (step === 4 && photos.length < 2) {
      Alert.alert('More Photos Needed', 'Please add at least 2 photos to continue.');
      return;
    }
    if (step === 6 && interests.length < 3) {
      Alert.alert('Select Interests', 'Please select at least 3 interests.');
      return;
    }
    if (step === 7 && !lookingFor) {
      Alert.alert('Almost there', 'Please select what you are looking for.');
      return;
    }

    // Step 8: Location Permission
    if (step === 8) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location Required', 'We need your location to show nearby people.');
          return;
        }
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            const geocoded = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (geocoded && geocoded.length > 0) {
              const detectedCity = geocoded[0].city || geocoded[0].subregion || geocoded[0].district;
              if (detectedCity) setUserLocation(detectedCity);
            }
          }
        } catch (locErr) {
          console.log('Location geocode error:', locErr);
        }
      } catch (e) {
        console.log(e);
      }
    }

    // Final Step 9: Notifications & Save
    if (step === 9) {
      // Calculate age from dob
      let userAge = currentUser?.age || 22;
      if (dob) {
        const cleanDigits = dob.replace(/\D/g, '');
        if (cleanDigits.length >= 4) {
          const year = parseInt(cleanDigits.slice(-4), 10);
          const currentYear = new Date().getFullYear();
          if (year > 1920 && year <= currentYear) {
            userAge = currentYear - year;
          }
        }
      }

      // Complete Onboarding & Sync with Profile
      updateCurrentUser({
        name: name.trim(),
        age: userAge,
        gender,
        bio: bio.trim(),
        photos,
        photo: photos[0] || currentUser?.photo,
        interests,
        lookingFor,
        location: userLocation || currentUser?.location || 'Roorkee',
        isOnboardingComplete: true,
      });
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    triggerHaptic();
    if (step > 1) setStep(step - 1);
  };

  const pickImage = async (index: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      // Filter out empty slots if they didn't exist before this index
      setPhotos(newPhotos.filter(p => p));
    }
  };

  const toggleInterest = (i: string) => {
    triggerHaptic();
    const cleanInterests = interests.filter(x => ALL_INTERESTS.includes(x));
    if (cleanInterests.includes(i)) {
      setInterests(cleanInterests.filter(x => x !== i));
    } else {
      if (cleanInterests.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 interests.');
        return;
      }
      setInterests([...cleanInterests, i]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What's your first name?</Text>
            <Text style={styles.subtitle}>This is how it will appear on your profile.</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>When's your birthday?</Text>
            <Text style={styles.subtitle}>You must be at least 18 years old to use Synkin.</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#666"
              value={dob}
              onChangeText={setDob}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>How do you identify?</Text>
            <Text style={styles.subtitle}>Everyone is welcome on Synkin.</Text>
            <View style={styles.optionsList}>
              {['male', 'female', 'nonbinary', 'other'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionCard, gender === g && styles.optionCardActive]}
                  onPress={() => { triggerHaptic(); setGender(g as any); }}
                >
                  <Text style={[styles.optionText, gender === g && styles.optionTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Add your best photos</Text>
            <Text style={styles.subtitle}>Add at least 2 photos to continue.</Text>
            <View style={styles.photoGrid}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <TouchableOpacity key={idx} style={styles.photoSlot} onPress={() => pickImage(idx)}>
                  {photos[idx] ? (
                    <>
                      <Image source={{ uri: photos[idx] }} style={styles.photoImage} />
                      <View style={styles.photoEditBadge}>
                        <Ionicons name="pencil" size={14} color="#FFF" />
                      </View>
                    </>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="add" size={32} color="#FD3A73" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Write a short bio</Text>
            <Text style={styles.subtitle}>Tell them a little about yourself.</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="I love spontaneous road trips and finding the best coffee in the city..."
              placeholderTextColor="#666"
              value={bio}
              onChangeText={setBio}
              multiline
              autoFocus
            />
          </View>
        );
      case 6:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What are you into?</Text>
            <Text style={styles.subtitle}>Pick 3-5 interests to match with your vibe.</Text>
            <View style={styles.chipContainer}>
              {ALL_INTERESTS.map(i => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, interests.includes(i) && styles.chipActive]}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 7:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What are you looking for?</Text>
            <Text style={styles.subtitle}>Be honest, it helps find the right match.</Text>
            <View style={styles.optionsList}>
              {LOOKING_FOR_OPTIONS.map(opt => {
                const isSelected = lookingFor === opt.label || lookingFor === opt.title || lookingFor === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.lookingForCard, isSelected && styles.lookingForCardActive]}
                    onPress={() => { triggerHaptic(); setLookingFor(opt.label); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lookingForTitle, isSelected && styles.lookingForTitleActive]}>
                        {opt.title}
                      </Text>
                      {opt.description ? (
                        <Text style={styles.lookingForDesc}>{opt.description}</Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FD3A73" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 8:
        return (
          <View style={styles.contentCentered}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-sharp" size={48} color="#FD3A73" />
            </View>
            <Text style={styles.titleCentered}>Enable Location</Text>
            <Text style={styles.subtitleCentered}>
              You'll need to enable location to find matches nearby and suggest cool date venues.
            </Text>
          </View>
        );
      case 9:
        return (
          <View style={styles.contentCentered}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={48} color="#FD3A73" />
            </View>
            <Text style={styles.titleCentered}>Enable Notifications</Text>
            <Text style={styles.subtitleCentered}>
              Get pushed when you get a new match or message. Don't miss out!
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        ) : <View style={{ width: 28 }} />}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <LinearGradient colors={['#FD3A73', '#FF655B']} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextBtnText}>{step === 9 ? 'Complete Profile' : 'Continue'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#222',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FD3A73',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  contentCentered: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFF',
    marginBottom: 10,
  },
  titleCentered: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
  },
  subtitleCentered: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  input: {
    borderBottomWidth: 2,
    borderColor: '#333',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
    paddingVertical: 10,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#888',
  },
  optionTextActive: {
    color: '#FFF',
  },
  lookingForCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111',
  },
  lookingForCardActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
  },
  lookingForTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  lookingForTitleActive: {
    color: '#FD3A73',
  },
  lookingForDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoSlot: {
    width: '30%',
    aspectRatio: 0.7,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#222',
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FD3A73',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  chipActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.2)',
  },
  chipText: {
    color: '#888',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FD3A73',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  nextBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
});
