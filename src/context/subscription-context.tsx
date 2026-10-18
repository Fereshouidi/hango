import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  fetchSubscriptionStatus,
  SubscriptionStatus,
} from '@/services/paymentService';
import { getStoredToken } from '@/services/authSyncService';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: SubscriptionStatus['subscriptionStatus'];
  daysRemaining: number;
  hasPendingPayment: boolean;
  pendingPayment: SubscriptionStatus['pendingPayment'];
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
  loading: false,
  refresh: async () => {},
};

const SubscriptionContext = createContext<SubscriptionContextType>(defaultCtx);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Partial<SubscriptionStatus>>({});
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return; // not logged in yet

      setLoading(true);
      const data = await fetchSubscriptionStatus();
      setStatus(data);
      lastFetchRef.current = Date.now();
    } catch {
      // silently fail – user might not be logged in
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const timer = setTimeout(refresh, 1500);
    return () => clearTimeout(timer);
  }, [refresh]);

  // Re-fetch when app comes back to foreground (max once per 5 min)
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const now = Date.now();
        if (now - lastFetchRef.current > 5 * 60 * 1000) {
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
