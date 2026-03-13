import { supabase } from './supabase';

export const authService = {
  async sendOTP(phone: string): Promise<{ error: string | null }> {
    // Normalize to E.164 — Korean numbers: 010-XXXX-XXXX → +8210XXXXXXXX
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    return { error: error?.message ?? null };
  },

  async verifyOTP(
    phone: string,
    token: string
  ): Promise<{ error: string | null }> {
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token,
      type: 'sms',
    });
    return { error: error?.message ?? null };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};

function normalizePhone(phone: string): string {
  // Strip spaces, dashes, parens
  const digits = phone.replace(/[\s\-\(\)]/g, '');
  // If already has +, return as is
  if (digits.startsWith('+')) return digits;
  // Korean mobile: 010XXXXXXXX → +8210XXXXXXXX
  if (digits.startsWith('010')) return `+82${digits.slice(1)}`;
  // Default: assume +82
  return `+82${digits}`;
}
