// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Checkbox,
  useTheme,
  HelperText,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList, LoginFormData } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { brandColors, borderRadius, spacing, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean(),
});

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember_me: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientMid]}
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="receipt" size={40} color="#FFF" />
        </View>
        <Text style={styles.appName}>BillVault</Text>
        <Text style={styles.tagline}>Your Smart Bill Companion</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.form, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
          Welcome back
        </Text>
        <Text style={[styles.formSub, { color: theme.colors.onSurfaceVariant }]}>
          Sign in to access your bills
        </Text>

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldWrap}>
              <TextInput
                label="Email address"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                mode="outlined"
                left={<TextInput.Icon icon="email-outline" />}
                error={!!errors.email}
                style={styles.input}
                outlineStyle={{ borderRadius: borderRadius.md }}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldWrap}>
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                mode="outlined"
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword((v) => !v)}
                  />
                }
                error={!!errors.password}
                style={styles.input}
                outlineStyle={{ borderRadius: borderRadius.md }}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Remember me + Forgot */}
        <View style={styles.rememberRow}>
          <Controller
            control={control}
            name="remember_me"
            render={({ field: { onChange, value } }) => (
              <View style={styles.checkRow}>
                <Checkbox
                  status={value ? 'checked' : 'unchecked'}
                  onPress={() => onChange(!value)}
                  color={theme.colors.primary}
                />
                <Text
                  style={{ color: theme.colors.onSurface, fontSize: 13 }}
                  onPress={() => onChange(!value)}
                >
                  Remember me
                </Text>
              </View>
            )}
          />
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitBtn}
          contentStyle={styles.submitContent}
          labelStyle={styles.submitLabel}
        >
          Sign In
        </Button>

        <View style={styles.signupRow}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Create one
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  formTitle: {
    ...typography.headlineSmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSub: {
    ...typography.bodyMedium,
    marginBottom: spacing.xl,
  },
  fieldWrap: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: 'transparent',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  submitContent: {
    paddingVertical: spacing.xs,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
});
