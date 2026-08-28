import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '../contexts/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLANS = [
  {
    id: '1_month',
    duration: '1 Month',
    price: '₹499',
    perMonth: '₹499 / mo',
    badge: null,
  },
  {
    id: '6_months',
    duration: '6 Months',
    price: '₹1,799',
    perMonth: '₹299 / mo',
    badge: 'SAVE 40%',
    isPopular: true,
  },
  {
    id: '12_months',
    duration: '12 Months',
    price: '₹2,399',
    perMonth: '₹199 / mo',
    badge: 'BEST VALUE',
  },
];

const VIP_PERKS = [
  { icon: 'crown', title: 'Gold VIP Badge & Border', desc: 'Exclusive gold border and crown icon on your card.' },
  { icon: 'infinite', title: 'Unlimited Super Likes & Rewinds', desc: 'Never run out of swipes and rewind missed matches.' },
  { icon: 'eye', title: 'See Who Liked You', desc: 'Instant access to everyone who already swiped right on you.' },
  { icon: 'cafe', title: 'Complimentary Cafe Perks', desc: 'Free welcome drinks & reserved tables at curated cafes.' },
  { icon: 'shield-checkmark', title: 'Incognito Ghost Mode', desc: 'Only people you like will be able to see your profile.' },
  { icon: 'rocket', title: '5x Profile Discovery Boost', desc: 'Be the top profile in your city for 1 hour every week.' },
];

export default function VipMembershipScreen() {
  const router = useRouter();
  const { currentUser, updateCurrentUser, isDarkMode } = useApp();
  const [selectedPlan, setSelectedPlan] = useState('6_months');

  const handleActivateVip = () => {
    updateCurrentUser({ isVip: true });
    Alert.alert(
      '👑 SYNKING Black VIP Active!',
      'Congratulations! You now have unlimited Super Likes, See Who Liked You, and VIP Gold Badge.',
      [{ text: 'Enjoy VIP ✨', onPress: () => router.back() }]
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

        {/* Pricing Tiers Carousel */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Choose Your Plan</Text>
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: cardBg, borderColor: isSelected ? '#FB8500' : 'rgba(255,255,255,0.08)' },
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.85}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planDuration, { color: textColor }]}>{plan.duration}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* VIP Perks Checklist */}
        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>What's Included</Text>
        <View style={styles.perksList}>
          {VIP_PERKS.map((perk, idx) => (
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
              {currentUser?.isVip ? 'Renew VIP Membership 👑' : 'Unlock SYNKING Black VIP ✨'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Recurring billing. Cancel anytime in profile settings.
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
    fontWeight: '800',
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  crownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
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
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FB8500',
    borderWidth: 2,
  },
  planBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#FB8500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  planDuration: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  planPrice: {
    color: '#FB8500',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  planPerMonth: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
});
