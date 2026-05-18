// src/types/index.ts

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_name: string;
  item_quantity: number;
  item_price: number;
  item_total: number;
  product_category: string;
}

export interface Bill {
  id: string;
  user_id: string;
  store_name: string;
  store_address: string;
  gst_number: string;
  invoice_number: string;
  payment_method: string;
  payment_date: string;
  payment_time: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  receipt_image_url: string;
  qr_raw_data: string;
  notes: string;
  created_at: string;
  bill_items?: BillItem[];
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  category_name: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
}

export interface ParsedReceipt {
  store_name: string;
  store_address: string;
  gst_number: string;
  invoice_number: string;
  payment_method: string;
  payment_date: string;
  payment_time: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  items: Partial<BillItem>[];
  raw_text: string;
}

export interface MonthlyExpense {
  month: string;
  total: number;
  count: number;
}

export interface CategoryExpense {
  category: string;
  total: number;
  percentage: number;
}

export interface AnalyticsSummary {
  total_spent: number;
  bill_count: number;
  average_bill: number;
  highest_bill: number;
  monthly_data: MonthlyExpense[];
  category_data: CategoryExpense[];
  payment_method_data: { method: string; total: number }[];
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  BillDetail: { billId: string };
  BillEdit: { billId: string };
  Search: undefined;
};

export interface SignupFormData {
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
