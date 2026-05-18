// src/screens/main/SearchScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  useTheme,
  Chip,
  Surface,
  ActivityIndicator,
  Menu,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BillCard } from '../../components/BillCard';
import { EmptyState } from '../../components/EmptyState';
import { useBillsStore } from '../../store/bills.store';
import { useAuthStore } from '../../store/auth.store';
import { brandColors, borderRadius, spacing, typography } from '../../theme';
import { HomeStackParamList } from '../../types';
import { PAYMENT_METHODS } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Search'>;
};

export const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { bills, fetchBills, setSearchQuery, setFilters, clearFilters, filters, searchQuery } = useBillsStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string | undefined>(filters.payment_method);
  const [showFilters, setShowFilters] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const doSearch = useCallback(async (query: string) => {
    if (!user) return;
    setIsLoading(true);
    setSearchQuery(query);
    await fetchBills(user.id);
    setIsLoading(false);
  }, [user]);

  const applyFilters = async () => {
    if (!user) return;
    setFilters({
      payment_method: paymentFilter,
      min_amount: minAmount ? parseFloat(minAmount) : undefined,
      max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
    setIsLoading(true);
    await fetchBills(user.id);
    setIsLoading(false);
    setShowFilters(false);
  };

  const resetFilters = async () => {
    setPaymentFilter(undefined);
    setMinAmount('');
    setMaxAmount('');
    clearFilters();
    if (user) {
      setIsLoading(true);
      await fetchBills(user.id);
      setIsLoading(false);
    }
  };

  const activeFilterCount = [paymentFilter, minAmount, maxAmount].filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchHeader, {
        backgroundColor: theme.colors.surface,
        paddingTop: insets.top + spacing.sm,
      }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Searchbar
            placeholder="Search stores, items..."
            value={localSearch}
            onChangeText={(q) => {
              setLocalSearch(q);
              doSearch(q);
            }}
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
            inputStyle={{ fontSize: 14 }}
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: activeFilterCount > 0 ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
            ]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={20}
              color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Payment method filter chips */}
        {showFilters && (
          <Surface style={[styles.filterPanel, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>
              Payment Method
            </Text>
            <FlatList
              data={PAYMENT_METHODS}
              horizontal
              keyExtractor={(i) => i}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <Chip
                  selected={paymentFilter === item}
                  onPress={() => setPaymentFilter(paymentFilter === item ? undefined : item)}
                  compact
                  style={styles.chip}
                >
                  {item}
                </Chip>
              )}
            />
            <View style={styles.filterActions}>
              <Button onPress={resetFilters} compact>Reset</Button>
              <Button mode="contained" onPress={applyFilters} compact style={{ borderRadius: 50 }}>
                Apply
              </Button>
            </View>
          </Surface>
        )}
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            bills.length > 0 ? (
              <Text style={[styles.resultCount, { color: theme.colors.onSurfaceVariant }]}>
                {bills.length} result{bills.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            localSearch || activeFilterCount > 0 ? (
              <EmptyState
                icon="magnify-close"
                title="No results found"
                description={`No bills match "${localSearch || 'your filters'}"`}
                actionLabel="Clear Search"
                onAction={() => {
                  setLocalSearch('');
                  resetFilters();
                }}
              />
            ) : (
              <EmptyState
                icon="magnify"
                title="Search Your Bills"
                description="Type a store name or product name to find your bills"
              />
            )
          }
          renderItem={({ item }) => (
            <BillCard
              bill={item}
              onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    borderRadius: borderRadius.full,
    elevation: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  filterPanel: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  filterLabel: { ...typography.labelMedium, marginBottom: spacing.sm },
  chipRow: { gap: spacing.xs, paddingBottom: spacing.sm },
  chip: { borderRadius: borderRadius.full },
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  resultCount: {
    ...typography.bodySmall,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listContent: { paddingBottom: spacing.xxl },
  columnWrapper: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
});
