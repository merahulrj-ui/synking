import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', // Male 1
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800', // Female 1
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', // Male 2
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800', // Female 2
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800', // Female 3
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800', // Male 3
];

interface Props {
  visible: boolean;
  onClose?: () => void;
}

export const CreateProfileModal: React.FC<Props> = ({ visible, onClose }) => {
  const { loginUser, currentUser, isDarkMode } = useApp();
  const [name, setName] = useState('');
  const [age, setAge] = useState('22');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [city, setCity] = useState('Roorkee');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(AVATAR_OPTIONS[0]);

  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const inputBg = isDarkMode ? '#1A1B28' : '#F1F5F9';

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    const generateHashId = () => Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newId = `usr_${generateHashId()}`;
    const newProfile = {
      id: newId,
      name: name.trim(),
      age: parseInt(age, 10) || 22,
      gender,
      occupation: occupation.trim() || 'Member',
      location: city.trim() || 'Roorkee',
      phoneNumber: currentUser?.phoneNumber || '',
      distance: '0 km',
      bio: bio.trim() || `Exploring cafes & dates in ${city || 'Roorkee'} ✨`,
      photo: selectedPhoto,
      photos: [selectedPhoto],
      interests: ['Coffee', 'Music', 'Travel'],
      compatibility: 98,
      isVerified: true,
      isVip: false,
    };

    loginUser(newProfile);
    if (onClose) onClose();
    Alert.alert('Profile Created! 🚀', `Welcome ${name}! Your profile is live in ${city || 'Roorkee'}.`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('../../assets/images/logo_emblem.png')}
                style={{ width: 28, height: 28, borderRadius: 8 }}
                resizeMode="contain"
              />
              <Text style={[styles.logo, { color: textColor }]}>Synkin</Text>
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>REAL ROORKEE NETWORK</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
            <Text style={[styles.title, { color: textColor }]}>Create Your Real Profile</Text>
            <Text style={[styles.subtitle, { color: subText }]}>
              Enter your details to discover and connect with other real users on Phone / Laptop.
            </Text>

            {/* Avatar Selector */}
            <Text style={[styles.fieldLabel, { color: subText }]}>Choose Your Avatar Photo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {AVATAR_OPTIONS.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedPhoto(img)}
                  style={[
                    styles.avatarOption,
                    selectedPhoto === img && styles.avatarOptionSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img }} style={styles.avatarImg} />
                  {selectedPhoto === img && (
                    <View style={styles.avatarCheck}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name Input */}
            <Text style={[styles.fieldLabel, { color: subText }]}>Your Name (e.g. Rahul / Ananya)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={subText}
            />

            {/* City & Age Row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Text style={[styles.fieldLabel, { color: subText }]}>City / Location</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Roorkee"
                  placeholderTextColor={subText}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: subText }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="22"
                  placeholderTextColor={subText}
                />
              </View>
            </View>

            {/* Gender Toggle */}
            <Text style={[styles.fieldLabel, { color: subText }]}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    { backgroundColor: gender === g ? '#FD3A73' : inputBg, borderColor: borderCol },
                  ]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderText, { color: gender === g ? '#FFF' : textColor }]}>
                    {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '✨ Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Occupation */}
            <Text style={[styles.fieldLabel, { color: subText }]}>Occupation / College</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="e.g. Student at IIT Roorkee"
              placeholderTextColor={subText}
            />

            {/* Bio */}
            <Text style={[styles.fieldLabel, { color: subText }]}>Bio</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, minHeight: 54 }]}
              value={bio}
              onChangeText={setBio}
              placeholder="What do you enjoy doing?"
              placeholderTextColor={subText}
              multiline
            />

            {/* Create Button */}
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.85}>
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.createBtnText}>Join & Launch Profile 🚀</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1,
  },
  tagBadge: {
    backgroundColor: 'rgba(253, 58, 115, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    color: '#FD3A73',
    fontSize: 9,
    fontFamily: 'Poppins_900Black',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  avatarOption: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: '#FD3A73',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FD3A73',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FD3A73',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#FD3A73',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 14.5,
    fontFamily: 'Poppins_900Black',
  },
});
