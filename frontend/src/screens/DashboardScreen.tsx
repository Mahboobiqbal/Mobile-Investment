import { useCallback, useEffect, useState } from 'react';
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
  const { height: screenHeight } = useWindowDimensions();
  
  // Detects shorter screen forms dynamically
  const isSmallScreen = screenHeight < 780;

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
  const [menuVisible, setMenuVisible] = useState(false);

  // Blueprint Static Matrix Data for Investment Plans
  const investmentPlans = [
    { id: '1', name: 'DIGITAL TREE', icon: '🌳', cat1: '-', cat2: '-', min: 'Rs. 5,000', profit: '1.5% - 2%' },
    { id: '2', name: 'FARMING', icon: '🚜', cat1: 'LIVE STOCK', cat2: 'AGRICULTURE', min: 'Rs. 10,000', profit: '1.5% - 2%' },
    { id: '3', name: 'RENTAL', icon: '🏢', cat1: 'CAR', cat2: 'APARTMENT', min: 'Rs. 20,000', profit: '2.5% - 3%' },
    { id: '4', name: 'TRADING', icon: '📈', cat1: 'FOREX', cat2: 'PHYSICAL', min: 'Rs. 10,000', profit: '2.5% - 4%' },
  ];

  // Blueprint Matrix Data for My Plans Summary Table
  const planSummary = [
    { plan: 'PLAN-1', investment: 'Rs. 25,000', weekly: 'Rs. 375', total: 'Rs. 1,500' },
    { plan: 'PLAN-4', investment: 'Rs. 40,000', weekly: 'Rs. 1,000', total: 'Rs. 5,000' },
  ];

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
    navigation.navigate('Settings' as never);
  };

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

  const balanceDisplay = showBalance ? formatCurrency(dashboardData.user?.currentBalance || 0) : 'Rs. 25,000.00';
  const displayedUserName = dashboardData.user?.name || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008F5A" />

      {/* CHANGED: 1. FIXED HEIGHT MODULAR GRADIENT HEADER */}
      <View style={styles.headerContainer}>
        {/* Simulating clear smooth top-down native color blending layers (#008F5A -> #00A86B) */}
        <View style={StyleSheet.absoluteFill}>
          {/* <View style={{ flex: 1, backgroundColor: '#008F5A' }} /> */}
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

        {/* CHANGED: 2. FLOATING ABSOLUTE OVERLAPPING BALANCE BLOCK CONTAINER */}
        <View style={styles.floatingCardPositioner}>
          <View style={[styles.walletCard, { padding: isSmallScreen ? 12 : 16 }]}>
            <View style={styles.walletCardLeft}>
              <Text style={styles.walletLabel}>WALLET BALANCE</Text>
              <Text style={[styles.walletAmount, { fontSize: isSmallScreen ? 20 : 24 }]}>{balanceDisplay}</Text>
              <Text style={styles.walletSubtext}>Your current funds</Text>
            </View>
            
            <View style={styles.verticalDivider} />

            <View style={styles.walletCardRight}>
              <Pressable style={styles.walletCircleIcon} onPress={handleBalanceToggle}>
                <Text style={{ fontSize: isSmallScreen ? 16 : 20 }}>👛</Text>
              </Pressable>
              <Pressable style={[styles.addMoneyButton, { paddingVertical: isSmallScreen ? 6 : 8 }]} onPress={() => navigation.navigate('DepositRequest' as never)}>
                <Text style={styles.addMoneyText}>Add Money</Text>
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

      {/* Main Container Layout (no vertical scroll) */}
      <View style={styles.scrollContentModifier}>
        {/* Dynamic Spacing Wrapper to condense components on shorter devices */}
        <View style={{ gap: isSmallScreen ? 12 : 20, marginTop: isSmallScreen ? 12 : 20 }}>

          {/* 3. FINANCIAL ANALYTICS HORIZONTAL SLIDER */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 6 : 10 }]}>Financial Analytics</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.analyticsHorizontalContent}>

              <View style={[styles.analyticsHCard, { borderBottomColor: '#8B5CF6' }]}>
                <Text style={styles.analyticsHIcon}>📊</Text>
                <Text style={styles.analyticsHLabel}>TOTAL INVESTMENT</Text>
                <Text style={[styles.analyticsHValue, { color: '#6D28D9' }]}>Rs. 50,000.00</Text>
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
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 6 : 10 }]}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <Pressable style={[styles.actionCapsule, styles.actionCapsuleDeposit, { paddingVertical: isSmallScreen ? 8 : 12 }]} onPress={() => navigation.navigate('DepositRequest' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4 }}>💳</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#008F5A' }]}>Deposit</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#008F5A' }]}>›</Text>
              </Pressable>

              <Pressable style={[styles.actionCapsule, styles.actionCapsuleWithdraw, { paddingVertical: isSmallScreen ? 8 : 12 }]} onPress={() => navigation.navigate('WithdrawalRequest' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4 }}>🏛️</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#DB2777' }]}>Withdraw</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#DB2777' }]}>›</Text>
              </Pressable>

              <Pressable style={[styles.actionCapsule, styles.actionCapsulePlans, { paddingVertical: isSmallScreen ? 8 : 12 }]} onPress={() => navigation.navigate('Systems' as never)}>
                <View style={styles.capsuleLeftRow}>
                  <Text style={{ marginRight: 4 }}>📊</Text>
                  <Text style={[styles.actionCapsuleText, { color: '#2563EB' }]}>Plans</Text>
                </View>
                <Text style={[styles.actionCapsuleArrow, { color: '#2563EB' }]}>›</Text>
              </Pressable>
            </View>
          </View>

          {/* 5. INVESTMENT PLANS DATA MATRIX TABLE */}
          <View>
            <View style={styles.tableHeaderNavigationRow}>
              <Text style={styles.sectionTitle}>Investment Plans</Text>
              <Pressable onPress={() => navigation.navigate('Systems' as never)}>
                <Text style={styles.viewAllLink}>View All ›</Text>
              </Pressable>
            </View>

            <View style={styles.tableMainWrapperCard}>
              <View style={styles.tableHeaderBackgroundRow}>
                <Text style={[styles.thElement, { flex: 0.6, textAlign: 'center' }]}>S.NO.</Text>
                <Text style={[styles.thElement, { flex: 2 }]}>PROJECT</Text>
                <Text style={[styles.thElement, { flex: 1.5, textAlign: 'center' }]}>CATEGORY-1</Text>
                <Text style={[styles.thElement, { flex: 1.5, textAlign: 'center' }]}>CATEGORY-2</Text>
                <Text style={[styles.thElement, { flex: 1.8, textAlign: 'right' }]}>MIN INVESTMENT</Text>
                <Text style={[styles.thElement, { flex: 1.8, textAlign: 'right' }]}>WEEKLY PROFIT %</Text>
              </View>

              {investmentPlans.map((row) => (
                <View key={row.id} style={[styles.tableDataRow, { paddingVertical: isSmallScreen ? 6 : 10 }]}>
                  <Text style={[styles.tdElement, { flex: 0.6, textAlign: 'center', color: '#64748B' }]}>{row.id}</Text>
                  <View style={[{ flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <Text style={{ marginRight: 4, fontSize: 11 }}>{row.icon}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#1E293B' }}>{row.name}</Text>
                  </View>
                  <Text style={[styles.tdElement, { flex: 1.5, textAlign: 'center', color: '#64748B' }]}>{row.cat1}</Text>
                  <Text style={[styles.tdElement, { flex: 1.5, textAlign: 'center', color: '#64748B' }]}>{row.cat2}</Text>
                  <Text style={[styles.tdElement, { flex: 1.8, textAlign: 'right', color: '#047857', fontWeight: '700' }]}>{row.min}</Text>
                  <Text style={[styles.tdElement, { flex: 1.8, textAlign: 'right', color: '#059669', fontWeight: '700' }]}>{row.profit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 6. MY PLANS SUMMARY */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: isSmallScreen ? 6 : 10 }]}>My Plans Summary</Text>
            <View style={styles.tableMainWrapperCard}>
              <View style={styles.tableHeaderBackgroundRow}>
                <Text style={[styles.thElement, { flex: 1.5 }]}>PLAN</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'center' }]}>INVESTMENT</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'center' }]}>WEEKLY PROFIT</Text>
                <Text style={[styles.thElement, { flex: 2, textAlign: 'right' }]}>TOTAL PROFIT</Text>
              </View>

              {planSummary.map((row, index) => (
                <View key={index} style={[styles.tableDataRow, { paddingVertical: isSmallScreen ? 6 : 10 }]}>
                  <Text style={[styles.tdElement, { flex: 1.5, fontWeight: '700', color: '#334155' }]}>{row.plan}</Text>
                  <Text style={[styles.tdElement, { flex: 2, textAlign: 'center', color: '#047857', fontWeight: '600' }]}>{row.investment}</Text>
                  <Text style={[styles.tdElement, { flex: 2, textAlign: 'center', color: '#059669', fontWeight: '600' }]}>{row.weekly}</Text>
                  <Text style={[styles.tdElement, { flex: 2, textAlign: 'right', color: '#047857', fontWeight: '700' }]}>{row.total}</Text>
                </View>
              ))}

              {/* Combined Direct Cashout Footer Strip */}
              <View style={[styles.innerWithdrawStrip, { padding: isSmallScreen ? 8 : 12 }]}>
                <View>
                  <Text style={styles.withdrawStripLabel}>TOTAL WITHDRAWABLE</Text>
                  <Text style={[styles.withdrawStripValue, { fontSize: isSmallScreen ? 13 : 15 }]}>Rs. 1,500.00</Text>
                </View>
                <Pressable style={[styles.withdrawStripButton, { paddingVertical: isSmallScreen ? 6 : 8 }]} onPress={() => navigation.navigate('WithdrawalRequest' as never)}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // CHANGED: Fixed 180px container height layout parameters
  headerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 24,
  },
  headerHamburger: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerGreetingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  headerNotif: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  notifIcon: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#00A86B', // Matches the gradient baseline highlight edge color
  },
  // CHANGED: Absolute overlapping position alignment parameters 
  floatingCardPositioner: {
    position: 'absolute',
    bottom: -40, 
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletCardLeft: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  walletAmount: {
    fontWeight: '900',
    color: '#0F172A',
  },
  walletSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  // NEW: Center Vertical divider rule
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  walletCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletCircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F3ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoneyButton: {
    backgroundColor: '#008F5A',
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addMoneyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentModifier: {
    paddingHorizontal: 16,
    paddingTop: 50, // Added padding space layout buffer so content clears the floating absolute overlapping card position
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  analyticsHorizontalContent: {
    paddingRight: 8,
    gap: 10,
  },
  analyticsHCard: {
    width: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderBottomWidth: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  analyticsHIcon: {
    fontSize: 15,
    marginBottom: 6,
  },
  analyticsHLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  analyticsHValue: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCapsule: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
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
    fontSize: 11,
    fontWeight: '700',
  },
  actionCapsuleArrow: {
    fontSize: 14,
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
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008F5A',
  },
  tableMainWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tableHeaderBackgroundRow: {
    backgroundColor: '#008F5A',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  thElement: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdElement: {
    fontSize: 9.5,
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
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  withdrawStripValue: {
    fontWeight: '900',
    color: '#008F5A',
    marginTop: 2,
  },
  withdrawStripButton: {
    backgroundColor: '#008F5A',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  withdrawStripButtonArrow: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  withdrawStripButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    width: 230,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 24,
    fontSize: 16,
    color: '#0F172A',
    marginRight: 8,
    textAlign: 'center',
  },
  menuIconDanger: {
    color: '#DC2626',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuTitleDanger: {
    color: '#DC2626',
  },
  menuSubtitle: {
    marginTop: 1,
    fontSize: 10,
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
    borderRadius: 16,
    padding: 24,
    width: '80%',
    elevation: 8,
  },
  pinModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  pinModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  pinCodeInput: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#0F172A',
    letterSpacing: 6,
  },
  pinModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  pinModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  pinCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  pinConfirmButton: {
    backgroundColor: '#008F5A',
  },
  pinConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});