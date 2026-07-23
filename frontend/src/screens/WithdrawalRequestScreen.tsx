import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

const QUICK_AMOUNTS = [25, 50, 75, 100];

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

  const handleQuickAmount = (percent: number) => {
    const calculated = Math.floor((availableBalance - 500) * (percent / 100));
    const finalAmount = percent === 100 ? Math.max(0, availableBalance - 500) : calculated;
    setAmount(String(Math.max(0, finalAmount)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
          </View>

          {eligibilityLoading ? (
            <View style={styles.statusLoading}>
              <ActivityIndicator size="small" color="#0EA5E9" />
            </View>
          ) : eligible ? (
            <View style={styles.statusCardSuccess}>
              <Text style={styles.statusIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Withdrawals Available</Text>
                <Text style={styles.statusText}>
                  Your account meets the 30-day maturity requirement.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statusCardWarning}>
              <Text style={styles.statusIcon}>!</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>30-Day Withdrawal Lock</Text>
                <Text style={styles.statusText}>
                  {daysLeft > 0
                    ? `Please wait ${daysLeft} more day(s) after your first deposit.`
                    : 'A deposit is required before withdrawal.'}
                </Text>
              </View>
            </View>
          )}

          {availableBalance <= 500 && (
            <View style={styles.alertWarning}>
              <Text style={styles.alertWarningText}>
                Withdrawals are disabled until your balance exceeds Rs. 500.
              </Text>
            </View>
          )}

          {withdrawalWouldDropBelowMinimum && !(availableBalance <= 500) && (
            <View style={styles.alertWarning}>
              <Text style={styles.alertWarningText}>
                This withdrawal would reduce your balance below the Rs. 500 minimum.
              </Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Withdrawal Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!isSubmitting}
            />
            <Text style={styles.inputHint}>
              Max: {formatCurrency(availableBalance)}
            </Text>

            {availableBalance > 500 && (
              <>
                <Text style={styles.quickLabel}>Quick Select</Text>
                <View style={styles.quickRow}>
                  {QUICK_AMOUNTS.map((pct) => {
                    const active = numAmount > 0 && Math.abs(numAmount - Math.floor((availableBalance - 500) * (pct / 100))) < 10;
                    return (
                      <Pressable
                        key={pct}
                        style={[styles.quickButton, active && styles.quickButtonActive]}
                        onPress={() => handleQuickAmount(pct)}
                      >
                        <Text style={[styles.quickButtonText, active && styles.quickButtonTextActive]}>
                          {pct}%
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Balance</Text>
              <Text style={styles.summaryValue}>{formatCurrency(availableBalance)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Withdrawal Amount</Text>
              <Text style={[styles.summaryValue, numAmount > 0 && { color: '#DC2626' }]}>
                {numAmount > 0 ? `-${formatCurrency(numAmount)}` : '—'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance After Withdrawal</Text>
              <Text style={[styles.summaryValueBold, remainingBalance <= 500 && { color: '#DC2626' }]}>
                {formatCurrency(remainingBalance)}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Mobile Wallet</Text>
                <Text style={styles.detailValue}>{userData?.phone || 'No phone registered'}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⏱️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Processing Time</Text>
                <Text style={styles.detailValue}>1-5 business days after admin approval</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
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

      <SuccessModal
        visible={successModal.visible}
        title="Withdrawal Requested!"
        message="Funds are being processed and will be transferred to your mobile wallet shortly upon admin authorization."
        autoCloseMs={2500}
        onClose={() => navigation.goBack()}
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

  // Balance card
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Status cards
  statusLoading: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusCardWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 16,
    fontWeight: '800',
    overflow: 'hidden',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 16,
  },

  // Alert warning
  alertWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
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
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },

  // Quick select
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickButtonActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  quickButtonTextActive: {
    color: '#FFFFFF',
  },

  // Summary card
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },

  // Detail card
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailIcon: {
    fontSize: 20,
    width: 36,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
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
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
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
