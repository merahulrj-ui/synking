import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { GradientButton } from '../../components/GradientButton';

export default function FeedbackScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { submitFeedback, isDarkMode } = useApp();

  const [matched, setMatched] = useState(true);
  const [respectful, setRespectful] = useState(true);
  const [safe, setSafe] = useState(true);
  const [notes, setNotes] = useState('');

  const bg = isDarkMode ? '#05060A' : '#F8F9FB';
  const headerBg = isDarkMode ? '#05060A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const cardBg = isDarkMode ? '#13141F' : '#FFFFFF';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/matches');
    }
  };

  const handleSubmit = () => {
    if (bookingId) {
      submitFeedback(bookingId, { matched, respectful, safe, notes });
    }
    Alert.alert(
      'Thank you! 🛡️',
      'Your feedback is 100% anonymous and helps keep the SYNKING community safe for everyone.',
      [{ text: 'Done', onPress: handleClose }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderCol }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark" size={18} color="#00E5FF" />
          <Text style={[styles.title, { color: textColor }]}>Post-Date Safety Review</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: subText }]}>
          Your feedback is <Text style={{ color: textColor, fontFamily: 'Poppins_800ExtraBold' }}>100% blind & anonymous</Text>. It is never shared with your date.
        </Text>

        <View style={styles.questionsContainer}>
          <TouchableOpacity
            style={[styles.questionItem, { backgroundColor: cardBg, borderColor: borderCol }]}
            activeOpacity={0.8}
            onPress={() => setMatched(!matched)}
          >
            <Text style={[styles.questionText, { color: textColor }]}>
              Did they look like their profile photos?
            </Text>
            <Text style={styles.checkIcon}>{matched ? '✅ Yes' : '❌ No'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.questionItem, { backgroundColor: cardBg, borderColor: borderCol }]}
            activeOpacity={0.8}
            onPress={() => setRespectful(!respectful)}
          >
            <Text style={[styles.questionText, { color: textColor }]}>
              Was their behaviour respectful?
            </Text>
            <Text style={styles.checkIcon}>{respectful ? '✅ Yes' : '❌ No'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.questionItem, { backgroundColor: cardBg, borderColor: borderCol }]}
            activeOpacity={0.8}
            onPress={() => setSafe(!safe)}
          >
            <Text style={[styles.questionText, { color: textColor }]}>
              Did you feel 100% safe during the date?
            </Text>
            <Text style={styles.checkIcon}>{safe ? '✅ Yes' : '❌ No'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesSection}>
          <Text style={[styles.notesLabel, { color: subText }]}>
            Optional Confidential Notes for Safety Team:
          </Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: cardBg, borderColor: borderCol, color: textColor }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Share any highlights or concerns..."
            placeholderTextColor={subText}
            multiline
            numberOfLines={4}
          />
        </View>

        <GradientButton
          title="Submit Anonymous Review 🛡️"
          onPress={handleSubmit}
          style={{ marginTop: 24, marginBottom: 30 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_800ExtraBold',
  },
  closeBtn: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 12.5,
    marginBottom: 16,
    lineHeight: 18,
  },
  questionsContainer: {
    gap: 10,
  },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  questionText: {
    fontSize: 13.5,
    fontFamily: 'Poppins_700Bold',
    maxWidth: '75%',
  },
  checkIcon: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
  },
  notesSection: {
    marginTop: 18,
    gap: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  notesInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 90,
  },
});