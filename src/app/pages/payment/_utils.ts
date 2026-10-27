import { ImageSourcePropType } from 'react-native';
import type { PaymentMethod, Plan } from '@/services/paymentService';

// ── Types ──────────────────────────────────────────────────────────
export interface MethodMeta {
  label: string;
  shortName: string;
  badge: string;
  icon: ImageSourcePropType;
  color: string;
  lightBg: string;
  flag: string;
  accountLabel: string;
  refPlaceholder: string;
  refHint: string;
}

// ── Constants ──────────────────────────────────────────────────────
export const METHOD_META: Record<PaymentMethod, MethodMeta> = {
  d17: {
    label: 'D17 (La Poste Tunisienne)',
    shortName: 'D17',
    badge: 'Most Popular in Tunisia',
    icon: require('../../../../assets/images/d17.jpg'),
    color: '#d97706',
    lightBg: '#fffbeb',
    flag: '🇹🇳',
    accountLabel: 'D17 Phone Number',
    refPlaceholder: 'e.g. 29 123 456 (your phone number)',
    refHint: 'Enter the phone number or name you transferred from',
  },
  ooredoo: {
    label: 'Ooredoo Transfer / Recharge',
    shortName: 'Ooredoo',
    badge: 'Instant Dial Code (*120*)',
    icon: require('../../../../assets/images/ooredoo.jpg'),
    color: '#dc2626',
    lightBg: '#fef2f2',
    flag: '🇹🇳',
    accountLabel: 'Ooredoo Number',
    refPlaceholder: 'e.g. 22 123 456 (your phone number)',
    refHint: 'Enter your phone number so we can match your transfer',
  },
  payeer: {
    label: 'Payeer (USD / Cards / Crypto)',
    shortName: 'Payeer',
    badge: 'International & Crypto',
    icon: require('../../../../assets/images/payeer.jpg'),
    color: '#2563eb',
    lightBg: '#eff6ff',
    flag: '🌐',
    accountLabel: 'Payeer Account ID',
    refPlaceholder: 'e.g. Batch #19845621 or P12345678',
    refHint: 'Enter your Payeer account ID or Operation Batch ID',
  },
  usdt: {
    label: 'USDT (Tether)',
    shortName: 'USDT',
    badge: 'Crypto Payments',
    icon: require('../../../../assets/images/usdt.jpg'),
    color: '#16a34a',
    lightBg: '#f0fdf4',
    flag: '🌐',
    accountLabel: 'USDT Wallet Address',
    refPlaceholder: 'Enter your transaction hash (TXID)',
    refHint: 'Send USDT using the supported network only, then enter your transaction hash (TXID)',
  },
};

export const PRO_BENEFITS = [
  { icon: 'headphones', title: 'Listening Loop', desc: 'Infinite native audio repetition' },
  { icon: 'pencil-line', title: 'Character Canvas', desc: 'Real-time stroke order verification' },
  { icon: 'keyboard', title: 'Writing Studio', desc: 'Full composition & sentence builder' },
  { icon: 'cloud', title: 'Instant Cloud Sync', desc: 'Keep your vocabulary backed up safely' },
];

// ── Helpers ────────────────────────────────────────────────────────
export function getPlanUsdPrice(plan: Plan) {
  // USDT and Payeer share the same USD price
  const rawVal =
    plan.prices?.payeer != null
      ? Number(plan.prices.payeer)
      : plan.prices?.usdt != null
        ? Number(plan.prices.usdt)
        : Number(plan.prices?.d17 || 0) / 3.0;
  const total = `$${rawVal.toFixed(2)}`;
  const perMoVal = rawVal / Math.max(1, plan.durationMonths);
  const perMo = `$${perMoVal.toFixed(2)}`;
  return { total, perMo, rawVal };
}

export function getPriceString(plan: Plan, method: PaymentMethod): string {
  // USDT uses the same USD price as Payeer
  const isUsd = method === 'payeer' || method === 'usdt';
  const p = isUsd
    ? (plan.prices?.usdt ?? plan.prices.payeer)
    : plan.prices[method as 'd17' | 'ooredoo'];
  return isUsd ? `$${p}` : `${p} DT`;
}

export function getMonthlyPrice(plan: Plan, method: PaymentMethod): string {
  const isUsd = method === 'payeer' || method === 'usdt';
  const rawP = isUsd
    ? (plan.prices?.usdt ?? plan.prices.payeer)
    : plan.prices[method as 'd17' | 'ooredoo'];
  const perMo = (rawP / plan.durationMonths).toFixed(1);
  return isUsd ? `$${perMo}/mo` : `${perMo} DT/mo`;
}

export function formatPlanTitle(planKey?: string) {
  if (!planKey) return 'HanGo Pro';
  if (planKey === '1_month_free_trial') return '🎁 1 Month Free Trial';
  if (planKey === '1_month') return '1 Month Access';
  if (planKey === '2_months') return '2 Months Access';
  if (planKey === '3_months') return '3 Months Access';
  if (planKey.endsWith('_month_manual')) return `${planKey.replace('_month_manual', '')} Month (Admin Grant)`;
  return planKey.replace('_', ' ').toUpperCase();
}

export function getUssdCode(accountNumber: string, amount: number): string {
  return `*120*${accountNumber}*${amount}#`;
}

export const WHATSAPP_PHONE = '21629845347';
