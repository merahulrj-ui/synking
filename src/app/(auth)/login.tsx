import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientButton } from '../../components/GradientButton';
import { Colors } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.heroSection}>
        <Text style={styles.logo}>⚡ SYNKING</Text>
        <Text style={styles.tagline}>Discover. Synk. Meet IRL. 🔥</Text>
        <View style={styles.safetyBadge}>
          <Text style={styles.safetyText}>🛡️ Identity Verified · Safe Public Outlets Only</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Phone"
          placeholderTextColor={Colors.textMuted}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <GradientButton
          title="Get Into SYNKING ⚡"
          onPress={handleLogin}
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.switchText}>
            New to SYNKING? <Text style={{ color: Colors.neonCyan, fontWeight: '800' }}>Get InSynk</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  logo: {
    fontFamily: 'Poppins_900Black',
    fontSize: 38,
    color: '#FF0055',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  safetyBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
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
    padding: 22,
    gap: 12,
  },
  cardTitle: {
    color: '#FFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
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
