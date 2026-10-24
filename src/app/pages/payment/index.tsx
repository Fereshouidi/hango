// ─────────────────────────────────────────────────────────────────
// Payment Step 1 – Plan Selection
// ─────────────────────────────────────────────────────────────────
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import Lucide from '@react-native-vector-icons/lucide';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/context/subscription-context';
import { getStoredToken } from '@/services/authSyncService';
import { fetchPlansAndMethods, type Plan } from '@/services/paymentService';
import { S } from './_styles';
import { formatPlanTitle, getPlanUsdPrice, PRO_BENEFITS, WHATSAPP_PHONE } from './_utils';

export default function PlanSelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ renew?: string }>();
  const {
    refresh,
    isSubscribed,
    subscriptionPlan,
    subscriptionExpiresAt,
    daysRemaining,
    hasPendingPayment,
  } = useSubscription();

  const [isRenewing, setIsRenewing] = useState(params.renew === 'true');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (params.renew === 'true') {
      setIsRenewing(true);
    }
  }, [params.renew]);

  const plansCarouselRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const CARD_WIDTH = Math.min(Math.round(windowWidth * 0.82), 335);
  const CARD_GAP = 14;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
  // Side inset so the first (and last) card sits centred in the full-width scroll view
  const SIDE_INSET = (windowWidth - CARD_WIDTH) / 2;

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (hasPendingPayment) {
      router.replace('/pages/payment/pending');
    }
  }, [hasPendingPayment]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          Alert.alert(
            'Account Required',
            'Please log in to your account first so your subscription links directly to you.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        const data = await fetchPlansAndMethods();
        setPlans(data.plans || []);
        if (data.plans?.length) {
          const bestIndex = data.plans.findIndex((p) => p.durationMonths === 3);
          const best = bestIndex >= 0 ? data.plans[bestIndex] : data.plans[0];
          setSelectedPlan(best);
          if (bestIndex > 0) {
            setTimeout(() => {
              plansCarouselRef.current?.scrollTo({ x: bestIndex * SNAP_INTERVAL, animated: false });
            }, 300);
          }
        }
      } catch (e: any) {
        Alert.alert('Connection Issue', e.message || 'Could not load payment options.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const handleSwitchPlan = useCallback((plan: Plan, index: number) => {
    setSelectedPlan(plan);
    plansCarouselRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
  }, [SNAP_INTERVAL]);

  const handleSelectPlan = (plan: Plan) => {
    router.push({
      pathname: '/pages/payment/method',
      params: { planJson: JSON.stringify(plan) },
    });
  };

  const handleOpenWhatsApp = () => {
    const { Linking } = require('react-native');
    const text = encodeURIComponent('Hello HanGo Support! I need help with my subscription.');
    Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`).catch(() =>
      Alert.alert('Contact Support', 'WhatsApp: +216 29 845 347')
    );
  };

  if (loadingData) {
    return (
      <ThemedView style={S.loadingContainer}>
        <Bg1 />
        <View style={S.loadingCard}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={S.loadingTitle}>Setting up your checkout...</Text>
          <Text style={S.loadingSub}>Loading verified payment options</Text>
        </View>
      </ThemedView>
    );
  }

  // ── Already subscribed ─────────────────────────────────────────
  if (isSubscribed && !isRenewing) {
    return (
      <ThemedView style={S.container}>
        <Bg1 />
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Lucide name="arrow-left" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={S.headerCenter}>
            <Text style={S.headerTitle}>Subscription Status</Text>
            <Text style={S.headerSub}>HanGo Pro Member</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/pages/payment/history')} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Lucide name="receipt" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={[S.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]} showsVerticalScrollIndicator={false}>
          <View style={S.activeCard}>
            <View style={S.activeIconOuter}>
              <Lucide name="badge-check" size={54} color="#10b981" />
            </View>
            <Text style={S.activeTitle}>HanGo Pro is Active!</Text>
            <Text style={S.activeSubtitle}>You have full unlimited access to all features.</Text>
            <View style={S.activeDetailsBox}>
              <View style={S.activeDetailRow}>
                <Text style={S.activeDetailLabel}>Current Plan</Text>
                <Text style={S.activeDetailValue}>{formatPlanTitle(subscriptionPlan)}</Text>
              </View>
              <View style={S.activeDetailRow}>
                <Text style={S.activeDetailLabel}>Status</Text>
                <View style={S.activeBadge}><Text style={S.activeBadgeText}>ACTIVE</Text></View>
              </View>
              {subscriptionExpiresAt && (
                <View style={S.activeDetailRow}>
                  <Text style={S.activeDetailLabel}>Expires On</Text>
                  <Text style={S.activeDetailValue}>
                    {new Date(subscriptionExpiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </View>
              )}
              <View style={S.activeDetailRow}>
                <Text style={S.activeDetailLabel}>Days Left</Text>
                <Text style={[S.activeDetailValue, { color: '#059669' }]}>{daysRemaining} days remaining</Text>
              </View>
            </View>
            <View style={S.unlockedFeaturesBox}>
              <Text style={S.unlockedTitle}>All Pro Features Unlocked</Text>
              {PRO_BENEFITS.map((f) => (
                <View key={f.title} style={S.unlockedRow}>
                  <View style={S.benefitIconCircle}>
                    <Lucide name={f.icon as any} size={14} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.unlockedFeatureName}>{f.title}</Text>
                    <Text style={S.unlockedFeatureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={S.renewNoteBox}>
              <Lucide name="sparkles" size={16} color="#2563eb" />
              <Text style={S.renewNoteText}>Want to add more time? Renewing now adds days right on top of your existing period!</Text>
            </View>
            <TouchableOpacity style={S.primaryActionBtn} onPress={() => setIsRenewing(true)} activeOpacity={0.85}>
              <Lucide name="refresh-cw" size={17} color="#ffffff" />
              <Text style={S.primaryActionBtnText}>Renew or Extend Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.ghostBtn} onPress={() => router.push('/pages/payment/history')} activeOpacity={0.8}>
              <Lucide name="receipt" size={15} color="#64748b" />
              <Text style={S.ghostBtnText}>View Payment History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={S.ghostBtnText}>Return to Learning</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // ── Plan selection ─────────────────────────────────────────────
  return (
    <ThemedView style={S.container}>
      <Bg1 />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => {
            if (isSubscribed && isRenewing) {
              setIsRenewing(false);
            } else {
              router.back();
            }
          }}
          style={S.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Lucide name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{isRenewing ? 'Extend / Renew Pro' : 'Upgrade to Pro'}</Text>
          <Text style={S.headerSub}>
            {isRenewing ? 'Add more days to your active membership' : 'Pick your duration to unlock everything'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleOpenWhatsApp} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Lucide name="help-circle" size={19} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Steps Switcher */}
      <View style={S.stepsSwitcherWrapper}>
        <View style={S.stepsSwitcherContainer}>
          <View style={[S.stepsSwitcherTab, S.stepsSwitcherTabActive]}>
            <View style={[S.stepNumBadge, S.stepNumBadgeActive]}>
              <Text style={[S.stepNumBadgeText, S.stepNumBadgeTextActive]}>1</Text>
            </View>
            <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextActive]}>Plan</Text>
          </View>
          <View style={[S.stepsSwitcherTab, S.stepsSwitcherTabDisabled]}>
            <View style={S.stepNumBadge}><Text style={S.stepNumBadgeText}>2</Text></View>
            <Text style={S.stepsSwitcherTabText}>Method</Text>
          </View>
          <View style={[S.stepsSwitcherTab, S.stepsSwitcherTabDisabled]}>
            <View style={S.stepNumBadge}><Text style={S.stepNumBadgeText}>3</Text></View>
            <Text style={S.stepsSwitcherTabText}>Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[S.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Member Extension Note */}
        {isRenewing && (
          <View style={[S.renewNoteBox, { marginBottom: 12 }]}>
            <Lucide name="sparkles" size={17} color="#2563eb" />
            <Text style={S.renewNoteText}>
              Active Member: Your {daysRemaining} days remaining will not be lost. Your new plan will be added directly on top!
            </Text>
          </View>
        )}

        {/* Hero Banner */}
        <View style={ls.heroBanner}>
          <View style={ls.heroBadge}>
            <Lucide name="sparkles" size={13} color="#2563eb" />
            <Text style={ls.heroBadgeText}>HANGO PRO PASS</Text>
          </View>
          <Text style={ls.heroTitle}>Master Chinese 3x Faster</Text>
          <Text style={ls.heroSub}>
            Full access to all audio loops, writing studios, and HSK lessons with simple local payment.
          </Text>
        </View>

        <View style={{...ls.plansContainer}}>
          {/* Section Header */}
          <Text style={[S.sectionHeaderTitle, { marginTop: 4 }]}>Choose Your Access Duration</Text>
          <Text style={S.sectionHeaderSubtitle}>Swipe to explore each plan — all features included</Text>

          {/* Carousel */}
          <ScrollView
            ref={plansCarouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: SIDE_INSET,
              gap: CARD_GAP,
              paddingVertical: 8,
            }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
              const clamped = Math.max(0, Math.min(plans.length - 1, index));
              if (plans[clamped] && plans[clamped].id !== selectedPlan?.id) {
                setSelectedPlan(plans[clamped]);
              }
            }}
          >
            {plans.map((plan, idx) => {
              const isSelected = selectedPlan?.id === plan.id;
              const isBestValue = plan.durationMonths === 3;
              const { total: usdPrice, perMo: perMoUsd } = getPlanUsdPrice(plan);

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[ls.swipePlanCard, { width: CARD_WIDTH }, isSelected && ls.swipePlanCardSelected, isBestValue && ls.swipePlanCardBest]}
                  onPress={() => handleSwitchPlan(plan, idx)}
                  activeOpacity={0.92}
                >
                  {/* Ribbon */}
                  {plan.tag && (
                    <View style={[ls.planRibbon, isBestValue ? ls.planRibbonBest : ls.planRibbonStandard]}>
                      <Lucide name={isBestValue ? 'sparkles' : 'award'} size={12} color="#ffffff" />
                      <Text style={ls.planRibbonText}>{plan.tag}</Text>
                    </View>
                  )}

                  {/* Plan Title Row */}
                  <View style={ls.planTitleRow}>
                    <View style={[ls.radioCircle, isSelected && ls.radioCircleSelected]}>
                      {isSelected && <View style={ls.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ls.planTitle}>{plan.title}</Text>
                      <Text style={ls.planDuration}>
                        {plan.durationMonths === 1 ? '30 Days Full Access'
                          : plan.durationMonths === 3 ? '90 Days Full Access'
                          : '365 Days Full Access'}
                      </Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={ls.priceCard}>
                    <View style={ls.priceRow}>
                      <Text style={ls.priceMain}>{usdPrice}</Text>
                      <View style={ls.perMoPill}>
                        <Text style={ls.perMoText}>{perMoUsd} / month</Text>
                      </View>
                    </View>
                    <Text style={ls.savingsNote}>
                      {plan.durationMonths === 1 ? 'No recurring charges · Pay once'
                        : plan.durationMonths === 3 ? '🔥 Save 19% vs monthly plan'
                        : '🌟 Save 28% vs monthly plan'}
                    </Text>
                  </View>

                  <View style={ls.cardDivider} />

                  {/* Features */}
                  <Text style={ls.includedHeading}>All Pro Features Included:</Text>
                  <View style={{ gap: 8 }}>
                    {[
                      { icon: 'headphones', title: 'Listening Loop', sub: 'Infinite native audio loops & speed controls' },
                      { icon: 'pencil-line', title: 'Character Canvas', sub: 'Real-time stroke order & handwriting engine' },
                      { icon: 'keyboard', title: 'Writing Studio', sub: 'Sentence composition & dictation mastery' },
                      { icon: 'cloud', title: 'Cloud Sync & Backups', sub: 'Keep vocabulary & review stats safely synced' },
                      { icon: 'book-open', title: 'Complete HSK 1–6', sub: 'All grammar rules, words, and passages' },
                    ].map((f) => (
                      <View key={f.title} style={ls.perkRow}>
                        <View style={ls.perkIconBox}>
                          <Lucide name={f.icon as any} size={14} color="#2563eb" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={ls.perkTitle}>{f.title}</Text>
                          <Text style={ls.perkSub}>{f.sub}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Confirm Button */}
                  <TouchableOpacity
                    style={[ls.cardConfirmBtn, isSelected && ls.cardConfirmBtnSelected]}
                    onPress={(e) => {
                      (e as any).stopPropagation?.();
                      handleSelectPlan(plan);
                    }}
                    activeOpacity={0.85}
                  >
                    <Lucide
                      name={isSelected ? 'arrow-right-circle' : 'circle'}
                      size={17}
                      color={isSelected ? '#ffffff' : '#2563eb'}
                    />
                    <Text style={[ls.cardConfirmBtnText, isSelected && ls.cardConfirmBtnTextSelected]} numberOfLines={1}>
                      {isSelected
                        ? (isRenewing ? `Renew with ${plan.title} · ${usdPrice}` : `Continue with ${plan.title} · ${usdPrice}`)
                        : `Select ${plan.title}`}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View style={{ alignItems: 'center', gap: 5, marginVertical: 4 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {plans.map((p, idx) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleSwitchPlan(p, idx)}
                style={[ls.dot, selectedPlan?.id === p.id && ls.dotActive]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              />
            ))}
          </View>
        </View>

        {/* Trust Box */}
        <View style={S.trustBox}>
          <Lucide name="shield-check" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={S.trustTitle}>Safe & Transparent</Text>
            <Text style={S.trustDesc}>Manual verification · Zero hidden fees · Pay only for what you choose</Text>
          </View>
        </View>

        {/* History link */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 }}
          onPress={() => router.push('/pages/payment/history')}
          activeOpacity={0.7}
        >
          <Lucide name="receipt" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: '600' }}>View Payment History</Text>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

// ── Local styles (plan-specific) ──────────────────────────────────
const ls = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#ffffffe1',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eff6ff',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  heroBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#2563eb', letterSpacing: 0.6 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: '#64748b', lineHeight: 19, fontWeight: '500' },

  swipePlanCard: {
    backgroundColor: '#ffffffe6',
    overflow: "hidden",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    gap: 12,
  },
  swipePlanCardSelected: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    overflow: "hidden",
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  swipePlanCardBest: { borderColor: '#3b82f6', overflow: "hidden" },

  planRibbon: {
    position: 'absolute', top: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12,
  },
  planRibbonBest: { backgroundColor: '#2563eb' },
  planRibbonStandard: { backgroundColor: '#059669' },
  planRibbonText: { fontSize: 10, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 },

  plansContainer: {backgroundColor: "#ffffffe6", padding: 10, borderRadius: 20},
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#2563eb', backgroundColor: '#ffffff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb' },
  planTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  planDuration: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },

  priceCard: {
    backgroundColor: '#f8faff', borderRadius: 14, padding: 12, gap: 6,
    borderWidth: 1, borderColor: '#dbeafe',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceMain: { fontSize: 30, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  perMoPill: { backgroundColor: '#eff6ff', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  perMoText: { fontSize: 11.5, fontWeight: '700', color: '#2563eb' },
  savingsNote: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  includedHeading: { fontSize: 11.5, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.6 },

  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  perkSub: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  cardConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#2563eb', marginTop: 4,
  },
  cardConfirmBtnSelected: {
    backgroundColor: '#2563eb', borderColor: '#1d4ed8',
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  cardConfirmBtnText: { fontSize: 13.5, fontWeight: '700', color: '#2563eb', flexShrink: 1 },
  cardConfirmBtnTextSelected: { color: '#ffffff' },

  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  dotActive: { width: 22, height: 8, borderRadius: 4, backgroundColor: '#2563eb' },
  swipeHint: { fontSize: 11.5, fontWeight: '600', color: '#94a3b8' },
});
