import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { authApi } from '../services/api/authApi';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ForgotPasswordRoute = RouteProp<RootStackParamList, 'ForgotPassword'>;
type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ForgotPasswordRoute>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. Please try again in a moment.';
    }

    if (axiosError.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    return axiosError.message || fallback;
  };

  const handleRequestOtp = async () => {
    if (!normalizedEmail) {
      Alert.alert('Email Required', 'Please enter your account email.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: normalizedEmail });
      setStep('otp');
      Alert.alert('Check Your Email', 'If this email is registered, a reset OTP has been sent.');
    } catch (error) {
      Alert.alert('Reset Failed', getErrorMessage(error, 'Unable to request password reset.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('OTP Required', 'Please enter the OTP sent to your email.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp({ email: normalizedEmail, otp: otp.trim() });
      setResetToken(response.data.resetToken);
      setStep('password');
    } catch (error) {
      Alert.alert('Invalid OTP', getErrorMessage(error, 'Unable to verify OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please confirm the same password.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: normalizedEmail,
        resetToken,
        newPassword,
      });
      Alert.alert('Password Reset', 'Your password has been updated. Please log in with your new password.', [
        {
          text: 'Login',
          onPress: () => navigation.navigate('Login', { email: normalizedEmail }),
        },
      ]);
    } catch (error) {
      Alert.alert('Reset Failed', getErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setIsLoading(false);
    }
  };

  const primaryAction =
    step === 'email' ? handleRequestOtp : step === 'otp' ? handleVerifyOtp : handleResetPassword;
  const buttonText = step === 'email' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Reset Password';
  const subtitle =
    step === 'email'
      ? 'Enter your email and we will send a reset OTP if the account exists.'
      : step === 'otp'
        ? 'Enter the OTP from your email. It expires after 10 minutes.'
        : 'Choose a new password for your account.';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.hero}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>🔐</Text>
          </View>
          <Text style={styles.brandName}>Reset Password</Text>
          <Text style={styles.brandTagline}>{subtitle}</Text>
        </View>

        <ScrollView
          style={styles.formWrapper}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.stepRow}>
              {(['email', 'otp', 'password'] as Step[]).map((item, index) => {
                const isActive = step === item;
                const isDone = ['email', 'otp', 'password'].indexOf(step) > index;
                const stepLabels = ['Email', 'Verify', 'Reset'];
                return (
                  <View key={item} style={styles.stepItem}>
                    <View style={[styles.stepDot, (isActive || isDone) && styles.stepDotActive, isDone && styles.stepDotDone]}>
                      <Text style={[styles.stepNumber, (isActive || isDone) && styles.stepNumberActive]}>
                        {isDone ? '✓' : index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.stepLabel, (isActive || isDone) && styles.stepLabelActive]}>
                      {stepLabels[index]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={step === 'email'}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                style={[styles.input, step !== 'email' && styles.inputDisabled]}
                value={email}
              />
            </View>

            {step !== 'email' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OTP</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, step === 'password' && styles.inputDisabled]}
                  value={otp}
                  editable={step === 'otp'}
                />
              </View>
            )}

            {step === 'password' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    onChangeText={setNewPassword}
                    placeholder="Create a new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    value={newPassword}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    value={confirmPassword}
                  />
                </View>
              </>
            )}

            <Pressable
              disabled={isLoading}
              onPress={primaryAction}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>{buttonText}</Text>
              )}
            </Pressable>

            {step === 'otp' && (
              <Pressable
                disabled={isLoading}
                onPress={handleRequestOtp}
                hitSlop={8}
                style={styles.secondaryRow}
              >
                <Text style={styles.secondaryText}>Resend OTP</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'flex-end',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandIcon: {
    fontSize: 28,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  // Form wrapper
  formWrapper: {
    maxHeight: '65%',
  },
  formContent: {
    flexGrow: 1,
  },

  // Form card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 28,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepDotDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Input
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
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#94A3B8',
  },

  // Button
  primaryButton: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Secondary
  secondaryRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
  },
});
