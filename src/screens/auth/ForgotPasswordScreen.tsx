// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { brandColors, borderRadius, spacing, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const schema = z.object({ email: z.string().email('Enter a valid email') });

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading } = useAuthStore();
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: { email: string }) => {
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <Text style={styles.headerSub}>We'll send you a reset link</Text>
      </LinearGradient>

      <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
        {sent ? (
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.onSurface }]}>Check your email</Text>
            <Text style={[styles.successDesc, { color: theme.colors.onSurfaceVariant }]}>
              We've sent a password reset link to your email address.
            </Text>
            <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.btn}>
              Back to Login
            </Button>
          </View>
        ) : (
          <>
            <Text style={[styles.bodyDesc, { color: theme.colors.onSurfaceVariant }]}>
              Enter the email associated with your account and we'll send you a link to reset your password.
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldWrap}>
                  <TextInput
                    label="Email Address"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    mode="outlined"
                    left={<TextInput.Icon icon="email-outline" />}
                    error={!!errors.email}
                    outlineStyle={{ borderRadius: borderRadius.md }}
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </View>
              )}
            />
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={[styles.btn, { borderRadius: borderRadius.full }]}
              contentStyle={{ paddingVertical: spacing.xs }}
              labelStyle={{ fontSize: 15, fontWeight: '600' }}
            >
              Send Reset Link
            </Button>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    marginBottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  bodyDesc: {
    ...typography.bodyMedium,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  fieldWrap: { marginBottom: spacing.md },
  btn: { marginTop: spacing.md },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  successTitle: { ...typography.headlineSmall, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  successDesc: { ...typography.bodyMedium, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
});
