// src/screens/main/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Switch,
  Divider,
  useTheme,
  Avatar,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { brandColors, borderRadius, spacing, typography, shadows } from '../../theme';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, isLoading } = useAuthStore();
  const { isDark, setMode, mode } = useThemeStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || 'User';

  const menuItems = [
    { icon: 'account-edit-outline', label: 'Edit Profile', onPress: () => {} },
    { icon: 'lock-reset', label: 'Change Password', onPress: () => {} },
    { icon: 'bell-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'shield-check-outline', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-outline', label: 'About BillVault', onPress: () => {} },
  ];

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
        <View style={styles.avatarWrap}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
            labelStyle={{ color: '#FFF', fontSize: 28, fontWeight: '700' }}
          />
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
        {profile?.phone_number && (
          <Text style={styles.userPhone}>{profile.phone_number}</Text>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Profile Info Card */}
        {profile && (
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Account Information
            </Text>
            <Divider style={styles.divider} />
            <InfoRow icon="map-marker-outline" label="Address" value={profile.address} theme={theme} />
            <InfoRow icon="phone-outline" label="Phone" value={profile.phone_number} theme={theme} />
            <InfoRow icon="calendar-outline" label="Member Since" value={
              new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
            } theme={theme} />
          </Surface>
        )}

        {/* Preferences */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            Preferences
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons
                name={isDark ? 'weather-night' : 'weather-sunny'}
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.prefLabel, { color: theme.colors.onSurface }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              color={theme.colors.primary}
            />
          </View>
        </Surface>

        {/* Menu Items */}
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
                  {item.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.outline}
                />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <Divider style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </Surface>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          loading={isLoading}
          disabled={isLoading}
          style={styles.signOutBtn}
          contentStyle={{ paddingVertical: spacing.xs }}
          labelStyle={{ color: theme.colors.error, fontWeight: '600' }}
          icon="logout"
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>

        <Text style={[styles.version, { color: theme.colors.outline }]}>
          BillVault v1.0.0 • Made with ❤️ for India
        </Text>
      </View>
    </ScrollView>
  );
};

const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  theme: any;
}> = ({ icon, label, value, theme }) => (
  <View style={infoStyles.row}>
    <MaterialCommunityIcons name={icon as any} size={18} color={theme.colors.outline} />
    <View style={{ flex: 1 }}>
      <Text style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.colors.onSurface }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  avatarWrap: { marginBottom: spacing.sm },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  userPhone: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: { borderRadius: borderRadius.lg, padding: spacing.md },
  cardTitle: { ...typography.titleSmall, fontWeight: '700' },
  divider: { marginVertical: spacing.sm },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prefLabel: { fontSize: 15, fontWeight: '500' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  menuDivider: { marginLeft: 48 },
  signOutBtn: {
    borderRadius: borderRadius.full,
    borderColor: '#DC2626',
  },
  version: { textAlign: 'center', fontSize: 12, marginTop: spacing.sm },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: 11, marginBottom: 1 },
  value: { fontSize: 14, fontWeight: '500' },
});
