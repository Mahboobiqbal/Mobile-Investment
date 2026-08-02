import { AxiosError } from 'axios';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import ErrorModal from '../components/ErrorModal';

type ApiError = {
  message?: string;
};

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [signupBonus, setSignupBonus] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSignupBonus(res.data.signupBonus || 0);
      } catch { }
    };
    fetchSettings();
  }, []);

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setErrorModal({ visible: true, title: 'Missing Fields', message: 'Please fill all fields before registering.' });
      return;
    }

    setIsLoading(true);

    try {
      navigation.navigate('VerifySignup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });
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
                <Text style={styles.primaryButtonText}>Continue</Text>
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