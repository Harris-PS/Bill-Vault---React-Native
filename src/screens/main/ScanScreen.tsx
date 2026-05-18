// src/screens/main/ScanScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  TextInput,
  useTheme,
  HelperText,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { parseReceiptText, parseQRData } from '../../services/ocr.service';
import { billsService } from '../../services/bills.service';
import { useAuthStore } from '../../store/auth.store';
import { useBillsStore } from '../../store/bills.store';
import { brandColors, borderRadius, spacing, typography, shadows } from '../../theme';
import { HomeStackParamList, ParsedReceipt } from '../../types';

const { width, height } = Dimensions.get('window');

type Mode = 'qr' | 'ocr' | 'upload' | 'manual';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;
};

export const ScanScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fetchBills } = useBillsStore();

  const [mode, setMode] = useState<Mode>('qr');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<ParsedReceipt> | null>(null);

  // Manual form state
  const [manualData, setManualData] = useState({
    store_name: '',
    total_amount: '',
    payment_method: 'UPI',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleQRScan = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    const parsed = parseQRData(data);
    setParsedData({ ...parsed, raw_text: data });
    await saveBill({ ...parsed } as any, undefined, data);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImage(uri);
    }
  };

  const handleCaptureImage = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      // In production: call Google Cloud Vision API here
      // For now, generate a minimal parsed result with placeholders
      const mockText = `Sample Store\n123 Main Road, Mumbai\nGSTIN: 27ABCDE1234F1Z5\nInvoice: INV-2024-001\nDate: ${new Date().toLocaleDateString('en-IN')}\nTotal: 599.00\nCash`;
      const parsed = parseReceiptText(mockText);
      parsed.raw_text = mockText;
      setParsedData(parsed);
      Alert.alert(
        'Receipt Processed',
        `Store: ${parsed.store_name}\nTotal: ₹${parsed.total_amount}`,
        [
          { text: 'Edit & Save', onPress: () => {} },
          { text: 'Save Now', onPress: () => saveBill(parsed, uri) },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBill = async (data: Partial<ParsedReceipt>, imageUri?: string, qrData?: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const bill = await billsService.createBill(
        user.id,
        data as ParsedReceipt,
        imageUri,
        qrData
      );
      await fetchBills(user.id);
      Alert.alert('✅ Bill Saved!', `${data.store_name} — ₹${data.total_amount}`, [
        {
          text: 'View Bill',
          onPress: () => navigation.navigate('BillDetail', { billId: bill.id }),
        },
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualData.store_name || !manualData.total_amount) {
      Alert.alert('Missing Fields', 'Please enter store name and amount');
      return;
    }
    await saveBill({
      store_name: manualData.store_name,
      total_amount: parseFloat(manualData.total_amount),
      payment_method: manualData.payment_method,
      payment_date: manualData.payment_date,
      store_address: '',
      gst_number: '',
      invoice_number: '',
      payment_time: '00:00',
      subtotal: parseFloat(manualData.total_amount),
      tax_amount: 0,
      discount: 0,
      items: [],
      raw_text: '',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text style={styles.headerTitle}>Scan Bill</Text>
        <Text style={styles.headerSub}>QR code, camera, or upload</Text>
      </LinearGradient>

      {/* Mode Selector */}
      <View style={[styles.modeSelector, { backgroundColor: theme.colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {([
            { value: 'qr', label: 'QR Scan', icon: 'qrcode-scan' },
            { value: 'ocr', label: 'Camera', icon: 'camera-outline' },
            { value: 'upload', label: 'Upload', icon: 'image-outline' },
            { value: 'manual', label: 'Manual', icon: 'pencil-outline' },
          ] as { value: Mode; label: string; icon: string }[]).map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.modeTab,
                mode === m.value && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => setMode(m.value)}
            >
              <MaterialCommunityIcons
                name={m.icon as any}
                size={20}
                color={mode === m.value ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.modeLabel,
                  {
                    color:
                      mode === m.value ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* QR Mode */}
        {mode === 'qr' && (
          <View>
            {!permission?.granted ? (
              <View style={styles.permBox}>
                <MaterialCommunityIcons name="camera-off" size={48} color={theme.colors.outline} />
                <Text style={[styles.permTitle, { color: theme.colors.onSurface }]}>
                  Camera Permission Required
                </Text>
                <Button mode="contained" onPress={requestPermission} style={{ borderRadius: 50 }}>
                  Grant Permission
                </Button>
              </View>
            ) : (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleQRScan}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                >
                  {/* Scan overlay */}
                  <View style={styles.scanOverlay}>
                    <View style={styles.scanFrame}>
                      <View style={[styles.corner, styles.cornerTL]} />
                      <View style={[styles.corner, styles.cornerTR]} />
                      <View style={[styles.corner, styles.cornerBL]} />
                      <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                    <Text style={styles.scanHint}>Point at a UPI / receipt QR code</Text>
                  </View>
                </CameraView>
                {scanned && (
                  <Button
                    mode="contained"
                    onPress={() => setScanned(false)}
                    style={styles.rescanBtn}
                  >
                    Scan Again
                  </Button>
                )}
              </View>
            )}
          </View>
        )}

        {/* Camera OCR Mode */}
        {mode === 'ocr' && (
          <View style={styles.uploadArea}>
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: theme.colors.primary }]}
              onPress={handleCaptureImage}
            >
              <MaterialCommunityIcons name="camera" size={48} color={theme.colors.primary} />
              <Text style={[styles.uploadTitle, { color: theme.colors.onSurface }]}>
                Capture Receipt
              </Text>
              <Text style={[styles.uploadSub, { color: theme.colors.onSurfaceVariant }]}>
                Take a photo of any receipt or bill
              </Text>
            </TouchableOpacity>
            {isProcessing && (
              <View style={styles.processingBox}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}>
                  Extracting text...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <View style={styles.uploadArea}>
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: theme.colors.primary }]}
              onPress={handlePickImage}
            >
              <MaterialCommunityIcons name="image-plus" size={48} color={theme.colors.primary} />
              <Text style={[styles.uploadTitle, { color: theme.colors.onSurface }]}>
                Choose from Gallery
              </Text>
              <Text style={[styles.uploadSub, { color: theme.colors.onSurfaceVariant }]}>
                PNG, JPG, or WEBP supported
              </Text>
            </TouchableOpacity>
            {isProcessing && (
              <View style={styles.processingBox}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}>
                  Processing receipt...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Manual Entry Mode */}
        {mode === 'manual' && (
          <Surface style={[styles.manualCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.manualTitle, { color: theme.colors.onSurface }]}>
              Enter Bill Details
            </Text>

            <TextInput
              label="Store Name *"
              value={manualData.store_name}
              onChangeText={(v) => setManualData((d) => ({ ...d, store_name: v }))}
              mode="outlined"
              left={<TextInput.Icon icon="store-outline" />}
              outlineStyle={{ borderRadius: borderRadius.md }}
              style={styles.manualInput}
            />

            <TextInput
              label="Total Amount (₹) *"
              value={manualData.total_amount}
              onChangeText={(v) => setManualData((d) => ({ ...d, total_amount: v }))}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Icon icon="currency-inr" />}
              outlineStyle={{ borderRadius: borderRadius.md }}
              style={styles.manualInput}
            />

            <TextInput
              label="Date (YYYY-MM-DD)"
              value={manualData.payment_date}
              onChangeText={(v) => setManualData((d) => ({ ...d, payment_date: v }))}
              mode="outlined"
              left={<TextInput.Icon icon="calendar" />}
              outlineStyle={{ borderRadius: borderRadius.md }}
              style={styles.manualInput}
            />

            <TextInput
              label="Payment Method"
              value={manualData.payment_method}
              onChangeText={(v) => setManualData((d) => ({ ...d, payment_method: v }))}
              mode="outlined"
              left={<TextInput.Icon icon="credit-card-outline" />}
              outlineStyle={{ borderRadius: borderRadius.md }}
              style={styles.manualInput}
            />

            <TextInput
              label="Notes"
              value={manualData.notes}
              onChangeText={(v) => setManualData((d) => ({ ...d, notes: v }))}
              multiline
              numberOfLines={3}
              mode="outlined"
              left={<TextInput.Icon icon="note-outline" />}
              outlineStyle={{ borderRadius: borderRadius.md }}
              style={styles.manualInput}
            />

            <Button
              mode="contained"
              onPress={handleManualSave}
              loading={isProcessing}
              disabled={isProcessing}
              style={[styles.saveBtn, { borderRadius: borderRadius.full }]}
              contentStyle={{ paddingVertical: spacing.xs }}
              labelStyle={{ fontSize: 15, fontWeight: '600' }}
            >
              Save Bill
            </Button>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const FRAME_SIZE = width * 0.65;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  modeSelector: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  modeLabel: { fontSize: 13, fontWeight: '600' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  permBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permTitle: { ...typography.titleMedium, textAlign: 'center' },
  cameraWrap: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  camera: { width: '100%', height: height * 0.55 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  scanHint: { color: '#FFF', marginTop: spacing.xl, fontSize: 13, textAlign: 'center' },
  rescanBtn: { marginTop: spacing.md, borderRadius: 50 },
  uploadArea: { gap: spacing.md },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadTitle: { ...typography.titleMedium, fontWeight: '600', textAlign: 'center' },
  uploadSub: { ...typography.bodySmall, textAlign: 'center' },
  processingBox: { alignItems: 'center', padding: spacing.lg },
  manualCard: { borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.sm },
  manualTitle: { ...typography.titleMedium, fontWeight: '700', marginBottom: spacing.sm },
  manualInput: { backgroundColor: 'transparent' },
  saveBtn: { marginTop: spacing.sm },
});
