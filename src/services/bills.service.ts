// src/services/bills.service.ts
import { supabase } from './supabase';
import { Bill, BillItem, ParsedReceipt } from '../types';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { STORAGE_BUCKETS } from '../constants/config';

export const billsService = {
  async getBills(userId: string, options?: {
    search?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    limit?: number;
    offset?: number;
  }): Promise<Bill[]> {
    let query = supabase
      .from('bills')
      .select('*, bill_items(*)')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (options?.search) {
      query = query.ilike('store_name', `%${options.search}%`);
    }
    if (options?.payment_method) {
      query = query.eq('payment_method', options.payment_method);
    }
    if (options?.date_from) {
      query = query.gte('payment_date', options.date_from);
    }
    if (options?.date_to) {
      query = query.lte('payment_date', options.date_to);
    }
    if (options?.min_amount !== undefined) {
      query = query.gte('total_amount', options.min_amount);
    }
    if (options?.max_amount !== undefined) {
      query = query.lte('total_amount', options.max_amount);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getBillById(billId: string): Promise<Bill | null> {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*)')
      .eq('id', billId)
      .single();
    if (error) return null;
    return data;
  },

  async createBill(
    userId: string,
    receipt: ParsedReceipt,
    imageUri?: string,
    qrData?: string
  ): Promise<Bill> {
    let receipt_image_url = '';

    if (imageUri) {
      receipt_image_url = await billsService.uploadReceiptImage(userId, imageUri);
    }

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        user_id: userId,
        store_name: receipt.store_name,
        store_address: receipt.store_address,
        gst_number: receipt.gst_number,
        invoice_number: receipt.invoice_number,
        payment_method: receipt.payment_method || 'Other',
        payment_date: receipt.payment_date || new Date().toISOString().split('T')[0],
        payment_time: receipt.payment_time || new Date().toTimeString().split(' ')[0],
        currency: 'INR',
        subtotal: receipt.subtotal || 0,
        tax_amount: receipt.tax_amount || 0,
        discount: receipt.discount || 0,
        total_amount: receipt.total_amount || 0,
        receipt_image_url,
        qr_raw_data: qrData || '',
        notes: '',
      })
      .select()
      .single();

    if (billError) throw billError;

    if (receipt.items && receipt.items.length > 0) {
      const items = receipt.items.map((item) => ({
        bill_id: bill.id,
        item_name: item.item_name || 'Unknown Item',
        item_quantity: item.item_quantity || 1,
        item_price: item.item_price || 0,
        item_total: item.item_total || 0,
        product_category: item.product_category || 'Other',
      }));

      const { error: itemsError } = await supabase.from('bill_items').insert(items);
      if (itemsError) console.error('Failed to insert bill items:', itemsError);
    }

    return bill;
  },

  async updateBill(billId: string, updates: Partial<Bill>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update(updates)
      .eq('id', billId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBill(billId: string): Promise<void> {
    const { error } = await supabase.from('bills').delete().eq('id', billId);
    if (error) throw error;
  },

  async uploadReceiptImage(userId: string, imageUri: string): Promise<string> {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.RECEIPTS)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.RECEIPTS)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async getAnalytics(userId: string) {
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total_amount, payment_date, payment_method, bill_items(product_category, item_total)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!bills || bills.length === 0) return null;

    const total_spent = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const bill_count = bills.length;
    const average_bill = total_spent / bill_count;
    const highest_bill = Math.max(...bills.map((b) => b.total_amount || 0));

    // Monthly data
    const monthlyMap: Record<string, { total: number; count: number }> = {};
    bills.forEach((b) => {
      if (!b.payment_date) return;
      const month = b.payment_date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { total: 0, count: 0 };
      monthlyMap[month].total += b.total_amount || 0;
      monthlyMap[month].count += 1;
    });
    const monthly_data = Object.entries(monthlyMap)
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Category data
    const categoryMap: Record<string, number> = {};
    bills.forEach((b) => {
      (b.bill_items as any[])?.forEach((item) => {
        const cat = item.product_category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.item_total || 0);
      });
    });
    const category_data = Object.entries(categoryMap)
      .map(([category, total]) => ({
        category,
        total,
        percentage: (total / total_spent) * 100,
      }))
      .sort((a, b) => b.total - a.total);

    // Payment method data
    const pmMap: Record<string, number> = {};
    bills.forEach((b) => {
      const pm = b.payment_method || 'Other';
      pmMap[pm] = (pmMap[pm] || 0) + (b.total_amount || 0);
    });
    const payment_method_data = Object.entries(pmMap).map(([method, total]) => ({
      method,
      total,
    }));

    return {
      total_spent,
      bill_count,
      average_bill,
      highest_bill,
      monthly_data,
      category_data,
      payment_method_data,
    };
  },

  async searchBillsByItem(userId: string, itemName: string): Promise<Bill[]> {
    const { data: items, error } = await supabase
      .from('bill_items')
      .select('bill_id')
      .ilike('item_name', `%${itemName}%`);

    if (error) throw error;
    if (!items || items.length === 0) return [];

    const billIds = [...new Set(items.map((i) => i.bill_id))];
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*, bill_items(*)')
      .eq('user_id', userId)
      .in('id', billIds);

    if (billsError) throw billsError;
    return bills || [];
  },
};
