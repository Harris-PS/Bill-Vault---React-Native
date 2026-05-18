// src/screens/main/DashboardScreen.tsx
import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Searchbar, useTheme, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { BillCard } from '../../components/BillCard';
import { StatCard } from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { useAuthStore } from '../../store/auth.store';
import { useBillsStore } from '../../store/bills.store';
import { brandColors, spacing, typography, borderRadius } from '../../theme';
import { CURRENCY, PAYMENT_METHODS } from '../../constants/config';
import { HomeStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;
};

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const {
    bills, isLoading, isRefreshing, analytics,
    fetchBills, refreshBills, fetchAnalytics,
    searchQuery, setSearchQuery, filters, setFilters, clearFilters,
  } = useBillsStore();

  useEffect(() => {
    if (user) {
      fetchBills(user.id);
      fetchAnalytics(user.id);
    }
  }, [user]);

  const handleRefresh = useCallback(() => {
    if (user) refreshBills(user.id);
  }, [user]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (user) fetchBills(user.id);
  };

  const totalSpent = analytics?.total_spent || 0;
  const formattedTotal = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: 0,
  }).format(totalSpent);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.first_name || 'there';
  const today = format(new Date(), 'EEEE, d MMMM');

  const ListHeader = () => (
    <>
      {/* Gradient Hero */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {firstName} 👋</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Total Spend Card */}
        <View style={styles.spendCard}>
          <Text style={styles.spendLabel}>Total Spend This Month</Text>
          <Text style={styles.spendAmount}>{formattedTotal}</Text>
          <Text style={styles.spendSub}>{analytics?.bill_count || 0} receipts stored</Text>
        </View>
      </LinearGradient>

      {/* Stats Row */}
      <View style={[styles.section, { marginTop: -spacing.lg }]}>
        <View style={styles.statsRow}>
          <StatCard
            label="Bills"
            value={String(analytics?.bill_count || 0)}
            icon="receipt-text-outline"
            iconColor="#7C3AED"
          />
          <StatCard
            label="Avg Bill"
            value={`₹${Math.round(analytics?.average_bill || 0)}`}
            icon="chart-line"
            iconColor="#2563EB"
          />
          <StatCard
            label="Highest"
            value={`₹${Math.round(analytics?.highest_bill || 0)}`}
            icon="trending-up"
            iconColor="#DC2626"
          />
        </View>
      </View>

      {/* Search */}
      <View style={styles.section}>
        <Searchbar
          placeholder="Search bills, stores..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ fontSize: 14 }}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Payment method filters */}
      <View style={styles.section}>
        <FlatList
          data={['All', ...PAYMENT_METHODS]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Chip
              selected={
                item === 'All'
                  ? !filters.payment_method
                  : filters.payment_method === item
              }
              onPress={() => {
                if (item === 'All') {
                  setFilters({ ...filters, payment_method: undefined });
                } else {
                  setFilters({ ...filters, payment_method: item });
                }
                if (user) fetchBills(user.id);
              }}
              style={styles.chip}
              compact
            >
              {item}
            </Chip>
          )}
        />
      </View>

      {/* Bills header */}
      <View style={[styles.section, styles.sectionHeader]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Recent Bills
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={[styles.seeAll, { color: theme.colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isLoading && bills.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-text-outline"
            title="No bills yet"
            description="Scan your first receipt or upload a bill to get started."
          />
        }
        renderItem={({ item }) => (
          <BillCard
            bill={item}
            onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[brandColors.gradientStart]}
            tintColor={brandColors.gradientStart}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spendCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  spendLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  spendAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  spendSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchBar: {
    borderRadius: borderRadius.full,
    elevation: 0,
    marginBottom: spacing.xs,
  },
  chipRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  columnWrapper: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
});
