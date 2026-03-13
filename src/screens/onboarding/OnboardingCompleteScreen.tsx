import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { useOnboardingStore, useAuthStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingComplete'>;
};

export function OnboardingCompleteScreen(_props: any) {
  const { skinType, concerns } = useOnboardingStore();
  const { setOnboardingComplete } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.check}>✨</Text>
        <Text style={styles.title}>피부 프로필이{'\n'}완성됐어요!</Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>피부 타입</Text>
            <Text style={styles.summaryValue}>{skinType ?? '미설정'}</Text>
          </View>
          {concerns.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>주요 고민</Text>
              <Text style={styles.summaryValue}>{concerns.slice(0, 2).join(' · ')}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AURA가 할 일</Text>
            <Text style={styles.summaryValue}>맞춤형 피부 분석 시작</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          첫 성분 스캔을 해보세요 — 지금 쓰는 제품이 내 피부에 맞는지 바로 알 수 있어요
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="스캔 시작하기"
          onPress={setOnboardingComplete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  check: { fontSize: 56, marginBottom: Spacing.lg },
  title: { ...Typography.h1, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 38 },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...Typography.bodySecondary },
  summaryValue: { ...Typography.body, fontWeight: '600', color: Colors.accent },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  footer: { paddingBottom: 48 },
});
