// src/store/bills.store.ts
import { create } from 'zustand';
import { Bill, AnalyticsSummary } from '../types';
import { billsService } from '../services/bills.service';

interface BillsState {
  bills: Bill[];
  selectedBill: Bill | null;
  analytics: AnalyticsSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  };

  // Actions
  fetchBills: (userId: string) => Promise<void>;
  refreshBills: (userId: string) => Promise<void>;
  fetchBillById: (billId: string) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>;
  fetchAnalytics: (userId: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilters: (filters: BillsState['filters']) => void;
  clearFilters: () => void;
  setSelectedBill: (bill: Bill | null) => void;
}

export const useBillsStore = create<BillsState>((set, get) => ({
  bills: [],
  selectedBill: null,
  analytics: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  searchQuery: '',
  filters: {},

  fetchBills: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { searchQuery, filters } = get();
      const bills = await billsService.getBills(userId, {
        search: searchQuery || undefined,
        ...filters,
      });
      set({ bills });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshBills: async (userId) => {
    set({ isRefreshing: true });
    try {
      const { searchQuery, filters } = get();
      const bills = await billsService.getBills(userId, {
        search: searchQuery || undefined,
        ...filters,
      });
      set({ bills });
    } finally {
      set({ isRefreshing: false });
    }
  },

  fetchBillById: async (billId) => {
    set({ isLoading: true });
    try {
      const bill = await billsService.getBillById(billId);
      set({ selectedBill: bill });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBill: async (billId) => {
    await billsService.deleteBill(billId);
    set((state) => ({ bills: state.bills.filter((b) => b.id !== billId) }));
  },

  updateBill: async (billId, updates) => {
    const updated = await billsService.updateBill(billId, updates);
    set((state) => ({
      bills: state.bills.map((b) => (b.id === billId ? { ...b, ...updated } : b)),
      selectedBill: state.selectedBill?.id === billId ? { ...state.selectedBill, ...updated } : state.selectedBill,
    }));
  },

  fetchAnalytics: async (userId) => {
    set({ isLoading: true });
    try {
      const analytics = await billsService.getAnalytics(userId);
      set({ analytics: analytics as AnalyticsSummary | null });
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {}, searchQuery: '' }),
  setSelectedBill: (selectedBill) => set({ selectedBill }),
}));
