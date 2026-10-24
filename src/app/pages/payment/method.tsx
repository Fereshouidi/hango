// ─────────────────────────────────────────────────────────────────
// Payment Step 2 – Method Selection
// ─────────────────────────────────────────────────────────────────
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import Lucide from '@react-native-vector-icons/lucide';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchPlansAndMethods, type MethodInfo, type PaymentMethod, type Plan } from '@/services/paymentService';
import { S } from './_styles';
import { getMonthlyPrice, getPlanUsdPrice, getPriceString, METHOD_META, WHATSAPP_PHONE } from './_utils';

export default function MethodSelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ planJson: string }>();

  const plan: Plan | null = params.planJson ? JSON.parse(params.planJson) : null;

  const [methods, setMethods] = useState<Partial<Record<PaymentMethod, MethodInfo>>>({});

  useEffect(() => {
    if (!plan) { router.back(); return; }
    fetchPlansAndMethods()
      .then((d) => setMethods(d.methods || {}))
      .catch(() => {});
  }, []);

  if (!plan) return null;

  const handleSelectMethod = (method: PaymentMethod) => {
    router.push({
      pathname: '/pages/payment/confirm',
      params: { planJson: JSON.stringify(plan), method },
    });
  };

  const handleOpenWhatsApp = () => {
    const { Linking } = require('react-native');
    const text = encodeURIComponent(`Hello HanGo Support! I need help activating my HanGo Pro subscription (${plan.title}).`);
    Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`).catch(() =>
      Alert.alert('Contact Support', 'WhatsApp: +216 29 845 347')
    );
  };

  const { total: usdTotal } = getPlanUsdPrice(plan);

  return (
    <ThemedView style={S.container}>
      <Bg1 />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Lucide name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Select Payment</Text>
          <Text style={S.headerSub}>Choose your easiest payment method</Text>
        </View>
        <TouchableOpacity onPress={handleOpenWhatsApp} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Lucide name="help-circle" size={19} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Steps Switcher */}
      <View style={S.stepsSwitcherWrapper}>
        <View style={S.stepsSwitcherContainer}>
          <TouchableOpacity style={[S.stepsSwitcherTab, S.stepsSwitcherTabCompleted]} onPress={() => router.back()} activeOpacity={0.75}>
            <View style={S.stepCheckBadge}><Lucide name="check" size={11} color="#ffffff" /></View>
            <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextCompleted]}>Plan</Text>
          </TouchableOpacity>
          <View style={[S.stepsSwitcherTab, S.stepsSwitcherTabActive]}>
            <View style={[S.stepNumBadge, S.stepNumBadgeActive]}><Text style={[S.stepNumBadgeText, S.stepNumBadgeTextActive]}>2</Text></View>
            <Text style={[S.stepsSwitcherTabText, S.stepsSwitcherTabTextActive]}>Method</Text>
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
        {/* Selected Plan Pill */}
        <View style={S.planSummaryPill}>
          <Lucide name="package" size={18} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={S.planSummaryLabel}>Selected Plan</Text>
            <Text style={S.planSummaryValue}>{plan.title} · {usdTotal}</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={S.changePlanBtn}>
            <Text style={S.changePlanBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={S.methodsContainer}>
          <Text style={[S.sectionHeaderTitle, { marginTop: 4 }]}>Choose Your Payment Method</Text>
          <Text style={S.sectionHeaderSubtitle}>Pick whichever is fastest and easiest for you.</Text>

          {/* Method Cards */}
          {(Object.keys(METHOD_META) as PaymentMethod[]).map((m) => {
            const info = methods[m];
            const meta = METHOD_META[m];
            const isEnabled = info ? info.isEnabled : true;

            return (
              <TouchableOpacity
                key={m}
                style={[S.methodCard, !isEnabled && S.methodCardDisabled]}
                onPress={() => isEnabled && handleSelectMethod(m)}
                disabled={!isEnabled}
                activeOpacity={0.85}
              >
                {/* Top row: icon + title */}
                <View style={S.methodCardTop}>
                  <View style={[S.methodCardIconBox, { backgroundColor: meta.lightBg, borderColor: meta.color + '40' }]}>
                    <Image
                      source={meta.icon}
                      style={{ width: "105%", height: "105%" }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={S.methodTitleRow}>
                      <Text style={S.methodTitleText}>{meta.shortName}</Text>
                      <View style={[S.methodBadge, { backgroundColor: meta.lightBg, borderColor: meta.color + '40' }]}>
                        <Text style={[S.methodBadgeText, { color: meta.color }]}>{meta.badge}</Text>
                      </View>
                    </View>
                    <Text style={S.methodFullLabel}>{meta.label}</Text>
                  </View>
                </View>

                <View style={S.methodCardDivider} />

                {/* Bottom row: price + CTA */}
                <View style={S.methodCardBottom}>
                  <View>
                    <Text style={S.methodPriceTotal}>{getPriceString(plan, m)}</Text>
                    <Text style={S.methodPricePerMo}>{getMonthlyPrice(plan, m)}</Text>
                  </View>
                  <View style={[S.methodSelectBtn, !isEnabled && { backgroundColor: '#f1f5f9', shadowOpacity: 0 }]}>
                    <Text style={[S.methodSelectBtnText, !isEnabled && { color: '#94a3b8' }]}>
                      {isEnabled ? `Pay with ${meta.shortName}` : 'Unavailable'}
                    </Text>
                    {isEnabled && <Lucide name="chevron-right" size={16} color="#ffffff" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info tip */}
        <View style={S.easyHelpCard}>
          <Lucide name="zap" size={18} color="#d97706" />
          <View style={{ flex: 1 }}>
            <Text style={S.easyHelpTitle}>No app or card needed for Ooredoo</Text>
            <Text style={S.easyHelpText}>
              If you have an Ooredoo SIM, you can transfer phone credit instantly with a simple USSD dial code!
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
