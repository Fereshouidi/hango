import { getServerUrl, getStoredToken, logoutAccount } from './authSyncService';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'd17' | 'ooredoo' | 'payeer';

export interface MethodInfo {
  accountNumber: string;
  accountName: string;
  instructions: string;
  isEnabled: boolean;
}

export interface Plan {
  id: string;
  durationMonths: number;
  title: string;
  tag?: string;
  prices: {
    d17: number;
    ooredoo: number;
    payeer: number;
  };
}

export interface PlansAndMethodsResponse {
  methods: {
    d17: MethodInfo;
    ooredoo: MethodInfo;
    payeer: MethodInfo;
  };
  plans: Plan[];
  updatedAt?: string;
}

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionStatus: 'none' | 'pending' | 'active' | 'expired';
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  daysRemaining: number;
  hasPendingPayment: boolean;
  pendingPayment?: {
    _id: string;
    method: PaymentMethod;
    durationMonths: number;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  } | null;
}

export interface PaymentRecord {
  _id: string;
  method: PaymentMethod;
  durationMonths: number;
  amount: number;
  currency: string;
  recipientAccount: string;
  senderReference: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    await logoutAccount();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch available subscription plans and payment method details.
 * Public endpoint – no authentication required.
 */
export async function fetchPlansAndMethods(): Promise<PlansAndMethodsResponse> {
  const base = await getServerUrl();
  const res = await fetch(`${base}/api/payments/plans`);
  return handleResponse<PlansAndMethodsResponse>(res);
}

/**
 * Submit a payment after the user has sent money.
 */
export async function submitPayment(payload: {
  method: PaymentMethod;
  durationMonths: number;
  senderReference: string;
  notes?: string;
}): Promise<{ message: string; payment: PaymentRecord }> {
  const base = await getServerUrl();
  const res = await fetch(`${base}/api/payments/submit`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Get the current user's subscription status.
 */
export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const base = await getServerUrl();
  const res = await fetch(`${base}/api/payments/status`, {
    headers: await authHeaders(),
  });
  return handleResponse<SubscriptionStatus>(res);
}

/**
 * Get the current user's payment history.
 */
export async function fetchPaymentHistory(): Promise<PaymentRecord[]> {
  const base = await getServerUrl();
  const res = await fetch(`${base}/api/payments/history`, {
    headers: await authHeaders(),
  });
  return handleResponse<PaymentRecord[]>(res);
}
