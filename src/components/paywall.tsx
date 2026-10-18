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
 * gate access. Shows an upgrade prompt when the user is not subscribed.
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
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Lucide name="arrow-left" size={22} color="#c4b5fd" />
        </TouchableOpacity>

        <View style={styles.iconOuter}>
          <View style={[styles.iconInner, { backgroundColor: '#f59e0b20' }]}>
            <Lucide name="clock" size={44} color="#f59e0b" />
          </View>
        </View>

        <Text style={styles.title}>Payment Pending</Text>
        <Text style={styles.subtitle}>
          Your payment is being reviewed by our team. Access to{' '}
          <Text style={{ color: '#a78bfa', fontWeight: '700' }}>
            {featureName}
          </Text>{' '}
          will unlock automatically once approved.
        </Text>
        <Text style={styles.note}>
          This usually takes a few hours. Check back soon!
        </Text>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleCheckStatus}
          disabled={refreshing || loading}
          activeOpacity={0.8}
        >
          {refreshing || loading ? (
            <ActivityIndicator size="small" color="#ede9fe" />
          ) : (
            <>
              <Lucide name="refresh-cw" size={15} color="#ede9fe" />
              <Text style={styles.refreshBtnText}>Check Approval Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backTextBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backTextBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Not subscribed ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Lucide name="arrow-left" size={22} color="#c4b5fd" />
      </TouchableOpacity>

      <View style={styles.iconOuter}>
        <View style={styles.iconInner}>
          <Lucide name={featureIcon as any} size={44} color="#a78bfa" />
        </View>
      </View>

      <View style={styles.lockBadge}>
        <Lucide name="lock" size={12} color="#7c3aed" />
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
        <Lucide name="zap" size={17} color="#fff" />
        <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkStatusBtn}
        onPress={handleCheckStatus}
        disabled={refreshing || loading}
        activeOpacity={0.7}
      >
        {refreshing || loading ? (
          <ActivityIndicator size="small" color="#a78bfa" />
        ) : (
          <>
            <Lucide name="refresh-cw" size={13} color="#a78bfa" />
            <Text style={styles.checkStatusBtnText}>Already paid? Check status</Text>
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
        Starting from 4.5 DT / month
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0a1e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1635',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3b2575',
    zIndex: 10,
  },
  backTextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backTextBtnText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2e1065',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  iconInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#4c1d95',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2e1065',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a78bfa',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ede9fe',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#c4b5fd',
    textAlign: 'center',
    lineHeight: 22,
  },
  note: {
    fontSize: 12.5,
    color: '#7c3aed',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  priceHint: {
    fontSize: 12,
    color: '#4c1d95',
    fontWeight: '500',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b2575',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7c3aed',
    marginTop: 4,
  },
  refreshBtnText: {
    color: '#ede9fe',
    fontSize: 14,
    fontWeight: '700',
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  checkStatusBtnText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
