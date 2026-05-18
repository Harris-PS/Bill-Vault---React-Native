// src/components/BillCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Bill } from '../types';
import { CURRENCY } from '../constants/config';
import { borderRadius, shadows, spacing } from '../theme';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

interface BillCardProps {
  bill: Bill;
  onPress: () => void;
}

const PAYMENT_ICONS: Record<string, string> = {
  UPI: 'cellphone-nfc',
  'Credit Card': 'credit-card',
  'Debit Card': 'credit-card-outline',
  Cash: 'cash',
  'Net Banking': 'bank',
  Wallet: 'wallet',
  BNPL: 'clock-time-four',
  Other: 'receipt',
};

const STORE_COLORS = [
  '#7C3AED', '#DC2626', '#2563EB', '#D97706', '#059669',
  '#9333EA', '#E11D48', '#0891B2', '#15803D', '#B45309',
];

function getStoreColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return STORE_COLORS[Math.abs(hash) % STORE_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const BillCard: React.FC<BillCardProps> = ({ bill, onPress }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const storeColor = getStoreColor(bill.store_name);
  const initials = getInitials(bill.store_name);
  const paymentIcon = PAYMENT_ICONS[bill.payment_method] || 'receipt';

  const formattedAmount = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(bill.total_amount);

  let formattedDate = '';
  try {
    formattedDate = format(new Date(bill.payment_date), 'dd MMM yy');
  } catch {
    formattedDate = bill.payment_date;
  }

  return (
    <AnimatedTouchable
      style={[styles.wrapper, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Surface
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface },
          shadows.md,
        ]}
        elevation={2}
      >
        {/* Store Avatar */}
        <View style={[styles.avatar, { backgroundColor: storeColor + '20' }]}>
          <Text style={[styles.avatarText, { color: storeColor }]}>{initials}</Text>
        </View>

        {/* Store Name */}
        <Text
          style={[styles.storeName, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {bill.store_name}
        </Text>

        {/* Amount */}
        <Text style={[styles.amount, { color: theme.colors.primary }]}>
          {formattedAmount}
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
          {formattedDate}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.paymentBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons
              name={paymentIcon as any}
              size={12}
              color={theme.colors.secondary}
            />
            <Text style={[styles.paymentText, { color: theme.colors.secondary }]}>
              {bill.payment_method}
            </Text>
          </View>
          {bill.bill_items && bill.bill_items.length > 0 && (
            <Text style={[styles.itemCount, { color: theme.colors.outline }]}>
              {bill.bill_items.length} items
            </Text>
          )}
        </View>

        {/* Accent Bar */}
        <View style={[styles.accentBar, { backgroundColor: storeColor }]} />
      </Surface>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '500',
  },
  itemCount: {
    fontSize: 10,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
});
