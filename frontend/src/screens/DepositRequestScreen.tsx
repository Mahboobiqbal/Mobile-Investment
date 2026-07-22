import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AxiosError } from 'axios';

import { walletApi, type InvestmentPlan } from '../services/api/walletApi';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

interface ApiErrorResponse {
  message?: string;
}

type DepositRoute = RouteProp<
  { DepositRequest: { selectedPlanId?: string; selectedPlanName?: string; investmentAmount?: number } | undefined },
  'DepositRequest'
>;

const isPlanPurchase = (selectedPlanId?: string) => Boolean(selectedPlanId);

export default function DepositRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<DepositRoute>();
  const { userData } = useAuth();

  const selectedPlanId = route.params?.selectedPlanId;
  const selectedPlanName = route.params?.selectedPlanName;
  const investmentAmount = route.params?.investmentAmount;

  const [amount, setAmount] = useState(investmentAmount ? String(investmentAmount) : '');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ visible: false });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    if (selectedPlanId) {
      const fetchPlan = async () => {
        setPlanLoading(true);
        try {
          const response = await walletApi.getPlans();
          const foundPlan = response.data.plans.find((p: InvestmentPlan) => p._id === selectedPlanId);
          setPlan(foundPlan || null);
        } catch (error) {
          console.error('Failed to fetch plan:', error);
        } finally {
          setPlanLoading(false);
        }
      };
      fetchPlan();
    }
  }, [selectedPlanId]);

  const validateForm = useCallback(() => {
    if (!amount.trim()) {
      Alert.alert('Missing Amount', 'Please enter an amount to deposit.');
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return false;
    }

    if (plan && numAmount < plan.minInvestment) {
      Alert.alert('Invalid Amount', `Minimum investment for this plan is Rs. ${plan.minInvestment.toLocaleString('en-PK')}.`);
      return false;
    }

    if (plan && plan.maxInvestment && numAmount > plan.maxInvestment) {
      Alert.alert('Invalid Amount', `Maximum investment for this plan is Rs. ${plan.maxInvestment.toLocaleString('en-PK')}.`);
      return false;
    }

    if (!transactionId.trim()) {
      Alert.alert('Missing Transaction ID', 'Please enter your Easypaisa or bank transaction ID.');
      return false;
    }

    return true;
  }, [amount, transactionId, plan]);

  const handleSubmitDeposit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const numAmount = parseFloat(amount);

      await walletApi.deposit({
        amount: numAmount,
        transactionId: transactionId.trim(),
        transactionType: isPlanPurchase(selectedPlanId) ? 'plan' : 'deposit',
        planId: selectedPlanId,
        planName: selectedPlanName,
        investmentAmount: isPlanPurchase(selectedPlanId) ? (investmentAmount || numAmount) : 0,
      });

      setSuccessModal({ visible: true });
      setAmount('');
      setTransactionId('');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to submit deposit. Please try again.';

      setErrorModal({
        visible: true,
        title: 'Deposit Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, investmentAmount, selectedPlanId, selectedPlanName, transactionId, validateForm]);

  const formatCurrency = (amt: number) =>
    `Rs. ${amt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const dailyReturn = plan && amount ? parseFloat(amount) * plan.dailyReturnRate : 0;
  const weeklyReturn = dailyReturn * 7;
  const monthlyReturn = dailyReturn * 30;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Deposit Funds</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {planLoading && (
            <View style={styles.loadingPlan}>
              <ActivityIndicator size="small" color="#0EA5E9" />
            </View>
          )}

          {selectedPlanName && plan && (
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planBadge}>SELECTED PLAN</Text>
                <Text style={styles.planName}>{selectedPlanName}</Text>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planGrid}>
                <View style={styles.planGridItem}>
                  <Text style={styles.planGridLabel}>Daily ROI</Text>
                  <Text style={styles.planGridValue}>{(plan.dailyReturnRate * 100).toFixed(2)}%</Text>
                </View>
                <View style={styles.planGridItem}>
                  <Text style={styles.planGridLabel}>Monthly ROI</Text>
                  <Text style={styles.planGridValue}>{(plan.dailyReturnRate * 30 * 100).toFixed(2)}%</Text>
                </View>
              </View>
              {amount && parseFloat(amount) > 0 && (
                <>
                  <View style={styles.planDivider} />
                  <View style={styles.planProjection}>
                    <Text style={styles.planProjectionTitle}>Projected Returns</Text>
                    <View style={styles.planProjectionRow}>
                      <Text style={styles.planProjectionLabel}>Daily</Text>
                      <Text style={styles.planProjectionValue}>{formatCurrency(dailyReturn)}</Text>
                    </View>
                    <View style={styles.planProjectionRow}>
                      <Text style={styles.planProjectionLabel}>Weekly</Text>
                      <Text style={styles.planProjectionValue}>{formatCurrency(weeklyReturn)}</Text>
                    </View>
                    <View style={styles.planProjectionRow}>
                      <Text style={styles.planProjectionLabel}>Monthly</Text>
                      <Text style={styles.planProjectionValue}>{formatCurrency(monthlyReturn)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <Text style={styles.bankIcon}>🏦</Text>
              <Text style={styles.bankTitle}>Bank Account Details</Text>
            </View>
            <View style={styles.bankBody}>
              <View style={styles.bankDetail}>
                <Text style={styles.bankDetailLabel}>Account Name</Text>
                <Text style={styles.bankDetailValue}>Invest In Trees Pvt Ltd</Text>
              </View>
              <View style={styles.bankSeparator} />
              <View style={styles.bankDetail}>
                <Text style={styles.bankDetailLabel}>Account Number</Text>
                <Text style={styles.bankDetailValue}>0300-1234567</Text>
              </View>
            </View>
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>How to Deposit</Text>
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <Text style={styles.stepText}>Transfer funds to our business account via Easypaisa or Bank Transfer</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
                <Text style={styles.stepText}>Enter the transaction ID and amount details below</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>3</Text>
                </View>
                <Text style={styles.stepText}>Submit your request for admin verification</Text>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Transaction Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (Rs.)</Text>
              <TextInput
                style={[styles.input, investmentAmount && styles.inputDisabled]}
                placeholder={investmentAmount ? `Pre-filled: ${formatCurrency(investmentAmount)}` : '0.00'}
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={!isSubmitting && !investmentAmount}
              />
              {investmentAmount ? (
                <Text style={styles.inputHint}>Amount pre-filled from plan selection</Text>
              ) : (
                <Text style={styles.inputHint}>Minimum deposit: Rs. 500</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transaction ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. DP123456789"
                placeholderTextColor="#94A3B8"
                value={transactionId}
                onChangeText={setTransactionId}
                editable={!isSubmitting}
              />
              <Text style={styles.inputHint}>Enter the Easypaisa or bank transfer reference number</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.submitButton,
              (isSubmitting || !amount.trim() || !transactionId.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitDeposit}
            disabled={isSubmitting || !amount.trim() || !transactionId.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Deposit Request</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={successModal.visible}
        title="Deposit Submitted!"
        message="Your balance will update automatically as soon as the admin verifies your transaction ID."
        autoCloseMs={2500}
        onClose={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        }
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 36,
  },

  // Scroll
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },

  // Plan summary card
  loadingPlan: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  planHeader: {
    marginBottom: 12,
  },
  planBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  planDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  planGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  planGridItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  planGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  planGridValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  planProjection: {},
  planProjectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  planProjectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  planProjectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  planProjectionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Bank account card
  bankCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#0F172A',
  },
  bankIcon: {
    fontSize: 18,
  },
  bankTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bankBody: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  bankDetail: {
    paddingVertical: 8,
  },
  bankDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bankDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Steps card
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  stepsList: {},
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 19,
  },
  stepConnector: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginLeft: 11.5,
    marginVertical: 4,
  },

  // Form section
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  inputHint: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 6,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
