import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlockReport } from '../types';

interface AdminModerationModalProps {
  visible: boolean;
  onClose: () => void;
  blockReports: BlockReport[];
  onUnblockUser: (reportId: string, userId: string) => Promise<boolean>;
  onDismissAppeal: (reportId: string) => Promise<boolean>;
  onDeleteReport: (reportId: string) => Promise<boolean>;
  isDarkMode?: boolean;
}

const MASTER_KEYS = ['synking_master_2026', '7788', 'admin', 'synkin2026'];

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  visible,
  onClose,
  blockReports,
  onUnblockUser,
  onDismissAppeal,
  onDeleteReport,
  isDarkMode = true,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'unblocked'>('pending');

  const bg = isDarkMode ? '#05060A' : '#F1F5F9';
  const cardBg = isDarkMode ? '#0F101A' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0F172A';
  const subText = isDarkMode ? '#94A3B8' : '#64748B';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  const handleLogin = () => {
    const clean = inputKey.trim();
    if (MASTER_KEYS.includes(clean)) {
      setIsAuthenticated(true);
      setKeyError(false);
      setInputKey('');
    } else {
      setKeyError(true);
      Alert.alert('Access Denied', 'Invalid Master Secret Key. Default PIN is 7788');
    }
  };

  const handleUnblock = (report: BlockReport) => {
    Alert.alert(
      'Open User Block',
      `Are you sure you want to open block and restore full access for ${report.blockedUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🔓 Open Block Now',
          style: 'default',
          onPress: async () => {
            const ok = await onUnblockUser(report.id, report.blockedUserId);
            if (ok) {
              Alert.alert('User Unblocked! ✅', `${report.blockedUserName} ka block open kar diya gaya hai. Ab wo normal user ban gaye hain.`);
            }
          },
        },
      ]
    );
  };

  const handleDismiss = (report: BlockReport) => {
    Alert.alert(
      'Dismiss Appeal',
      `Reject ${report.blockedUserName}'s appeal and keep them blocked?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Appeal',
          style: 'destructive',
          onPress: async () => {
            await onDismissAppeal(report.id);
            Alert.alert('Appeal Dismissed', 'User will remain blocked.');
          },
        },
      ]
    );
  };

  const handleDelete = (reportId: string) => {
    Alert.alert('Delete Report', 'Permanently remove this report record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await onDeleteReport(reportId);
        },
      },
    ]);
  };

  // Filtered reports
  const pendingCount = blockReports.filter(r => r.status === 'appeal_pending').length;
  const unblockedCount = blockReports.filter(r => r.status === 'unblocked_by_admin').length;
  const totalCount = blockReports.length;

  const filteredReports = blockReports.filter(r => {
    if (activeTab === 'pending') return r.status === 'appeal_pending';
    if (activeTab === 'unblocked') return r.status === 'unblocked_by_admin';
    return true;
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: bg }]}>
        {/* Top Decorative App Header */}
        <View style={[styles.navbar, { borderBottomColor: borderCol, backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.badgeShield}>
              <Ionicons name="shield-checkmark" size={18} color="#00E5FF" />
            </View>
            <View>
              <Text style={styles.navTitle}>SYNKIN ADMIN CONSOLE</Text>
              <Text style={[styles.navSubtitle, { color: subText }]}>
                User Moderation & Unlock Appeals
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {!isAuthenticated ? (
          /* =========================================================================
             1. ADMIN MASTER KEY LOGIN SCREEN
             ========================================================================= */
          <View style={styles.loginContainer}>
            <View style={[styles.loginBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <View style={styles.keyIconCircle}>
                <Ionicons name="lock-closed" size={32} color="#FD3A73" />
              </View>
              <Text style={[styles.loginTitle, { color: textColor }]}>Admin Master Access</Text>
              <Text style={[styles.loginSub, { color: subText }]}>
                Enter the secret administrator PIN or Master Key to manage blocked users & review unlock appeal reports.
              </Text>

              <TextInput
                style={[
                  styles.keyInput,
                  {
                    backgroundColor: isDarkMode ? '#08090F' : '#F8F9FA',
                    borderColor: keyError ? '#EF4444' : borderCol,
                    color: textColor,
                  },
                ]}
                placeholder="Enter Admin PIN (Default: 7788)"
                placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                value={inputKey}
                onChangeText={t => {
                  setInputKey(t);
                  if (keyError) setKeyError(false);
                }}
                secureTextEntry
                autoFocus
              />

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FD3A73', '#FF7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtnGrad}
                >
                  <Ionicons name="key-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.loginBtnText}>Unlock Admin Panel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={{ color: subText, fontSize: 11, textAlign: 'center', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>
                Default PIN: <Text style={{ color: '#00E5FF', fontFamily: 'Poppins_700Bold' }}>7788</Text>
              </Text>
            </View>
          </View>
        ) : (
          /* =========================================================================
             2. LIVE ADMIN MODERATION & REPORTS DASHBOARD
             ========================================================================= */
          <View style={{ flex: 1 }}>
            {/* Quick Stat Counter Bar */}
            <View style={styles.statsBar}>
              <View style={[styles.statPill, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor: borderCol }]}>
                <Text style={styles.statLabel}>PENDING APPEALS</Text>
                <Text style={[styles.statNumber, { color: pendingCount > 0 ? '#F59E0B' : '#94A3B8' }]}>
                  {pendingCount}
                </Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor: borderCol }]}>
                <Text style={styles.statLabel}>TOTAL BLOCKED</Text>
                <Text style={[styles.statNumber, { color: '#EF4444' }]}>{totalCount}</Text>
              </View>

              <View style={[styles.statPill, { backgroundColor: isDarkMode ? '#13141F' : '#FFFFFF', borderColor: borderCol }]}>
                <Text style={styles.statLabel}>UNBLOCKED BY ADMIN</Text>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{unblockedCount}</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: borderCol }]}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
                onPress={() => setActiveTab('pending')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === 'pending' ? '#FD3A73' : subText },
                    activeTab === 'pending' && { fontFamily: 'Poppins_700Bold' },
                  ]}
                >
                  Pending Requests ({pendingCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === 'all' ? '#FD3A73' : subText },
                    activeTab === 'all' && { fontFamily: 'Poppins_700Bold' },
                  ]}
                >
                  All Reports ({totalCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'unblocked' && styles.tabItemActive]}
                onPress={() => setActiveTab('unblocked')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: activeTab === 'unblocked' ? '#FD3A73' : subText },
                    activeTab === 'unblocked' && { fontFamily: 'Poppins_700Bold' },
                  ]}
                >
                  Unblocked ({unblockedCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reports List */}
            <ScrollView style={styles.reportsScroll} showsVerticalScrollIndicator={false}>
              {filteredReports.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={56} color="#10B981" />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No Reports Found</Text>
                  <Text style={[styles.emptySub, { color: subText }]}>
                    {activeTab === 'pending'
                      ? 'Abhi kisi blocked user ki pending unlock request nahi hai.'
                      : 'Is category me koi user report nahi hai.'}
                  </Text>
                </View>
              ) : (
                filteredReports.map(report => {
                  const isPending = report.status === 'appeal_pending';
                  const isUnblocked = report.status === 'unblocked_by_admin';

                  return (
                    <View
                      key={report.id}
                      style={[
                        styles.reportCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: isPending
                            ? 'rgba(245, 158, 11, 0.4)'
                            : isUnblocked
                            ? 'rgba(16, 185, 129, 0.4)'
                            : borderCol,
                        },
                      ]}
                    >
                      {/* Top User Row */}
                      <View style={styles.cardTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <Image
                            source={{
                              uri:
                                report.blockedUserPhoto ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                            }}
                            style={styles.userAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <Text style={[styles.reportUserName, { color: textColor }]}>
                                {report.blockedUserName}
                              </Text>
                              {/* Status Badge */}
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor: isPending
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : isUnblocked
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : 'rgba(239, 68, 68, 0.15)',
                                    borderColor: isPending
                                      ? '#F59E0B'
                                      : isUnblocked
                                      ? '#10B981'
                                      : '#EF4444',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    {
                                      color: isPending
                                        ? '#F59E0B'
                                        : isUnblocked
                                        ? '#10B981'
                                        : '#EF4444',
                                    },
                                  ]}
                                >
                                  {isPending
                                    ? '● APPEAL PENDING'
                                    : isUnblocked
                                    ? '✓ UNBLOCKED (OPEN)'
                                    : '🔒 BLOCKED'}
                                </Text>
                              </View>
                            </View>

                            <Text style={[styles.userIdText, { color: subText }]}>
                              Phone: {report.blockedUserPhone || 'Not shared'} • ID: {report.blockedUserId.slice(0, 12)}
                            </Text>
                            <Text style={[styles.timeText, { color: subText }]}>
                              Blocked: {formatDate(report.timestamp)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleDelete(report.id)}
                          style={styles.deleteIconBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/* 🚩 BLOCK REASON (KARAN) */}
                      <View
                        style={[
                          styles.reasonBox,
                          {
                            backgroundColor: isDarkMode ? '#171827' : '#F1F5F9',
                            borderColor: borderCol,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <Ionicons name="alert-circle" size={15} color="#EF4444" />
                          <Text style={styles.reasonHeader}>BLOCK HONE KA KARAN (REASON):</Text>
                        </View>
                        <Text style={[styles.reasonContent, { color: textColor }]}>
                          {report.reason}
                        </Text>
                        <Text style={[styles.reporterText, { color: subText }]}>
                          Reported by: {report.reportedByUserName}
                        </Text>
                      </View>

                      {/* 📩 USER UNLOCK REQUEST & APPEAL NOTE */}
                      {report.appealNote ? (
                        <View
                          style={[
                            styles.appealBox,
                            {
                              backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
                              borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <Ionicons name="mail-unread" size={15} color="#F59E0B" />
                            <Text style={[styles.appealHeader, { color: '#F59E0B' }]}>
                              USER KA UNLOCK REQUEST / APPEAL:
                            </Text>
                          </View>
                          <Text style={[styles.appealContent, { color: textColor }]}>
                            "{report.appealNote}"
                          </Text>
                          {Boolean(report.appealTimestamp) && (
                            <Text style={[styles.appealTime, { color: subText }]}>
                              Requested: {formatDate(report.appealTimestamp)}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <View style={{ paddingVertical: 6 }}>
                          <Text style={{ color: subText, fontSize: 11, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' }}>
                            ℹ️ Is user ne abhi unlock request submit nahi kiya hai.
                          </Text>
                        </View>
                      )}

                      {/* 🟢 ADMIN ACTION BUTTONS: BLOCK OPEN KARNE KA OPTION */}
                      {(!report.reportedByUserId || report.reportedByUserId !== 'system_shield') && !report.reason.toLowerCase().includes('contact sharing') ? (
                        <View style={{ backgroundColor: 'rgba(148, 163, 184, 0.08)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: borderCol, marginTop: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="information-circle-outline" size={16} color={subText} />
                            <Text style={{ color: subText, fontSize: 11.5, fontFamily: 'Poppins_600SemiBold' }}>
                              Users Ka Aapas Ka Private Block
                            </Text>
                          </View>
                          <Text style={{ color: subText, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>
                            Ye do users ke beech ka aapas ka personal block hai. Isme Admin se unblock karne ka koi matter nahi hai.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.actionBtnRow}>
                          {!isUnblocked ? (
                            <TouchableOpacity
                              style={styles.unblockBtn}
                              onPress={() => handleUnblock(report)}
                              activeOpacity={0.85}
                            >
                              <LinearGradient
                                colors={['#10B981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.unblockBtnGrad}
                              >
                                <Ionicons name="lock-open-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={styles.unblockBtnText}>
                                  🔓 Open Block (Unsuspend User)
                                </Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.unblockedBanner}>
                              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                              <Text style={styles.unblockedBannerText}>
                                Block Open Ho Chuka Hai (Active)
                              </Text>
                            </View>
                          )}

                          {isPending && (
                            <TouchableOpacity
                              style={[styles.dismissBtn, { borderColor: borderCol }]}
                              onPress={() => handleDismiss(report)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.dismissBtnText, { color: '#EF4444' }]}>
                                Reject Appeal
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  badgeShield: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FD3A73',
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.8,
  },
  navSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  closeHeaderBtn: {
    padding: 6,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  keyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253, 58, 115, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  loginSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  keyInput: {
    width: '100%',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginBtnGrad: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#FD3A73',
  },
  tabItemText: {
    fontSize: 12.5,
    fontFamily: 'Poppins_500Medium',
  },
  reportsScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    maxWidth: 260,
  },
  reportCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
  },
  reportUserName: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.5,
  },
  userIdText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  timeText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
  },
  deleteIconBtn: {
    padding: 6,
  },
  reasonBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonHeader: {
    color: '#EF4444',
    fontSize: 10.5,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.6,
  },
  reasonContent: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  reporterText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  appealBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  appealHeader: {
    fontSize: 10.5,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.6,
  },
  appealContent: {
    fontSize: 12.5,
    fontFamily: 'Poppins_500Medium',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 4,
  },
  appealTime: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unblockBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  unblockBtnGrad: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
  },
  unblockedBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
  },
  unblockedBannerText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  dismissBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
