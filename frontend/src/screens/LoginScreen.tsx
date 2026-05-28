import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
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

      navigation.replace(user.activePlan && user.activePlan !== 'None' ? 'Dashboard' : 'PlanSelection' as never);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'Something went wrong';
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prefill credentials if navigated from Register
  const route = useRoute<LoginRoute>();
  useEffect(() => {
    if (route.params?.email) setEmail(route.params.email);
    if (route.params?.password) setPassword(route.params.password);
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
