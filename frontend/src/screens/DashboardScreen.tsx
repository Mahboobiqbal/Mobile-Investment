import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  useWindowDimensions,
} from 'react-native';
import { AxiosError } from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InfoModal from '../components/InfoModal';
import { InvestmentSystem } from '../services/api/walletApi';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface UserProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    currentBalance: number;
    activePlan?: string;
    pendingInvestmentAmount?: number;
    phone?: string;
    dp?: string;
    isVerified?: boolean;
  };
}

interface DashboardStatsResponse {
  totalDepositsApproved: number;
  totalWithdrawalsApproved: number;
  totalROIEarnings: number;
  totalInvestment: number;
}

interface InvestmentPlan {
  _id: string;
  category: string | { _id: string; name: string };
  name: string;
  dailyReturnRate: number;
  minInvestment: number;
  maxInvestment?: number | null;
  description?: string;
  isActive: boolean;
}

interface UserInvestment {
  _id: string;
  user: string;
  plan?: InvestmentPlan | null;
  category: { _id: string; name: string };
  investmentAmount: number;
  dailyReturnRate: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

interface DashboardData {
  user: UserProfileResponse['user'] | null;
  stats: DashboardStatsResponse | null;
}

interface InvestmentsResponse {
  investments: UserInvestment[];
  totalInvestment: number;
}

interface ApiError {
  message: string;
}

export default function DashboardScreen() {
  const { logout, refreshUserData } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height: screenHeight } = useWindowDimensions();
  
  // Detects shorter screen forms dynamically
  const isSmallScreen = screenHeight < 780;

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    stats: null,
  });
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [systems, setSystems] = useState<InvestmentSystem[]>([]);
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
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, statsRes, systemsRes, investmentsRes] = await Promise.all([
        api.get<UserProfileResponse>('/auth/profile'),
        api.get<DashboardStatsResponse>('/auth/dashboard-stats'),
        api.get<{ systems: InvestmentSystem[] }>('/wallet/systems'),
        api.get<InvestmentsResponse>('/auth/investments'),
      ]);

      setDashboardData({
        user: profileRes.data.user,
        stats: statsRes.data,
      });
      setSystems(systemsRes.data.systems || []);
      setInvestments(investmentsRes.data.investments || []);
      await refreshUserData();
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
  }, [refreshUserData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    setMenuVisible(false);
    setConfirmModal({
      visible: true,
      title: 'Log Out?',
      message: 'Are you sure you want to log out of your account?',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        try {
          await logout();
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

  const handleOpenSettings = () => {
    setMenuVisible(false);
    openDashboardChild('Settings');
  };

  const openDashboardChild = useCallback(
    (routeName: 'Settings' | 'DepositRequest' | 'WithdrawalRequest' | 'Systems') => {
      navigation.reset({
        index: 1,
        routes: [{ name: 'Dashboard' }, { name: routeName }],
      });
    },
    [navigation]
  );

  const handleOpenMenu = () => {
    setMenuVisible(true);
  };

  const handleBalanceToggle = () => {
    if (showBalance) {
      setShowBalance(false);
      return;
    }
    setShowPinModal(true);
    setPinCodeInput('');
  };

  const handlePinSubmit = () => {
    const CORRECT_PIN = '0000';
    if (pinCodeInput === CORRECT_PIN) {
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
          <ActivityIndicator size="large" color="#008F5A" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = dashboardData.stats || {
    totalDepositsApproved: 0,
    totalWithdrawalsApproved: 0,
    totalROIEarnings: 0,
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

 const balanceDisplay = showBalance ? formatCurrency(dashboardData.user?.currentBalance || 0) : '••••••';
  const displayedUserName = dashboardData.user?.name || 'User';
  // Prefer backend investments status; activePlan can be name-based and may be stale.
  const hasActivePlan = investments.some((investment) => investment.status === 'active') ||
    Boolean(dashboardData.user?.activePlan && dashboardData.user.activePlan !== 'None');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008F5A" />

      {/* MODIFIED: Optimized layout header container size parameters */}
      <View style={[styles.headerContainer, { height: isSmallScreen ? 140 : 150 }]}>
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 2, backgroundColor: '#078355' }} />
          <View style={{ flex: 1, backgroundColor: '#00A86B' }} />
        </View>

        <View style={styles.headerTopBar}>
          <Pressable style={styles.headerHamburger} onPress={handleOpenMenu} hitSlop={10}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </Pressable>

          <View style={styles.headerGreetingWrap}>
            <Text style={styles.greetingText}>Good Morning</Text>
            <Text style={styles.userNameText} numberOfLines={1}>{displayedUserName}</Text>
          </View>

          <Pressable style={styles.headerNotif} hitSlop={10} onPress={() => {}}>
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {/* FLOATING ABSOLUTE OVERLAPPING BALANCE BLOCK CONTAINER */}
        <View style={styles.floatingCardPositioner}>
          <View style={[styles.walletCard, { padding: isSmallScreen ? 10 : 14 }]}>

            <Pressable style={styles.walletCardLeft} onPress={handleBalanceToggle} hitSlop={10}>
              <Text style={styles.walletLabel}>WALLET BALANCE</Text>
              {/* Added numberOfLines and flexShrink to prevent variable overflow errors */}
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.walletAmount, { fontSize: isSmallScreen ? 18 : 22 }]}>
                {balanceDisplay}
              </Text>
              <Text style={styles.walletSubtext}>Your current funds</Text>
            </Pressable>
            
            <View style={styles.verticalDivider} />

            <View style={styles.walletCardRight}>
              <Pressable onPress={handleBalanceToggle} hitSlop={10}>

                <Text style={{ fontSize: isSmallScreen ? 14 : 18 }}>{showBalance ? '👁️' : '🔒'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Sidemenu Drawer Overlay */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            <Pressable style={styles.menuItem} onPress={handleOpenSettings}>
              <Text style={styles.menuIcon}>⚙</Text>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>App preferences and security</Text>
              </View>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuIcon, styles.menuIconDanger]}>⎋</Text>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, styles.menuTitleDanger]}>Log out</Text>
                <Text style={styles.menuSubtitle}>Sign out from this device</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* FIXED: Replaced mismatched outer elements with unified scroll view configuration */}
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={[styles.scrollContentModifier, { paddingTop: isSmallScreen ? 55 : 50 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#008F5A']} />}
      >
        <View style={{ gap: isSmallScreen ? 10 : 16 }}>

{/* 3. FINANCIAL ANALYTICS HORIZONTAL SLIDER */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 4 : 8 }]}>Financial Analytics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.analyticsHorizontalContent}>
              <View style={[styles.analyticsHCard, { borderBottomColor: '#8B5CF6' }]}>
                <Text style={styles.analyticsHIcon}>📊</Text>
                <Text style={styles.analyticsHLabel}>TOTAL INVESTMENT</Text>
                <Text style={[styles.analyticsHValue, { color: '#6D28D9' }]}>{formatCurrency(stats.totalDepositsApproved)}</Text>
              </View>

              <View style={[styles.analyticsHCard, { borderBottomColor: '#008F5A' }]}>
                <Text style={styles.analyticsHIcon}>📈</Text>
                <Text style={styles.analyticsHLabel}>TOTAL ROI PROFIT</Text>
                <Text style={[styles.analyticsHValue, { color: '#008F5A' }]}>{formatCurrency(stats.totalROIEarnings)}</Text>
              </View>

              <View style={[styles.analyticsHCard, { borderBottomColor: '#3B82F6' }]}>
                <Text style={styles.analyticsHIcon}>💳</Text>
                <Text style={styles.analyticsHLabel}>TOTAL DEPOSITED</Text>
                <Text style={[styles.analyticsHValue, { color: '#0284C7' }]}>{formatCurrency(stats.totalDepositsApproved)}</Text>
              </View>

              <View style={[styles.analyticsHCard, { borderBottomColor: '#F59E0B' }]}>
                <Text style={styles.analyticsHIcon}>💰</Text>
                <Text style={styles.analyticsHLabel}>TOTAL WITHDRAWN</Text>
                <Text style={[styles.analyticsHValue, { color: '#D97706' }]}>{formatCurrency(stats.totalWithdrawalsApproved)}</Text>
              </View>
            </ScrollView>
          </View>


          {/* 4. CAPSULE QUICK ACTIONS */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 4 : 8 }]}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <Pressable style={[styles.actionCapsule, styles.actionCapsuleDeposit, { paddingVertical: isSmallScreen ? 6 : 10 }]} onPress={() => navigation.navigate('DepositRequest' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4, fontSize: isSmallScreen ? 10 : 12 }}>💳</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#008F5A', fontSize: isSmallScreen ? 10 : 11 }]}>Deposit</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#008F5A' }]}>›</Text>
              </Pressable>

              <Pressable style={[styles.actionCapsule, styles.actionCapsuleWithdraw, { paddingVertical: isSmallScreen ? 6 : 10 }]} onPress={() => navigation.navigate('WithdrawalRequest' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4, fontSize: isSmallScreen ? 10 : 12 }}>🏛️</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#DB2777', fontSize: isSmallScreen ? 10 : 11 }]}>Withdraw</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#DB2777' }]}>›</Text>
              </Pressable>

              <Pressable style={[styles.actionCapsule, styles.actionCapsulePlans, { paddingVertical: isSmallScreen ? 6 : 10 }]} onPress={() => navigation.navigate('Systems' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4, fontSize: isSmallScreen ? 10 : 12 }}>📊</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#2563EB', fontSize: isSmallScreen ? 10 : 11 }]}>Plans</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#2563EB' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* 5. ACTIVE PLAN DATA MATRIX TABLE */}
          <View>
            <View style={styles.tableHeaderNavigationRow}>
              <Text style={styles.sectionTitle}>Active Plan</Text>
              <Pressable onPress={() => navigation.navigate('Systems' as never)}>
                <Text style={styles.viewAllLink}>View All ›</Text>
              </Pressable>
            </View>

            <View style={styles.tableMainWrapperCard}>
              <View style={styles.tableHeaderBackgroundRow}>
                <Text style={[styles.thElement, { flex: 0.6, textAlign: 'center' }]}>S.NO.</Text>
                <Text style={[styles.thElement, { flex: 2 }]}>
                  Active Plan
                </Text>
                <Text style={[styles.thElement, { flex: 1.5, textAlign: 'center' }]}>
                  {hasActivePlan ? 'ACTIVE' : 'CAT-1'}
                </Text>
                <Text style={[styles.thElement, { flex: 1.5, textAlign: 'center' }]}>
                  {hasActivePlan ? '' : 'CAT-2'}
                </Text>
                <Text style={[styles.thElement, { flex: 1.8, textAlign: 'right' }]}>MIN INVEST</Text>
                <Text style={[styles.thElement, { flex: 1.8, textAlign: 'right' }]}>WEEKLY %</Text>
              </View>

              {/* Active Plan (clickable) */}
              {(() => {
                const activeInvestments = investments.filter((investment) => investment.status === 'active');
                const activeInvestment = activeInvestments[0];
                const fallbackPlan = dashboardData.user?.activePlan && dashboardData.user.activePlan !== 'None'
                  ? systems
                      .flatMap((system) => system.plans?.map((plan) => ({ plan, system })) ?? [])
                      .find((row) => row.plan.name === dashboardData.user?.activePlan)
                  : null;

                const plan = activeInvestment?.plan || fallbackPlan?.plan;

                if (!plan) {
                  return (
                    <View style={[styles.tableDataRow, { paddingVertical: 12 }]}>
                      <Text style={[styles.tdElement, { flex: 8, textAlign: 'center', color: '#64748B', fontStyle: 'italic' }]}
                      >
                        No active plan available
                      </Text>
                    </View>
                  );
                }

                const investmentAmount = activeInvestment?.investmentAmount || dashboardData.user?.pendingInvestmentAmount || 0;
                const dailyReturnRate = activeInvestment?.dailyReturnRate || plan.dailyReturnRate;

                // Try to map system/category display, but do not block UI if mapping fails.
                const matchedSystem = systems
                  .flatMap((s) => s.plans?.map((p) => ({ p, system: s })) ?? [])
                  .find((row) => row.p._id === plan._id);

                const icon = matchedSystem?.system?.name?.charAt(0) || '📊';
                const cat1 = matchedSystem?.system?.name || activeInvestment.category?.name || '-';

                const activeRow = {
                  id: plan._id,
                  name: plan.name,
                  investmentAmount,
                  dailyReturnRate,
                  icon,
                  cat1,
                  cat2: '-',
                  min: `Rs. ${plan.minInvestment?.toLocaleString?.() ?? '0'}`,
                  profit: `${(((dailyReturnRate) * 100) as number).toFixed(1)}% Daily`,
                };

                return (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('ActivePlanHistory', {
                        selectedPlanId: activeRow.id,
                        selectedPlanName: activeRow.name,
                        investmentAmount: activeRow.investmentAmount,
                        dailyReturnRate: activeRow.dailyReturnRate,
                      })
                    }
                    style={({ pressed }) => [
                      styles.tableDataRow,
                      { paddingVertical: isSmallScreen ? 5 : 8, backgroundColor: pressed ? 'rgba(16,185,129,0.08)' : '#ECFDF5' },
                    ]}
                  >
                    <Text style={[styles.tdElement, { flex: 0.6, textAlign: 'center', color: '#047857', fontWeight: '800' }]}>•</Text>
                    <View style={[{ flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <Text style={{ marginRight: 4, fontSize: 10 }}>{activeRow.icon}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 9, fontWeight: '900', color: '#065F46' }}>
                        {activeRow.name}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.tdElement, { flex: 1.5, textAlign: 'center', color: '#047857', fontWeight: '800' }]}>
                      ACTIVE
                    </Text>
                    <Text numberOfLines={1} style={[styles.tdElement, { flex: 1.5, textAlign: 'center', color: '#64748B' }]}>
                      {activeRow.cat2}
                    </Text>
                    <Text numberOfLines={1} style={[styles.tdElement, { flex: 1.8, textAlign: 'right', color: '#047857', fontWeight: '800' }]}>
                      {activeRow.min}
                    </Text>
                    <Text numberOfLines={1} style={[styles.tdElement, { flex: 1.8, textAlign: 'right', color: '#059669', fontWeight: '800' }]}>
                      {activeRow.profit}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>
          </View>

          {/* 6. MY PLANS SUMMARY */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 4 : 8 }]}>My Plans Summary</Text>
            <View style={styles.tableMainWrapperCard}>
              <View style={styles.tableHeaderBackgroundRow}>
                <Text style={[styles.thElement, { flex: 1.5 }]}>PLAN</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'center' }]}>INVESTMENT</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'center' }]}>WEEKLY PROFIT</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'right' }]}>TOTAL PROFIT</Text>
              </View>

{investments.filter(inv => inv.status === 'active').length > 0 ? (
                investments.filter(inv => inv.status === 'active').map((row) => {
                  const weeklyProfit = row.investmentAmount * row.dailyReturnRate * 7;
                  const totalProfit = stats.totalROIEarnings || 0;
                  return (
                    <View key={row._id} style={[styles.tableDataRow, { paddingVertical: isSmallScreen ? 5 : 8 }]}>
                      <Text style={[styles.tdElement, { flex: 1.5, fontWeight: '700', color: '#334155' }]}>{row.plan?.name || 'Unknown Plan'}</Text>
                      <Text style={[styles.tdElement, { flex: 2, textAlign: 'center', color: '#047857', fontWeight: '600' }]}>{formatCurrency(row.investmentAmount)}</Text>
                      <Text style={[styles.tdElement, { flex: 2, textAlign: 'center', color: '#059669', fontWeight: '600' }]}>{formatCurrency(weeklyProfit)}</Text>
                      <Text style={[styles.tdElement, { flex: 2, textAlign: 'right', color: '#047857', fontWeight: '700' }]}>{formatCurrency(totalProfit)}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={[styles.tableDataRow, { paddingVertical: 12 }]}>
                  <Text style={[styles.tdElement, { flex: 8, textAlign: 'center', color: '#64748B', fontStyle: 'italic' }]}>No active investments</Text>
                </View>
              )}

              {/* Combined Direct Cashout Footer Strip */}
              <View style={[styles.innerWithdrawStrip, { padding: isSmallScreen ? 6 : 10 }]}>
                <View>
                  <Text style={styles.withdrawStripLabel}>TOTAL WITHDRAWABLE</Text>
                  <Text style={[styles.withdrawStripValue, { fontSize: isSmallScreen ? 12 : 14 }]}>{formatCurrency(stats.totalROIEarnings || 0)}</Text>
                </View>
                <Pressable style={[styles.withdrawStripButton, { paddingVertical: isSmallScreen ? 5 : 8 }]} onPress={() => navigation.navigate('WithdrawalRequest' as never)}>
                  <Text style={styles.withdrawStripButtonArrow}>↑</Text>
                  <Text style={styles.withdrawStripButtonText}>Withdraw</Text>
                </Pressable>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
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
              <Pressable style={[styles.pinModalButton, styles.pinCancelButton]} onPress={() => { setShowPinModal(false); setPinCodeInput(''); }}>
                <Text style={styles.pinCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.pinModalButton, styles.pinConfirmButton]} onPress={handlePinSubmit}>
                <Text style={styles.pinConfirmButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Modals Context */}
      <SuccessModal visible={successModal.visible} title={successModal.title} message={successModal.message} onClose={() => setSuccessModal({ ...successModal, visible: false })} />
      <ErrorModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} onClose={() => setErrorModal({ ...errorModal, visible: false })} />
      <ConfirmationModal visible={confirmModal.visible} title={confirmModal.title} message={confirmModal.message} isDangerous={confirmModal.isDangerous} confirmText={confirmModal.isDangerous ? 'Log Out' : 'Confirm'} onCancel={() => setConfirmModal({ ...confirmModal, visible: false })} onConfirm={confirmModal.onConfirm} />
      <InfoModal visible={infoModal.visible} title={infoModal.title} message={infoModal.message} icon={infoModal.icon} isComingSoon={infoModal.isComingSoon} buttonText={infoModal.isComingSoon ? 'Okay' : 'Got it'} onClose={() => setInfoModal({ ...infoModal, visible: false })} />
        {/* ADD THIS MODAL JUST BEFORE YOUR GLOBAL MODALS CONTENT */}
      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pinCodeModal}>
            <Text style={styles.pinModalTitle}>Verify Security Access</Text>
            <Text style={styles.pinModalSubtitle}>Enter your 4-digit master configuration key</Text>
            <TextInput
              style={styles.pinCodeInput}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pinCodeInput}
              onChangeText={setPinCodeInput}
              autoFocus={true}
            />
            <View style={styles.pinModalButtons}>
              <Pressable style={[styles.pinModalButton, styles.pinCancelButton]} onPress={() => { setShowPinModal(false); setPinCodeInput(''); }}>
                <Text style={styles.pinCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.pinModalButton, styles.pinConfirmButton]} onPress={handlePinSubmit}>
                <Text style={styles.pinConfirmButtonText}>Unlock</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerHamburger: {
    width: 40,
    height: 35,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerGreetingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
    textAlign: 'center',
  },
  headerNotif: {
    width: 40,
    height: 35,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  notifIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#00A86B',
  },
  floatingCardPositioner: {
    position: 'absolute',
    bottom: -30, 
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    zIndex: 20,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletCardLeft: {
    flex: 1,
    flexShrink: 1,
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  walletAmount: {
    fontWeight: '900',
    color: '#0F172A',
    flexShrink: 1,
  },
  walletSubtext: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  walletCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentModifier: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  analyticsHorizontalContent: {
    paddingRight: 8,
    gap: 8,
  },
  analyticsHCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderBottomWidth: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  analyticsHIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  analyticsHLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  analyticsHValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionCapsule: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  capsuleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCapsuleText: {
    fontWeight: '700',
  },
  actionCapsuleArrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionCapsuleDeposit: {
    backgroundColor: '#E6F3ED',
    borderColor: '#C2E3D4',
  },
  actionCapsuleWithdraw: {
    backgroundColor: '#FCE7F3',
    borderColor: '#FBCFE8',
  },
  actionCapsulePlans: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  tableHeaderNavigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  viewAllLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#008F5A',
  },
  tableMainWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tableHeaderBackgroundRow: {
    backgroundColor: '#008F5A',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thElement: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdElement: {
    fontSize: 9,
  },
  innerWithdrawStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  withdrawStripLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  withdrawStripValue: {
    fontWeight: '900',
    color: '#008F5A',
    marginTop: 1,
  },
  withdrawStripButton: {
    backgroundColor: '#008F5A',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  withdrawStripButtonArrow: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  withdrawStripButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 56,
    paddingLeft: 14,
  },
  menuCard: {
    width: 220,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuIcon: {
    width: 22,
    fontSize: 15,
    color: '#0F172A',
    marginRight: 6,
    textAlign: 'center',
  },
  menuIconDanger: {
    color: '#DC2626',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuTitleDanger: {
    color: '#DC2626',
  },
  menuSubtitle: {
    marginTop: 1,
    fontSize: 9,
    color: '#64748B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCodeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '80%',
    elevation: 6,
  },
  pinModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  pinModalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  pinCodeInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    color: '#0F172A',
    letterSpacing: 6,
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pinModalButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  pinCancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pinConfirmButton: {
    backgroundColor: '#008F5A',
  },
  pinConfirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
