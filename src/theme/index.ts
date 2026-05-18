// src/theme/index.ts
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

// Material Design 3 Color Palette — BillVault Brand
export const brandColors = {
  primary: '#6750A4',        // MD3 Purple Primary
  primaryContainer: '#EADDFF',
  secondary: '#625B71',
  secondaryContainer: '#E8DEF8',
  tertiary: '#7D5260',
  tertiaryContainer: '#FFD8E4',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  outline: '#79747E',
  background: '#FFFBFE',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#1C1B1F',
  onBackground: '#1C1B1F',

  // Custom Brand Colors
  income: '#1B873E',
  expense: '#B3261E',
  warning: '#F6A62B',
  info: '#1565C0',

  // Surface elevations (MD3)
  elevation0: '#FFFBFE',
  elevation1: '#F4EFF4',
  elevation2: '#ECE6F0',
  elevation3: '#E6DFF0',

  // Gradients
  gradientStart: '#7C3AED',
  gradientMid: '#9333EA',
  gradientEnd: '#A855F7',
};

export const darkBrandColors = {
  primary: '#D0BCFF',
  primaryContainer: '#4F378B',
  secondary: '#CCC2DC',
  secondaryContainer: '#4A4458',
  tertiary: '#EFB8C8',
  tertiaryContainer: '#633B48',
  error: '#F2B8B5',
  errorContainer: '#8C1D18',
  surface: '#141218',
  surfaceVariant: '#49454F',
  outline: '#938F99',
  background: '#141218',
  onPrimary: '#371E73',
  onSecondary: '#332D41',
  onSurface: '#E6E1E5',
  onBackground: '#E6E1E5',

  income: '#81C784',
  expense: '#EF9A9A',
  warning: '#FFD54F',
  info: '#90CAF9',

  elevation0: '#141218',
  elevation1: '#211F26',
  elevation2: '#2B2930',
  elevation3: '#332F3A',

  gradientStart: '#7C3AED',
  gradientMid: '#9333EA',
  gradientEnd: '#A855F7',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: brandColors.primaryContainer,
    secondary: brandColors.secondary,
    secondaryContainer: brandColors.secondaryContainer,
    tertiary: brandColors.tertiary,
    tertiaryContainer: brandColors.tertiaryContainer,
    error: brandColors.error,
    errorContainer: brandColors.errorContainer,
    background: brandColors.background,
    surface: brandColors.surface,
    surfaceVariant: brandColors.surfaceVariant,
    outline: brandColors.outline,
    onPrimary: brandColors.onPrimary,
    onSecondary: brandColors.onSecondary,
    onSurface: brandColors.onSurface,
    onBackground: brandColors.onBackground,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkBrandColors.primary,
    primaryContainer: darkBrandColors.primaryContainer,
    secondary: darkBrandColors.secondary,
    secondaryContainer: darkBrandColors.secondaryContainer,
    tertiary: darkBrandColors.tertiary,
    tertiaryContainer: darkBrandColors.tertiaryContainer,
    error: darkBrandColors.error,
    errorContainer: darkBrandColors.errorContainer,
    background: darkBrandColors.background,
    surface: darkBrandColors.surface,
    surfaceVariant: darkBrandColors.surfaceVariant,
    outline: darkBrandColors.outline,
    onPrimary: darkBrandColors.onPrimary,
    onSecondary: darkBrandColors.onSecondary,
    onSurface: darkBrandColors.onSurface,
    onBackground: darkBrandColors.onBackground,
  },
};

export const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: brandColors.primary,
    background: brandColors.background,
    card: brandColors.surface,
    text: brandColors.onSurface,
    border: brandColors.outline,
  },
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkBrandColors.primary,
    background: darkBrandColors.background,
    card: darkBrandColors.surface,
    text: darkBrandColors.onSurface,
    border: darkBrandColors.outline,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const typography = {
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '400' as const },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '400' as const },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '400' as const },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '400' as const },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
