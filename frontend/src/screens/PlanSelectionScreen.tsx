import { useCallback, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Plan {
  id: string;
  name: string;
  dailyProfit: string;
  description: string;
  color: string;
}

const DUMMY_PLANS: Plan[] = [
  {
    id: 'plan-a',
    name: 'Plan A',
    dailyProfit: '2% Daily',
    description: 'Starter investment plan with consistent daily returns',
    color: '#3B82F6',
  },
  {
    id: 'plan-b',
    name: 'Plan B',
    dailyProfit: '3.5% Daily',
    description: 'Premium plan with higher daily profit potential',
    color: '#8B5CF6',
  },
  {
    id: 'plan-c',
    name: 'Plan C',
    dailyProfit: '5% Daily',
    description: 'Elite plan with maximum daily returns',
    color: '#EC4899',
  },
];

export default function PlanSelectionScreen() {
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlan(planId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select an investment plan to continue');
      return;
    }

    const selected = DUMMY_PLANS.find((p) => p.id === selectedPlan);
    if (selected) {
      navigation.navigate('TermsAndConditions' as never, { plan: selected } as never);
    }
  }, [selectedPlan, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Investment Plan</Text>
          <Text style={styles.subtitle}>Select a plan that suits your investment goals</Text>
        </View>

        {/* Plans Grid */}
        <View style={styles.plansContainer}>
          {DUMMY_PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                { borderLeftColor: plan.color },
              ]}
              onPress={() => handlePlanSelect(plan.id)}
            >
              <View
                style={[
                  styles.planHeader,
                  selectedPlan === plan.id && { backgroundColor: `${plan.color}20` },
                ]}
              >
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <View
                  style={[
                    styles.profitBadge,
                    selectedPlan === plan.id && { backgroundColor: plan.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.profitText,
                      selectedPlan === plan.id && { color: '#FFFFFF' },
                      !selectedPlan?.includes(plan.id) && { color: plan.color },
                    ]}
                  >
                    {plan.dailyProfit}
                  </Text>
                </View>
              </View>

              <Text style={styles.planDescription}>{plan.description}</Text>

              {selectedPlan === plan.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Features Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What You Get:</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>📊 Daily profit calculations</Text>
            <Text style={styles.featureItem}>💳 Flexible withdrawal options</Text>
            <Text style={styles.featureItem}>🔒 Secure transactions</Text>
            <Text style={styles.featureItem}>📈 Real-time dashboard</Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.continueButton, !selectedPlan && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!selectedPlan}
          >
            <Text style={styles.continueButtonText}>Continue to Terms & Conditions</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 22,
  },
  plansContainer: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  planCardSelected: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'currentColor',
  },
  profitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 8,
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#10B981',
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  checkmarkText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
