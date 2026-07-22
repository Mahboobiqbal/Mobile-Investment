import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AxiosError } from 'axios';

import { walletApi } from '../services/api/walletApi';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

interface ApiErrorResponse {
  message?: string;
}

export default function WithdrawalRequestScreen() {
  const navigation = useNavigation();
  const { userData, refreshUserData } = useAuth();

  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  const [successModal, setSuccessModal] = useState({ visible: false });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const availableBalance = useMemo(() => userData?.currentBalance ?? 0, [userData]);

  useFocusEffect(
    useCallback(() => {
      refreshUserData();
      const checkEligibility = async () => {
        try {
          setEligibilityLoading(true);
          const res = await walletApi.checkWithdrawalEligibility();
          setEligible(res.data.eligible);
          setDaysLeft(res.data.daysLeft);
        } catch {
          setEligible(false);
          setDaysLeft(30);
        } finally {
          setEligibilityLoading(false);
        }
      };
      checkEligibility();
    }, [refreshUserData])
  );

  const validateForm = useCallback(() => {
    if (!eligible) {
      Alert.alert('Withdrawal Locked', daysLeft > 0
        ? `Withdrawals are available 30 days after your first approved deposit. Please wait ${daysLeft} more day(s).`
        : 'No approved deposits found. A deposit is required before withdrawal.');
      return false;
    }

    if (!amount.trim()) {
      Alert.alert('Missing Amount', 'Please enter an amount to withdraw.');
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return false;
    }

    if (numAmount > availableBalance) {
      Alert.alert('Insufficient Balance', `Your available balance is Rs. ${availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return false;
    }

    const remainingBalanceAfterWithdrawal = availableBalance - numAmount;

    if (remainingBalanceAfterWithdrawal < 500) {
      Alert.alert(
        'Withdrawal Not Allowed',
        'Your withdrawal cannot reduce the account balance below Rs. 500.'
      );
      return false;
    }

    return true;
  }, [amount, availableBalance, eligible, daysLeft]);

  const handleSubmitWithdrawal = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const numAmount = parseFloat(amount);

      await walletApi.withdraw({
        amount: numAmount,
        targetPhone: userData?.phone || '',
      });

      setSuccessModal({ visible: true });
      setAmount('');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to submit withdrawal. Please try again.';

      setErrorModal({
        visible: true,
        title: 'Withdrawal Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, userData, validateForm, navigation]);

  const formatCurrency = (value: number) =>
    `Rs. ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const numAmount = amount ? parseFloat(amount) : 0;
  const remainingBalance = Math.max(0, availableBalance - numAmount);
  const withdrawalWouldDropBelowMinimum = numAmount > 0 && remainingBalance < 500;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          {/* <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Request Withdrawal</Text>
            <View style={{ width: 30 }} />
          </View> */}

          {/* Balance Info Card */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
            </View>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>💰</Text>
            </View>
          </View>

          {availableBalance <= 500 ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Withdrawals are disabled until your balance is above Rs. 500.
              </Text>
            </View>
          ) : withdrawalWouldDropBelowMinimum ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                This withdrawal would reduce your balance below Rs. 500.
              </Text>
            </View>
          ) : null}

          {/* 30-Day Lock Info */}
          {eligible && (
            <View style={styles.readyBox}>
              <Text style={styles.readyIcon}>✅</Text>
              <View>
                <Text style={styles.readyTitle}>Withdrawals Available</Text>
                <Text style={styles.readyText}>
                  Your account meets the 30-day maturity requirement. You can withdraw your funds.
                </Text>
              </View>
            </View>
          )}
          {!eligible && !eligibilityLoading && (
            <View style={styles.lockBox}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View>
                <Text style={styles.lockTitle}>30-Day Withdrawal Lock</Text>
                <Text style={styles.lockText}>
                  {daysLeft > 0
                    ? `Withdrawals are available 30 days after your first approved deposit. Please wait ${daysLeft} more day(s).`
                    : 'No approved deposits found. A deposit is required before withdrawal.'}
                </Text>
              </View>
            </View>
          )}

          {/* Amount Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Withdrawal Amount (Rs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to withdraw"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!isSubmitting}
            />
            <Text style={styles.fieldHelper}>
              Maximum: {formatCurrency(availableBalance)}
            </Text>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Balance</Text>
              <Text style={styles.summaryValue}>{formatCurrency(availableBalance)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
              <Text style={styles.summaryValue}>{numAmount > 0 ? formatCurrency(numAmount) : '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance After Withdrawal</Text>
              <Text style={[styles.summaryValue, remainingBalance === 0 && styles.zeroBalance]}>
                {formatCurrency(remainingBalance)}
              </Text>
            </View>
          </View>

          {/* Processing Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View>
              <Text style={styles.infoTitle}>Processing Time</Text>
              <Text style={styles.infoText}>
                Your withdrawal will be processed within 1-5 business days after admin approval.
              </Text>
            </View>
          </View>

          {/* Mobile Wallet Info */}
          <View style={styles.phoneBox}>
            <Text style={styles.phoneIcon}>📱</Text>
            <View>
              <Text style={styles.phoneTitle}>Mobile Wallet</Text>
              <Text style={styles.phoneNumber}>
                {userData?.phone || 'No phone number registered'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footerButton}>
          <Pressable
            style={[
              styles.submitButton,
              (isSubmitting || !amount.trim() || withdrawalWouldDropBelowMinimum || availableBalance <= 500 || !eligible) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitWithdrawal}
            disabled={isSubmitting || !amount.trim() || withdrawalWouldDropBelowMinimum || availableBalance <= 500 || !eligible}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Request Withdrawal</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        title="Withdrawal Requested!"
        message="Funds are being processed and will be transferred to your mobile wallet shortly upon admin authorization."
        autoCloseMs={2500}
        onClose={() => navigation.goBack()}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00A86B',
  },
  balanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIconText: {
    fontSize: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  zeroBalance: {
    color: '#EF4444',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
    lineHeight: 15,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 16,
  },
  readyBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  readyIcon: {
    fontSize: 18,
  },
  readyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  readyText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '500',
    lineHeight: 15,
  },
  lockBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 18,
  },
  lockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  lockText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
    lineHeight: 15,
  },
  phoneBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  phoneIcon: {
    fontSize: 18,
  },
  phoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
