import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import { useSubscription } from '@/context/subscription-context';

interface PaywallProps {
  /** The feature name shown to the user */
  featureName: string;
  /** Icon name from lucide */
  featureIcon?: string;
  /** Short description of what is locked */
  featureDescription?: string;
  /** The content to show when subscribed */
  children: React.ReactNode;
}

/**
 * Wrap any premium feature with <Paywall featureName="..."> to automatically
 * gate access. Matches the native clean app design.
 */
export function Paywall({
  featureName,
  featureIcon = 'lock',
  featureDescription,
  children,
}: PaywallProps) {
  const { isSubscribed, subscriptionStatus, hasPendingPayment, loading, refresh } =
    useSubscription();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-check subscription whenever Paywall is mounted
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCheckStatus = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Pass-through when subscribed
  if (isSubscribed) {
    return <>{children}</>;
  }

  // ── Pending payment ──────────────────────────────────────────
  if (hasPendingPayment || subscriptionStatus === 'pending') {
    return (
      <ThemedView style={styles.container}>
        <Bg1 />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Lucide name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={[styles.iconOuter, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}>
            <Lucide name="clock" size={38} color="#d97706" />
          </View>

          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>UNDER REVIEW</Text>
          </View>

          <Text style={styles.title}>Payment Under Review</Text>
          <Text style={styles.subtitle}>
            Your payment reference has been submitted. Access to{' '}
            <Text style={{ color: '#0f172a', fontWeight: '800' }}>
              {featureName}
            </Text>{' '}
            will unlock automatically as soon as verified.
          </Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleCheckStatus}
            disabled={refreshing || loading}
            activeOpacity={0.85}
          >
            {refreshing || loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Lucide name="refresh-cw" size={15} color="#ffffff" />
                <Text style={styles.refreshBtnText}>Check Approval Status</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backTextBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backTextBtnText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // ── Not subscribed ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Bg1 />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Lucide name="arrow-left" size={20} color="#1e293b" />
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconOuter}>
          <Lucide name={featureIcon as any} size={38} color="#2563eb" />
        </View>

        <View style={styles.lockBadge}>
          <Lucide name="lock" size={12} color="#2563eb" />
          <Text style={styles.lockBadgeText}>PRO FEATURE</Text>
        </View>

        <Text style={styles.title}>{featureName}</Text>
        <Text style={styles.subtitle}>
          {featureDescription ||
            `Unlock ${featureName} and all premium features by upgrading to HanGo Pro.`}
        </Text>

        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/pages/payment' as any)}
          activeOpacity={0.85}
        >
          <Lucide name="sparkles" size={17} color="#ffffff" />
          <Text style={styles.upgradeBtnText}>Upgrade to HanGo Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkStatusBtn}
          onPress={handleCheckStatus}
          disabled={refreshing || loading}
          activeOpacity={0.7}
        >
          {refreshing || loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Lucide name="refresh-cw" size={13} color="#2563eb" />
              <Text style={styles.checkStatusBtnText}>Already paid? Refresh status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backTextBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backTextBtnText}>Maybe Later</Text>
        </TouchableOpacity>

        <Text style={styles.priceHint}>
          From 3.2 DT / month • Pay with D17, Ooredoo, Payeer, or USDT
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    backgroundColor: '#f8fafce7',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffffea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffffea',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  iconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ffea',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6fff3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lockBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#d97706',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  upgradeBtn: {
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 4,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  checkStatusBtnText: {
    color: '#2563eb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  backTextBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  backTextBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  priceHint: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
