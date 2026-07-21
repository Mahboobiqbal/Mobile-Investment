import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { walletApi, type InvestmentPlan } from '../services/api/walletApi';

type TermsRoute = RouteProp<{ TermsCondition: { selectedPlanId: string; selectedPlanName: string; investmentAmount?: number } }, 'TermsCondition'>;

export default function TermsConditionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<TermsRoute>();
  const selectedPlanId = useMemo(() => route.params?.selectedPlanId, [route.params]);
  const selectedPlanName = useMemo(() => route.params?.selectedPlanName, [route.params]);
  const initialInvestmentAmount = useMemo(() => route.params?.investmentAmount, [route.params]);

  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState<string>(initialInvestmentAmount ? String(initialInvestmentAmount) : '');
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlan = async () => {
      try {
        setPlanLoading(true);
        const response = await walletApi.getPlans();
        const foundPlan = response.data.plans.find((p: InvestmentPlan) => p._id === selectedPlanId);
        if (isMounted) {
          setPlan(foundPlan || null);
        }
      } catch (error) {
        console.error('Failed to fetch plan details:', error);
        if (isMounted) setPlan(null);
      } finally {
        if (isMounted) setPlanLoading(false);
      }
    };
    fetchPlan();
    return () => { isMounted = false; };
  }, [selectedPlanId]);

  const validateAmount = useCallback(() => {
    if (!plan) return true;
    const amount = parseFloat(investmentAmount);
    if (!investmentAmount.trim()) {
      setAmountError('Please enter an investment amount');
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    if (amount < plan.minInvestment) {
      setAmountError(`Minimum investment is Rs. ${plan.minInvestment.toLocaleString('en-PK')}`);
      return false;
    }
    if (plan.maxInvestment && amount > plan.maxInvestment) {
      setAmountError(`Maximum investment is Rs. ${plan.maxInvestment.toLocaleString('en-PK')}`);
      return false;
    }
    setAmountError(null);
    return true;
  }, [investmentAmount, plan]);

  const handleToggleAgree = useCallback(() => setHasAgreed((v) => !v), []);

  const handleContinue = useCallback(() => {
    if (!hasAgreed || !selectedPlanId) {
      return;
    }
    if (!validateAmount()) {
      return;
    }

    const amount = parseFloat(investmentAmount);

    navigation.navigate('DepositRequest', {
      selectedPlanId,
      selectedPlanName,
      investmentAmount: amount,
    });
  }, [hasAgreed, navigation, selectedPlanId, investmentAmount, validateAmount]);

  const formatCurrency = (amount: number) =>
    `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const dailyReturn = plan && investmentAmount ? parseFloat(investmentAmount) * plan.dailyReturnRate : 0;
  const weeklyReturn = dailyReturn * 7;
  const monthlyReturn = dailyReturn * 30;

  if (planLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00A86B" size="large" />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0 }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topSection}>
            <Text style={styles.title}>Platform Terms of Service</Text>
            <Text style={styles.subtitle}>
              Please review our legal guidelines, daily ROI distribution rules, and transfer windows carefully.
            </Text>
            {selectedPlanName ? (
              <View style={styles.selectedPlanPill}>
                <Text style={styles.selectedPlanText}>{selectedPlanName}</Text>
              </View>
            ) : null}

            {plan && (
              <View style={styles.planDetailsCard}>
                <Text style={styles.planDetailTitle}>Plan Details</Text>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Daily Return Rate</Text>
                  <Text style={styles.planDetailValue}>{(plan.dailyReturnRate * 100).toFixed(2)}%</Text>
                </View>
                <View style={styles.planDetailRow}>
                  <Text style={styles.planDetailLabel}>Minimum Investment</Text>
                  <Text style={styles.planDetailValue}>{formatCurrency(plan.minInvestment)}</Text>
                </View>
                {plan.maxInvestment && (
                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>Maximum Investment</Text>
                    <Text style={styles.planDetailValue}>{formatCurrency(plan.maxInvestment)}</Text>
                  </View>
                )}
                {plan.description && (
                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>Description</Text>
                    <Text style={styles.planDetailValueDesc}>{plan.description}</Text>
                  </View>
                )}
              </View>
            )}

            {!initialInvestmentAmount && plan && (
              <View style={styles.investmentInputCard}>
                <Text style={styles.investmentInputTitle}>Enter Investment Amount</Text>
                <TextInput
                  style={styles.investmentInput}
                  placeholder={`Min: ${formatCurrency(plan.minInvestment)}${plan.maxInvestment ? ` • Max: ${formatCurrency(plan.maxInvestment)}` : ''}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={investmentAmount}
                  onChangeText={(text) => { setInvestmentAmount(text); setAmountError(null); }}
                  editable={!submitting}
                />
                {amountError && <Text style={styles.amountErrorText}>{amountError}</Text>}
                <View style={styles.roiPreview}>
                  <Text style={styles.roiPreviewLabel}>Projected Returns</Text>
                  <View style={styles.roiPreviewRow}>
                    <Text style={styles.roiPreviewItemLabel}>Daily</Text>
                    <Text style={styles.roiPreviewItemValue}>{formatCurrency(dailyReturn)}</Text>
                  </View>
                  <View style={styles.roiPreviewRow}>
                    <Text style={styles.roiPreviewItemLabel}>Weekly</Text>
                    <Text style={styles.roiPreviewItemValue}>{formatCurrency(weeklyReturn)}</Text>
                  </View>
                  <View style={styles.roiPreviewRow}>
                    <Text style={styles.roiPreviewItemLabel}>Monthly</Text>
                    <Text style={styles.roiPreviewItemValue}>{formatCurrency(monthlyReturn)}</Text>
                  </View>
                </View>
              </View>
            )}

            {initialInvestmentAmount && plan && (
              <View style={styles.investmentSummaryCard}>
                <Text style={styles.investmentSummaryTitle}>Investment Summary</Text>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>Investment Amount</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(initialInvestmentAmount)}</Text>
                </View>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>Daily Return</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(dailyReturn)}</Text>
                </View>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>Weekly Return</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(weeklyReturn)}</Text>
                </View>
                <View style={styles.investmentSummaryRow}>
                  <Text style={styles.investmentSummaryLabel}>Monthly Return</Text>
                  <Text style={styles.investmentSummaryValue}>{formatCurrency(monthlyReturn)}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.termsCardWrapper}>
            <View style={styles.termsCard}>
              <ScrollView contentContainerStyle={styles.termsScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.termSection}>
                  <Text style={styles.termTitle}>1. Capital Protection & Investment Cycles</Text>
                  <Text style={styles.termBullet}>• Daily return engine runs according to the selected wealth tier and is applied once per 24-hour cycle.</Text>
                  <Text style={styles.termBullet}>• Estimated returns are displayed in-app and are subject to platform rules and market conditions.</Text>
                  <Text style={styles.termBullet}>• Principal is tracked separately from accrued returns; plan-specific minimums apply.</Text>
                </View>

                <View style={styles.termSection}>
                  <Text style={styles.termTitle}>2. Secure Withdrawal Processing</Text>
                  <Text style={styles.termBullet}>• Withdrawal requests undergo identity verification and anti-fraud checks before processing.</Text>
                  <Text style={styles.termBullet}>• Transfers are executed during predefined banking windows; expect 1-5 business days for settlement.</Text>
                  <Text style={styles.termBullet}>• Rapid mobile wallet transfers may require additional confirmation if flagged by our monitoring systems.</Text>
                </View>

                <View style={styles.termSection}>
                  <Text style={styles.termTitle}>3. Anti-Fraud Policy</Text>
                  <Text style={styles.termBullet}>• Duplicate system accounts and synthetic identity attempts are strictly prohibited.</Text>
                  <Text style={styles.termBullet}>• Suspected fraudulent activity will result in temporary holds and an investigation by our security team.</Text>
                  <Text style={styles.termBullet}>• Repeated violations may lead to account termination and legal action where applicable.</Text>
                </View>

                <View style={styles.termSectionSmall}>
                  <Text style={styles.smallNoteTitle}>Contact & Support</Text>
                  <Text style={styles.smallNote}>For support, contact: support@investmentapp.com</Text>
                </View>
              </ScrollView>
            </View>
          </View>

          <Pressable style={styles.agreeRow} onPress={handleToggleAgree} hitSlop={8}>
            <View style={[styles.checkbox, hasAgreed && styles.checkboxActive]}>
              {hasAgreed ? <View style={styles.checkboxInner} /> : null}
            </View>
            <Text style={styles.agreeText}>I have read, understood, and accept the platform investment terms.</Text>
          </Pressable>

          <View style={styles.footerSpacer} />
        </ScrollView>

        <View style={styles.stickyFooter} pointerEvents={hasAgreed && !planLoading && (!!initialInvestmentAmount || !!investmentAmount.trim()) ? 'auto' : 'box-none'}>
          <Pressable
            style={[styles.continueButton, (!hasAgreed || submitting || planLoading || (!initialInvestmentAmount && !investmentAmount.trim())) && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!hasAgreed || submitting || planLoading || (!initialInvestmentAmount && !investmentAmount.trim())}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.continueText, !hasAgreed && styles.continueTextDisabled]}>Agree & Continue</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  selectedPlanPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E6EEF7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  planDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  planDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  planDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  planDetailValueDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },

  investmentInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  investmentInputTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  investmentInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  amountErrorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 12,
  },
  roiPreview: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  roiPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#052E16',
    marginBottom: 8,
  },
  roiPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  roiPreviewItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  roiPreviewItemValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  investmentSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  investmentSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#052E16',
    marginBottom: 12,
  },
  investmentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  investmentSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  investmentSummaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  termsCardWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  termsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 12,
    elevation: 4,
  },
  termsScrollContent: {
    paddingBottom: 24,
  },
  termSection: {
    marginBottom: 18,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  termBullet: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 20,
  },
  termSectionSmall: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
  },
  smallNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  smallNote: {
    fontSize: 12,
    color: '#475569',
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#00A86B',
    backgroundColor: '#ECFDF6',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#00A86B',
    borderRadius: 2,
  },
  agreeText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
  },

  footerSpacer: {
    height: 84,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 20,
  },
  continueButton: {
    width: width - 40,
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: '#94A3B8',
  },
});