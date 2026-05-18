// src/components/GradientHeader.tsx
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '../theme';
import { brandColors } from '../theme';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  leftAction,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[brandColors.gradientStart, brandColors.gradientMid, brandColors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.content}>
        {leftAction && <View style={styles.leftAction}>{leftAction}</View>}
        <View style={styles.titleArea}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  leftAction: {
    marginRight: spacing.sm,
  },
  titleArea: {
    flex: 1,
  },
  rightAction: {
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.headlineSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
