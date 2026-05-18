// src/constants/config.ts
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const APP_NAME = 'BillVault';
export const APP_VERSION = '1.0.0';

export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
};

export const STORAGE_BUCKETS = {
  RECEIPTS: 'receipts',
};

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_MB = 10;

export const PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Net Banking',
  'Wallet',
  'BNPL',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Transport',
  'Healthcare',
  'Electronics',
  'Clothing',
  'Entertainment',
  'Utilities',
  'Education',
  'Travel',
  'Home & Garden',
  'Personal Care',
  'Other',
] as const;
