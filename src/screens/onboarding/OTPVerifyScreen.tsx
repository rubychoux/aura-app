import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { PrimaryButton } from '../../components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OTPVerify'>;
type Route = RouteProp<OnboardingStackParamList, 'OTPVerify'>;

export function OTPVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email, name } = route.params;
  const { setSession } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) {
        Alert.alert('인증 실패', '인증 코드를 다시 확인해 주세요.');
        return;
      }
      if (data.session && data.user) {
        const { error: upsertError } = await supabase.from('user_profiles').upsert({
          id: data.user.id,
          display_name: name,
          skin_type: 'unknown',
          skin_concerns: [],
          goal: 'general',
          onboarding_completed: false,
        });
        console.log('[otp] upsert result:', upsertError);
        setSession({ accessToken: data.session.access_token });
        // RootNavigator가 isAuthenticated = true 감지 → Main으로 자동 전환
      }
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await supabase.auth.resend({ type: 'signup', email });
      Alert.alert('재발송 완료', '인증 코드를 다시 보내드렸어요.');
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해 주세요.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>이메일 인증</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.emailText}>{email}</Text>
          {'\n'}로 보낸 6자리 코드를 입력해 주세요.
        </Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.textSecondary}
          textAlign="center"
        />

        <PrimaryButton
          label="인증하기"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length !== 6}
        />

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.resendText}>
            {resending ? '재발송 중...' : '코드를 받지 못하셨나요? 재발송'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.xl },
  backText: { ...Typography.body, color: Colors.accent },
  title: { ...Typography.h2, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  emailText: { color: Colors.textPrimary, fontWeight: '600' },
  otpInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 8,
    marginBottom: Spacing.lg,
  },
  resendBtn: { marginTop: Spacing.lg, alignItems: 'center' },
  resendText: { ...Typography.caption, color: Colors.accent },
});
