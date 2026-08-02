import { AxiosError } from 'axios';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
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

export default function RegisterScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [signupBonus, setSignupBonus] = useState(0);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const otpString = otpDigits.join('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSignupBonus(res.data.signupBonus || 0);
      } catch { }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!email.trim()) { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); setOtpVerified(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-signup-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        if (res.data.otpExists) {
          setOtpSent(true);
          setOtpTimer(0);
        }
      } catch { }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

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
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpTimer]);

  const handleOtpDigitChange = useCallback((text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);
    setOtpVerified(false);
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

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrorModal({ visible: true, title: 'Email Required', message: 'Please enter your email first.' });
      return;
    }
    setOtpSending(true);
    try {
      const res = await api.post('/auth/send-signup-otp', { email: email.trim().toLowerCase() });
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpVerified(false);
      setOtpTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setErrorModal({ visible: true, title: 'Missing Fields', message: 'Please fill all fields before registering.' });
      return;
    }
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
        navigation.navigate('Login', { email: email.trim().toLowerCase(), password });
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
          <Text style={styles.brandName}>SmartInvest</Text>
          <Text style={styles.brandTagline}>Start your investment journey</Text>
        </View>

        <ScrollView
          style={styles.formWrapper}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Fill in your details to get started</Text>

            {signupBonus > 0 && (
              <View style={styles.bonusBanner}>
                <Text style={styles.bonusIcon}>🎁</Text>
                <View style={styles.bonusTextWrapper}>
                  <Text style={styles.bonusTitle}>Signup Bonus!</Text>
                  <Text style={styles.bonusSubtitle}>Get Rs. {signupBonus.toLocaleString('en-PK')} credited instantly when you create your account.</Text>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={name}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.verifyCard}>
              <View style={styles.verifyHeader}>
                <View style={styles.verifyIconWrap}>
                  <Text style={styles.verifyIcon}>✉</Text>
                </View>
                <View style={styles.verifyHeaderText}>
                  <Text style={styles.verifyTitle}>Email Verification</Text>
                  <Text style={styles.verifySubtitle}>
                    {otpSent
                      ? `Code sent to ${email.trim().toLowerCase()}`
                      : 'Verify your email address'}
                  </Text>
                </View>
                {otpSent && (
                  <View style={styles.verifyStatusBadge}>
                    <Text style={styles.verifyStatusText}>Sent</Text>
                  </View>
                )}
              </View>

              {!otpSent ? (
                <Pressable
                  onPress={handleSendOtp}
                  disabled={otpSending || !email.trim()}
                  style={[styles.sendOtpButton, (otpSending || !email.trim()) && styles.sendOtpButtonDisabled]}
                >
                  {otpSending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.sendOtpButtonText}>Send Verification Code</Text>
                  )}
                </Pressable>
              ) : (
                <>
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

                  <Pressable
                    onPress={handleSendOtp}
                    disabled={otpSending || otpTimer > 0}
                    style={styles.resendRow}
                  >
                    <Text style={styles.resendText}>
                      {otpSending ? 'Sending...' : otpTimer > 0
                        ? `Resend code in ${otpTimer}s`
                        : 'Resend code'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Create a secure password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="03XXXXXXXXX"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={phone}
              />
              <Text style={styles.phoneWarning}>Enter your correct phone number. You will not be able to change it later. We will use it for payments and withdrawals.</Text>
            </View>

            <Pressable
              disabled={isLoading}
              onPress={handleRegister}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.switchRow}
            >
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={styles.switchLink}>Sign in</Text>
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
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },

  formWrapper: {
    maxHeight: '70%',
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
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 24,
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
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },

  // Email Verification Card
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

  sendOtpButton: {
    borderRadius: 10,
    backgroundColor: '#0F172A',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpButtonDisabled: {
    opacity: 0.5,
  },
  sendOtpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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

  // Bonus Banner
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  bonusIcon: {
    fontSize: 24,
  },
  bonusTextWrapper: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  bonusSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#047857',
    lineHeight: 16,
  },
  phoneWarning: {
    fontSize: 11,
    fontWeight: '400',
    color: '#DC2626',
    lineHeight: 15,
    marginTop: 4,
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
