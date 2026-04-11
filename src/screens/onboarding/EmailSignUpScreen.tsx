import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { PrimaryButton } from '../../components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'EmailSignUp'>;

export function EmailSignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { setSession } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 0 && email.includes('@') && password.length >= 6;

  const handleSignUp = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate')) {
          Alert.alert('잠시 후 다시 시도해 주세요.');
        } else if (error.message.includes('already registered')) {
          Alert.alert('이미 가입된 이메일이에요.', '로그인해 주세요.');
        } else {
          Alert.alert('가입 실패', error.message);
        }
        return;
      }

      if (data.session) {
        // 이메일 확인 비활성화 상태 — 세션 즉시 발급
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user!.id,
            display_name: name.trim(),
            onboarding_completed: false,
          });
        console.log('[signup] upsert error:', upsertError);
        setSession({ accessToken: data.session.access_token });
        // RootNavigator가 isAuthenticated = true 감지 → Main으로 자동 전환
      } else if (data.user) {
        // 이메일 확인 ON — OTP 화면으로 이동
        navigation.navigate('OTPVerify', { email: email.trim(), name: name.trim() });
      }
    } catch {
      Alert.alert('오류', '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>이메일로 가입하기</Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력해 주세요"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="6자 이상"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <PrimaryButton
          label="가입하기"
          onPress={handleSignUp}
          loading={loading}
          disabled={!isValid}
        />
      </KeyboardAvoidingView>
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
  title: { ...Typography.h2, marginBottom: Spacing.xl },
  fields: { flex: 1, gap: Spacing.lg },
  fieldGroup: { gap: Spacing.xs },
  label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 52,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
});
