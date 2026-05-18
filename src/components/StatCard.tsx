// src/components/StatCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, shadows, spacing, typography } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
  trend?: number; // percentage change
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  trend,
  compact = false,
}) => {
  const theme = useTheme();
  const color = iconColor || theme.colors.primary;

  return (
    <Surface
      style={[
        styles.card,
        compact && styles.compact,
        { backgroundColor: theme.colors.surface },
        shadows.sm,
      ]}
      elevation={1}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={compact ? 18 : 22} color={color} />
      </View>
      <Text
        style={[styles.value, { color: theme.colors.onSurface }, compact && styles.compactValue]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      {trend !== undefined && (
        <View style={styles.trend}>
          <MaterialCommunityIcons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend >= 0 ? '#DC2626' : '#059669'}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? '#DC2626' : '#059669' },
            ]}
          >
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 120,
  },
  compact: {
    padding: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.titleLarge,
    fontWeight: '700',
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 16,
  },
  label: {
    ...typography.bodySmall,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
