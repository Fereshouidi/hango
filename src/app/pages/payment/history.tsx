// ─────────────────────────────────────────────────────────────────
// Payment – History Screen
// ─────────────────────────────────────────────────────────────────
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import { fetchPaymentHistory, type PaymentMethod, type PaymentRecord } from '@/services/paymentService';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S } from './_styles';

// ── Config ────────────────────────────────────────────────────────
const METHOD_LABEL: Record<PaymentMethod, { name: string; color: string; bg: string }> = {
  d17:     { name: 'D17',     color: '#d97706', bg: '#fffbeb' },
  ooredoo: { name: 'Ooredoo', color: '#dc2626', bg: '#fef2f2' },
  payeer:  { name: 'Payeer',  color: '#2563eb', bg: '#eff6ff' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  approved: { label: 'Approved',  color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'check-circle-2' },
  pending:  { label: 'Pending',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: 'clock' },
  rejected: { label: 'Rejected',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'x-circle' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────
export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');

  useEffect(() => {
    fetchPaymentHistory()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  const counts = {
    all: records.length,
    approved: records.filter((r) => r.status === 'approved').length,
    pending:  records.filter((r) => r.status === 'pending').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
  };

  return (
    <ThemedView style={S.container}>
      <Bg1 />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Lucide name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Payment History</Text>
          <Text style={S.headerSub}>All your subscription transactions</Text>
        </View>
        <View style={[S.helpBtn, { backgroundColor: '#f1f5f9' }]}>
          <Lucide name="receipt" size={18} color="#64748b" />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={ls.filterBar}>
        {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => {
          const isActive = filter === f;
          const cfg = f === 'all' ? null : STATUS_CONFIG[f];
          return (
            <TouchableOpacity
              key={f}
              style={[
                ls.filterTab,
                isActive && { backgroundColor: cfg?.bg ?? '#f1f5f9', borderColor: cfg?.border ?? '#e2e8f0' },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[ls.filterTabText, isActive && { color: cfg?.color ?? '#0f172a', fontWeight: '800' }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
              {counts[f] > 0 && (
                <View style={[ls.filterCount, isActive && { backgroundColor: cfg?.color ?? '#0f172a' }]}>
                  <Text style={ls.filterCountText}>{counts[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={ls.loadingBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={ls.loadingText}>Loading your history...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[ls.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={ls.emptyState}>
              <View style={ls.emptyIconBox}>
                <Lucide name="inbox" size={36} color="#94a3b8" />
              </View>
              <Text style={ls.emptyTitle}>No records yet</Text>
              <Text style={ls.emptySubtitle}>
                {filter === 'all'
                  ? "You haven't submitted any payments yet."
                  : `No ${filter} payments found.`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity style={ls.startBtn} onPress={() => router.push('/pages/payment')} activeOpacity={0.85}>
                  <Lucide name="plus-circle" size={16} color="#ffffff" />
                  <Text style={ls.startBtnText}>Get HanGo Pro</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={ls.listWrapper}>
              {filtered.map((record, idx) => {
                const cfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.pending;
                const method = METHOD_LABEL[record.method] ?? { name: record.method.toUpperCase(), color: '#64748b', bg: '#f1f5f9' };
                const priceStr = record.currency === '$'
                  ? `$${record.amount}`
                  : `${record.amount} DT`;
                const isRejected = record.status === 'rejected';

                return (
                  <View key={record._id} style={[ls.recordCard, isRejected && ls.recordCardRejected]}>
                    {/* Top row */}
                    <View style={ls.recordTop}>
                      {/* Method badge */}
                      <View style={[ls.methodPill, { backgroundColor: method.bg }]}>
                        <Text style={[ls.methodPillText, { color: method.color }]}>{method.name}</Text>
                      </View>

                      {/* Status badge */}
                      <View style={[ls.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <Lucide name={cfg.icon as any} size={11} color={cfg.color} />
                        <Text style={[ls.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>

                    {/* Main info */}
                    <View style={ls.recordBody}>
                      <View style={ls.recordPriceRow}>
                        <Text style={ls.recordPrice}>{priceStr}</Text>
                        <Text style={ls.recordDuration}>
                          {record.durationMonths} month{record.durationMonths !== 1 ? 's' : ''} access
                        </Text>
                      </View>

                      <View style={ls.recordMeta}>
                        <View style={ls.recordMetaRow}>
                          <Lucide name="calendar" size={12} color="#94a3b8" />
                          <Text style={ls.recordMetaText}>Submitted: {formatDate(record.createdAt)} at {formatTime(record.createdAt)}</Text>
                        </View>
                        {record.reviewedAt && (
                          <View style={ls.recordMetaRow}>
                            <Lucide name={isRejected ? 'x' : 'check'} size={12} color={cfg.color} />
                            <Text style={[ls.recordMetaText, { color: cfg.color }]}>
                              {isRejected ? 'Declined' : 'Approved'}: {formatDate(record.reviewedAt)} at {formatTime(record.reviewedAt)}
                            </Text>
                          </View>
                        )}
                        <View style={ls.recordMetaRow}>
                          <Lucide name="hash" size={12} color="#94a3b8" />
                          <Text style={ls.recordMetaText} numberOfLines={1}>Ref: {record.senderReference}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Rejection reason */}
                    {isRejected && record.rejectionReason && (
                      <View style={ls.rejectionReasonBox}>
                        <Lucide name="alert-triangle" size={13} color="#dc2626" />
                        <View style={{ flex: 1 }}>
                          <Text style={ls.rejectionReasonLabel}>Admin Note</Text>
                          <Text style={ls.rejectionReasonText}>{record.rejectionReason}</Text>
                        </View>
                      </View>
                    )}

                    {/* Approved: show subscription dates */}
                    {record.status === 'approved' && (
                      <View style={ls.approvedDateBox}>
                        <Lucide name="shield-check" size={13} color="#059669" />
                        <Text style={ls.approvedDateText}>
                          Subscription active · expires after {record.durationMonths * 30} days from approval
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 5,
    paddingTop: 5,
    gap: 5,
  },
  loadingBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffffdb',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  filterTabText: {
    fontSize: 11, fontWeight: '600', color: '#64748b',
  },
  filterCount: {
    backgroundColor: '#94a3b8',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },

  // Empty state
  emptyState: {
    alignItems: 'center', gap: 10,
    paddingVertical: 60, paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  startBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },

  // List
  listWrapper: { gap: 5 },

  // Record card
  recordCard: {
    backgroundColor: '#ffffffee',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  recordCardRejected: {
    borderColor: '#fecaca',
    backgroundColor: '#fff8f8ed',
  },

  // Top row
  recordTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  methodPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  methodPillText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  // Body
  recordBody: { gap: 8 },
  recordPriceRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 10,
  },
  recordPrice: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  recordDuration: {
    fontSize: 13, color: '#64748b', fontWeight: '600',
    backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },

  recordMeta: { gap: 4 },
  recordMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recordMetaText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', flex: 1 },

  // Rejection reason
  rejectionReasonBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#fca5a5',
    alignItems: 'flex-start',
  },
  rejectionReasonLabel: {
    fontSize: 10.5, fontWeight: '800', color: '#dc2626',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2,
  },
  rejectionReasonText: {
    fontSize: 13, color: '#7f1d1d', fontWeight: '600', lineHeight: 18,
  },

  // Approved info
  approvedDateBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  approvedDateText: {
    fontSize: 12, color: '#065f46', fontWeight: '600', flex: 1,
  },
});
