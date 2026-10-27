// ─────────────────────────────────────────────────────────────────
// Payment Step 3 – Transfer Instructions & Confirmation
// ─────────────────────────────────────────────────────────────────
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import Lucide from '@react-native-vector-icons/lucide';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/context/subscription-context';
import { fetchPlansAndMethods, submitPayment, type MethodInfo, type PaymentMethod, type Plan } from '@/services/paymentService';
import { S } from './_styles';
import { getMonthlyPrice, getPlanUsdPrice, getPriceString, getUssdCode, METHOD_META, WHATSAPP_PHONE } from './_utils';

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh } = useSubscription();
  const params = useLocalSearchParams<{ planJson: string; method: PaymentMethod }>();

  const plan: Plan | null = params.planJson ? JSON.parse(params.planJson) : null;
  const selectedMethod: PaymentMethod | null = params.method || null;

  const [methods, setMethods] = useState<Partial<Record<PaymentMethod, MethodInfo>>>({});
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyboardSpace, setKeyboardSpace] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!plan || !selectedMethod) { router.back(); return; }
    fetchPlansAndMethods()
      .then((d) => setMethods(d.methods || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(show, (e) => setKeyboardSpace(e.endCoordinates.height));
    const h = Keyboard.addListener(hide, () => setKeyboardSpace(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  if (!plan || !selectedMethod) return null;

  const meta = METHOD_META[selectedMethod];
  const info = methods[selectedMethod];
  const accountNumber = info?.accountNumber || '29845347';
  const price = getPriceString(plan, selectedMethod);
  const isOoredoo = selectedMethod === 'ooredoo';
  const ussdCode = isOoredoo ? getUssdCode(accountNumber, plan.prices.ooredoo) : '';

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 2500);
    } catch {
      Alert.alert('Copied', text);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setReference(text.trim());
    } catch {}
  };

  const scrollToInput = useCallback((offsetY: number) => {
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: offsetY, animated: true }), 120);
  }, []);

  const handleDialUssd = () => {
    const encoded = `*120*${accountNumber}*${plan.prices.ooredoo}%23`;
    Linking.openURL(`tel:${encoded}`).catch(() => {
      copyToClipboard(ussdCode, 'ussd');
      Alert.alert('USSD Code Copied', `Dial ${ussdCode} from your phone.`);
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(`Hello HanGo Support! I need help activating my HanGo Pro subscription (${plan.title}).`);
    Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`).catch(() =>
      Alert.alert('Contact Support', 'WhatsApp: +216 29 845 347')
    );
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      Alert.alert('Reference Required', 'Please enter your phone number or transaction ID so we can match your payment.');
      return;
    }
    setSubmitting(true);
    try {
      await submitPayment({
        method: selectedMethod,
        durationMonths: plan.durationMonths,
        senderReference: reference.trim(),
        notes: notes.trim(),
      });
      await refresh();
      router.replace('/pages/payment/pending');
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { total: usdTotal } = getPlanUsdPrice(plan);

  return (
    <ThemedView style={S.container}>
      <Bg1 />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top + 40, 60) : 0}
      >
        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Lucide name="arrow-left" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={S.headerCenter}>
            <Text style={S.headerTitle}>Complete Transfer</Text>
            <Text style={S.headerSub}>Quick 2-minute transfer & confirmation</Text>
          </View>
          <TouchableOpacity onPress={handleOpenWhatsApp} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Lucide name="help-circle" size={19} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Steps Switcher */}
        <View style={S.stepsSwitcherWrapper}>
          <View style={S.stepsSwitcherContainer}>
            <TouchableOpacity
              style={[S.stepsSwitcherTab, S.stepsSwitcherTabCompleted]}
              onPress={() => router.push({ pathname: '/pages/payment' })}
              activeOpacity={0.75}
            >
              <View style={S.stepCheckBadge}><Lucide name="check" size={11} color="#ffffff" /></View>
              <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextCompleted]}>Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.stepsSwitcherTab, S.stepsSwitcherTabCompleted]}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <View style={S.stepCheckBadge}><Lucide name="check" size={11} color="#ffffff" /></View>
              <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextCompleted]}>Method</Text>
            </TouchableOpacity>
            <View style={[S.stepsSwitcherTab, S.stepsSwitcherTabActive]}>
              <View style={[S.stepNumBadge, S.stepNumBadgeActive]}><Text style={[S.stepNumBadgeText, S.stepNumBadgeTextActive]}>3</Text></View>
              <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextActive]}>Confirm</Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[S.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, keyboardSpace > 0 ? keyboardSpace + 120 : 36) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Pill */}
          <View style={S.checkoutSummaryPill}>
            <View style={S.summaryMethodIcon}>
              <Text style={{ fontSize: 20 }}>{meta.flag}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.summaryPlanTitle}>{plan.title} · {usdTotal}</Text>
              <Text style={S.summaryMethodSub}>Paying via {meta.shortName}</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} style={S.summaryChangeBtn}>
              <Text style={S.summaryChangeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Step 1: Send the money */}
          <View style={S.stepBoxCard}>
            <View style={S.stepBoxHeader}>
              <View style={S.stepBadgeNumber}><Text style={S.stepBadgeNumberText}>1</Text></View>
              <Text style={S.stepBoxTitle}>Send exactly {price} to this account:</Text>
            </View>

            <View style={S.accountNumberCallout}>
              <Text style={S.accountNumberLabel}>{meta.accountLabel}</Text>
              <Text style={S.accountNumberText} selectable>{accountNumber}</Text>

              <View style={S.copyButtonsRow}>
                <TouchableOpacity
                  style={[S.copyButton, copiedKey === 'account' && S.copyButtonActive]}
                  onPress={() => copyToClipboard(accountNumber, 'account')}
                  activeOpacity={0.8}
                >
                  <Lucide name={copiedKey === 'account' ? 'check' : 'copy'} size={15} color={copiedKey === 'account' ? '#10b981' : '#2563eb'} />
                  <Text style={[S.copyButtonText, copiedKey === 'account' && S.copyButtonTextActive]}>
                    {copiedKey === 'account' ? 'Copied!' : 'Copy Number'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.copyButton, copiedKey === 'amount' && S.copyButtonActive]}
                  onPress={() => copyToClipboard(
                    (selectedMethod === 'payeer' || selectedMethod === 'usdt')
                      ? `${plan.prices?.usdt ?? plan.prices.payeer}`
                      : `${plan.prices[selectedMethod as 'd17' | 'ooredoo']}`,
                    'amount'
                  )}
                  activeOpacity={0.8}
                >
                  <Lucide name={copiedKey === 'amount' ? 'check' : 'copy'} size={15} color={copiedKey === 'amount' ? '#10b981' : '#2563eb'} />
                  <Text style={[S.copyButtonText, copiedKey === 'amount' && S.copyButtonTextActive]}>
                    {copiedKey === 'amount' ? 'Copied!' : `Copy ${price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ooredoo USSD */}
            {isOoredoo && (
              <View style={S.ussdDirectCard}>
                <View style={S.ussdDirectTop}>
                  <Lucide name="zap" size={18} color="#dc2626" />
                  <Text style={S.ussdDirectTitle}>Fastest Option: 1-Tap Dial Code</Text>
                </View>
                <Text style={S.ussdDirectDesc}>Tap below to open your dialer with the transfer code pre-filled:</Text>
                <TouchableOpacity style={S.ussdDialBtn} onPress={handleDialUssd} activeOpacity={0.85}>
                  <Lucide name="phone" size={16} color="#ffffff" />
                  <Text style={S.ussdDialBtnText}>Dial {ussdCode}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick steps */}
            <View style={S.quickStepsList}>
              {selectedMethod === 'd17' && (
                <>
                  <Text style={S.quickStepLine}>• Open your <Text style={{ fontWeight: '700' }}>D17 App</Text>.</Text>
                  <Text style={S.quickStepLine}>• Choose <Text style={{ fontWeight: '700' }}>"Transfert d'argent"</Text>.</Text>
                  <Text style={S.quickStepLine}>• Send <Text style={{ fontWeight: '700' }}>{price}</Text> to <Text style={{ fontWeight: '800', color: '#2563eb' }}>{accountNumber}</Text>.</Text>
                </>
              )}
              {selectedMethod === 'ooredoo' && (
                <>
                  <Text style={S.quickStepLine}>• Dial <Text style={{ fontWeight: '800' }}>{ussdCode}</Text> from your Ooredoo phone.</Text>
                  <Text style={S.quickStepLine}>• Or send a recharge ticket code in the notes below.</Text>
                </>
              )}
              {selectedMethod === 'payeer' && (
                <>
                  <Text style={S.quickStepLine}>• Open your Payeer wallet or site.</Text>
                  <Text style={S.quickStepLine}>• Send <Text style={{ fontWeight: '700' }}>{price} USD</Text> to <Text style={{ fontWeight: '800', color: '#2563eb' }}>{accountNumber}</Text>.</Text>
                  <Text style={S.quickStepLine}>• Copy the Operation / Batch ID from your Payeer history.</Text>
                </>
              )}
              {selectedMethod === 'usdt' && (
                <>
                  <Text style={S.quickStepLine}>• Open your crypto wallet (Trust Wallet, Binance, etc.).</Text>
                  <Text style={S.quickStepLine}>• Send exactly <Text style={{ fontWeight: '700' }}>{price} USDT</Text> to the wallet address above.</Text>
                  <Text style={[S.quickStepLine, { color: '#dc2626', fontWeight: '600' }]}>⚠️ Use the correct network — check with support if unsure.</Text>
                  <Text style={S.quickStepLine}>• Copy your <Text style={{ fontWeight: '700' }}>Transaction Hash (TXID)</Text> from your wallet history.</Text>
                </>
              )}
            </View>
          </View>

          {/* Step 2: Enter Reference */}
          <View style={S.stepBoxCard}>
            <View style={S.stepBoxHeader}>
              <View style={S.stepBadgeNumber}><Text style={S.stepBadgeNumberText}>2</Text></View>
              <Text style={S.stepBoxTitle}>Enter Your Sender Reference:</Text>
            </View>

            <Text style={S.inputPromptText}>{meta.refHint}</Text>

            <View style={S.inputWithPasteContainer}>
              <TextInput
                style={S.textInputMain}
                value={reference}
                onChangeText={setReference}
                onFocus={() => scrollToInput(340)}
                placeholder={meta.refPlaceholder}
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType={selectedMethod === 'payeer' || selectedMethod === 'usdt' ? 'default' : 'phone-pad'}
              />
              <TouchableOpacity style={S.pasteInlineBtn} onPress={pasteFromClipboard} activeOpacity={0.7}>
                <Lucide name="clipboard" size={13} color="#2563eb" />
                <Text style={S.pasteInlineBtnText}>Paste</Text>
              </TouchableOpacity>
            </View>

            {!showNotes ? (
              <TouchableOpacity onPress={() => setShowNotes(true)} style={S.addNotesToggle}>
                <Lucide name="plus" size={13} color="#64748b" />
                <Text style={S.addNotesToggleText}>Add optional note or recharge code</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 4 }}>
                <Text style={S.notesLabel}>Additional Note / Voucher Code:</Text>
                <TextInput
                  style={[S.textInputMain, { height: 74, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, backgroundColor: '#f8fafc' }]}
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => scrollToInput(420)}
                  placeholder="Any message or extra info for the admin..."
                  placeholderTextColor="#94a3b8"
                  multiline
                />
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[S.primaryActionBtn, submitting && S.primaryActionBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Lucide name="send" size={17} color="#ffffff" />
                <Text style={S.primaryActionBtnText}>I've Sent the Money · Confirm Transfer</Text>
              </>
            )}
          </TouchableOpacity>

          {/* WhatsApp Help */}
          <TouchableOpacity style={S.whatsAppHelpBtn} onPress={handleOpenWhatsApp} activeOpacity={0.8}>
            <Lucide name="message-circle" size={17} color="#059669" />
            <Text style={S.whatsAppHelpBtnText}>Need help or instant approval? Chat on WhatsApp</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
