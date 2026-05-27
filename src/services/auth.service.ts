// src/services/auth.service.ts
import { supabase } from './supabase';
import { Profile, SignupFormData } from '../types';

export const authService = {
  async signUp(data: SignupFormData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          address: data.address,
          phone_number: data.phone_number,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Only perform client-side upserts if the user is immediately authenticated (Email Confirmation disabled).
    // If Email Confirmation is enabled, session is null and RLS policies will block client-side writes.
    // In that case, we rely fully on the PostgreSQL trigger (handle_new_user) which runs with elevated SECURITY DEFINER privileges.
    if (authData.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        email: data.email,
        phone_number: data.phone_number,
      });

      if (profileError) throw profileError;

      // Create default preferences
      await supabase.from('user_preferences').upsert({
        user_id: authData.user.id,
        dark_mode: false,
        notifications_enabled: true,
      });
    }

    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
