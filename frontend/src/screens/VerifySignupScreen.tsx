import { AxiosError } from 'axios';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';

import api from '../services/api';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    currentBalance: number;
  };
};

type ApiError = {
  message?: string;
};

type VerifySignupRouteParams = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

export default function VerifySignupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { name, email, password, phone } = (route.params || {}) as VerifySignupRouteParams;

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [otpExpired, setOtpExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const otpString = otpDigits.join('');

  const requestOtp = async (showTimer = true) => {
    setOtpSending(true);
    try {
      const res = await api.post('/auth/send-signup-otp', { email: email.trim().toLowerCase() });
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpired(false);
      if (showTimer) setOtpTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
      if (res.data?.emailDelivered === false) {
        setErrorModal({ visible: true, title: 'Email Not Delivered', message: 'The verification code could not be emailed to you right now. Please try again in a few minutes or contact support.' });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setErrorModal({ visible: true, title: 'Failed', message: axiosError.response?.data?.message || 'Could not send verification code' });
    } finally {
      setOtpSending(false);
    }
  };

  useEffect(() => {
    if (!isFocused) return;
    const check = async () => {
      try {
        const res = await api.get(`/auth/check-signup-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        if (res.data.otpExists) {
          setOtpDigits(['', '', '', '', '', '']);
          setOtpExpired(false);
          setOtpTimer(60);
        } else {
          await requestOtp(true);
        }
      } catch {
        await requestOtp(true);
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (hasStartedRef.current) {
      setOtpExpired(true);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpTimer]);

  useEffect(() => {
    if (otpTimer === 60) hasStartedRef.current = true;
  }, [otpTimer]);

  const handleOtpDigitChange = useCallback((text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpKeyPress = useCallback((e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newOtp = [...otpDigits];
      newOtp[index - 1] = '';
      setOtpDigits(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  const handleVerify = async () => {
    if (otpString.length !== 6) {
      setErrorModal({ visible: true, title: 'Code Required', message: 'Please enter the full 6-digit verification code sent to your email.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        otp: otpString,
      });

      setSuccessModal({ visible: true, title: 'Account Created!', message: 'Account created. Redirecting to login...' });
      setTimeout(() => {
        setSuccessModal({ visible: false, title: '', message: '' });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login', params: { email: email.trim().toLowerCase(), password } }],
        });
      }, 1200);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setErrorModal({ visible: true, title: 'Registration Failed', message: axiosError.response?.data?.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.hero}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>📈</Text>
          </View>
          <Text style={styles.brandName}>Verify Your Email</Text>
          <Text style={styles.brandTagline}>We sent a 6-digit code to {email.trim().toLowerCase()}</Text>
        </View>

        <ScrollView
          style={styles.formWrapper}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.verifyCard}>
              <View style={styles.verifyHeader}>
                <View style={styles.verifyIconWrap}>
                  <Text style={styles.verifyIcon}>✉</Text>
                </View>
                <View style={styles.verifyHeaderText}>
                  <Text style={styles.verifyTitle}>Email Verification</Text>
                  <Text style={styles.verifySubtitle}>
                    {otpSending
                      ? 'Sending code...'
                      : `Code sent to ${email.trim().toLowerCase()}`}
                  </Text>
                </View>
                {!otpSending && (
                  <View style={styles.verifyStatusBadge}>
                    <Text style={styles.verifyStatusText}>Sent</Text>
                  </View>
                )}
              </View>

              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { otpRefs.current[index] = ref; }}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={text => handleOtpDigitChange(text, index)}
                    onKeyPress={e => handleOtpKeyPress(e, index)}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                    ]}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {otpExpired && (
                <Text style={styles.expiredText}>
                  This code has expired. Please request a new code.
                </Text>
              )}

              <Pressable
                onPress={() => requestOtp()}
                disabled={otpSending || otpTimer > 0}
                style={styles.resendRow}
              >
                <Text style={styles.resendText}>
                  {otpSending ? 'Sending...' : otpTimer > 0
                    ? `Resend code in ${otpTimer}s`
                    : otpExpired
                      ? 'Request new code'
                      : 'Resend code'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              disabled={isLoading}
              onPress={handleVerify}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>
                Wrong details?{' '}
                <Text style={styles.switchLink}>Go back and edit</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        buttonText="Continue"
        onClose={() => setSuccessModal({ ...successModal, visible: false })}
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
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
    justifyContent: 'flex-end',
  },

  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  formWrapper: {
    maxHeight: '62%',
  },
  formContent: {
    flexGrow: 1,
  },

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

  verifyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 8,
  },
  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  verifyIcon: {
    fontSize: 16,
  },
  verifyHeaderText: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifySubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  verifyStatusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  expiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },

  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
  },

  resendRow: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },

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

  switchRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  switchLink: {
    color: '#0EA5E9',
    fontWeight: '700',
  },
});