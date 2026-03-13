import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { authService } from '../../services/auth';
import { useOnboardingStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PhoneAuth'>;
};

export function PhoneAuthScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const setStorePhone = useOnboardingStore((s) => s.setPhone);

  const isValid = phone.replace(/\D/g, '').length >= 10;

  async function handleSendOTP() {
    if (!isValid) return;
    setLoading(true);
    const { error } = await authService.sendOTP(phone);
    setLoading(false);
    if (error) {
      Alert.alert('오류', error);
      return;
    }
    setStorePhone(phone);
    navigation.navigate('OTPVerify', { phone });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>전화번호를{'\n'}입력해주세요</Text>
          <Text style={styles.subtitle}>
            SMS로 인증번호를 보내드릴게요
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>🇰🇷 +82</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="010-0000-0000"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={13}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="인증번호 받기"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!isValid}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { paddingTop: 60, marginBottom: Spacing.xl },
  back: { fontSize: 24, color: Colors.textPrimary },
  content: { flex: 1 },
  title: { ...Typography.h1, marginBottom: Spacing.sm, lineHeight: 38 },
  subtitle: { ...Typography.bodySecondary, marginBottom: Spacing.xl },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  prefix: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
  },
  prefixText: { ...Typography.body, color: Colors.textSecondary },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  footer: { paddingBottom: 48 },
});
