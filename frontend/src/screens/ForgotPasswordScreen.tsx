import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </Pressable>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.stepRow}>
              {(['email', 'otp', 'password'] as Step[]).map((item, index) => (
                <View key={item} style={[styles.stepDot, step === item && styles.stepDotActive]}>
                  <Text style={[styles.stepText, step === item && styles.stepTextActive]}>{index + 1}</Text>
                </View>
              ))}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
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
              <View style={styles.formGroup}>
                <Text style={styles.label}>OTP</Text>
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
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    onChangeText={setNewPassword}
                    placeholder="Create a new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    value={newPassword}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
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

            <Pressable disabled={isLoading} onPress={primaryAction} style={[styles.button, isLoading && styles.buttonDisabled]}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{buttonText}</Text>}
            </Pressable>

            {step === 'otp' && (
              <Pressable disabled={isLoading} onPress={handleRequestOtp} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Resend OTP</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#0EA5E9',
  },
  stepText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '600',
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
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
  },
});
