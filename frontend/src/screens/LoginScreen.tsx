import { AxiosError } from 'axios';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorModal({ visible: true, title: 'Missing Fields', message: 'Please enter your email and password.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;
      await login(token, user);

      setSuccessModal({ visible: true, title: 'Welcome Back!', message: 'Login successful. Redirecting...' });
      setTimeout(() => {
        setSuccessModal({ visible: false, title: '', message: '' });
        navigation.navigate('PlanSelection');
      }, 1500);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setErrorModal({ visible: true, title: 'Login Failed', message: axiosError.response?.data?.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  // Prefill credentials if navigated from Register
  const route = useRoute<any>();
  useEffect(() => {
    const params = route.params as { email?: string; password?: string } | undefined;
    if (params?.email) setEmail(params.email);
    if (params?.password) setPassword(params.password);
  }, [route.params]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your wallet dashboard.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <Pressable disabled={isLoading} onPress={handleLogin} style={[styles.button, isLoading && styles.buttonDisabled]}>
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Login</Text>}
          </Pressable>

          <Pressable style={styles.signUpRow} onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.signUpText}>Don't have an account? <Text style={styles.signUpLink}>Sign up</Text></Text>
          </Pressable>
        </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
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
  signUpRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#64748B',
    fontSize: 13,
  },
  signUpLink: {
    color: '#0EA5E9',
    fontWeight: '700',
  },
});
