// ─────────────────────────────────────────────────────────────────
// Payment – Pending Review / Rejected Screen
// ─────────────────────────────────────────────────────────────────
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/context/subscription-context';
import { S } from './_styles';
import { WHATSAPP_PHONE } from './_utils';

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh, isSubscribed, hasPendingPayment, latestRejectedPayment } = useSubscription();
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Show rejected view when: no current pending payment AND there's a rejected one
  const isRejected = !hasPendingPayment && !!latestRejectedPayment;
  const rejectionNote = latestRejectedPayment?.rejectionReason;

  const handleManualCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      await refresh();
      if (isSubscribed) {
        Alert.alert('Subscription Active! 🎉', 'Your payment is approved. Enjoy learning!', [
          { text: 'Start Learning', onPress: () => router.replace('/') },
        ]);
      } else {
        Alert.alert(
          'Verification in Progress',
          'Your payment is being reviewed. Please check back in a few minutes!'
        );
      }
    } catch (e: any) {
      Alert.alert('Status Check', e.message || 'Could not verify at this moment.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent('Hello HanGo Support! I submitted my payment and need instant activation.');
    Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`).catch(() =>
      Alert.alert('Contact Support', 'WhatsApp: +216 29 845 347')
    );
  };

  const handleResubmit = () => {
    router.replace('/pages/payment');
  };

  // ── Rejected View ───────────────────────────────────────────────
  if (isRejected) {
    return (
      <ThemedView style={S.container}>
        <Bg1 />

        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.replace('/')} style={S.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Lucide name="x" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={S.headerCenter}>
            <Text style={S.headerTitle}>Payment Declined</Text>
            <Text style={S.headerSub}>Your payment could not be verified</Text>
          </View>
          <TouchableOpacity onPress={handleOpenWhatsApp} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Lucide name="help-circle" size={19} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[S.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={ls.rejectedContainer}>
            {/* Icon */}
            <View style={ls.rejectedIconOuter}>
              <View style={ls.rejectedIconInner}>
                <Lucide name="x-circle" size={44} color="#dc2626" />
              </View>
            </View>

            {/* Status Badge */}
            <View style={ls.rejectedBadgePill}>
              <View style={ls.rejectedBadgeDot} />
              <Text style={ls.rejectedBadgePillText}>PAYMENT REJECTED</Text>
            </View>

            <Text style={ls.rejectedTitle}>We Couldn't Verify Your Payment</Text>
            <Text style={ls.rejectedBody}>
              Unfortunately, our admin team could not confirm your payment transfer. Please review the reason below and try again.
            </Text>

            {/* Rejection Reason Card */}
            <View style={ls.reasonCard}>
              <View style={ls.reasonCardHeader}>
                <Lucide name="alert-triangle" size={16} color="#dc2626" />
                <Text style={ls.reasonCardTitle}>Reason from Admin</Text>
              </View>
              <View style={ls.reasonCardDivider} />
              <Text style={ls.reasonCardText}>
                {rejectionNote || 'No specific reason was provided. Please contact support for more details.'}
              </Text>
            </View>

            {/* What to do next */}
            <View style={ls.nextStepsCard}>
              <Text style={ls.nextStepsTitle}>What can I do?</Text>
              {[
                { icon: 'refresh-cw', text: 'Double-check your transfer reference and resubmit' },
                { icon: 'message-circle', text: 'Send your payment screenshot on WhatsApp for faster help' },
                { icon: 'credit-card', text: 'Try a different payment method (D17, Ooredoo, or Payeer)' },
              ].map((item) => (
                <View key={item.text} style={ls.nextStepRow}>
                  <View style={ls.nextStepIconBox}>
                    <Lucide name={item.icon as any} size={14} color="#2563eb" />
                  </View>
                  <Text style={ls.nextStepText}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={ls.resubmitBtn}
              onPress={handleResubmit}
              activeOpacity={0.85}
            >
              <Lucide name="rotate-ccw" size={17} color="#ffffff" />
              <Text style={ls.resubmitBtnText}>Try Again – Resubmit Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[S.whatsAppHelpBtn, { width: '100%' }]} onPress={handleOpenWhatsApp} activeOpacity={0.8}>
              <Lucide name="message-circle" size={17} color="#059669" />
              <Text style={S.whatsAppHelpBtnText}>Chat with Support on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={S.ghostBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
              <Text style={S.ghostBtnText}>Return to App</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // ── Pending View ────────────────────────────────────────────────
  return (
    <ThemedView style={S.container}>
      <Bg1 />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={S.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Lucide name="x" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Payment Under Review</Text>
          <Text style={S.headerSub}>We are activating your account</Text>
        </View>
        <TouchableOpacity onPress={handleOpenWhatsApp} style={S.helpBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Lucide name="help-circle" size={19} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[S.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.pendingContainer}>
          {/* Icon */}
          <View style={S.pendingIconOuter}>
            <View style={S.pendingIconInner}>
              <Lucide name="clock" size={44} color="#2563eb" />
            </View>
          </View>

          {/* Status Pill */}
          <View style={S.pendingBadgePill}>
            <View style={S.pendingBadgeDot} />
            <Text style={S.pendingBadgePillText}>PAYMENT RECEIVED · UNDER REVIEW</Text>
          </View>

          <Text style={S.pendingTitle}>You're All Set!</Text>
          <Text style={S.pendingBody}>
            We received your payment details. Our admin team verifies transfers quickly, and your subscription activates automatically.
          </Text>

          {/* Timeline */}
          <View style={S.timelineCard}>
            <View style={S.timelineStep}>
              <View style={S.timelineCheckCircle}>
                <Lucide name="check" size={14} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.timelineStepTitle}>Transfer Details Submitted</Text>
                <Text style={S.timelineStepSub}>Reference received successfully</Text>
              </View>
            </View>

            <View style={S.timelineDividerLine} />

            <View style={S.timelineStep}>
              <View style={S.timelinePendingCircle}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.timelineStepTitle, { color: '#2563eb' }]}>Admin Verification in Progress</Text>
                <Text style={S.timelineStepSub}>Typically takes 10 to 30 minutes</Text>
              </View>
            </View>

            <View style={S.timelineDividerLine} />

            <View style={S.timelineStep}>
              <View style={S.timelineFutureCircle}>
                <Lucide name="sparkles" size={13} color="#94a3b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.timelineFutureTitle}>Pro Unlocked Automatically</Text>
                <Text style={S.timelineStepSub}>No further action required from you</Text>
              </View>
            </View>
          </View>

          {/* Check Status */}
          <TouchableOpacity
            style={[S.primaryActionBtn, { width: '100%' }]}
            onPress={handleManualCheckStatus}
            disabled={checkingStatus}
            activeOpacity={0.85}
          >
            {checkingStatus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Lucide name="refresh-cw" size={17} color="#ffffff" />
                <Text style={S.primaryActionBtnText}>Check Approval Status Now</Text>
              </>
            )}
          </TouchableOpacity>

          {/* WhatsApp Expedite */}
          <TouchableOpacity style={[S.whatsAppHelpBtn, { width: '100%' }]} onPress={handleOpenWhatsApp} activeOpacity={0.8}>
            <Lucide name="message-circle" size={17} color="#059669" />
            <Text style={S.whatsAppHelpBtnText}>Send screenshot on WhatsApp for instant activation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={S.ghostBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
            <Text style={S.ghostBtnText}>Return to App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// ── Local styles for rejection state ──────────────────────────────
const ls = StyleSheet.create({
  rejectedContainer: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
  },
  rejectedIconOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fecaca',
  },
  rejectedIconInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  rejectedBadgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#fef2f2', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#fecaca',
  },
  rejectedBadgeDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#dc2626',
  },
  rejectedBadgePillText: {
    fontSize: 11, fontWeight: '800', color: '#dc2626', letterSpacing: 0.5,
  },
  rejectedTitle: {
    fontSize: 21, fontWeight: '900', color: '#0f172a',
    textAlign: 'center', letterSpacing: -0.4,
  },
  rejectedBody: {
    fontSize: 13.5, color: '#64748b', textAlign: 'center',
    lineHeight: 20, fontWeight: '500',
  },

  // Reason card
  reasonCard: {
    width: '100%',
    backgroundColor: '#fff5f5',
    borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#fca5a5',
    gap: 10,
  },
  reasonCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  reasonCardTitle: {
    fontSize: 13, fontWeight: '800', color: '#dc2626',
  },
  reasonCardDivider: {
    height: 1, backgroundColor: '#fecaca',
  },
  reasonCardText: {
    fontSize: 14, color: '#7f1d1d',
    lineHeight: 21, fontWeight: '600',
  },

  // Next steps
  nextStepsCard: {
    width: '100%',
    backgroundColor: '#ffffffed',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    gap: 10,
  },
  nextStepsTitle: {
    fontSize: 12, fontWeight: '800', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  nextStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  nextStepIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  nextStepText: {
    flex: 1, fontSize: 13, color: '#334155', fontWeight: '500', lineHeight: 18,
  },

  // Resubmit button
  resubmitBtn: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  resubmitBtnText: {
    fontSize: 15, fontWeight: '800', color: '#ffffff',
  },
});
