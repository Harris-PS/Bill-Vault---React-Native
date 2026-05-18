// src/store/auth.store.ts
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setProfile: (profile: Profile) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const session = await authService.getSession();
      if (session) {
        const profile = await authService.getProfile(session.user.id);
        set({ session, user: session.user, profile, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await authService.getProfile(session.user.id);
        set({ session, user: session.user, profile });
      } else {
        set({ session: null, user: null, profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.signIn(email, password);
      const profile = await authService.getProfile(data.user.id);
      set({ session: data.session, user: data.user, profile });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (data) => {
    set({ isLoading: true });
    try {
      await authService.signUp(data);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ session: null, user: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    try {
      await authService.resetPassword(email);
    } finally {
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await authService.getProfile(user.id);
    set({ profile });
  },
}));
