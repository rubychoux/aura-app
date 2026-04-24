import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { upsertDailyLogForDate, fetchDailyLogByDate } from '../../services/dailyLog';
import { todayYmd } from '../../utils/dateYmd';
import { AIScanStackParamList, LifestyleDietTag } from '../../types';
import Slider from '@react-native-community/slider';

type Nav = NativeStackNavigationProp<AIScanStackParamList, 'DailyLog'>;

const SLEEP_MIN = 4;
const SLEEP_MAX = 10;
const WATER_GOAL = 8;

const DIET_OPTIONS: LifestyleDietTag[] = [
  '자극적인 음식',
  '기름진 음식',
  '단 음식',
  '균형잡힌 식사',
  '채소 충분',
];

const STRESS = [
  { level: 1 as const, emoji: '😌' },
  { level: 2 as const, emoji: '😊' },
  { level: 3 as const, emoji: '😐' },
  { level: 4 as const, emoji: '😤' },
  { level: 5 as const, emoji: '😫' },
];

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function clampSleep(n: number): number {
  return Math.min(SLEEP_MAX, Math.max(SLEEP_MIN, roundHalf(n)));
}

export function DailyLogScreen() {
  const navigation = useNavigation<Nav>();
  const ymd = useMemo(() => todayYmd(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(0);
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [diet, setDiet] = useState<Record<LifestyleDietTag, boolean>>(
    () =>
      Object.fromEntries(DIET_OPTIONS.map((t) => [t, false])) as Record<LifestyleDietTag, boolean>
  );
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const row = await fetchDailyLogByDate(user.id, ymd);
        if (row) {
          if (row.sleep_hours != null) setSleep(clampSleep(row.sleep_hours));
          if (row.water_intake != null) setWater(Math.max(0, row.water_intake));
          if (row.stress_level && row.stress_level >= 1 && row.stress_level <= 5) {
            setStress(row.stress_level as 1 | 2 | 3 | 4 | 5);
          }
          if (row.diet_tags && row.diet_tags.length > 0) {
            const next = Object.fromEntries(DIET_OPTIONS.map((t) => [t, false])) as Record<
              LifestyleDietTag,
              boolean
            >;
            row.diet_tags.forEach((t) => {
              if (DIET_OPTIONS.includes(t as LifestyleDietTag)) {
                next[t as LifestyleDietTag] = true;
              }
            });
            setDiet(next);
          }
          if (row.notes) setNotes(row.notes);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ymd]);

  const toggleDiet = (tag: LifestyleDietTag) => {
    setDiet((d) => ({ ...d, [tag]: !d[tag] }));
  };

  const onSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('로그인 필요', '로그인 후 기록할 수 있어요.');
      return;
    }
    setSaving(true);
    try {
      const selectedTags = DIET_OPTIONS.filter((t) => diet[t]);
      const { error } = await upsertDailyLogForDate({
        userId: user.id,
        ymd,
        sleepHours: sleep,
        waterCups: water,
        stressLevel: stress,
        dietTags: selectedTags,
        notes: notes.trim(),
      });
      if (error) {
        Alert.alert('저장 실패', error);
        return;
      }
      Alert.alert('저장됐어요', '오늘의 라이프스타일 기록이 반영됐어요.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>라이프스타일</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateLabel}>{ymd} · 하루 1회 체크인</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>수면 시간</Text>
          <Text style={styles.cardHint}>{SLEEP_MIN}~{SLEEP_MAX}시간 · 0.5시간 단위</Text>
          <Text style={styles.sleepValue}>{sleep.toFixed(1)}시간</Text>
          <Slider
            style={styles.sleepSlider}
            minimumValue={SLEEP_MIN}
            maximumValue={SLEEP_MAX}
            step={0.5}
            value={sleep}
            onValueChange={(v) => setSleep(clampSleep(v))}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.accent}
          />
          <View style={styles.sleepRow}>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setSleep((s) => clampSleep(s - 0.5))}
              disabled={sleep <= SLEEP_MIN}
            >
              <Ionicons name="remove" size={20} color={sleep <= SLEEP_MIN ? Colors.textDisabled : Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setSleep((s) => clampSleep(s + 0.5))}
              disabled={sleep >= SLEEP_MAX}
            >
              <Ionicons name="add" size={20} color={sleep >= SLEEP_MAX ? Colors.textDisabled : Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.waterHeader}>
            <Text style={styles.cardTitle}>물 섭취</Text>
            <Text style={styles.waterMeta}>
              목표 {WATER_GOAL}잔 · 지금 {water}잔
            </Text>
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={() => setWater((w) => Math.min(16, w + 1))} activeOpacity={0.9}>
            <Ionicons name="water-outline" size={22} color={Colors.accent} />
            <Text style={styles.waterBtnText}>+1잔</Text>
          </TouchableOpacity>
          {water > 0 && (
            <TouchableOpacity onPress={() => setWater(0)} style={styles.waterReset}>
              <Text style={styles.waterResetText}>오늘 기록 초기화</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>스트레스</Text>
          <View style={styles.stressRow}>
            {STRESS.map((s) => {
              const on = stress === s.level;
              return (
                <TouchableOpacity
                  key={s.level}
                  style={[styles.stressBtn, on && styles.stressBtnOn]}
                  onPress={() => setStress(s.level)}
                >
                  <Text style={styles.stressEmoji}>{s.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>식단 (복수 선택)</Text>
          <View style={styles.chipWrap}>
            {DIET_OPTIONS.map((tag) => {
              const on = diet[tag];
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleDiet(tag)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘 메모 (선택)</Text>
          <TextInput
            style={styles.notes}
            value={notes}
            onChangeText={setNotes}
            placeholder="컨디션, 약물, 운동… 자유롭게 적어주세요"
            placeholderTextColor={Colors.textDisabled}
            multiline
          />
        </View>

        <PrimaryButton label={saving ? '저장 중…' : '저장'} onPress={onSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: { ...Typography.h3 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  dateLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.h3, fontSize: 16 },
  cardHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: -4 },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sleepSlider: { width: '100%', height: 44 },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepValue: { ...Typography.h2, fontSize: 26, textAlign: 'center', marginTop: 4 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterMeta: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  waterBtn: {
    marginTop: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accentLight,
  },
  waterBtnText: { ...Typography.body, fontWeight: '800', color: Colors.textPrimary },
  waterReset: { alignSelf: 'center', marginTop: 4 },
  waterResetText: { ...Typography.caption, color: Colors.textSecondary, textDecorationLine: 'underline' },
  stressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  stressBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressBtnOn: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  stressEmoji: { fontSize: 24 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  chipOn: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  chipTextOn: { color: Colors.textPrimary },
  notes: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    textAlignVertical: 'top',
    ...Typography.body,
  },
});
