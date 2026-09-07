import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReportReasonModalProps {
  visible: boolean;
  targetUserName: string;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
  isDarkMode?: boolean;
}

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', icon: 'hand-left-outline', desc: 'Abusive language, threats, or aggressive behavior' },
  { id: 'inappropriate', label: 'Inappropriate Photos or Content', icon: 'eye-off-outline', desc: 'Sexually explicit, vulgar, or offensive media' },
  { id: 'fake', label: 'Fake Profile or Impersonation', icon: 'person-remove-outline', desc: 'Using someone else photos, celebrity, or bot' },
  { id: 'scam', label: 'Scammer or Financial Fraud', icon: 'cash-outline', desc: 'Asking for money, crypto, or promotional sales' },
  { id: 'spam', label: 'Spam or Commercial Promotion', icon: 'megaphone-outline', desc: 'Sending unsolicited links or business ads' },
  { id: 'other', label: 'Other Safety Concern', icon: 'alert-circle-outline', desc: 'Violating community standards or unwanted contact' },
];

export const ReportReasonModal: React.FC<ReportReasonModalProps> = ({
  visible,
  targetUserName,
  onClose,
  onSubmit,
  isDarkMode = true,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0].label);
  const [customNotes, setCustomNotes] = useState<string>('');

  const bg = isDarkMode ? '#0A0B14' : '#FFFFFF';
  const cardBg = isDarkMode ? '#13141F' : '#F8F9FB';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  const handleConfirm = () => {
    onSubmit(selectedReason, customNotes.trim() ? customNotes.trim() : undefined);
    setCustomNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: bg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-half-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: textColor }]}>Report & Block</Text>
                <Text style={[styles.subTitle, { color: subText }]} numberOfLines={1}>
                  Why are you blocking {targetUserName}?
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={subText} />
            </TouchableOpacity>
          </View>

          {/* Reasons List */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: subText }]}>
              SELECT PRIMARY REASON (KARAN):
            </Text>

            {REPORT_REASONS.map(r => {
              const isSelected = selectedReason === r.label;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reasonItem,
                    { backgroundColor: cardBg, borderColor: isSelected ? '#FD3A73' : borderCol },
                    isSelected && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(r.label)}
                  activeOpacity={0.8}
                >
                  <View style={styles.reasonRadio}>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? '#FD3A73' : subText },
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        { color: isSelected ? '#FD3A73' : textColor },
                        isSelected && { fontFamily: 'Poppins_700Bold' },
                      ]}
                    >
                      {r.label}
                    </Text>
                    <Text style={[styles.reasonDesc, { color: subText }]}>{r.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Custom Notes */}
            <Text style={[styles.sectionLabel, { color: subText, marginTop: 14 }]}>
              ADDITIONAL DETAILS / NOTES (OPTIONAL):
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: cardBg,
                  color: textColor,
                  borderColor: borderCol,
                },
              ]}
              placeholder="Add any specific context for admin review..."
              placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
              value={customNotes}
              onChangeText={setCustomNotes}
              multiline
              numberOfLines={3}
              maxLength={250}
            />
          </ScrollView>

          {/* Actions Footer */}
          <View style={[styles.footer, { borderTopColor: borderCol }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: borderCol }]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Ionicons name="ban" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>Block & Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  reasonItemSelected: {
    backgroundColor: 'rgba(253, 58, 115, 0.08)',
  },
  reasonRadio: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FD3A73',
  },
  reasonLabel: {
    fontSize: 13.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  reasonDesc: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
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
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'Poppins_700Bold',
  },
});
