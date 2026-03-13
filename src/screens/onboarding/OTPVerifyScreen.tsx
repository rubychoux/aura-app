import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { authService } from '../../services/auth';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OTPVerify'>;
  route: RouteProp<OnboardingStackParamList, 'OTPVerify'>;
};

export function OTPVerifyScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const fullCode = code.join('');
  const isComplete = fullCode.length === 6;

  function handleChange(text: string, index: number) {
    const newCode = [...code];
    newCode[index] = text.slice(-1); // only last character
    setCode(newCode);

    // Auto-advance
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (newCode.every(Boolean)) {
      handleVerify(newCode.join(''));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(otp?: string) {
    const token = otp ?? fullCode;
    if (token.length < 6) return;
    setLoading(true);
    const { error } = await authService.verifyOTP(phone, token);
    setLoading(false);
    if (error) {
      Alert.alert('인증 실패', '인증번호가 올바르지 않아요. 다시 확인해주세요.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }
    navigation.navigate('SkinQuiz');
  }

  async function handleResend() {
    const { error } = await authService.sendOTP(phone);
    if (!error) Alert.alert('재전송 완료', '새로운 인증번호를 보내드렸어요.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>인증번호를{'\n'}입력해주세요</Text>
        <Text style={styles.subtitle}>
          {phone}으로 문자를 보내드렸어요
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleResend} style={styles.resendRow}>
          <Text style={styles.resendText}>인증번호 재전송</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="확인"
          onPress={() => handleVerify()}
          loading={loading}
          disabled={!isComplete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  header: { paddingTop: 60, marginBottom: Spacing.xl },
  back: { fontSize: 24, color: Colors.textPrimary },
  content: { flex: 1 },
  title: { ...Typography.h1, marginBottom: Spacing.sm, lineHeight: 38 },
  subtitle: { ...Typography.bodySecondary, marginBottom: Spacing.xl },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxHeight: 60,
  },
  codeInputFilled: {
    borderColor: Colors.accent,
  },
  resendRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { ...Typography.caption, color: Colors.accent },
  footer: { paddingBottom: 48 },
});
