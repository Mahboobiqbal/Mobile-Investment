import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InfoModal from '../components/InfoModal';

interface UserProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    currentBalance: number;
    activePlan?: string;
    phone?: string;
    dp?: string;
    isVerified?: boolean;
  };
}

interface DashboardStatsResponse {
  totalDepositsApproved: number;
  totalWithdrawalsApproved: number;
  totalROIEarnings: number;
}

interface DashboardData {
  user: UserProfileResponse['user'] | null;
  stats: DashboardStatsResponse | null;
}

interface ApiError {
  message: string;
}

export default function DashboardScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Balance visibility and PIN state
  const [showBalance, setShowBalance] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCodeInput, setPinCodeInput] = useState('');

  // Modal states
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    isDangerous: false,
    onConfirm: () => {},
  });
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '', icon: '🎯', isComingSoon: false });

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      const [profileRes, statsRes] = await Promise.all([
        api.get<UserProfileResponse>('/auth/profile'),
        api.get<DashboardStatsResponse>('/auth/dashboard-stats'),
      ]);

      setDashboardData({
        user: profileRes.data.user,
        stats: statsRes.data,
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Failed to load dashboard data';
      console.error('Dashboard error:', errorMessage, axiosError);
      setError(errorMessage);
      setErrorModal({
        visible: true,
        title: 'Failed to Load Dashboard',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    setConfirmModal({
      visible: true,
      title: 'Log Out?',
      message: 'Are you sure you want to log out of your account?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        try {
          await logout();
          // Use reset to completely clear the navigation state and go back to Login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' as never }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          setErrorModal({
            visible: true,
            title: 'Logout Failed',
            message: 'Unable to log out. Please try again.',
          });
        }
      },
    });
  };

  const handleBalanceToggle = () => {
    // If balance is currently visible, hide it immediately without asking for PIN.
    if (showBalance) {
      setShowBalance(false);
      return;
    }

    // If balance is hidden, require PIN to show it.
    setShowPinModal(true);
    setPinCodeInput('');
  };

  const handlePinSubmit = () => {
    const CORRECT_PIN = '0000';
    if (pinCodeInput === CORRECT_PIN) {
      // Only used to show the balance (we never call PIN to hide)
      setShowBalance(true);
      setShowPinModal(false);
      setPinCodeInput('');
      setSuccessModal({
        visible: true,
        title: 'Balance Visible',
        message: 'Your balance is now visible.',
      });
    } else {
      setErrorModal({
        visible: true,
        title: 'Incorrect PIN',
        message: 'The PIN you entered is incorrect. Please try again.',
      });
      setPinCodeInput('');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const user = dashboardData.user || {
    id: '',
    name: 'User',
    email: '',
    role: 'user' as const,
    currentBalance: 0,
  };
  const stats = dashboardData.stats || {
    totalDepositsApproved: 0,
    totalWithdrawalsApproved: 0,
    totalROIEarnings: 0,
    message: undefined,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const balanceDisplay = showBalance ? formatCurrency(user?.currentBalance || 0) : 'Rs. ••••••';
  const activePlanDisplay = user?.activePlan && user.activePlan !== 'None' ? user.activePlan : 'No plan selected yet';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Green Background */}
      <View style={styles.headerGreen}>
        <View style={styles.headerContent}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{user?.name || 'User'}</Text>
        </View>
        <Pressable style={styles.headerIcon} onPress={handleLogout} hitSlop={15}>
          <Text style={styles.logoutIcon}>⎋</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00A86B']} />}
      >
        {/* Floating Wallet Card */}
        <View style={styles.walletCardContainer}>
          <View style={styles.walletCard}>
            <View style={styles.walletCardLeft}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletAmount}>{balanceDisplay}</Text>
              <Text style={styles.walletSubtext}>Your current funds</Text>
            </View>

            <View style={styles.walletCardDivider} />

            <View style={styles.walletCardRight}>
              <Pressable style={styles.eyeButtonContainer} onPress={handleBalanceToggle}>
                <Text style={styles.eyeButton}>{showBalance ? '👁' : '🔒'}</Text>
              </Pressable>
              <Pressable style={styles.addMoneyButton} onPress={() => navigation.navigate('DepositRequest' as never)}>
                <Text style={styles.addMoneyText}>Add Money</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Financial Analytics Grid */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Financial Analytics</Text>
          <View style={styles.analyticsGrid}>
            {/* Total Investment Card */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>Total Investment</Text>
              <Text style={[styles.analyticsValue, styles.investmentColor]}>
                {formatCurrency(user?.currentBalance || 0)}
              </Text>
              <View style={[styles.analyticsIndicator, { backgroundColor: '#8B5CF6' }]} />
            </View>

            {/* ROI Card */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>Total ROI Profit</Text>
              <Text style={[styles.analyticsValue, styles.roiColor]}>
                {formatCurrency(stats.totalROIEarnings)}
              </Text>
              <View style={styles.analyticsIndicator} />
            </View>

            {/* Deposited Card */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>Total Deposited</Text>
              <Text style={[styles.analyticsValue, styles.depositColor]}>
                {formatCurrency(stats.totalDepositsApproved)}
              </Text>
              <View style={[styles.analyticsIndicator, { backgroundColor: '#0EA5E9' }]} />
            </View>

            {/* Withdrawn Card */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>Total Withdrawn</Text>
              <Text style={[styles.analyticsValue, styles.withdrawColor]}>
                {formatCurrency(stats.totalWithdrawalsApproved)}
              </Text>
              <View style={[styles.analyticsIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {/* Deposit Action */}
            <Pressable
              style={styles.actionItem}
              onPress={() => navigation.navigate('DepositRequest' as never)}
            >
              <View style={[styles.actionCircle, styles.depositActionBg]}>
                <Text style={styles.actionIcon}>💳</Text>
              </View>
              <Text style={styles.actionLabel}>Deposit</Text>
            </Pressable>

            {/* Withdraw Action */}
            <Pressable
              style={styles.actionItem}
              onPress={() => navigation.navigate('WithdrawalRequest' as never)}
            >
              <View style={[styles.actionCircle, styles.withdrawActionBg]}>
                <Text style={styles.actionIcon}>🏦</Text>
              </View>
              <Text style={styles.actionLabel}>Withdraw</Text>
            </Pressable>

            {/* Plans Action */}
            <Pressable
              style={styles.actionItem}
              onPress={() => navigation.navigate('PlanSelection' as never)}
            >
              <View style={[styles.actionCircle, styles.plansActionBg]}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>Plans</Text>
            </Pressable>
          </View>
        </View>

        {/* Investment Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Investment Summary</Text>
            <Pressable onPress={() => navigation.navigate('Analysis' as never)}>
              <Text style={styles.seeAnalysisLink}>See Analysis →</Text>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active Plan</Text>
              <Text style={styles.summaryValue}>{activePlanDisplay}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={[styles.summaryValue, styles.balanceHighlight]}>
                {formatCurrency(
                  stats.totalDepositsApproved + stats.totalROIEarnings - stats.totalWithdrawalsApproved
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pinCodeModal}>
            <Text style={styles.pinModalTitle}>Enter Your PIN</Text>
            <Text style={styles.pinModalSubtitle}>4-digit security code</Text>
            <TextInput
              style={styles.pinCodeInput}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pinCodeInput}
              onChangeText={setPinCodeInput}
            />
            <View style={styles.pinModalButtons}>
              <Pressable
                style={[styles.pinModalButton, styles.pinCancelButton]}
                onPress={() => {
                  setShowPinModal(false);
                  setPinCodeInput('');
                }}
              >
                <Text style={styles.pinCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.pinModalButton, styles.pinConfirmButton]}
                onPress={handlePinSubmit}
              >
                <Text style={styles.pinConfirmButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ ...successModal, visible: false })}
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />

      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        confirmText={confirmModal.isDangerous ? 'Log Out' : 'Confirm'}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        onConfirm={confirmModal.onConfirm}
      />

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        icon={infoModal.icon}
        isComingSoon={infoModal.isComingSoon}
        buttonText={infoModal.isComingSoon ? 'Okay' : 'Got it'}
        onClose={() => setInfoModal({ ...infoModal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGreen: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  walletCardContainer: {
    marginTop: -8,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  walletCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  walletSubtext: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  walletCardDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  walletCardRight: {
    alignItems: 'center',
    gap: 10,
  },
  eyeButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    fontSize: 20,
  },
  addMoneyButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addMoneyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  analyticsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  roiColor: {
    color: '#10B981',
  },
  investmentColor: {
    color: '#8B5CF6',
  },
  depositColor: {
    color: '#0EA5E9',
  },
  withdrawColor: {
    color: '#F59E0B',
  },
  analyticsIndicator: {
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  depositActionBg: {
    backgroundColor: '#DBEAFE',
  },
  withdrawActionBg: {
    backgroundColor: '#FEE2E2',
  },
  plansActionBg: {
    backgroundColor: '#DCFCE7',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAnalysisLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A86B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceHighlight: {
    color: '#00A86B',
    fontSize: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  footer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCodeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  pinModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  pinCodeInput: {
    height: 60,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#0F172A',
    letterSpacing: 8,
  },
  pinModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinModalButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  pinCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  pinConfirmButton: {
    backgroundColor: '#00A86B',
  },
  pinConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    marginTop: 'auto',
    maxHeight: '80%',
  },
  transactionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  transactionModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  transactionModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  transactionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#00A86B',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
});
