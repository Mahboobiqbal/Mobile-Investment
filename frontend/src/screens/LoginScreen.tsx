import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { authApi } from '../services/api/authApi';
import { useAuth, type UserData } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/AppNavigator';

type LoginRoute = RouteProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        Alert.alert('Login Failed', 'The server did not return a valid session.');
        return;
      }

      const normalizedUser: UserData = {
        id: user.id ?? user._id ?? '',
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'user',
        currentBalance: user.currentBalance ?? 0,
        phone: user.phone,
        activePlan: user.activePlan ?? undefined,
        isVerified: user.isVerified,
        dp: user.dp,
      };

      await login(token, normalizedUser);

      const hasActivePlan = Boolean(
        normalizedUser.activePlan &&
          normalizedUser.activePlan !== 'None' &&
          normalizedUser.activePlan.trim() !== ''
      );
      navigation.reset({
        index: 0,
        routes: [{ name: (hasActivePlan ? 'MainTabs' : 'PlanSelection') as never }],
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'Something went wrong';
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const route = useRoute<LoginRoute>();
  useEffect(() => {
    if (route.params?.email) setEmail(route.params.email);
    if (route.params?.password) setPassword(route.params.password);
  }, [route.params]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.hero}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandIcon}>📈</Text>
          </View>
          <Text style={styles.brandName}>SmartInvest</Text>
          <Text style={styles.brandTagline}>Your trusted investment platform</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to access your dashboard</Text>

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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.input}
              value={password}
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword', { email: email.trim().toLowerCase() })}
            hitSlop={8}
            style={styles.forgotRow}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Register' as never)}
            hitSlop={8}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Create one</Text>
            </Text>
          </Pressable>
        </View>
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
    paddingTop: 40,
    paddingBottom: 32,
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

  // Forgot
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -6,
    marginBottom: 4,
  },
  forgotText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '600',
  },

  // Button
  primaryButton: {
    marginTop: 12,
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

  // Switch
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
