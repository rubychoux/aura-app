import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList, SkinType, SkinConcern, AcneType, RoutineComplexity } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { useOnboardingStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SkinQuiz'>;
};

const QUESTIONS = [
  {
    id: 'skinType',
    question: '피부 타입이 어떻게 되세요?',
    options: ['지성', '건성', '복합성', '민감성'],
    multi: false,
  },
  {
    id: 'concerns',
    question: '주요 피부 고민을 선택해주세요',
    subtitle: '여러 개 선택 가능해요',
    options: ['여드름', '블랙헤드', '모공', '색소침착', '건조함', '트러블 후 자국'],
    multi: true,
  },
  {
    id: 'acneType',
    question: '여드름 타입을 알고 계신가요?',
    subtitle: '모르시면 넘어가도 괜찮아요',
    options: ['화농성', '좁쌀', '모낙염', '혼합형', '잘 모르겠어요'],
    multi: false,
    optional: true,
  },
  {
    id: 'routineComplexity',
    question: '현재 스킨케어 루틴이 어느 정도예요?',
    options: ['없음', '기초만 (세안+보습)', '5단계 이상'],
    multi: false,
  },
] as const;

export function SkinQuizScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string | string[]>>({});
  const store = useOnboardingStore();

  const q = QUESTIONS[step];
  const current = selected[q.id];
  const canProceed = ('optional' in q && q.optional) || (Array.isArray(current) ? current.length > 0 : !!current);
  const isLast = step === QUESTIONS.length - 1;

  function toggle(option: string) {
    if (q.multi) {
      const prev = (selected[q.id] as string[]) ?? [];
      const next = prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option];
      setSelected({ ...selected, [q.id]: next });
    } else {
      setSelected({ ...selected, [q.id]: option });
    }
  }

  function isActive(option: string): boolean {
    const val = selected[q.id];
    if (Array.isArray(val)) return val.includes(option);
    return val === option;
  }

  function handleNext() {
    // Persist to store
    if (q.id === 'skinType') store.setSkinType(current as SkinType);
    if (q.id === 'concerns') (current as SkinConcern[]).forEach((c) => store.toggleConcern(c));
    if (q.id === 'acneType' && current !== '잘 모르겠어요') store.setAcneType(current as AcneType);
    if (q.id === 'routineComplexity') store.setRoutineComplexity(current as RoutineComplexity);

    if (isLast) {
      navigation.navigate('PIAPConsent');
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepLabel}>{step + 1} / {QUESTIONS.length}</Text>
        <Text style={styles.question}>{q.question}</Text>
        {'subtitle' in q && q.subtitle && (
          <Text style={styles.subtitle}>{q.subtitle}</Text>
        )}

        <View style={styles.optionsGrid}>
          {q.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, isActive(option) && styles.optionActive]}
              onPress={() => toggle(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, isActive(option) && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isLast ? '다음' : '다음'}
          onPress={handleNext}
          disabled={!canProceed}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    marginTop: 56,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  stepLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  question: { ...Typography.h2, marginBottom: Spacing.sm, lineHeight: 30 },
  subtitle: { ...Typography.bodySecondary, marginBottom: Spacing.lg },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}22`,
  },
  optionText: { ...Typography.body, color: Colors.textSecondary },
  optionTextActive: { color: Colors.accent, fontWeight: '600' },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: 48 },
});
