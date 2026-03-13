import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { useOnboardingStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PIAPConsent'>;
};

export function PIAPConsentScreen({ navigation }: Props) {
  const [required, setRequired] = useState(false);
  const [optional, setOptional] = useState(false);
  const store = useOnboardingStore();

  function handleNext() {
    store.setSkinDataConsent(required);
    store.setDatasetConsent(optional);
    navigation.navigate('NotificationPermission');
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>개인정보 수집 및{'\n'}이용 동의</Text>
        <Text style={styles.subtitle}>
          AURA는 서비스 제공을 위해 아래 정보를 수집해요. 피부 분석에 필요한 생체 정보는 법적 근거 하에 처리됩니다.
        </Text>

        {/* What we collect */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>수집하는 정보</Text>
          {[
            '전화번호 (계정 인증)',
            '피부 타입 및 고민 정보',
            '성분 스캔 이력',
            '일일 라이프스타일 로그 (수면, 식단, 스트레스)',
          ].map((item) => (
            <View key={item} style={styles.infoRow}>
              <Text style={styles.infoDot}>·</Text>
              <Text style={styles.infoText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Premium: face scan */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>프리미엄 전용 (선택)</Text>
          {[
            '얼굴 사진 (피부 스캔, 분석 후 안전하게 처리)',
          ].map((item) => (
            <View key={item} style={styles.infoRow}>
              <Text style={styles.infoDot}>·</Text>
              <Text style={styles.infoText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Consent checkboxes */}
        <View style={styles.checkboxSection}>
          <CheckboxRow
            checked={required}
            onPress={() => setRequired(!required)}
            required
            label="[필수] 이용약관 및 개인정보처리방침에 동의합니다"
          />
          <CheckboxRow
            checked={optional}
            onPress={() => setOptional(!optional)}
            label="[선택] 익명화된 피부 사진을 AI 모델 개선에 사용하는 것에 동의합니다"
            description="귀하의 동의로 한국인 피부 데이터가 더 정확한 분석을 만들어요. 언제든 철회 가능해요."
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="동의하고 계속하기"
          onPress={handleNext}
          disabled={!required}
        />
      </View>
    </View>
  );
}

function CheckboxRow({
  checked, onPress, label, description, required,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  description?: string;
  required?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.checkboxContent}>
        <Text style={[styles.checkboxLabel, required && styles.requiredLabel]}>{label}</Text>
        {description && <Text style={styles.checkboxDesc}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: Spacing.xxl },
  title: { ...Typography.h1, marginBottom: Spacing.sm, lineHeight: 38 },
  subtitle: { ...Typography.bodySecondary, marginBottom: Spacing.lg, lineHeight: 22 },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  infoTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: 4 },
  infoDot: { color: Colors.textSecondary, marginTop: 2 },
  infoText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  checkboxSection: { gap: Spacing.md, marginTop: Spacing.sm },
  checkboxRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { fontSize: 13, color: Colors.bg, fontWeight: '700' },
  checkboxContent: { flex: 1, gap: Spacing.xs },
  checkboxLabel: { ...Typography.body, lineHeight: 22 },
  requiredLabel: { color: Colors.textPrimary },
  checkboxDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: 48 },
});
