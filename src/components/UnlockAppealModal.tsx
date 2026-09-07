import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UnlockAppealModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userPhone?: string;
  violationReason?: string;
  onSubmitAppeal: (userId: string, appealNote: string, violationReason?: string) => Promise<boolean>;
  isDarkMode?: boolean;
}

export const UnlockAppealModal: React.FC<UnlockAppealModalProps> = ({
  visible,
  onClose,
  userId,
  userName = 'Member',
  userPhone,
  violationReason,
  onSubmitAppeal,
  isDarkMode = true,
}) => {
  const [appealText, setAppealText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const bg = isDarkMode ? '#0A0B14' : '#FFFFFF';
  const cardBg = isDarkMode ? '#13141F' : '#F8F9FB';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  const handleSubmit = async () => {
    if (!appealText.trim()) {
      Alert.alert('Appeal Required', 'Please explain why your block should be opened/unblocked.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSubmitAppeal(userId, appealText.trim(), violationReason);
      setIsSubmitting(false);
      if (ok) {
        Alert.alert(
          'Request Submitted 📩',
          'Aapki unlock request admin ke pas bhej di gayi hai. Admin review karke aapka block open karega.',
          [
            {
              text: 'OK',
              onPress: () => {
                setAppealText('');
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Could not submit appeal. Please try again.');
      }
    } catch (e: any) {
      setIsSubmitting(false);
      Alert.alert('Error', e?.message || 'Failed to submit appeal');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: bg, borderColor: borderCol }]}>
          {/* Top Decorative Bar */}
          <LinearGradient
            colors={['#FD3A73', '#FF7A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGradientBar}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={22} color="#00E5FF" />
              </View>
              <View>
                <Text style={[styles.title, { color: textColor }]}>Request to Unlock Account</Text>
                <Text style={[styles.subTitle, { color: subText }]}>
                  Safety Suspension Appeal to Admin
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={subText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Notice Card: What you did */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                  borderColor: '#EF4444',
                },
              ]}
            >
              <Ionicons name="warning-outline" size={20} color="#EF4444" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: '#EF4444' }]}>
                  AAPNE KYA KIYA (SAFETY VIOLATION):
                </Text>
                <Text style={[styles.infoDesc, { color: textColor, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }]}>
                  {violationReason || 'Chat me Mobile Number ya Instagram / Social ID share karne ki koshish ki.'}
                </Text>
                <Text style={[styles.infoDesc, { color: subText, fontSize: 11, marginTop: 4 }]}>
                  Community safety rules ke tahat account 3 din suspend hua hai. Admin review karke unblock kar sakta hai.
                </Text>
              </View>
            </View>

            {/* User Details Summary */}
            <View style={[styles.userSummaryCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.userRow}>
                <Text style={[styles.userRowLabel, { color: subText }]}>Applicant Name:</Text>
                <Text style={[styles.userRowValue, { color: textColor }]}>{userName}</Text>
              </View>
              {Boolean(userPhone) && (
                <View style={styles.userRow}>
                  <Text style={[styles.userRowLabel, { color: subText }]}>Phone / Contact:</Text>
                  <Text style={[styles.userRowValue, { color: '#00E5FF' }]}>{userPhone}</Text>
                </View>
              )}
              <View style={styles.userRow}>
                <Text style={[styles.userRowLabel, { color: subText }]}>User ID:</Text>
                <Text style={[styles.userRowValue, { color: subText, fontSize: 11 }]}>{userId}</Text>
              </View>
            </View>

            {/* Appeal Explanation Box */}
            <Text style={[styles.inputLabel, { color: subText }]}>
              EXPLAIN YOUR APPEAL / BLOCK OPEN KARNE KA KARAN:
            </Text>
            <TextInput
              style={[
                styles.appealInput,
                {
                  backgroundColor: cardBg,
                  color: textColor,
                  borderColor: borderCol,
                },
              ]}
              placeholder="Apna karan likhein — kya galti thi ya kyu aapka block hataya jana chahiye... (e.g. I apologize for the issue, I will adhere to community standards.)"
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              value={appealText}
              onChangeText={setAppealText}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: subText }]}>
              {appealText.length} / 500 characters
            </Text>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: borderCol }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: borderCol }]}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FD3A73', '#FF7A00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Ionicons name="paper-plane" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Submitting...' : 'Send Unlock Request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topGradientBar: {
    height: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  subTitle: {
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 10,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  userSummaryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRowLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  userRowValue: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  appealInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  submitBtn: {
    flex: 1.4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});
