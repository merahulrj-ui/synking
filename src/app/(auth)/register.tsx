import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientButton } from '../../components/GradientButton';
import { Colors } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState('');
  const [bio, setBio] = useState('');

  const handleRegister = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>⚡ SYNKING</Text>
          <Text style={styles.tagline}>Create Your Verified Profile</Text>
          <View style={styles.safetyBadge}>
            <Text style={styles.safetyText}>🛡️ Identity Verification Required</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Sharma"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="24"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />

          <Text style={styles.label}>Occupation / College</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Architect @ Studio"
            placeholderTextColor={Colors.textMuted}
            value={occupation}
            onChangeText={setOccupation}
          />

          <Text style={styles.label}>Top 3 Vibe Tags</Text>
          <TextInput
            style={styles.input}
            placeholder="Specialty Coffee, Live Jazz, Bowling"
            placeholderTextColor={Colors.textMuted}
            value={interests}
            onChangeText={setInterests}
          />

          <Text style={styles.label}>My Ideal First Date...</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="Coffee, dessert and exploring art galleries!"
            placeholderTextColor={Colors.textMuted}
            multiline
            value={bio}
            onChangeText={setBio}
          />

          <GradientButton
            title="Create Verified Profile 🛡️"
            onPress={handleRegister}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={{ color: Colors.neonCyan, fontWeight: '800' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    fontFamily: 'Poppins_900Black',
    fontSize: 32,
    color: '#FF0055',
  },
  tagline: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  safetyBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  safetyText: {
    color: Colors.neonCyan,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
  },
  switchBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
