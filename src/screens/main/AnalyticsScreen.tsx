// src/screens/main/AnalyticsScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Text, Surface, useTheme, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, G, Text as SvgText, Circle, Path } from 'react-native-svg';
import { useAuthStore } from '../../store/auth.store';
import { useBillsStore } from '../../store/bills.store';
import { brandColors, borderRadius, spacing, typography, shadows } from '../../theme';
import { CURRENCY } from '../../constants/config';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.md * 4;
const CHART_HEIGHT = 180;

const CATEGORY_COLORS = [
  '#7C3AED', '#2563EB', '#DC2626', '#D97706', '#059669',
  '#9333EA', '#0891B2', '#E11D48', '#15803D', '#B45309',
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: 0,
  }).format(n);

// ── Simple Bar Chart using react-native-svg ──────────────────────────────────
const BarChart: React.FC<{
  data: { x: string; y: number }[];
  color: string;
  themeColors: any;
}> = ({ data, color, themeColors }) => {
  if (!data.length) return null;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const barW = Math.floor(CHART_WIDTH / data.length) - 8;
  const pad = 4;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
      {data.map((d, i) => {
        const bH = Math.max(4, (d.y / maxY) * CHART_HEIGHT);
        const x = i * (CHART_WIDTH / data.length) + pad;
        const y = CHART_HEIGHT - bH;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={bH}
              fill={color}
              rx={4}
              ry={4}
              opacity={0.85}
            />
            <SvgText
              x={x + barW / 2}
              y={CHART_HEIGHT + 16}
              textAnchor="middle"
              fill={themeColors.onSurfaceVariant}
              fontSize={10}
            >
              {d.x}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

// ── Simple Donut Chart ────────────────────────────────────────────────────────
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size: number;
}> = ({ data, size }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const R = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = R * 0.45;
  const innerR = R - strokeW / 2;

  let startAngle = -Math.PI / 2;
  const segments = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const seg = { ...d, startAngle, angle };
    startAngle += angle;
    return seg;
  });

  const arcPath = (sa: number, ea: number, r: number) => {
    const x1 = cx + r * Math.cos(sa);
    const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea);
    const y2 = cy + r * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => (
        <Path
          key={i}
          d={arcPath(seg.startAngle, seg.startAngle + seg.angle, innerR)}
          stroke={seg.color}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
    </Svg>
  );
};

export const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { analytics, fetchAnalytics, isLoading } = useBillsStore();

  useEffect(() => {
    if (user) fetchAnalytics(user.id);
  }, [user]);

  if (isLoading && !analytics) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="chart-bar" size={64} color={theme.colors.outline} />
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No data yet. Add some bills first!
        </Text>
      </View>
    );
  }

  const { monthly_data, category_data, payment_method_data, total_spent, bill_count, average_bill, highest_bill } = analytics;

  const barData = monthly_data.map((d) => ({
    x: d.month.slice(5), // MM
    y: d.total,
  }));

  const donutData = category_data.slice(0, 6).map((d, i) => ({
    label: d.category,
    value: d.total,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSub}>Your spending insights</Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{formatCurrency(total_spent)}</Text>
            <Text style={styles.heroLabel}>Total Spent</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{bill_count}</Text>
            <Text style={styles.heroLabel}>Bills</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.heroStat}>
            <Text style={styles.heroValue}>{formatCurrency(average_bill)}</Text>
            <Text style={styles.heroLabel}>Average</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Monthly Bar Chart */}
        {barData.length > 0 && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Monthly Spending
            </Text>
            <View style={styles.chartWrap}>
              <BarChart data={barData} color={brandColors.gradientStart} themeColors={theme.colors} />
            </View>
          </Surface>
        )}

        {/* Category Breakdown */}
        {category_data.length > 0 && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Category Breakdown
            </Text>

            {donutData.length > 1 && (
              <View style={styles.donutRow}>
                <DonutChart data={donutData} size={160} />
                <View style={styles.legend}>
                  {donutData.slice(0, 5).map((d) => (
                    <View key={d.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                      <Text style={[styles.legendLabel, { color: theme.colors.onSurface }]} numberOfLines={1}>
                        {d.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {category_data.slice(0, 6).map((cat, i) => (
              <View key={cat.category} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }]} />
                <View style={styles.catInfo}>
                  <View style={styles.catLabelRow}>
                    <Text style={[styles.catName, { color: theme.colors.onSurface }]}>
                      {cat.category}
                    </Text>
                    <Text style={[styles.catAmount, { color: theme.colors.onSurface }]}>
                      {formatCurrency(cat.total)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={Math.min(cat.percentage / 100, 1)}
                    color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    style={styles.catBar}
                  />
                  <Text style={[styles.catPercent, { color: theme.colors.onSurfaceVariant }]}>
                    {cat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* Payment Method Breakdown */}
        {payment_method_data.length > 0 && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Payment Methods
            </Text>
            {payment_method_data
              .sort((a, b) => b.total - a.total)
              .map((pm, i) => {
                const pct = total_spent > 0 ? (pm.total / total_spent) * 100 : 0;
                return (
                  <View key={pm.method} style={styles.pmRow}>
                    <MaterialCommunityIcons
                      name={
                        pm.method === 'UPI' ? 'cellphone-nfc' :
                        pm.method.includes('Card') ? 'credit-card' :
                        pm.method === 'Cash' ? 'cash' : 'bank'
                      }
                      size={20}
                      color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    />
                    <View style={styles.pmInfo}>
                      <View style={styles.pmLabelRow}>
                        <Text style={[styles.pmName, { color: theme.colors.onSurface }]}>
                          {pm.method}
                        </Text>
                        <Text style={[styles.pmAmount, { color: theme.colors.onSurface }]}>
                          {formatCurrency(pm.total)} ({pct.toFixed(0)}%)
                        </Text>
                      </View>
                      <ProgressBar
                        progress={Math.min(pct / 100, 1)}
                        color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                        style={styles.catBar}
                      />
                    </View>
                  </View>
                );
              })}
          </Surface>
        )}

        {/* Highest Bill Callout */}
        <Surface style={[styles.highlightCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
          <MaterialCommunityIcons name="trophy-outline" size={32} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.highlightLabel, { color: theme.colors.onPrimaryContainer }]}>
              Highest Single Bill
            </Text>
            <Text style={[styles.highlightValue, { color: theme.colors.primary }]}>
              {formatCurrency(highest_bill)}
            </Text>
          </View>
        </Surface>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.bodyMedium, textAlign: 'center' },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  separator: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { borderRadius: borderRadius.lg, padding: spacing.md },
  cardTitle: { ...typography.titleSmall, fontWeight: '700', marginBottom: spacing.sm },
  chartWrap: { alignItems: 'center', marginVertical: spacing.sm },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  legend: { flex: 1, gap: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, flex: 1 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  catInfo: { flex: 1 },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: { fontSize: 13, fontWeight: '500' },
  catAmount: { fontSize: 13, fontWeight: '600' },
  catBar: { height: 6, borderRadius: 3, marginBottom: 2 },
  catPercent: { fontSize: 10 },
  pmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pmInfo: { flex: 1 },
  pmLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pmName: { fontSize: 13, fontWeight: '500' },
  pmAmount: { fontSize: 12 },
  highlightCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  highlightLabel: { fontSize: 13 },
  highlightValue: { fontSize: 24, fontWeight: '800' },
});
