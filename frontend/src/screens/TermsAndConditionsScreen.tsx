import { useCallback, useMemo } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

interface Plan {
  id: string;
  name: string;
  dailyProfit: string;
  description: string;
  color: string;
}

type TermsRoute = RouteProp<{ TermsAndConditions: { plan: Plan } }, 'TermsAndConditions'>;

const TERMS_CONTENT = `
INVESTMENT PLAN TERMS & CONDITIONS

1. ACKNOWLEDGMENT
You acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions before proceeding with your investment plan selection.

2. INVESTMENT DISCLAIMER
- All investments carry risk. Past performance does not guarantee future results.
- The stated daily profit percentages are estimates and subject to market conditions.
- You assume full responsibility for your investment decision.

3. ACCOUNT RESPONSIBILITY
- You are responsible for maintaining the confidentiality of your account credentials.
- All transactions made through your account are your responsibility.
- You agree to notify us immediately of any unauthorized account activity.

4. WITHDRAWAL POLICY
- Withdrawal requests will be processed within 2-5 business days.
- Minimum withdrawal amount applies as per plan terms.
- Withdrawal charges, if any, will be clearly communicated.

5. LIMITATION OF LIABILITY
In no event shall the company be liable for any direct, indirect, incidental, special, consequential, or punitive damages.

6. MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use implies acceptance of modified terms.

7. GOVERNING LAW
These terms are governed by applicable laws and regulations.

8. CONTACT & SUPPORT
For support, contact: support@investmentapp.com

By clicking "I Agree", you confirm that you have read and accepted all terms and conditions.
`;

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();
  const route = useRoute<TermsRoute>();
  const plan = useMemo(() => route.params?.plan, [route.params]);

  const handleAgree = useCallback(async () => {
    if (!plan) {
      Alert.alert('Error', 'Plan information is missing');
      return;
    }

    try {
      // Here you would ideally call the backend to save the plan selection
      // For now, we'll just navigate to dashboard
      Alert.alert('Success', `You've selected ${plan.name}. Welcome to your investment journey!`);

      // Navigate to Dashboard - this will trigger AuthContext state update
      navigation.navigate('Dashboard' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete plan selection. Please try again.');
    }
  }, [plan, navigation]);

  const handleDecline = useCallback(() => {
    Alert.alert('Plan Not Selected', 'You must agree to the terms to continue', [
      { text: 'Go Back', onPress: () => navigation.goBack() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [navigation]);

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plan information not found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Plan Info */}
      <View style={[styles.planBanner, { backgroundColor: `${plan.color}20` }]}>
        <Text style={[styles.planNameInBanner, { color: plan.color }]}>{plan.name}</Text>
        <Text style={styles.planDescInBanner}>{plan.dailyProfit}</Text>
      </View>

      {/* Terms Content */}
      <ScrollView style={styles.termsScroll} contentContainerStyle={styles.termsContent}>
        <Text style={styles.termsTitle}>Terms & Conditions</Text>
        <Text style={styles.termsText}>{TERMS_CONTENT}</Text>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.declineButton} onPress={handleDecline}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
        <Pressable style={styles.agreeButton} onPress={handleAgree}>
          <Text style={styles.agreeButtonText}>I Agree</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  planBanner: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  planNameInBanner: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescInBanner: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  termsScroll: {
    flex: 1,
  },
  termsContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  declineButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  agreeButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  agreeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
