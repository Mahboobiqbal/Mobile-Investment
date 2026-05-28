import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { walletApi } from '../services/api/walletApi';

type TermsRoute = RouteProp<{ TermsCondition: { selectedPlanId: string; selectedPlanName: string } }, 'TermsCondition'>;

export default function TermsConditionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<TermsRoute>();
  const selectedPlanId = useMemo(() => route.params?.selectedPlanId, [route.params]);
  const selectedPlanName = useMemo(() => route.params?.selectedPlanName, [route.params]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleAgree = useCallback(() => setHasAgreed((v) => !v), []);

  const handleContinue = useCallback(() => {
    if (!hasAgreed || !selectedPlanId || !selectedPlanName) {
      return;
    }

    const commitPlanSelection = async () => {
      setSubmitting(true);

      try {
        await walletApi.selectPlan({ planName: selectedPlanName });
        navigation.replace('Dashboard');
      } catch (error) {
        Alert.alert(
          'Plan Selection Failed',
          error instanceof Error ? error.message : 'Unable to commit this plan to your account. Please try again.'
        );
      } finally {
        setSubmitting(false);
      }
    };

    void commitPlanSelection();
  }, [hasAgreed, navigation, selectedPlanId, selectedPlanName]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.title}>Platform Terms of Service</Text>
        <Text style={styles.subtitle}>
          Please review our legal guidelines, daily ROI distribution rules, and transfer windows carefully.
        </Text>
        {selectedPlanName ? (
          <View style={styles.selectedPlanPill}>
            <Text style={styles.selectedPlanText}>{selectedPlanName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.termsCardWrapper}>
        <View style={styles.termsCard}>
          <ScrollView contentContainerStyle={styles.termsScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.termSection}>
              <Text style={styles.termTitle}>1. Capital Protection & Investment Cycles</Text>
              <Text style={styles.termBullet}>• Daily return engine runs according to the selected wealth tier and is applied once per 24-hour cycle.</Text>
              <Text style={styles.termBullet}>• Estimated returns are displayed in-app and are subject to platform rules and market conditions.</Text>
              <Text style={styles.termBullet}>• Principal is tracked separately from accrued returns; plan-specific minimums apply.</Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>2. Secure Withdrawal Processing</Text>
              <Text style={styles.termBullet}>• Withdrawal requests undergo identity verification and anti-fraud checks before processing.</Text>
              <Text style={styles.termBullet}>• Transfers are executed during predefined banking windows; expect 1-5 business days for settlement.</Text>
              <Text style={styles.termBullet}>• Rapid mobile wallet transfers may require additional confirmation if flagged by our monitoring systems.</Text>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termTitle}>3. Anti-Fraud Policy</Text>
              <Text style={styles.termBullet}>• Duplicate system accounts and synthetic identity attempts are strictly prohibited.</Text>
              <Text style={styles.termBullet}>• Suspected fraudulent activity will result in temporary holds and an investigation by our security team.</Text>
              <Text style={styles.termBullet}>• Repeated violations may lead to account termination and legal action where applicable.</Text>
            </View>

            <View style={styles.termSectionSmall}>
              <Text style={styles.smallNoteTitle}>Contact & Support</Text>
              <Text style={styles.smallNote}>For support, contact: support@investmentapp.com</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      <Pressable style={styles.agreeRow} onPress={handleToggleAgree} hitSlop={8}>
        <View style={[styles.checkbox, hasAgreed && styles.checkboxActive]}>
          {hasAgreed ? <View style={styles.checkboxInner} /> : null}
        </View>
        <Text style={styles.agreeText}>I have read, understood, and accept the platform investment terms.</Text>
      </Pressable>

      <View style={styles.footerSpacer} />

      <View style={styles.stickyFooter} pointerEvents={hasAgreed ? 'auto' : 'box-none'}>
        <Pressable
          style={[styles.continueButton, (!hasAgreed || submitting) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!hasAgreed || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.continueText, !hasAgreed && styles.continueTextDisabled]}>Agree & Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  selectedPlanPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E6EEF7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  termsCardWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  termsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 12,
    elevation: 4,
  },
  termsScrollContent: {
    paddingBottom: 24,
  },
  termSection: {
    marginBottom: 18,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  termBullet: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 20,
  },
  termSectionSmall: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
  },
  smallNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  smallNote: {
    fontSize: 12,
    color: '#475569',
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#00A86B',
    backgroundColor: '#ECFDF6',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#00A86B',
    borderRadius: 2,
  },
  agreeText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
  },

  footerSpacer: {
    height: 84,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 20,
  },
  continueButton: {
    width: width - 40,
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: '#94A3B8',
  },
});