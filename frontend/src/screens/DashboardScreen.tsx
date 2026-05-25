import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AxiosError } from 'axios';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  message?: string;
}

export default function DashboardScreen() {
  const { userData, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const errorMessage = axiosError.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
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
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const user = dashboardData.user || userData;
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0EA5E9']} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back, {user?.name || 'User'}</Text>
          <Text style={styles.welcomeSubtitle}>
            Active: <Text style={styles.activePlanText}>{user?.activePlan || 'No Plan'}</Text>
          </Text>
        </View>

        {/* Main Wallet Card */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text style={styles.walletAmount}>{formatCurrency(user?.currentBalance || 0)}</Text>
          <View style={styles.walletFooter}>
            <Text style={styles.walletFooterText}>Your current spending balance</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Ledger Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Invested</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalDepositsApproved)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ROI Earned</Text>
              <Text style={[styles.statValue, styles.roiValue]}>{formatCurrency(stats.totalROIEarnings)}</Text>
            </View>

            <View style={[styles.statCard, { gridColumn: 1 }]}>
              <Text style={styles.statLabel}>Total Withdrawn</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalWithdrawalsApproved)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Net Balance</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalDepositsApproved + stats.totalROIEarnings - stats.totalWithdrawalsApproved)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable
              style={[styles.actionButton, styles.depositButton]}
              onPress={() => Alert.alert('Deposit', 'Deposit feature coming soon')}
            >
              <Text style={styles.actionButtonIcon}>💳</Text>
              <Text style={styles.actionButtonText}>Deposit Funds</Text>
              <Text style={styles.actionButtonSubtext}>Add money to your wallet</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => Alert.alert('Withdraw', 'Withdraw feature coming soon')}
            >
              <Text style={styles.actionButtonIcon}>💸</Text>
              <Text style={styles.actionButtonText}>Withdraw</Text>
              <Text style={styles.actionButtonSubtext}>Request a withdrawal</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
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
  welcomeSection: {
    marginTop: 20,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  activePlanText: {
    color: '#0EA5E9',
    fontWeight: '700',
  },
  walletCard: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0F2FE',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  walletFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 12,
  },
  walletFooterText: {
    fontSize: 13,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  statsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  roiValue: {
    color: '#10B981',
  },
  actionsSection: {
    marginVertical: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  depositButton: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  withdrawButton: {
    backgroundColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  actionButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});
