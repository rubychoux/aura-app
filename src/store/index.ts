import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  session: { accessToken: string } | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  setUser: (user: UserProfile | null) => void;
  setSession: (session: { accessToken: string } | null) => void;
  setLoading: (val: boolean) => void;
  setOnboardingComplete: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  signOut: () =>
    set({ user: null, session: null, hasCompletedOnboarding: false }),
}));

// ─── Onboarding Quiz Store ───────────────────────────────────────────────────

import { SkinType, SkinConcern, AcneType, RoutineComplexity } from '../types';

interface OnboardingState {
  phone: string;
  skinType: SkinType | null;
  concerns: SkinConcern[];
  acneType: AcneType | null;
  routineComplexity: RoutineComplexity | null;
  skinDataConsent: boolean;
  datasetContributionConsent: boolean;

  setPhone: (phone: string) => void;
  setSkinType: (val: SkinType) => void;
  toggleConcern: (val: SkinConcern) => void;
  setAcneType: (val: AcneType | null) => void;
  setRoutineComplexity: (val: RoutineComplexity) => void;
  setSkinDataConsent: (val: boolean) => void;
  setDatasetConsent: (val: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  phone: '',
  skinType: null,
  concerns: [],
  acneType: null,
  routineComplexity: null,
  skinDataConsent: false,
  datasetContributionConsent: false,

  setPhone: (phone) => set({ phone }),
  setSkinType: (skinType) => set({ skinType }),
  toggleConcern: (val) =>
    set((state) => ({
      concerns: state.concerns.includes(val)
        ? state.concerns.filter((c) => c !== val)
        : [...state.concerns, val],
    })),
  setAcneType: (acneType) => set({ acneType }),
  setRoutineComplexity: (routineComplexity) => set({ routineComplexity }),
  setSkinDataConsent: (skinDataConsent) => set({ skinDataConsent }),
  setDatasetConsent: (datasetContributionConsent) => set({ datasetContributionConsent }),
  reset: () =>
    set({
      phone: '',
      skinType: null,
      concerns: [],
      acneType: null,
      routineComplexity: null,
      skinDataConsent: false,
      datasetContributionConsent: false,
    }),
}));
