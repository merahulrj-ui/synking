import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '../contexts/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PlanCategory = 'full_vip' | 'calling_only' | 'boost_only';

interface Plan {
  id: string;
  duration: string;
  price: string;
  perDay: string;
  badge: string | null;
  note?: string;
  isPopular?: boolean;
}

const CATEGORIES: { id: PlanCategory; label: string; icon: string; subtitle: string }[] = [
  {
    id: 'full_vip',
    label: '👑 All-In-One VIP',
    icon: 'crown',
    subtitle: 'Complete VIP suite: HD Video & Audio Calling, Boosts, Unlimited Rewinds & Cafe perks',
  },
  {
    id: 'calling_only',
    label: '📞 Calling Pass',
    icon: 'call',
    subtitle: '1-on-1 HD Video & Audio Calling with mutual approval · 15-min calling window',
  },
  {
    id: 'boost_only',
    label: '⚡ Match Booster',
    icon: 'flash',
    subtitle: 'Unlimited Rewinds, 5 Daily Super Synks & 5x Discovery Boosts to get max matches',
  },
];

const PLANS_BY_CATEGORY: Record<PlanCategory, Plan[]> = {
  full_vip: [
    {
      id: 'vip_3_months',
      duration: '3 Months',
      price: '₹999',
      perDay: '₹11 / day',
      badge: 'POPULAR 🔥',
      isPopular: true,
    },
    {
      id: 'vip_1_month',
      duration: '1 Month',
      price: '₹499',
      perDay: '₹16 / day',
      badge: 'STANDARD',
    },
    {
      id: 'vip_12_months',
      duration: '12 Months',
      price: '₹2,199',
      perDay: '₹6 / day',
      badge: 'BEST VALUE 💎',
    },
  ],
  calling_only: [
    {
      id: 'call_10_min',
      duration: '10 Mins Call*',
      price: '₹49',
      perDay: '₹5 / min',
      badge: '10 MINS ⚡',
    },
    {
      id: 'call_25_min',
      duration: '25 Mins Call*',
      price: '₹99',
      perDay: '₹4 / min',
      badge: '25 MINS 🥂',
    },
    {
      id: 'call_1_month',
      duration: '1 Month Pass*',
      price: '₹249',
      perDay: '₹8 / day',
      badge: 'BEST VALUE 📞',
      isPopular: true,
    },
  ],
  boost_only: [
    {
      id: 'boost_1_month',
      duration: '1 Month',
      price: '₹349',
      perDay: '₹11 / day',
      badge: 'POPULAR 🚀',
      isPopular: true,
    },
    {
      id: 'boost_1_week',
      duration: '1 Week',
      price: '₹149',
      perDay: '₹21 / day',
      badge: '1 WEEK 🎯',
    },
    {
      id: 'boost_3_months',
      duration: '3 Months',
      price: '₹699',
      perDay: '₹7 / day',
      badge: 'MAX VALUE 🌟',
    },
  ],
};

const PERKS_BY_CATEGORY: Record<PlanCategory, { icon: any; title: string; desc: string }[]> = {
  full_vip: [
    { icon: 'videocam', title: '1-on-1 HD Video & Voice Calling', desc: 'Private encrypted video & voice dates (15-min window upon her approval).' },
    { icon: 'mic', title: 'Encrypted Voice Notes & Audio 🎙️', desc: 'Send audio messages in chat. Audio is VIP-locked to prevent phone number leaks.' },
    { icon: 'crown', title: 'Gold VIP Badge & Border', desc: 'Exclusive gold border and crown icon on your card.' },
    { icon: 'infinite', title: 'Unlimited Super Likes & Rewinds', desc: 'Never run out of swipes and rewind missed matches.' },
    { icon: 'eye', title: 'See Who Liked You', desc: 'Instant access to everyone who already swiped right on you.' },
    { icon: 'cafe', title: 'Complimentary Cafe Perks', desc: 'Free welcome drinks & reserved tables at curated cafes.' },
    { icon: 'shield-checkmark', title: 'Incognito Ghost Mode', desc: 'Only people you like will be able to see your profile.' },
    { icon: 'rocket', title: '5x Profile Discovery Boost', desc: 'Be the top profile in your city for 1 hour every week.' },
  ],
  calling_only: [
    { icon: 'shield-checkmark', title: 'Mutual Consent & Girl Approval 🛡️', desc: 'Call connects only when she approves. Opens a 15-minute dedicated calling window.' },
    { icon: 'videocam', title: '1-on-1 Encrypted HD Video Calling', desc: 'Private video dates in 15-min approved calling windows without exchanging numbers.' },
    { icon: 'call', title: 'Crystal-Clear HD Audio Calling', desc: 'HD voice calls in 15-min approved windows (1-Month Pass: 20 mins/day fair-use).' },
    { icon: 'mic', title: 'Unlimited Encrypted Voice Notes 🎙️', desc: 'Send voice messages directly in chat without phone number leaks.' },
  ],
  boost_only: [
    { icon: 'rocket', title: '5x Profile Discovery Boost', desc: 'Jump straight to #1 in your city for 30 minutes to maximize views.' },
    { icon: 'infinite', title: 'Unlimited Card Rewinds', desc: 'Accidentally passed? Undo swipes anytime with 0 limits.' },
    { icon: 'star', title: '5 Daily Super Synks ⭐', desc: 'Jump straight to the top of matches inbox with priority alerts.' },
    { icon: 'eye', title: 'See Who Liked You First', desc: 'Browse everyone who swiped right on you and match instantly.' },
  ],
};

export default function VipMembershipScreen() {
  const router = useRouter();
  const { currentUser, updateCurrentUser, isDarkMode } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('full_vip');
  const [selectedPlan, setSelectedPlan] = useState('vip_3_months');

  const currentPlans = PLANS_BY_CATEGORY[selectedCategory];
  const currentPerks = PERKS_BY_CATEGORY[selectedCategory];
  const activePlan = currentPlans.find(p => p.id === selectedPlan) || currentPlans[0];

  const handleActivateVip = () => {
    updateCurrentUser({ isVip: true });
    Alert.alert(
      '👑 Plan Activated!',
      `Congratulations! Your ${activePlan.duration} plan (${activePlan.price}) is now active. Enjoy premium features!`,
      [{ text: 'Start Dating ✨', onPress: () => router.back() }]
    );
  };

  const bgTheme = isDarkMode ? '#07080D' : '#F9FAFB';
  const textColor = isDarkMode ? '#FFFFFF' : '#111827';
  const cardBg = isDarkMode ? '#13141E' : '#FFFFFF';

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>SYNKING VIP</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Glowing VIP Banner */}
        <LinearGradient
          colors={['#FFB703', '#FB8500', '#D90429']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerCard}
        >
          <View style={styles.crownCircle}>
            <MaterialCommunityIcons name="crown" size={38} color="#FFF" />
          </View>
          <Text style={styles.bannerTitle}>SYNKING BLACK VIP</Text>
          <Text style={styles.bannerSub}>
            Level up your dating experience with unlimited access, high-priority discovery & exclusive cafe perks.
          </Text>
          {currentUser?.isVip && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>✓ CURRENTLY ACTIVE</Text>
            </View>
          )}
        </LinearGradient>

        {/* Category Tabs (3 Categories) */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Select Plan Type</Text>
        <View style={styles.categoryTabContainer}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  { 
                    backgroundColor: isActive ? '#FB8500' : cardBg, 
                    borderColor: isActive ? '#FB8500' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                  }
                ]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  const firstPopular = PLANS_BY_CATEGORY[cat.id].find(p => p.isPopular) || PLANS_BY_CATEGORY[cat.id][0];
                  setSelectedPlan(firstPopular.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryTabText, { color: isActive ? '#FFF' : textColor }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.categorySubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
          {CATEGORIES.find(c => c.id === selectedCategory)?.subtitle}
        </Text>

        {/* 3 Plans for Current Category */}
        <View style={styles.plansContainer}>
          {currentPlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: cardBg, borderColor: isSelected ? '#FB8500' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') },
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.85}
              >
                {plan.badge && (
                  <View style={[styles.planBadge, plan.isPopular && styles.popularBadge]}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planDuration, { color: textColor }]}>{plan.duration}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPerMonth}>{plan.perDay}</Text>
                {plan.note && (
                  <View style={styles.planNoteBadge}>
                    <Text style={styles.planNoteText}>{plan.note}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedCategory === 'calling_only' && (
          <Text style={[styles.footnoteDisclaimer, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
            * Upon recipient's approval · 20 min/day fair use on 1-Month pass
          </Text>
        )}

        {/* Category Specific Perks Checklist */}
        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 18 }]}>
          Included in {CATEGORIES.find(c => c.id === selectedCategory)?.label}
        </Text>
        <View style={styles.perksList}>
          {currentPerks.map((perk, idx) => (
            <View key={idx} style={[styles.perkCard, { backgroundColor: cardBg }]}>
              <View style={styles.perkIconBox}>
                <Ionicons name="checkmark-circle" size={22} color="#FB8500" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.perkTitle, { color: textColor }]}>{perk.title}</Text>
                <Text style={styles.perkDesc}>{perk.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.subscribeBtn}
          activeOpacity={0.85}
          onPress={handleActivateVip}
        >
          <LinearGradient
            colors={['#FFB703', '#FB8500']}
            style={styles.subscribeGradient}
          >
            <Text style={styles.subscribeBtnText}>
              {currentUser?.isVip
                ? `Renew ${activePlan.duration} Plan (${activePlan.price}) 👑`
                : `Unlock for ${activePlan.price} (${activePlan.duration}) ✨`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Instant activation. Cancel anytime in profile settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  crownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#FFB703',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  activePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  activePillText: {
    color: '#D90429',
    fontSize: 10,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
    marginTop: 18,
    marginBottom: 8,
  },
  categoryTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  categoryTabText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    textAlign: 'center',
  },
  categorySubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    marginBottom: 8,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FB8500',
    borderWidth: 2,
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  planBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#FB8500',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  popularBadge: {
    backgroundColor: '#D90429',
    shadowColor: '#D90429',
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 0.3,
  },
  planDuration: {
    fontSize: 12.5,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  planPrice: {
    color: '#FB8500',
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    marginTop: 3,
  },
  planPerMonth: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  planNoteBadge: {
    backgroundColor: 'rgba(251, 133, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 133, 0, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 4,
  },
  planNoteText: {
    color: '#FB8500',
    fontSize: 7.5,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  perksList: {
    gap: 8,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 133, 0, 0.15)',
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  perkIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  perkDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },
  subscribeBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 24,
    shadowColor: '#FB8500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  subscribeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  termsText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footnoteDisclaimer: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10.5,
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
    fontStyle: 'italic',
  },
});
