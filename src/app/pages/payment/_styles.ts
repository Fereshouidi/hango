import { StyleSheet } from 'react-native';

export const S = StyleSheet.create({
  // ── Layout ──
  container: { flex: 1 },
  scrollContent: {
    
    paddingHorizontal: 5,
    paddingTop: 5,
    gap: 5,
  },

  // ── Loading ──
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  loadingTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  loadingSub: { fontSize: 13, color: '#64748b' },

  // ── Header ──
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
    backgroundColor: '#ffffffee',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 1 },
  helpBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  // ── Steps Switcher ──
  stepsSwitcherWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffffdb',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepsSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepsSwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: 'transparent',
  },
  stepsSwitcherTabActive: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsSwitcherTabCompleted: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stepsSwitcherTabDisabled: { opacity: 0.4 },
  stepsSwitcherTabText: { fontSize: 12.5, fontWeight: '700', color: '#64748b' },
  stepsSwitcherTabTextActive: { color: '#ffffff', fontWeight: '800' },
  stepsSwitcherTabTextCompleted: { color: '#0f172a', fontWeight: '700' },
  stepNumBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
  },
  stepNumBadgeActive: { backgroundColor: '#ffffff33' },
  stepNumBadgeText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  stepNumBadgeTextActive: { color: '#ffffff' },
  stepCheckBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
  },

  // ── Primary Action Button ──
  primaryActionBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryActionBtnDisabled: { opacity: 0.6 },
  primaryActionBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff', letterSpacing: 0.1 },

  // ── WhatsApp & Ghost ──
  whatsAppHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  whatsAppHelpBtnText: { fontSize: 12.5, fontWeight: '700', color: '#047857', textAlign: 'center' },
  ghostBtn: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ghostBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  // ── Trust Box ──
  trustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  trustTitle: { fontSize: 13, fontWeight: '800', color: '#065f46' },
  trustDesc: { fontSize: 12, color: '#047857', lineHeight: 17, marginTop: 1 },

  // ── Plan Summary Pill (used on method/confirm pages) ──
  planSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffe6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  methodsContainer: {backgroundColor: "#ffffffe6", borderRadius: 20, padding: 15, gap: 5},
  planSummaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  planSummaryValue: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 1 },
  changePlanBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#eff6ff', borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe',
  },
  changePlanBtnText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  // ── Section Header ──
  sectionHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  sectionHeaderSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', lineHeight: 18 },

  // ── Method Cards ──
  methodCard: {
    backgroundColor: '#ffffffe6',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    gap: 12,
  },
  methodCardDisabled: { opacity: 0.5 },
  methodCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodCardIconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: "hidden"
  },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  methodTitleText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  methodBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  methodFullLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },
  methodCardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  methodCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodPriceTotal: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  methodPricePerMo: { fontSize: 11.5, color: '#64748b', fontWeight: '600' },
  methodSelectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  methodSelectBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },

  // ── Easy Help Card ──
  easyHelpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fffbeb', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#fde68a',
  },
  easyHelpTitle: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  easyHelpText: { fontSize: 12, color: '#b45309', lineHeight: 17, marginTop: 1 },

  // ── Step 3: Instructions ──
  checkoutSummaryPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffffe6',
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 12,
  },
  summaryMethodIcon: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  summaryPlanTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  summaryMethodSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  summaryChangeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f1f5f9' },
  summaryChangeBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  stepBoxCard: {
    backgroundColor: '#ffffffe6', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 12,
  },
  stepBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadgeNumber: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeNumberText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  stepBoxTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1 },

  accountNumberCallout: {
    backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', gap: 6,
  },
  accountNumberLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  accountNumberText: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },
  copyButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 6, width: '100%' },
  copyButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#eff6ff', paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe',
  },
  copyButtonActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  copyButtonText: { fontSize: 12.5, fontWeight: '700', color: '#2563eb' },
  copyButtonTextActive: { color: '#059669' },

  ussdDirectCard: {
    backgroundColor: '#fef2f2', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#fecaca', gap: 8,
  },
  ussdDirectTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ussdDirectTitle: { fontSize: 13, fontWeight: '800', color: '#991b1b' },
  ussdDirectDesc: { fontSize: 12, color: '#b91c1c', lineHeight: 16 },
  ussdDialBtn: {
    backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10,
  },
  ussdDialBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },

  quickStepsList: { gap: 4, paddingHorizontal: 4 },
  quickStepLine: { fontSize: 13, color: '#334155', lineHeight: 19 },

  inputPromptText: { fontSize: 12.5, color: '#64748b', fontWeight: '500' },
  inputWithPasteContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', paddingRight: 6,
  },
  textInputMain: { flex: 1, fontSize: 14, color: '#0f172a', paddingHorizontal: 14, paddingVertical: 12, fontWeight: '600' },
  pasteInlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  pasteInlineBtnText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  addNotesToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  addNotesToggleText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  notesLabel: { fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 4 },

  // ── Pending ──
  pendingContainer: { alignItems: 'center', padding: 12, gap: 16, backgroundColor: "#ffffffe6", borderRadius: 20 },
  pendingIconOuter: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#eff6ff',
    borderWidth: 2, borderColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563eb', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  pendingIconInner: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center',
  },
  pendingBadgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe',
  },
  pendingBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2563eb' },
  pendingBadgePillText: { fontSize: 11, fontWeight: '800', color: '#2563eb', letterSpacing: 0.5 },
  pendingTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center', letterSpacing: -0.4 },
  pendingBody: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 21, paddingHorizontal: 12 },

  timelineCard: {
    width: '100%', backgroundColor: '#ffffff', borderRadius: 18,
    padding: 18, borderWidth: 1, borderColor: '#e2e8f0', gap: 6,
  },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineCheckCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
  },
  timelinePendingCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#eff6ff',
    borderWidth: 1.5, borderColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  timelineFutureCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  timelineStepTitle: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  timelineFutureTitle: { fontSize: 13.5, fontWeight: '700', color: '#94a3b8' },
  timelineStepSub: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  timelineDividerLine: { width: 2, height: 18, backgroundColor: '#e2e8f0', marginLeft: 12, marginVertical: 1 },

  // ── Active Pro Card ──
  activeCard: {
    backgroundColor: '#ffffffe6', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 22, alignItems: 'center', gap: 16, marginTop: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  activeIconOuter: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#a7f3d0', marginBottom: 2,
  },
  activeTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  activeSubtitle: { fontSize: 13.5, color: '#64748b', textAlign: 'center', lineHeight: 19 },
  activeDetailsBox: {
    width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16,
    gap: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  activeDetailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeDetailLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeDetailValue: { fontSize: 13.5, color: '#0f172a', fontWeight: '700' },
  activeBadge: {
    backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: '#10b981',
  },
  activeBadgeText: { color: '#059669', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  unlockedFeaturesBox: {
    width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16,
    gap: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  unlockedTitle: { fontSize: 13.5, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIconCircle: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center',
  },
  unlockedFeatureName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  unlockedFeatureDesc: { fontSize: 11.5, color: '#64748b' },
  renewNoteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#eff6ff', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#bfdbfe', width: '100%',
  },
  renewNoteText: { flex: 1, fontSize: 12, color: '#2563eb', fontWeight: '600', lineHeight: 17 },
});
