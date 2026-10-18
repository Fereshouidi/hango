import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import Header from '@/components/main/header';

import {
  fetchPlansAndMethods,
  submitPayment,
  type MethodInfo,
  type PaymentMethod,
  type Plan,
} from '@/services/paymentService';
import { useSubscription } from '@/context/subscription-context';
import { getStoredToken } from '@/services/authSyncService';

// ─────────────────────────────────────────────────────────────────
// Constants & Metadata
// ─────────────────────────────────────────────────────────────────
type Step = 'plan' | 'method' | 'instructions' | 'pending';

interface MethodMeta {
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bgColor: string;
  badge: string;
  flag: string;
}

const METHOD_META: Record<PaymentMethod, MethodMeta> = {
  d17: {
    label: 'D17 (La Poste)',
    sublabel: 'Poste Tunisienne Money Transfer',
    icon: 'landmark',
    color: '#d97706',
    bgColor: '#fef3c7',
    badge: 'D17',
    flag: '🇹🇳',
  },
  ooredoo: {
    label: 'Ooredoo Transfer',
    sublabel: 'Mobile balance transfer (*120*)',
    icon: 'smartphone',
    color: '#dc2626',
    bgColor: '#fee2e2',
    badge: 'Ooredoo',
    flag: '🇹🇳',
  },
  payeer: {
    label: 'Payeer (USD)',
    sublabel: 'Instant international wallet transfer',
    icon: 'wallet',
    color: '#2563eb',
    bgColor: '#dbeafe',
    badge: 'Payeer',
    flag: '🌐',
  },
};

export default function PaymentScreen() {
  const router = useRouter();
  const {
    refresh,
    isSubscribed,
    subscriptionPlan,
    subscriptionExpiresAt,
    daysRemaining,
    hasPendingPayment,
    loading: subscriptionLoading,
  } = useSubscription();

  // Remote data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<
    Partial<Record<PaymentMethod, MethodInfo>>
  >({});
  const [loadingData, setLoadingData] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Flow state
  const [step, setStep] = useState<Step>('plan');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-refresh subscription on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // If user has pending payment, start on pending screen
  useEffect(() => {
    if (hasPendingPayment && step === 'plan') {
      setStep('pending');
    }
  }, [hasPendingPayment, step]);

  // Step fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateStep = useCallback(
    (next: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        next();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  // Load plans & methods on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          Alert.alert(
            'Account Required',
            'Please sign in or create an account before choosing a subscription.',
            [
              {
                text: 'Go to Account',
                onPress: () => router.push('/pages/sync' as any),
              },
            ]
          );
          return;
        }
        const data = await fetchPlansAndMethods();
        setPlans(data.plans || []);
        setMethods(data.methods || {});
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load subscription plans.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Format plan title helper
  function formatPlanTitle(planKey?: string) {
    if (!planKey) return 'HanGo Pro';
    if (planKey === '1_month') return '1 Month Access';
    if (planKey === '2_months') return '2 Months Access';
    if (planKey === '3_months') return '3 Months Access';
    return planKey.replace('_', ' ').toUpperCase();
  }

  // ── Helpers ──────────────────────────────────────────────────
  function buildInstructions(raw: string): string {
    if (!selectedPlan || !selectedMethod) return raw;
    const info = methods[selectedMethod];
    if (!info) return raw;
    const price =
      selectedMethod === 'payeer'
        ? `$${selectedPlan.prices.payeer}`
        : `${selectedPlan.prices[selectedMethod]} DT`;

    return raw
      .replace(/{accountNumber}/g, info.accountNumber)
      .replace(/{amount}/g, price)
      .replace(/\${amount}/g, `$${selectedPlan.prices.payeer}`);
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    animateStep(() => setStep('method'));
  };

  const handleSelectMethod = (m: PaymentMethod) => {
    setSelectedMethod(m);
    animateStep(() => setStep('instructions'));
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedMethod) return;

    if (!reference.trim()) {
      Alert.alert(
        'Reference Required',
        selectedMethod === 'payeer'
          ? 'Please enter your Payeer account or batch transaction ID.'
          : 'Please enter your phone number or transfer reference so we can verify the payment.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitPayment({
        method: selectedMethod,
        durationMonths: selectedPlan.durationMonths,
        senderReference: reference.trim(),
        notes: notes.trim(),
      });

      // Refresh subscription context to capture pending payment
      await refresh();

      animateStep(() => setStep('pending'));
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Could not submit payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'method') animateStep(() => setStep('plan'));
    else if (step === 'instructions') animateStep(() => setStep('method'));
    else router.back();
  };

  const handleManualCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      await refresh();
      if (isSubscribed) {
        Alert.alert(
          'Subscription Active!',
          'Your payment has been approved and your subscription is active. Enjoy learning!',
          [{ text: 'Start Learning', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Still Under Review',
          'Your payment is still being verified by the admin. Please check back shortly.'
        );
      }
    } catch (e: any) {
      Alert.alert('Status Check', e.message || 'Could not reach server.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // ── Price label helper ───────────────────────────────────────
  const priceLabel = (plan: Plan, method: PaymentMethod | null) => {
    if (!method) {
      return `${plan.prices.d17} DT / $${plan.prices.payeer}`;
    }
    const p = plan.prices[method];
    return method === 'payeer' ? `$${p}` : `${p} DT`;
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loadingData) {
    return (
      <ThemedView style={styles.container}>
        <Bg1 />
        <Header useBackArrow label="Subscription" subtitle="Loading plans..." />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading subscription options…</Text>
        </View>
      </ThemedView>
    );
  }

  // ── Render Screen ────────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      <Bg1 />

      {/* Screen Header */}
      <Header
        useBackArrow
        label={
          step === 'plan'
            ? isSubscribed
              ? 'Renew Subscription'
              : 'Choose a Plan'
            : step === 'method'
            ? 'Payment Method'
            : step === 'instructions'
            ? 'Confirm & Pay'
            : 'Payment Review'
        }
        subtitle={
          step === 'plan'
            ? isSubscribed
              ? 'Extend your HanGo Pro access'
              : 'Unlock full Chinese learning studio'
            : step === 'method'
            ? `${selectedPlan?.title || ''} • Select method`
            : step === 'instructions'
            ? 'Send money & enter reference'
            : 'Pending admin confirmation'
        }
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── STEP INDICATOR (for steps 1-3) ── */}
            {step !== 'pending' && (
              <View style={styles.stepBar}>
                <View
                  style={[
                    styles.stepBadge,
                    step === 'plan' && styles.stepBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      step === 'plan' && styles.stepBadgeTextActive,
                    ]}
                  >
                    1. Plan
                  </Text>
                </View>
                <Lucide name="chevron-right" size={14} color="#94a3b8" />
                <View
                  style={[
                    styles.stepBadge,
                    step === 'method' && styles.stepBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      step === 'method' && styles.stepBadgeTextActive,
                    ]}
                  >
                    2. Method
                  </Text>
                </View>
                <Lucide name="chevron-right" size={14} color="#94a3b8" />
                <View
                  style={[
                    styles.stepBadge,
                    step === 'instructions' && styles.stepBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      step === 'instructions' && styles.stepBadgeTextActive,
                    ]}
                  >
                    3. Pay
                  </Text>
                </View>
              </View>
            )}

            {/* ═════════════════════════════════════════════════════════════
                STEP 1: PLAN SELECTION (WITH RENEWAL / ACTIVE BANNER)
            ═════════════════════════════════════════════════════════════ */}
            {step === 'plan' && (
              <>
                {/* Active Membership Banner (if user already has active plan) */}
                {isSubscribed && (
                  <View style={styles.activeBanner}>
                    <View style={styles.activeBannerTop}>
                      <View style={styles.activeBannerIconBox}>
                        <Lucide name="crown" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.activeBadgeRow}>
                          <Text style={styles.activeBannerTitle}>
                            {formatPlanTitle(subscriptionPlan)}
                          </Text>
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        </View>
                        <Text style={styles.activeBannerSub}>
                          {daysRemaining > 0
                            ? `${daysRemaining} days remaining`
                            : 'Expires today'}{' '}
                          • Expires{' '}
                          {subscriptionExpiresAt
                            ? new Date(
                                subscriptionExpiresAt
                              ).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.activeBannerDivider} />
                    <View style={styles.activeBannerNoteRow}>
                      <Lucide name="info" size={14} color="#059669" />
                      <Text style={styles.activeBannerNoteText}>
                        Renewing or selecting a plan will add time onto your
                        existing expiration date without losing any days.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Plan Selection Header */}
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>
                    {isSubscribed ? 'Select Renewal Plan' : 'Select a Membership Plan'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    All plans include unlimited access to Listening Loop,
                    Writing Studio, and Character Stroke Canvas.
                  </Text>
                </View>

                {/* Plan Cards */}
                {plans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isBestValue =
                    plan.durationMonths === 3 ||
                    (plan.tag && plan.tag.includes('Best'));

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        isSelected && styles.planCardSelected,
                        isBestValue && styles.planCardFeatured,
                      ]}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.85}
                    >
                      {plan.tag ? (
                        <View
                          style={[
                            styles.planTag,
                            isBestValue && styles.planTagFeatured,
                          ]}
                        >
                          <Text style={styles.planTagText}>{plan.tag}</Text>
                        </View>
                      ) : null}

                      <View style={styles.planCardHeader}>
                        <View style={styles.planIconCircle}>
                          <Lucide
                            name={
                              plan.durationMonths === 1
                                ? 'calendar'
                                : plan.durationMonths === 2
                                ? 'layers'
                                : 'award'
                            }
                            size={20}
                            color="#2563eb"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planTitle}>{plan.title}</Text>
                          <Text style={styles.planDuration}>
                            {plan.durationMonths}{' '}
                            {plan.durationMonths === 1 ? 'Month' : 'Months'}{' '}
                            Full Access
                          </Text>
                        </View>
                      </View>

                      {/* Pricing block */}
                      <View style={styles.planPriceRow}>
                        <View style={styles.planPriceItem}>
                          <Text style={styles.priceAmount}>
                            {plan.prices.d17} <Text style={styles.priceUnit}>DT</Text>
                          </Text>
                          <Text style={styles.priceMethodLabel}>D17 / Ooredoo</Text>
                        </View>

                        <View style={styles.priceSeparator} />

                        <View style={styles.planPriceItem}>
                          <Text style={styles.priceAmount}>
                            ${plan.prices.payeer}{' '}
                            <Text style={styles.priceUnit}>USD</Text>
                          </Text>
                          <Text style={styles.priceMethodLabel}>Payeer</Text>
                        </View>
                      </View>

                      {/* Features preview */}
                      <View style={styles.planFeatures}>
                        <View style={styles.planFeatureRow}>
                          <Lucide name="check-circle" size={13} color="#059669" />
                          <Text style={styles.planFeatureText}>
                            Audio Shadowing & Repeat Loops
                          </Text>
                        </View>
                        <View style={styles.planFeatureRow}>
                          <Lucide name="check-circle" size={13} color="#059669" />
                          <Text style={styles.planFeatureText}>
                            Writing Studio & Chinese Keyboard
                          </Text>
                        </View>
                        <View style={styles.planFeatureRow}>
                          <Lucide name="check-circle" size={13} color="#059669" />
                          <Text style={styles.planFeatureText}>
                            Stroke-Order Tracing Canvas
                          </Text>
                        </View>
                      </View>

                      {/* Select CTA */}
                      <View style={styles.selectPlanBtn}>
                        <Text style={styles.selectPlanBtnText}>
                          Select This Plan
                        </Text>
                        <Lucide name="arrow-right" size={16} color="#2563eb" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ═════════════════════════════════════════════════════════════
                STEP 2: PAYMENT METHOD SELECTION
            ═════════════════════════════════════════════════════════════ */}
            {step === 'method' && selectedPlan && (
              <>
                <View style={styles.selectedPlanSummaryBar}>
                  <View>
                    <Text style={styles.summaryLabel}>Selected Plan</Text>
                    <Text style={styles.summaryValue}>{selectedPlan.title}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => animateStep(() => setStep('plan'))}
                    activeOpacity={0.7}
                    style={styles.changePlanBtn}
                  >
                    <Text style={styles.changePlanBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select how you would like to transfer the payment.
                  </Text>
                </View>

                {(['d17', 'ooredoo', 'payeer'] as PaymentMethod[]).map((key) => {
                  const meta = METHOD_META[key];
                  const info = methods[key];
                  const isEnabled = info ? info.isEnabled : true;
                  const price =
                    key === 'payeer'
                      ? `$${selectedPlan.prices.payeer} USD`
                      : `${selectedPlan.prices[key]} DT`;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.methodCard,
                        !isEnabled && styles.methodCardDisabled,
                      ]}
                      onPress={() => isEnabled && handleSelectMethod(key)}
                      disabled={!isEnabled}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.methodIconBox,
                          { backgroundColor: meta.bgColor },
                        ]}
                      >
                        <Lucide
                          name={meta.icon as any}
                          size={24}
                          color={meta.color}
                        />
                      </View>

                      <View style={styles.methodInfo}>
                        <View style={styles.methodTitleRow}>
                          <Text style={styles.methodTitle}>{meta.label}</Text>
                          <View style={styles.methodFlagPill}>
                            <Text style={styles.methodFlagText}>{meta.flag}</Text>
                          </View>
                        </View>
                        <Text style={styles.methodSubtitle}>{meta.sublabel}</Text>
                        <View style={styles.methodPriceRow}>
                          <Text
                            style={[
                              styles.methodPriceText,
                              { color: meta.color },
                            ]}
                          >
                            {price}
                          </Text>
                          <Text style={styles.methodForText}>
                            for {selectedPlan.durationMonths}{' '}
                            {selectedPlan.durationMonths === 1 ? 'month' : 'months'}
                          </Text>
                        </View>
                      </View>

                      <Lucide name="chevron-right" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ═════════════════════════════════════════════════════════════
                STEP 3: PAYMENT INSTRUCTIONS & SUBMISSION
            ═════════════════════════════════════════════════════════════ */}
            {step === 'instructions' &&
              selectedPlan &&
              selectedMethod &&
              (() => {
                const meta = METHOD_META[selectedMethod];
                const info = methods[selectedMethod];
                const instructions = buildInstructions(
                  info?.instructions || ''
                );
                const price =
                  selectedMethod === 'payeer'
                    ? `$${selectedPlan.prices.payeer} USD`
                    : `${selectedPlan.prices[selectedMethod]} DT`;

                return (
                  <>
                    {/* Summary Header Card */}
                    <View style={styles.instructionsHeaderCard}>
                      <View
                        style={[
                          styles.methodIconBox,
                          { backgroundColor: meta.bgColor },
                        ]}
                      >
                        <Lucide
                          name={meta.icon as any}
                          size={26}
                          color={meta.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryHeaderTitle}>
                          {meta.label}
                        </Text>
                        <Text style={styles.summaryHeaderSub}>
                          Amount: <Text style={{ fontWeight: '800', color: meta.color }}>{price}</Text> • {selectedPlan.title}
                        </Text>
                      </View>
                    </View>

                    {/* Recipient Account Highlight Box */}
                    <View style={styles.recipientCard}>
                      <Text style={styles.recipientLabel}>
                        Send exactly <Text style={{ color: meta.color, fontWeight: '800' }}>{price}</Text> to:
                      </Text>
                      <View style={styles.recipientNumberRow}>
                        <Text style={styles.recipientNumber}>
                          {info?.accountNumber || '—'}
                        </Text>
                        <View style={styles.recipientBadge}>
                          <Text style={styles.recipientBadgeText}>
                            {info?.accountName || meta.badge}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Step-by-Step Instructions */}
                    <View style={styles.instructionsBox}>
                      <View style={styles.instructionsTitleRow}>
                        <Lucide name="list-ordered" size={16} color="#2563eb" />
                        <Text style={styles.instructionsTitle}>Instructions</Text>
                      </View>
                      {instructions.split('\n').map((line, i) => (
                        <View key={i} style={styles.instructionLineRow}>
                          <Text style={styles.instructionLine}>{line}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Sender Reference Input */}
                    <View style={styles.formSection}>
                      <Text style={styles.inputTitle}>
                        Your Phone Number or Transaction ID *
                      </Text>
                      <View style={styles.inputWrapper}>
                        <Lucide
                          name={
                            selectedMethod === 'payeer'
                              ? 'receipt'
                              : 'phone-outgoing'
                          }
                          size={18}
                          color="#64748b"
                          style={{ marginRight: 8 }}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={reference}
                          onChangeText={setReference}
                          placeholder={
                            selectedMethod === 'payeer'
                              ? 'e.g. Batch Operation ID 1984251'
                              : 'e.g. your phone number (29XXXXXX)'
                          }
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="none"
                        />
                      </View>

                      <Text style={[styles.inputTitle, { marginTop: 12 }]}>
                        Notes or Remarks (Optional)
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { height: 76, alignItems: 'flex-start', paddingTop: 10 },
                        ]}
                      >
                        <TextInput
                          style={[styles.textInput, { height: '100%' }]}
                          value={notes}
                          onChangeText={setNotes}
                          placeholder="Any extra info for the admin to verify quickly"
                          placeholderTextColor="#94a3b8"
                          multiline
                        />
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        submitting && styles.submitBtnDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Lucide name="send" size={17} color="#ffffff" />
                          <Text style={styles.submitBtnText}>
                            I Have Sent The Money – Submit
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                );
              })()}

            {/* ═════════════════════════════════════════════════════════════
                STEP 4: PENDING CONFIRMATION / UNDER REVIEW
            ═════════════════════════════════════════════════════════════ */}
            {step === 'pending' && (
              <View style={styles.pendingCard}>
                <View style={styles.pendingIconCircle}>
                  <Lucide name="clock" size={42} color="#d97706" />
                </View>

                <Text style={styles.pendingTitle}>Payment Under Review</Text>
                <Text style={styles.pendingDescription}>
                  Your payment reference has been submitted. Our team will verify
                  the transfer in the database and your subscription will activate
                  or extend automatically.
                </Text>

                <View style={styles.pendingHintBox}>
                  <Lucide name="check-circle-2" size={15} color="#059669" />
                  <Text style={styles.pendingHintText}>
                    If you are renewing, your existing access continues uninterrupted.
                  </Text>
                </View>

                {/* Check status button */}
                <TouchableOpacity
                  style={styles.checkStatusBtn}
                  onPress={handleManualCheckStatus}
                  disabled={checkingStatus}
                  activeOpacity={0.85}
                >
                  {checkingStatus ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Lucide name="refresh-cw" size={16} color="#ffffff" />
                      <Text style={styles.checkStatusBtnText}>
                        Check Approval Status
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLearningBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.backToLearningBtnText}>
                    Back to Learning
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles (Matches HanGo clean app theme)
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafce7',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // ── Step bar ──
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  stepBadgeActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stepBadgeTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },

  // ── Active Membership Banner ──
  activeBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#059669',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  activeBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeBannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  activePill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  activeBannerSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
  },
  activeBannerDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  activeBannerNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  activeBannerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    lineHeight: 17,
    fontWeight: '500',
  },

  // ── Section Headings ──
  sectionHeading: {
    paddingHorizontal: 4,
    marginTop: 4,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  // ── Plan Cards ──
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8faff',
  },
  planCardFeatured: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  planTag: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planTagFeatured: {
    backgroundColor: '#059669',
  },
  planTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  planDuration: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 1,
  },

  // Price Row
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planPriceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  priceMethodLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  priceSeparator: {
    width: 1,
    height: 26,
    backgroundColor: '#cbd5e1',
  },

  // Features list
  planFeatures: {
    gap: 6,
    paddingHorizontal: 2,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },

  // Select button
  selectPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectPlanBtnText: {
    color: '#2563eb',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // ── Step 2 Method styles ──
  selectedPlanSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  changePlanBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  changePlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  methodFlagPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  methodFlagText: {
    fontSize: 12,
  },
  methodSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  methodPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  methodPriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  methodForText: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // ── Step 3 Instructions styles ──
  instructionsHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  summaryHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryHeaderSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  recipientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 6,
    alignItems: 'center',
  },
  recipientLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  recipientNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  recipientNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
  },
  recipientBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recipientBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  instructionsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  instructionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  instructionLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },

  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginTop: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ── Step 4 Pending styles ──
  pendingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 10,
  },
  pendingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 4,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  pendingDescription: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  pendingHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    width: '100%',
  },
  pendingHintText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  checkStatusBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  backToLearningBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backToLearningBtnText: {
    color: '#64748b',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
