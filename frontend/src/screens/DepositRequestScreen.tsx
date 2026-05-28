import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AxiosError } from 'axios';

import { walletApi } from '../services/api/walletApi';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

interface ApiErrorResponse {
  message?: string;
}

export default function DepositRequestScreen() {
  const navigation = useNavigation();
  const { userData } = useAuth();

  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successModal, setSuccessModal] = useState({ visible: false });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

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

    if (!transactionId.trim()) {
      Alert.alert('Missing Transaction ID', 'Please enter your Easypaisa or bank transaction ID.');
      return false;
    }

    return true;
  }, [amount, transactionId]);

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
  }, [amount, transactionId, validateForm, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Submit a Deposit</Text>
            <View style={{ width: 30 }} />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Deposit</Text>
            <Text style={styles.infoText}>
              1. Transfer funds to our business account via Easypaisa, JazzCash, or Bank Transfer{'\n'}
              2. Enter the transaction ID and amount below{'\n'}
              3. Submit the deposit request{'\n'}
              4. Wait for admin verification (usually within 24 hours){'\n'}
              5. Your balance updates automatically once approved
            </Text>
          </View>

          {/* Amount Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount (Rs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to deposit"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!isSubmitting}
            />
          </View>

          {/* Transaction ID Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.fieldHelper}>From Easypaisa, JazzCash, or Bank Transfer</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter transaction ID (e.g., DP123456789)"
              placeholderTextColor="#94A3B8"
              value={transactionId}
              onChangeText={setTransactionId}
              editable={!isSubmitting}
            />
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Deposit Amount</Text>
              <Text style={styles.summaryValue}>
                {amount ? `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.statusPending}>Pending Admin Approval</Text>
            </View>
          </View>

          {/* Security Note */}
          <View style={styles.securityBox}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your transaction is secure. Please keep your transaction ID safe for reference.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
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
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
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
    marginBottom: 6,
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
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  statusPending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  securityBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  securityIcon: {
    fontSize: 18,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    lineHeight: 16,
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
