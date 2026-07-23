import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  transactionId?: string;
}

interface ApiError {
  message: string;
}

type FilterType = 'daily' | 'weekly' | 'monthly' | 'all';

export default function AnalysisScreen() {
  const navigation = useNavigation();
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

      if (filter === 'daily') return toDateStr(txDate) === toDateStr(selectedDate);
      if (filter === 'weekly') return daysDiff <= 7;
      if (filter === 'monthly') return daysDiff <= 30;
      return true;
    });
  };

  const changeDate = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const isROITx = (tx: Transaction) =>
    tx.transactionId && tx.transactionId.startsWith('ROI-DAILY-');

  const getTransactionStats = (filteredTxs: Transaction[]) => {
    const approvedDeposits = filteredTxs
      .filter((tx) => ['plan', 'deposit', 'Deposit'].includes(tx.type))
      .filter((tx) => ['approved', 'Approved'].includes(tx.status))
      .filter((tx) => !isROITx(tx));

    const processedWithdrawals = filteredTxs
      .filter((tx) => ['withdrawal', 'Withdrawal'].includes(tx.type))
      .filter((tx) => ['approved', 'Approved', 'withdrawn', 'Withdrawn'].includes(tx.status));

    const roiTransactions = filteredTxs.filter((tx) => isROITx(tx));

    return {
      deposits: approvedDeposits.reduce((sum, tx) => sum + tx.amount, 0),
      withdrawals: processedWithdrawals.reduce((sum, tx) => sum + tx.amount, 0),
      roi: roiTransactions.reduce((sum, tx) => sum + tx.amount, 0),
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
        return 'Deposit';
      case 'withdrawal':
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
        return '↻';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBack}>
          <Text style={styles.headerBackText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0EA5E9']} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>Filter by Period</Text>
            <Text style={styles.filterCount}>{filteredTransactions.length} transactions</Text>
          </View>
          <View style={styles.filterButtons}>
            {(['daily', 'weekly', 'monthly', 'all'] as FilterType[]).map((filterOption) => (
              <Pressable
                key={filterOption}
                style={[
                  styles.filterButton,
                  filter === filterOption && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(filterOption)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === filterOption && styles.filterButtonTextActive,
                  ]}
                >
                  {filterOption === 'all' ? 'All Time' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {filter === 'daily' && (
            <View style={styles.datePickerRow}>
              <Pressable onPress={() => changeDate(-1)} style={styles.dateArrow}>
                <Text style={styles.dateArrowText}>{'<'}</Text>
              </Pressable>

              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-PK', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>

              <Pressable onPress={() => changeDate(1)} style={styles.dateArrow}>
                <Text style={styles.dateArrowText}>{'>'}</Text>
              </Pressable>

              <Pressable onPress={() => setSelectedDate(new Date())} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#0EA5E9' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.statIcon}>↓</Text>
            </View>
            <Text style={styles.statLabel}>Total Deposits</Text>
            <Text style={[styles.statValue, { color: '#0284C7' }]}>{formatCurrency(stats.deposits)}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.statIcon}>↻</Text>
            </View>
            <Text style={styles.statLabel}>ROI Earned</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{formatCurrency(stats.roi)}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.statIcon}>↑</Text>
            </View>
            <Text style={styles.statLabel}>Total Withdrawn</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{formatCurrency(stats.withdrawals)}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Text style={styles.statIcon}>#</Text>
            </View>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.count}</Text>
          </View>
        </View>

        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>Transaction History</Text>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtext}>Try selecting a different time period</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={filteredTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: getTransactionTypeColor(item.type) + '18' }]}>
                    <Text style={[styles.txIconText, { color: getTransactionTypeColor(item.type) }]}>
                      {getTransactionTypeIcon(item.type)}
                    </Text>
                  </View>

                  <View style={styles.txInfo}>
                    <View style={styles.txInfoTop}>
                      <Text style={styles.txType}>{getTransactionTypeLabel(item.type)}</Text>
                      <Text style={[styles.txAmount, { color: ['withdrawal', 'Withdrawal'].includes(item.type) ? '#DC2626' : '#0F172A' }]}>
                        {['withdrawal', 'Withdrawal'].includes(item.type) ? '-' : '+'}
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                    <View style={styles.txInfoBottom}>
                      <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                      <View style={[styles.txStatusBadge, { backgroundColor: (item.status || '').toLowerCase() === 'approved' || (item.status || '').toLowerCase() === 'withdrawn' ? '#DCFCE7' : '#FEF3C7' }]}>
                        <Text style={[styles.txStatusText, { color: (item.status || '').toLowerCase() === 'approved' || (item.status || '').toLowerCase() === 'withdrawn' ? '#059669' : '#D97706' }]}>
                          {(item.status || '').charAt(0).toUpperCase() + (item.status || '').slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.footer} />
      </ScrollView>

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 36,
  },

  // Scroll
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Filter card
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // Date picker
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateArrowText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  dateText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 165,
    textAlign: 'center',
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Transaction section
  txSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  txSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },

  // Transaction item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  txInfo: {
    flex: 1,
  },
  txInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txInfoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  txStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Empty state
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Footer
  footer: {
    height: 40,
  },
});
