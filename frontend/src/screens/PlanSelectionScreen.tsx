import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import InfoModal from '../components/InfoModal';
import { walletApi, type InvestmentPlan } from '../services/api/walletApi';
import type { RootStackParamList } from '../navigation/AppNavigator';

type PlanCard = InvestmentPlan & { color: string };

const PLAN_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PlanSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await walletApi.getPlans();

        if (!isMounted) {
          return;
        }

        const livePlans = response.data.plans.map((plan, index) => ({
          ...plan,
          color: PLAN_COLORS[index % PLAN_COLORS.length],
        }));

        setPlans(livePlans);
      } catch (error) {
        if (isMounted) {
          Alert.alert('Failed to Load Plans', error instanceof Error ? error.message : 'Unable to fetch live plans.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedPlanId) {
      setInfoModal({ visible: true, title: 'Select a Plan', message: 'Please select an investment plan to proceed.' });
      return;
    }

    const selected = plans.find((plan) => plan._id === selectedPlanId);
    if (selected) {
      navigation.navigate('TermsCondition', {
        selectedPlanId: selected._id,
        selectedPlanName: selected.name,
      });
    }
  }, [selectedPlanId, navigation, plans]);

  const renderPlanFeatures = (plan: InvestmentPlan) => {
    const features = [
      `Minimum investment ${formatCurrency(plan.minInvestment)}`,
      `Daily return rate ${plan.dailyReturnRate}%`,
      plan.maxInvestment ? `Maximum investment ${formatCurrency(plan.maxInvestment)}` : 'No maximum investment limit',
    ];

    if (plan.description) {
      features.unshift(plan.description);
    }

    return features;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0 }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Investment Plan</Text>
          <Text style={styles.subtitle}>Choose a plan that aligns with your investment objectives</Text>
        </View>

        {/* Plans Container */}
        <View style={styles.plansContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0EA5E9" />
              <Text style={styles.loadingText}>Loading live investment plans...</Text>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No plans available</Text>
              <Text style={styles.emptyStateText}>Please try again later while we load the latest plan options.</Text>
            </View>
          ) : plans.map((plan) => (
            <Pressable
              key={plan._id}
              style={[
                styles.planCard,
                selectedPlanId === plan._id && styles.planCardActive,
              ]}
              onPress={() => handlePlanSelect(plan._id)}
            >
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View style={styles.planTitleSection}>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description || 'Live plan from the backend.'}</Text>
                </View>
                <View style={[styles.profitBadge, { borderColor: plan.color }]}>
                  <Text style={[styles.profitText, { color: plan.color }]}>{plan.dailyReturnRate}% Daily</Text>
                </View>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {renderPlanFeatures(plan).map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Text style={styles.featureBullet}>•</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Selection Indicator */}
              {selectedPlanId === plan._id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Information Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Investment Security</Text>
          <Text style={styles.infoText}>
            All investments are processed through secure banking channels. Your funds and personal information are encrypted and protected.
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.actionButton, (!selectedPlanId || loading) && styles.actionButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedPlanId || loading}
          >
            <Text style={styles.actionButtonText}>Review Terms & Proceed</Text>
          </Pressable>
        </View>
      </ScrollView>

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        onClose={() => setInfoModal({ ...infoModal, visible: false })}
      />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 20,
  },
  plansContainer: {
    marginBottom: 24,
    gap: 14,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planCardActive: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  profitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  featuresList: {
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    borderRadius: 50,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
