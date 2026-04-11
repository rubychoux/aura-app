import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'AuthGate'>;

export function AuthGateScreen() {
  const navigation = useNavigation<Nav>();

  const handleKakao = async () => {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: redirectUrl, scopes: 'profile_nickname' },
      });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('오류', '카카오 로그인에 실패했어요. 다시 시도해 주세요.');
      console.error('[kakao] login error:', e);
    }
  };

  const handleApple = async () => {
    // Apple Developer 계정 등록 후 활성화 예정
    Alert.alert('준비 중', 'Apple 로그인은 곧 지원될 예정이에요.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>

        {/* 로고 + 태그라인 */}
        <View style={styles.header}>
          <Text style={styles.logo}>meve</Text>
          <Text style={styles.tagline}>나만의 AI 스킨케어 코치</Text>
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttons}>
          {/* 카카오 */}
          <TouchableOpacity style={styles.kakaoBtn} onPress={handleKakao} activeOpacity={0.85}>
            <Text style={styles.kakaoBtnText}>카카오로 시작하기</Text>
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} activeOpacity={0.85}>
            <Text style={styles.appleBtnText}>Apple로 시작하기</Text>
          </TouchableOpacity>

          {/* 이메일 */}
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => navigation.navigate('EmailSignUp')}
            activeOpacity={0.85}
          >
            <Text style={styles.emailBtnText}>이메일로 가입하기</Text>
          </TouchableOpacity>
        </View>

        {/* 로그인 링크 */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>이미 계정이 있어요 →</Text>
        </TouchableOpacity>

        {/* 법적 고지 */}
        <Text style={styles.legal}>
          시작하기를 누르면 이용약관 및 개인정보처리방침에{'\n'}동의하는 것으로 간주합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  buttons: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C1E1E',
  },
  appleBtn: {
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emailBtn: {
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
  },
  emailBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  legal: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  loginLinkText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
  },
});