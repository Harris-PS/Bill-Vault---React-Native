// src/screens/main/BillDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Divider,
  useTheme,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useBillsStore } from '../../store/bills.store';
import { useAuthStore } from '../../store/auth.store';
import { HomeStackParamList, BillItem } from '../../types';
import { brandColors, borderRadius, spacing, typography, shadows } from '../../theme';
import { CURRENCY } from '../../constants/config';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'BillDetail'>;
  route: RouteProp<HomeStackParamList, 'BillDetail'>;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(amount);

export const BillDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { billId } = route.params;
  const { fetchBillById, selectedBill, deleteBill, isLoading } = useBillsStore();
  const { user } = useAuthStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchBillById(billId);
  }, [billId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBill(billId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!selectedBill) return;
    try {
      await Share.share({
        message: `Bill from ${selectedBill.store_name}\nDate: ${selectedBill.payment_date}\nTotal: ${formatCurrency(selectedBill.total_amount)}\nInvoice: ${selectedBill.invoice_number}`,
        title: `Bill - ${selectedBill.store_name}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedBill) return;
    const html = generateReceiptHTML(selectedBill);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e: any) {
      Alert.alert('Error', 'Could not generate PDF: ' + e.message);
    }
  };

  if (isLoading || !selectedBill) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const bill = selectedBill;
  let formattedDate = bill.payment_date;
  try {
    formattedDate = format(new Date(bill.payment_date), 'dd MMMM yyyy');
  } catch {}

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFF"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {bill.store_name}
          </Text>
          <IconButton
            icon="pencil-outline"
            iconColor="#FFF"
            size={22}
            onPress={() => navigation.navigate('BillEdit', { billId })}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Receipt Image */}
        {bill.receipt_image_url && !imageError && (
          <Surface style={styles.imageCard} elevation={2}>
            <Image
              source={{ uri: bill.receipt_image_url }}
              style={styles.receiptImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          </Surface>
        )}

        {/* Amount Hero */}
        <Surface style={[styles.amountCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <Text style={[styles.amountLabel, { color: theme.colors.onPrimaryContainer }]}>
            Total Amount
          </Text>
          <Text style={[styles.amountValue, { color: theme.colors.primary }]}>
            {formatCurrency(bill.total_amount)}
          </Text>
          <View style={styles.amountMeta}>
            <Chip compact icon="calendar" style={{ backgroundColor: 'transparent' }}>
              {formattedDate}
            </Chip>
            <Chip compact icon="clock-outline" style={{ backgroundColor: 'transparent' }}>
              {bill.payment_time}
            </Chip>
          </View>
        </Surface>

        {/* Store Details */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Store Details
          </Text>
          <Divider style={styles.divider} />
          <DetailRow icon="store-outline" label="Store" value={bill.store_name} />
          {bill.store_address && (
            <DetailRow icon="map-marker-outline" label="Address" value={bill.store_address} />
          )}
          {bill.gst_number && (
            <DetailRow icon="identifier" label="GSTIN" value={bill.gst_number} monospace />
          )}
          {bill.invoice_number && (
            <DetailRow icon="receipt" label="Invoice #" value={bill.invoice_number} monospace />
          )}
        </Surface>

        {/* Payment Details */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Payment Details
          </Text>
          <Divider style={styles.divider} />
          <DetailRow icon="credit-card-outline" label="Method" value={bill.payment_method} />
          <DetailRow icon="currency-inr" label="Currency" value={bill.currency} />
          {bill.subtotal > 0 && (
            <DetailRow icon="tag-outline" label="Subtotal" value={formatCurrency(bill.subtotal)} />
          )}
          {bill.tax_amount > 0 && (
            <DetailRow icon="percent" label="Tax (GST)" value={formatCurrency(bill.tax_amount)} />
          )}
          {bill.discount > 0 && (
            <DetailRow icon="sale" label="Discount" value={`-${formatCurrency(bill.discount)}`} valueColor="#059669" />
          )}
          <Divider style={styles.divider} />
          <DetailRow
            icon="sigma"
            label="Total"
            value={formatCurrency(bill.total_amount)}
            bold
            valueColor={theme.colors.primary}
          />
        </Surface>

        {/* Bill Items */}
        {bill.bill_items && bill.bill_items.length > 0 && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Items ({bill.bill_items.length})
            </Text>
            <Divider style={styles.divider} />
            {bill.bill_items.map((item: BillItem, idx: number) => (
              <ItemRow key={item.id || idx} item={item} theme={theme} />
            ))}
          </Surface>
        )}

        {/* QR Data */}
        {bill.qr_raw_data && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              QR Data
            </Text>
            <Divider style={styles.divider} />
            <Text style={[styles.qrData, { color: theme.colors.onSurfaceVariant }]}>
              {bill.qr_raw_data}
            </Text>
          </Surface>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained-tonal"
            icon="share-outline"
            onPress={handleShare}
            style={styles.actionBtn}
            compact
          >
            Share
          </Button>
          <Button
            mode="contained-tonal"
            icon="file-pdf-box"
            onPress={handleDownloadPDF}
            style={styles.actionBtn}
            compact
          >
            PDF
          </Button>
          <Button
            mode="contained-tonal"
            icon="delete-outline"
            onPress={handleDelete}
            style={[styles.actionBtn, { backgroundColor: theme.colors.errorContainer }]}
            textColor={theme.colors.error}
            compact
          >
            Delete
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
  monospace?: boolean;
}> = ({ icon, label, value, bold, valueColor, monospace }) => {
  const theme = useTheme();
  return (
    <View style={detailStyles.row}>
      <MaterialCommunityIcons name={icon as any} size={16} color={theme.colors.outline} style={detailStyles.icon} />
      <Text style={[detailStyles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          { color: valueColor || theme.colors.onSurface },
          bold && detailStyles.bold,
          monospace && detailStyles.mono,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
};

const ItemRow: React.FC<{ item: BillItem; theme: any }> = ({ item, theme }) => (
  <View style={itemStyles.row}>
    <View style={itemStyles.left}>
      <Text style={[itemStyles.name, { color: theme.colors.onSurface }]} numberOfLines={2}>
        {item.item_name}
      </Text>
      <Text style={[itemStyles.qty, { color: theme.colors.onSurfaceVariant }]}>
        Qty: {item.item_quantity} × ₹{item.item_price.toFixed(2)}
      </Text>
    </View>
    <Text style={[itemStyles.total, { color: theme.colors.primary }]}>
      ₹{item.item_total.toFixed(2)}
    </Text>
  </View>
);

function generateReceiptHTML(bill: any): string {
  const items = (bill.bill_items || [])
    .map(
      (i: BillItem) =>
        `<tr><td>${i.item_name}</td><td>${i.item_quantity}</td><td>₹${i.item_price.toFixed(2)}</td><td>₹${i.item_total.toFixed(2)}</td></tr>`
    )
    .join('');

  return `
    <html><body style="font-family:sans-serif;max-width:400px;margin:auto;padding:20px">
    <h2 style="color:#6750A4">BillVault Receipt</h2>
    <h3>${bill.store_name}</h3>
    <p>${bill.store_address || ''}</p>
    ${bill.gst_number ? `<p>GSTIN: <b>${bill.gst_number}</b></p>` : ''}
    ${bill.invoice_number ? `<p>Invoice: <b>${bill.invoice_number}</b></p>` : ''}
    <p>Date: ${bill.payment_date} | Time: ${bill.payment_time}</p>
    <p>Payment: ${bill.payment_method}</p>
    <hr/>
    ${items ? `<table width="100%"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${items}</table><hr/>` : ''}
    <p>Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
    <p>Tax: ₹${bill.tax_amount.toFixed(2)}</p>
    ${bill.discount ? `<p>Discount: -₹${bill.discount.toFixed(2)}</p>` : ''}
    <h3>Total: ₹${bill.total_amount.toFixed(2)}</h3>
    <p style="color:#888;font-size:11px">Generated by BillVault</p>
    </body></html>
  `;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  imageCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  receiptImage: { width: '100%', height: 220 },
  amountCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 13, marginBottom: 4 },
  amountValue: { fontSize: 40, fontWeight: '800', marginBottom: spacing.sm },
  amountMeta: { flexDirection: 'row', gap: spacing.xs },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardTitle: { ...typography.titleSmall, fontWeight: '700', marginBottom: spacing.sm },
  divider: { marginBottom: spacing.sm },
  qrData: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  actionBtn: { flex: 1, borderRadius: borderRadius.full },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  icon: { marginTop: 2, width: 20 },
  label: { width: 80, fontSize: 13 },
  value: { flex: 1, fontSize: 13, textAlign: 'right' },
  bold: { fontWeight: '700', fontSize: 15 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
});

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  left: { flex: 1, paddingRight: spacing.sm },
  name: { fontSize: 13, fontWeight: '500' },
  qty: { fontSize: 11, marginTop: 2 },
  total: { fontSize: 14, fontWeight: '700' },
});
