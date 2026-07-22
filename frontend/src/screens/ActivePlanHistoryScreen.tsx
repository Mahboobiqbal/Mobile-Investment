import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { AxiosError } from 'axios';

import ErrorModal from '../components/ErrorModal';
import api from '../services/api';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ActivePlanHistoryRoute = RouteProp<RootStackParamList, 'ActivePlanHistory'>;

interface Transaction {
  _id: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | string;
  transactionId?: string;
  status: string;
  planId?: string | { _id: string };
  planName?: string;
  createdAt: string;
}

interface ApiError {
  message: string;
}

export default function ActivePlanHistoryScreen() {
  const route = useRoute<ActivePlanHistoryRoute>();
  const { selectedPlanName } = route.params;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [dailyRate, setDailyRate] = useState(0.005);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const fetchData = useCallback(async () => {
    try {
      const [txRes, statsRes] = await Promise.all([
        api.get<{ transactions: Transaction[] }>('/wallet/transactions'),
        api.get<{ currentBalance: number; dailyRate: number }>('/auth/dashboard-stats'),
      ]);
      setTransactions(txRes.data.transactions || []);
      setCurrentBalance(statsRes.data.currentBalance || 0);
      setDailyRate(statsRes.data.dailyRate || 0.005);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setErrorModal({
        visible: true,
        title: 'Failed to Load History',
        message: axiosError.response?.data?.message || axiosError.message || 'Unable to load plan history.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const roiHistory = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const isRoi = transaction.type === 'roi' || transaction.transactionId?.startsWith('ROI-DAILY-');
        return isRoi;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions]);

  const totalEarned = roiHistory.reduce((sum, transaction) => sum + transaction.amount, 0);
  const projectedDailyCommission = currentBalance * dailyRate;

  const formatCurrency = (amount: number) =>
    `Rs. ${amount.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008F5A" />
          <Text style={styles.loadingText}>Loading active plan history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0 }]}>
      <View style={styles.summary}>
        <Text style={styles.eyebrow}>Active Plan</Text>
        <Text style={styles.planName} numberOfLines={2}>
          {selectedPlanName}
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Investment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(currentBalance)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Commission</Text>
            <Text style={styles.summaryValue}>{formatCurrency(projectedDailyCommission)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalEarned)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Entries</Text>
            <Text style={styles.summaryValue}>{roiHistory.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={roiHistory}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#008F5A']} />}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Daily Earned Commission</Text>}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No commission history yet</Text>
            <Text style={styles.emptyText}>Daily earned commission will appear here after ROI is distributed.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.historyRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{new Date(item.createdAt).getDate()}</Text>
              <Text style={styles.dateMonth}>
                {new Date(item.createdAt).toLocaleDateString('en-PK', { month: 'short' })}
              </Text>
            </View>

            <View style={styles.historyDetails}>
              <Text style={styles.historyTitle}>Day {roiHistory.length - index} Commission</Text>
              <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.historyMeta} numberOfLines={1}>
                {(item.status || 'approved').toUpperCase()} {item.transactionId ? `- ${item.transactionId}` : ''}
              </Text>
            </View>

            <Text style={styles.amountText}>+{formatCurrency(item.amount)}</Text>
          </View>
        )}
      />

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
  summary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#008F5A',
    textTransform: 'uppercase',
  },
  planName: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  summaryItem: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  dateBadge: {
    width: 46,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '900',
    color: '#047857',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
  },
  historyDetails: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyDate: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  historyMeta: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  amountText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '900',
    color: '#008F5A',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
  },
});
