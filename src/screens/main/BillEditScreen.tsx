// src/screens/main/BillEditScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBillsStore } from '../../store/bills.store';
import { HomeStackParamList } from '../../types';
import { brandColors, borderRadius, spacing } from '../../theme';
import { PAYMENT_METHODS } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'BillEdit'>;
  route: RouteProp<HomeStackParamList, 'BillEdit'>;
};

export const BillEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { billId } = route.params;
  const { fetchBillById, selectedBill, updateBill, isLoading } = useBillsStore();

  const [form, setForm] = useState({
    store_name: '',
    store_address: '',
    gst_number: '',
    invoice_number: '',
    payment_method: '',
    payment_date: '',
    payment_time: '',
    subtotal: '',
    tax_amount: '',
    discount: '',
    total_amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchBillById(billId);
  }, [billId]);

  useEffect(() => {
    if (selectedBill) {
      setForm({
        store_name: selectedBill.store_name || '',
        store_address: selectedBill.store_address || '',
        gst_number: selectedBill.gst_number || '',
        invoice_number: selectedBill.invoice_number || '',
        payment_method: selectedBill.payment_method || '',
        payment_date: selectedBill.payment_date || '',
        payment_time: selectedBill.payment_time || '',
        subtotal: String(selectedBill.subtotal || ''),
        tax_amount: String(selectedBill.tax_amount || ''),
        discount: String(selectedBill.discount || ''),
        total_amount: String(selectedBill.total_amount || ''),
        notes: selectedBill.notes || '',
      });
    }
  }, [selectedBill]);

  const handleSave = async () => {
    try {
      await updateBill(billId, {
        store_name: form.store_name,
        store_address: form.store_address,
        gst_number: form.gst_number,
        invoice_number: form.invoice_number,
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        payment_time: form.payment_time,
        subtotal: parseFloat(form.subtotal) || 0,
        tax_amount: parseFloat(form.tax_amount) || 0,
        discount: parseFloat(form.discount) || 0,
        total_amount: parseFloat(form.total_amount) || 0,
        notes: form.notes,
      });
      Alert.alert('Saved!', 'Bill updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const Field = ({ label, field, keyboardType = 'default', icon }: any) => (
    <TextInput
      label={label}
      value={form[field as keyof typeof form]}
      onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
      mode="outlined"
      keyboardType={keyboardType}
      left={icon ? <TextInput.Icon icon={icon} /> : undefined}
      outlineStyle={{ borderRadius: borderRadius.md }}
      style={styles.input}
    />
  );

  if (isLoading && !selectedBill) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" iconColor="#FFF" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Edit Bill</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Store Info
        </Text>
        <Field label="Store Name" field="store_name" icon="store-outline" />
        <Field label="Store Address" field="store_address" icon="map-marker-outline" />
        <Field label="GSTIN" field="gst_number" icon="identifier" />
        <Field label="Invoice Number" field="invoice_number" icon="receipt" />

        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Payment Info
        </Text>
        <Field label="Payment Method" field="payment_method" icon="credit-card-outline" />
        <Field label="Date (YYYY-MM-DD)" field="payment_date" icon="calendar" />
        <Field label="Time (HH:MM)" field="payment_time" icon="clock-outline" />

        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Amounts
        </Text>
        <Field label="Subtotal (₹)" field="subtotal" keyboardType="numeric" icon="tag-outline" />
        <Field label="Tax Amount (₹)" field="tax_amount" keyboardType="numeric" icon="percent" />
        <Field label="Discount (₹)" field="discount" keyboardType="numeric" icon="sale" />
        <Field label="Total Amount (₹)" field="total_amount" keyboardType="numeric" icon="sigma" />

        <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Notes
        </Text>
        <TextInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={<TextInput.Icon icon="note-outline" />}
          outlineStyle={{ borderRadius: borderRadius.md }}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.saveBtn, { borderRadius: borderRadius.full }]}
          contentStyle={{ paddingVertical: spacing.xs }}
          labelStyle={{ fontSize: 15, fontWeight: '600' }}
        >
          Save Changes
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  input: { backgroundColor: 'transparent' },
  saveBtn: { marginTop: spacing.md },
});
