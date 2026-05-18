// src/screens/auth/SignupScreen.tsx
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
  useTheme,
  HelperText,
  ProgressBar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthStackParamList, SignupFormData } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { brandColors, borderRadius, spacing, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least 1 uppercase letter')
  .regex(/[0-9]/, 'At least 1 number')
  .regex(/[^A-Za-z0-9]/, 'At least 1 special character');

const schema = z
  .object({
    first_name: z.string().min(2, 'First name required'),
    last_name: z.string().min(2, 'Last name required'),
    address: z.string().min(5, 'Address required'),
    email: z.string().email('Enter a valid email'),
    phone_number: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score / 5;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['', '#DC2626', '#F59E0B', '#3B82F6', '#059669', '#7C3AED'];

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signUp, isLoading } = useAuthStore();
  const [passwordValue, setPasswordValue] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      address: '',
      email: '',
      phone_number: '',
      password: '',
      confirm_password: '',
    },
  });

  const strength = getPasswordStrength(passwordValue);
  const strengthIndex = Math.ceil(strength * 5);

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signUp(data);
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    }
  };

  const Field = ({
    name,
    label,
    icon,
    keyboardType,
    autoCapitalize = 'words',
    secure,
    showToggle,
    onToggle,
    onChangeExtra,
  }: any) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.fieldWrap}>
          <TextInput
            label={label}
            value={value}
            onChangeText={(v) => {
              onChange(v);
              if (onChangeExtra) onChangeExtra(v);
            }}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={secure ? 'none' : autoCapitalize}
            autoCorrect={false}
            mode="outlined"
            left={<TextInput.Icon icon={icon} />}
            right={
              showToggle !== undefined ? (
                <TextInput.Icon
                  icon={showToggle ? 'eye-off-outline' : 'eye-outline'}
                  onPress={onToggle}
                />
              ) : undefined
            }
            secureTextEntry={secure && !showToggle}
            error={!!(errors as any)[name]}
            style={styles.input}
            outlineStyle={{ borderRadius: borderRadius.md }}
          />
          <HelperText type="error" visible={!!(errors as any)[name]}>
            {(errors as any)[name]?.message}
          </HelperText>
        </View>
      )}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientMid]}
          style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Start managing your bills smarter</Text>
        </LinearGradient>

        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.halfField]}>
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      label="First Name"
                      value={value}
                      onChangeText={onChange}
                      mode="outlined"
                      left={<TextInput.Icon icon="account-outline" />}
                      error={!!errors.first_name}
                      style={styles.input}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                    />
                    <HelperText type="error" visible={!!errors.first_name}>
                      {errors.first_name?.message}
                    </HelperText>
                  </>
                )}
              />
            </View>
            <View style={[styles.fieldWrap, styles.halfField]}>
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      label="Last Name"
                      value={value}
                      onChangeText={onChange}
                      mode="outlined"
                      error={!!errors.last_name}
                      style={styles.input}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                    />
                    <HelperText type="error" visible={!!errors.last_name}>
                      {errors.last_name?.message}
                    </HelperText>
                  </>
                )}
              />
            </View>
          </View>

          <Field name="email" label="Email Address" icon="email-outline" autoCapitalize="none" keyboardType="email-address" />
          <Field name="phone_number" label="Phone Number (+91)" icon="phone-outline" keyboardType="number-pad" autoCapitalize="none" />
          <Field name="address" label="Address" icon="map-marker-outline" autoCapitalize="sentences" />

          {/* Password with strength */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldWrap}>
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={(v) => {
                    onChange(v);
                    setPasswordValue(v);
                  }}
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
                  autoCapitalize="none"
                />
                {passwordValue.length > 0 && (
                  <View style={styles.strengthWrap}>
                    <ProgressBar
                      progress={strength}
                      color={strengthColors[strengthIndex] || '#DC2626'}
                      style={styles.strengthBar}
                    />
                    <Text
                      style={[
                        styles.strengthLabel,
                        { color: strengthColors[strengthIndex] || '#DC2626' },
                      ]}
                    >
                      {strengthLabels[strengthIndex]}
                    </Text>
                  </View>
                )}
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password?.message}
                </HelperText>
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldWrap}>
                <TextInput
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirm}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock-check-outline" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setShowConfirm((v) => !v)}
                    />
                  }
                  error={!!errors.confirm_password}
                  style={styles.input}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  autoCapitalize="none"
                />
                <HelperText type="error" visible={!!errors.confirm_password}>
                  {errors.confirm_password?.message}
                </HelperText>
              </View>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitBtn}
            contentStyle={styles.submitContent}
            labelStyle={styles.submitLabel}
          >
            Create Account
          </Button>

          <View style={styles.loginRow}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  fieldWrap: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: 'transparent',
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    marginHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 64,
  },
  submitBtn: {
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  submitContent: {
    paddingVertical: spacing.xs,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
});
