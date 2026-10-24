import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchSubscriptionStatus,
  SubscriptionStatus,
} from '@/services/paymentService';
import { getStoredToken } from '@/services/authSyncService';

const KEY_SUBSCRIPTION_CACHE = 'hango_subscription_cache';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: SubscriptionStatus['subscriptionStatus'];
  daysRemaining: number;
  hasPendingPayment: boolean;
  pendingPayment: SubscriptionStatus['pendingPayment'];
  latestRejectedPayment: SubscriptionStatus['latestRejectedPayment'];
  subscriptionExpiresAt?: string;
  subscriptionPlan?: string;
  loading: boolean;
  /** Manually refresh the subscription status from the server */
  refresh: () => Promise<void>;
}

const defaultCtx: SubscriptionContextType = {
  isSubscribed: false,
  subscriptionStatus: 'none',
  daysRemaining: 0,
  hasPendingPayment: false,
  pendingPayment: null,
  latestRejectedPayment: null,
  loading: false,
  refresh: async () => {},
};

const SubscriptionContext = createContext<SubscriptionContextType>(defaultCtx);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Partial<SubscriptionStatus>>({});
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  // Load cached status on initial mount for instant UI feedback
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(KEY_SUBSCRIPTION_CACHE);
        if (cached) {
          const parsed = JSON.parse(cached);
          setStatus(parsed);
        }
      } catch {
        // ignore cache read errors
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return; // not logged in yet

      setLoading(true);
      const data = await fetchSubscriptionStatus();
      setStatus(data);
      lastFetchRef.current = Date.now();

      if (data.isSubscribed) {
        // Persist so the next cold-open feels instant
        await AsyncStorage.setItem(KEY_SUBSCRIPTION_CACHE, JSON.stringify(data));
      } else {
        // Clear stale cache so revoked subscriptions never flash as active
        await AsyncStorage.removeItem(KEY_SUBSCRIPTION_CACHE);
      }
    } catch {
      // silently fail – user might be offline
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch immediately on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-fetch whenever app becomes active (at most once every 3 seconds)
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const now = Date.now();
        if (now - lastFetchRef.current > 3000) {
          refresh();
        }
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [refresh]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed: status.isSubscribed ?? false,
        subscriptionStatus: status.subscriptionStatus ?? 'none',
        daysRemaining: status.daysRemaining ?? 0,
        hasPendingPayment: status.hasPendingPayment ?? false,
        pendingPayment: status.pendingPayment ?? null,
        latestRejectedPayment: status.latestRejectedPayment ?? null,
        subscriptionExpiresAt: status.subscriptionExpiresAt,
        subscriptionPlan: status.subscriptionPlan,
        loading,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
