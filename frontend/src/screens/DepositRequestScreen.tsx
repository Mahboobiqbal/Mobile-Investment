import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
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
        <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>

          {/* Plan Summary Card */}
          {selectedPlanName && (
            <View style={styles.planSummaryCard}>
              <Text style={styles.planSummaryTitle}>Selected Plan: {selectedPlanName}</Text>
              {plan && (
                <>
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryLabel}>Daily Return Rate</Text>
                    <Text style={styles.planSummaryValue}>{(plan.dailyReturnRate * 100).toFixed(2)}%</Text>
                  </View>
                  <View style={styles.planSummaryDivider} />
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryLabel}>Investment Amount</Text>
                    <Text style={styles.planSummaryValue}>{formatCurrency(parseFloat(amount) || 0)}</Text>
                  </View>
                  <View style={styles.planSummaryDivider} />
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryLabel}>Projected Daily Return</Text>
                    <Text style={styles.planSummaryValueHighlight}>{formatCurrency(dailyReturn)}</Text>
                  </View>
                  <View style={styles.planSummaryDivider} />
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryLabel}>Projected Weekly Return</Text>
                    <Text style={styles.planSummaryValue}>{formatCurrency(weeklyReturn)}</Text>
                  </View>
                  <View style={styles.planSummaryDivider} />
                  <View style={styles.planSummaryRow}>
                    <Text style={styles.planSummaryLabel}>Projected Monthly Return</Text>
                    <Text style={styles.planSummaryValue}>{formatCurrency(monthlyReturn)}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Deposit</Text>
            <Text style={styles.infoText}>
              1. Transfer funds to our business account via Easypaisa or Bank Transfer{'\n'}
              2. Enter the transaction ID and amount details below{'\n'}
              3. Submit your validation request for admin verification
            </Text>
          </View>

          {/* Business Details Frame */}
          <View style={styles.accountCard}>
            <Text style={styles.accountTitle}>Business Account Details</Text>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Account Name</Text>
              <Text style={styles.accountValue}>Invest In Trees Pvt Ltd</Text>
            </View>
            <View style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Account Number</Text>
              <Text style={styles.accountValue}>0300-1234567</Text>
            </View>
          </View>

          {/* Input Fields Content Block */}
          <View style={styles.formBlock}>
            {/* Amount Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount (Rs.)</Text>
              <TextInput
                style={styles.input}
                placeholder={investmentAmount ? `Pre-filled: ${formatCurrency(investmentAmount)}` : 'Enter amount to deposit'}
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={!isSubmitting && !investmentAmount}
              />
              {investmentAmount && (
                <Text style={styles.prefilledNote}>Amount pre-filled from plan selection</Text>
              )}
            </View>

            {/* Transaction ID Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Transaction ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter transaction ID (e.g., DP123456789)"
                placeholderTextColor="#94A3B8"
                value={transactionId}
                onChangeText={setTransactionId}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Security Alert Frame */}
          <View style={styles.securityBox}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your transaction records are verified via end-to-end cryptographic processing layers securely.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Fixed Process Button */}
        <View style={styles.footerButton}>
          <Pressable
            style={[styles.submitButton, (isSubmitting || !amount.trim() || !transactionId.trim()) && styles.submitButtonDisabled]}
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

      {/* Success Modal */}
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

      {/* Error Modal */}
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
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  planSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  planSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#052E16',
    marginBottom: 12,
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  planSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  planSummaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  planSummaryValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#052E16',
  },
  planSummaryDivider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    fontWeight: '500',
  },
  accountCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  accountTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  accountLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  accountValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'right',
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  formBlock: {
    gap: 10,
    marginBottom: 12,
  },
  formGroup: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  prefilledNote: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  securityBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
    lineHeight: 14,
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
