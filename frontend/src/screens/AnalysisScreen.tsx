import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AxiosError } from 'axios';
import ErrorModal from '../components/ErrorModal';

interface Transaction {
  _id: string;
  type: 'plan' | 'deposit' | 'withdrawal' | 'Deposit' | 'Withdrawal' | 'roi';
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
}

interface ApiError {
  message: string;
}

type FilterType = 'all' | 'week' | 'month' | 'year';

export default function AnalysisScreen() {
  const navigation = useNavigation();
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('month');
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get<{ transactions: Transaction[] }>('/wallet/transactions');
      setTransactions(response.data.transactions || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load transactions';
      setErrorModal({
        visible: true,
        title: 'Failed to Load Transactions',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

      if (filter === 'week') return daysDiff <= 7;
      if (filter === 'month') return daysDiff <= 30;
      if (filter === 'year') return daysDiff <= 365;
      return true;
    });
  };

  const getTransactionStats = (filteredTxs: Transaction[]) => {
    return {
      deposits: filteredTxs.filter((tx) => ['plan', 'deposit', 'Deposit'].includes(tx.type)).reduce((sum, tx) => sum + tx.amount, 0),
      withdrawals: filteredTxs.filter((tx) => ['withdrawal', 'Withdrawal'].includes(tx.type)).reduce((sum, tx) => sum + tx.amount, 0),
      roi: filteredTxs.filter((tx) => tx.type === 'roi').reduce((sum, tx) => sum + tx.amount, 0),
      count: filteredTxs.length,
    };
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plan':
        return 'Plan Purchase';
      case 'deposit':
      case 'Deposit':
        return 'Deposit';
      case 'withdrawal':
      case 'Withdrawal':
        return 'Withdrawal';
      case 'roi':
        return 'ROI Earnings';
      default:
        return 'Transaction';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plan':
        return '#8B5CF6';
      case 'deposit':
        return '#0EA5E9';
      case 'withdrawal':
        return '#EF4444';
      case 'roi':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plan':
        return '★';
      case 'deposit':
        return '↓';
      case 'withdrawal':
        return '↑';
      case 'roi':
        return '📈';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading transaction history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredTransactions = getFilteredTransactions();
  const stats = getTransactionStats(filteredTransactions);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0EA5E9']} />}
      >
        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Period</Text>
          <View style={styles.filterButtons}>
            {['week', 'month', 'year', 'all'].map((filterOption) => (
              <Pressable
                key={filterOption}
                style={[
                  styles.filterButton,
                  filter === filterOption && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(filterOption as FilterType)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === filterOption && styles.filterButtonTextActive,
                  ]}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.depositStat]}>
            <Text style={styles.statIcon}>💳</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.deposits)}</Text>
          </View>

          <View style={[styles.statCard, styles.roiStat]}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statLabel}>ROI Earned</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.roi)}</Text>
          </View>

          <View style={[styles.statCard, styles.withdrawalStat]}>
            <Text style={styles.statIcon}>🏦</Text>
            <Text style={styles.statLabel}>Total Withdrawn</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.withdrawals)}</Text>
          </View>

          <View style={[styles.statCard, styles.countStat]}>
            <Text style={styles.statIcon}>#</Text>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions found</Text>
              <Text style={styles.emptyStateSubtext}>Try selecting a different time period</Text>
            </View>
          ) : (
<FlatList
               scrollEnabled={false}
               data={filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
               keyExtractor={(item) => item._id}
               renderItem={({ item }) => (
                 <View style={styles.transactionItem}>
                   <View style={[styles.transactionIcon, { backgroundColor: getTransactionTypeColor(item.type) + '20' }]}>
                     <Text style={[styles.transactionIconText, { color: getTransactionTypeColor(item.type) }]}>
                       {getTransactionTypeIcon(item.type)}
                     </Text>
                   </View>

                   <View style={styles.transactionDetails}>
                     <Text style={styles.transactionType}>{getTransactionTypeLabel(item.type)}</Text>
                     <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                   </View>

                   <View style={styles.transactionAmountContainer}>
                     <Text style={[styles.transactionAmount, { color: getTransactionTypeColor(item.type) }]}>
                       {['withdrawal', 'Withdrawal'].includes(item.type) ? '-' : '+'}
                       {formatCurrency(item.amount)}
                     </Text>
<Text style={[styles.transactionStatus, { color: (item.status || '').toLowerCase() === 'approved' ? '#10B981' : '#F59E0B' }]}>
                        {(item.status || '').charAt(0).toUpperCase() + (item.status || '').slice(1)}
                     </Text>
                   </View>
                 </View>
               )}
             />
          )}
        </View>

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Error Modal */}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 50,
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
  filterSection: {
    marginVertical: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 20,
  },
  statCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  depositStat: {
    backgroundColor: '#DBEAFE',
  },
  roiStat: {
    backgroundColor: '#DCFCE7',
  },
  withdrawalStat: {
    backgroundColor: '#FEE2E2',
  },
  countStat: {
    backgroundColor: '#F3E8FF',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  transactionsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});
