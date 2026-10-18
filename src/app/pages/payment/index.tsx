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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
// Constants
// ─────────────────────────────────────────────────────────────────
type Step = 'plan' | 'method' | 'instructions' | 'pending';

const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string; color: string; flag: string }
> = {
  d17: {
    label: 'D17 (La Poste)',
    icon: 'landmark',
    color: '#f59e0b',
    flag: '🇹🇳',
  },
  ooredoo: {
    label: 'Ooredoo',
    icon: 'phone',
    color: '#ef4444',
    flag: '🇹🇳',
  },
  payeer: {
    label: 'Payeer (USD)',
    icon: 'globe',
    color: '#6366f1',
    flag: '🌐',
  },
};

// ─────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────
export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    refresh,
    isSubscribed,
    subscriptionExpiresAt,
    daysRemaining,
    hasPendingPayment,
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
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        next();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
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
            'Not logged in',
            'Please log in to your account first.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        const data = await fetchPlansAndMethods();
        setPlans(data.plans || []);
        setMethods(data.methods || {});
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load payment info.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

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
    animateStep(() => {
      setSelectedPlan(plan);
      setStep('method');
    });
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    animateStep(() => {
      setSelectedMethod(method);
      setStep('instructions');
    });
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      Alert.alert('Missing Reference', 'Please enter your sender reference / transaction ID.');
      return;
    }
    if (!selectedPlan || !selectedMethod) return;

    setSubmitting(true);
    try {
      await submitPayment({
        method: selectedMethod,
        durationMonths: selectedPlan.durationMonths,
        senderReference: reference.trim(),
        notes: notes.trim(),
      });
      await refresh(); // update subscription context
      animateStep(() => setStep('pending'));
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'method') animateStep(() => setStep('plan'));
    else if (step === 'instructions') animateStep(() => setStep('method'));
    else router.back();
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loadingData) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading plans…</Text>
      </View>
    );
  }

  // ── Active Pro Subscription Screen ────────────────────────────
  if (isSubscribed) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0f0a1e',
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: Math.max(insets.bottom, 14),
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Lucide name="arrow-left" size={20} color="#a78bfa" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Subscription</Text>
            <Text style={styles.headerSub}>HanGo Pro Member</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.activeCard}>
            <View style={styles.activeIconOuter}>
              <Lucide name="badge-check" size={56} color="#10b981" />
            </View>
            <Text style={styles.activeTitle}>HanGo Pro is Active!</Text>
            <Text style={styles.activeSubtitle}>
              You have full unlimited access to all premium features.
            </Text>

            <View style={styles.activeDetailsBox}>
              <View style={styles.activeDetailRow}>
                <Text style={styles.activeDetailLabel}>Status</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
              {subscriptionExpiresAt && (
                <View style={styles.activeDetailRow}>
                  <Text style={styles.activeDetailLabel}>Expires On</Text>
                  <Text style={styles.activeDetailValue}>
                    {new Date(subscriptionExpiresAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              <View style={styles.activeDetailRow}>
                <Text style={styles.activeDetailLabel}>Days Remaining</Text>
                <Text style={styles.activeDetailValue}>{daysRemaining} days</Text>
              </View>
            </View>

            <View style={styles.unlockedFeaturesBox}>
              <Text style={styles.unlockedTitle}>Unlocked Features</Text>
              <View style={styles.unlockedRow}>
                <Lucide name="check" size={16} color="#10b981" />
                <Text style={styles.unlockedText}>Listening Loop (Shadowing & Repeat)</Text>
              </View>
              <View style={styles.unlockedRow}>
                <Lucide name="check" size={16} color="#10b981" />
                <Text style={styles.unlockedText}>Writing Studio & Chinese Keyboard</Text>
              </View>
              <View style={styles.unlockedRow}>
                <Lucide name="check" size={16} color="#10b981" />
                <Text style={styles.unlockedText}>Write Characters (Stroke Order Canvas)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Back to Learning</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Price label helper ───────────────────────────────────────
  const priceLabel = (plan: Plan, method: PaymentMethod | null) => {
    if (!method) return '';
    const p = plan.prices[method];
    return method === 'payeer' ? `$${p}` : `${p} DT`;
  };

  // ── Render steps ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0a1e' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 14) },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Lucide name="arrow-left" size={20} color="#a78bfa" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <Text style={styles.headerSub}>
            {step === 'plan' && 'Choose your plan'}
            {step === 'method' && 'Choose payment method'}
            {step === 'instructions' && 'Send payment'}
            {step === 'pending' && 'Payment submitted'}
          </Text>
        </View>

        {/* Step dots */}
        <View style={styles.stepDots}>
          {(['plan', 'method', 'instructions'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.dot,
                step === s || (step === 'pending' && i < 3)
                  ? styles.dotActive
                  : null,
              ]}
            />
          ))}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 36) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP: plan ───────────────────────────────── */}
          {step === 'plan' && (
            <>
              <Text style={styles.sectionTitle}>Select a Plan</Text>
              <Text style={styles.sectionSub}>
                Longer plans save you more 💰
              </Text>

              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.card,
                    plan.durationMonths === 3 && styles.cardHighlight,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.8}
                >
                  {plan.tag && (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{plan.tag}</Text>
                    </View>
                  )}
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconBox}>
                      <Lucide name="calendar" size={20} color="#a78bfa" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{plan.title}</Text>
                      <Text style={styles.cardSubtext}>
                        D17 / Ooredoo: {plan.prices.d17} DT &nbsp;•&nbsp; Payeer: ${plan.prices.payeer}
                      </Text>
                    </View>
                    <Lucide name="chevron-right" size={18} color="#6d28d9" />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Features list */}
              <View style={styles.featuresBox}>
                <Text style={styles.featuresTitle}>What you unlock:</Text>
                {[
                  { icon: 'headphones', label: 'Listening Loop – audio practice' },
                  { icon: 'keyboard', label: 'Writing Studio – compose in Chinese' },
                  { icon: 'pencil-line', label: 'Write Characters – stroke canvas' },
                  { icon: 'cloud', label: 'Cloud Sync – backup your data' },
                ].map((f) => (
                  <View key={f.icon} style={styles.featureRow}>
                    <View style={styles.featureIconBox}>
                      <Lucide name={f.icon as any} size={14} color="#7c3aed" />
                    </View>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── STEP: method ─────────────────────────────── */}
          {step === 'method' && selectedPlan && (
            <>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <Text style={styles.sectionSub}>
                Plan: <Text style={{ color: '#a78bfa' }}>{selectedPlan.title}</Text>
              </Text>

              {(Object.keys(METHOD_META) as PaymentMethod[]).map((m) => {
                const info = methods[m];
                if (!info || !info.isEnabled) return null;
                const meta = METHOD_META[m];
                const price = priceLabel(selectedPlan, m);

                return (
                  <TouchableOpacity
                    key={m}
                    style={styles.card}
                    onPress={() => handleSelectMethod(m)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.cardIconBox,
                          { backgroundColor: meta.color + '20' },
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{meta.flag}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{meta.label}</Text>
                        <Text style={[styles.cardSubtext, { color: meta.color }]}>
                          {price}
                        </Text>
                        <Text style={styles.cardHint}>
                          Send to: {info.accountNumber}
                        </Text>
                      </View>
                      <Lucide name="chevron-right" size={18} color="#6d28d9" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── STEP: instructions ───────────────────────── */}
          {step === 'instructions' &&
            selectedPlan &&
            selectedMethod && (() => {
              const info = methods[selectedMethod];
              const meta = METHOD_META[selectedMethod];
              const price = priceLabel(selectedPlan, selectedMethod);
              const rawInstructions = info?.instructions || '';
              const instructions = buildInstructions(rawInstructions);

              return (
                <>
                  <View style={styles.methodHeader}>
                    <Text style={{ fontSize: 32 }}>{meta.flag}</Text>
                    <View>
                      <Text style={styles.methodHeaderTitle}>{meta.label}</Text>
                      <Text style={[styles.methodHeaderPrice, { color: meta.color }]}>
                        {price} for {selectedPlan.title}
                      </Text>
                    </View>
                  </View>

                  {/* Recipient number highlight */}
                  <View style={styles.recipientBox}>
                    <Text style={styles.recipientLabel}>Send to this account:</Text>
                    <Text style={styles.recipientNumber}>
                      {info?.accountNumber}
                    </Text>
                  </View>

                  {/* Step-by-step instructions */}
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>Instructions</Text>
                    {instructions.split('\n').map((line, i) => (
                      <Text key={i} style={styles.instructionLine}>
                        {line}
                      </Text>
                    ))}
                  </View>

                  {/* Reference input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>
                      Your sender reference / transaction ID *
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={reference}
                      onChangeText={setReference}
                      placeholder={
                        selectedMethod === 'payeer'
                          ? 'e.g. Batch ID 12345678'
                          : 'e.g. your phone number'
                      }
                      placeholderTextColor="#4c1d95"
                      autoCapitalize="none"
                    />

                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                      Additional notes (optional)
                    </Text>
                    <TextInput
                      style={[styles.input, { height: 72 }]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Any extra info for the admin"
                      placeholderTextColor="#4c1d95"
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Lucide name="send" size={17} color="#fff" />
                        <Text style={styles.submitBtnText}>
                          I've Sent the Money – Continue
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              );
            })()}

          {/* ── STEP: pending ────────────────────────────── */}
          {step === 'pending' && (
            <View style={styles.pendingContainer}>
              <View style={styles.pendingIconOuter}>
                <View style={styles.pendingIconInner}>
                  <Lucide name="clock" size={44} color="#a78bfa" />
                </View>
              </View>
              <Text style={styles.pendingTitle}>Payment Under Review</Text>
              <Text style={styles.pendingBody}>
                Your payment has been submitted and is awaiting admin
                approval. Once approved, your subscription will activate
                automatically.
              </Text>
              <Text style={styles.pendingNote}>
                This usually takes a few hours. You can check your status
                in the Account → Subscription section.
              </Text>

              <TouchableOpacity
                style={styles.checkStatusBtnPending}
                onPress={async () => {
                  setCheckingStatus(true);
                  try {
                    await refresh();
                  } finally {
                    setCheckingStatus(false);
                  }
                }}
                disabled={checkingStatus}
                activeOpacity={0.85}
              >
                {checkingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Lucide name="refresh-cw" size={16} color="#fff" />
                    <Text style={styles.checkStatusBtnPendingText}>Check Approval Status</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0f0a1e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0f0a1e',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1040',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e1040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ede9fe',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
    marginTop: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2e1065',
  },
  dotActive: {
    backgroundColor: '#7c3aed',
    width: 18,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ede9fe',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '500',
    marginBottom: 6,
  },

  // Cards
  card: {
    backgroundColor: '#160d30',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1065',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHighlight: {
    borderColor: '#7c3aed',
    backgroundColor: '#1a0f3a',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2e1065',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ede9fe',
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 12.5,
    color: '#7c3aed',
    fontWeight: '500',
  },
  cardHint: {
    fontSize: 11,
    color: '#4c1d95',
    marginTop: 2,
  },

  // Features box
  featuresBox: {
    backgroundColor: '#160d30',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1065',
    gap: 10,
    marginTop: 4,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#2e1065',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 13,
    color: '#c4b5fd',
    fontWeight: '500',
    flex: 1,
  },

  // Method header
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#160d30',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e1065',
  },
  methodHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ede9fe',
  },
  methodHeaderPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  // Recipient
  recipientBox: {
    backgroundColor: '#1a0f3a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    alignItems: 'center',
    gap: 6,
  },
  recipientLabel: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recipientNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ede9fe',
    letterSpacing: 2,
  },

  // Instructions
  instructionsBox: {
    backgroundColor: '#160d30',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1065',
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  instructionLine: {
    fontSize: 13.5,
    color: '#c4b5fd',
    lineHeight: 20,
    fontWeight: '400',
  },

  // Input
  inputSection: { gap: 6 },
  inputLabel: {
    fontSize: 12.5,
    color: '#a78bfa',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#160d30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2e1065',
    color: '#ede9fe',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Pending
  pendingContainer: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 18,
  },
  pendingIconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#2e1065',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4c1d95',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ede9fe',
    textAlign: 'center',
  },
  pendingBody: {
    fontSize: 14,
    color: '#c4b5fd',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  pendingNote: {
    fontSize: 12.5,
    color: '#7c3aed',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  doneBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 10,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  checkStatusBtnPending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b2575',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: '#7c3aed',
    width: '100%',
    maxWidth: 280,
  },
  checkStatusBtnPendingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Active Pro Subscription Card Styles
  activeCard: {
    backgroundColor: '#160e2e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2e1065',
    padding: 24,
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  activeIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 4,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ede9fe',
    textAlign: 'center',
  },
  activeSubtitle: {
    fontSize: 14,
    color: '#a78bfa',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  activeDetailsBox: {
    width: '100%',
    backgroundColor: '#1f1442',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#3b2575',
  },
  activeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeDetailLabel: {
    fontSize: 14,
    color: '#c4b5fd',
    fontWeight: '500',
  },
  activeDetailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  activeBadgeText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unlockedFeaturesBox: {
    width: '100%',
    backgroundColor: '#1a1038',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2e1065',
  },
  unlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ede9fe',
    marginBottom: 4,
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unlockedText: {
    fontSize: 13.5,
    color: '#e2e8f0',
    fontWeight: '500',
  },
});
