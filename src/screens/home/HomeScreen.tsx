import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { MainTabParamList, SkinMode } from '../../types';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const SKIN_MODES: { key: SkinMode; emoji: string; label: string }[] = [
  { key: 'wedding', emoji: '💍', label: 'Wedding' },
  { key: 'everyday', emoji: '🌿', label: 'Everyday' },
  { key: 'graduation', emoji: '🎓', label: 'Graduation' },
];

// ── Streak helper ─────────────────────────────────────────────────────────────

function calculateStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;
  const unique = [...new Set(isoDates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 0;
  let expected = unique[0];
  for (const d of unique) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

// ── Routine key ───────────────────────────────────────────────────────────────

function todayRoutineKey() {
  return `routine_checkin_${new Date().toISOString().slice(0, 10)}`;
}

// ─────────────────────────────────────────────────────────────────────────────

interface ScoreData {
  latest: number;
  prev: number | null;
}

interface Routine {
  am: boolean;
  pm: boolean;
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { skinMode, setSkinMode } = useAuthStore();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [routine, setRoutine] = useState<Routine>({ am: false, pm: false });
  const [streak, setStreak] = useState<number | null>(null);

  // ── Initial data loads ──────────────────────────────────────────────────────
  useEffect(() => {
    loadProfile();
    loadScans();
    loadRoutine();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) fetchDisplayName(session.user.id);
      }
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) fetchDisplayName(session.user.id);
  };

  const fetchDisplayName = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
  };

  const loadScans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('skin_scans')
      .select('scan_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      setStreak(0);
      return;
    }

    // Score tracker (latest + optional prev)
    const latest: number = data[0].scan_result?.overallScore ?? 0;
    const prev: number | null = data.length >= 2 ? (data[1].scan_result?.overallScore ?? null) : null;
    setScoreData({ latest, prev });

    // Streak
    setStreak(calculateStreak(data.map((r: any) => r.created_at)));
  };

  const loadRoutine = async () => {
    try {
      const raw = await AsyncStorage.getItem(todayRoutineKey());
      if (raw) setRoutine(JSON.parse(raw));
    } catch {}
  };

  const toggleRoutine = async (type: 'am' | 'pm') => {
    const next = { ...routine, [type]: !routine[type] };
    setRoutine(next);
    try {
      await AsyncStorage.setItem(todayRoutineKey(), JSON.stringify(next));
    } catch {}
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const greeting = displayName ? `${displayName}님 안녕하세요 :)` : '회원님 안녕하세요 :)';
  const scoreDiff = scoreData?.prev != null ? scoreData.latest - scoreData.prev : null;
  const bothDone = routine.am && routine.pm;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>meve</Text>
        </View>

        {/* 인사 */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.greetingSub}>오늘의 피부 상태를 확인해 볼까요?</Text>
        </View>

        {/* 스킨 모드 선택 */}
        <View style={styles.modeRow}>
          {SKIN_MODES.map(({ key, emoji, label }) => {
            const selected = skinMode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                onPress={() => setSkinMode(key)}
                activeOpacity={0.75}
              >
                <Text style={styles.modeEmoji}>{emoji}</Text>
                <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 1. 피부 점수 트래커 ─────────────────────────────────────────── */}
        {scoreData && (
          <View style={styles.padded}>
            <View style={styles.scoreCard}>
              <View>
                <Text style={styles.scoreLabel}>최근 피부 점수</Text>
                <Text style={styles.scoreValue}>{scoreData.latest}점</Text>
              </View>
              {scoreDiff != null && (
                <Text style={[styles.scoreDiff, { color: scoreDiff > 0 ? Colors.success : scoreDiff < 0 ? Colors.danger : Colors.textSecondary }]}>
                  {scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➖'}{' '}
                  지난 스캔보다{' '}
                  {scoreDiff > 0 ? `+${scoreDiff}점 올랐어요` : scoreDiff < 0 ? `${scoreDiff}점 내려갔어요` : '동일해요'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── 2. 루틴 체크인 ──────────────────────────────────────────────── */}
        <View style={styles.padded}>
          <View style={styles.routineCard}>
            <Text style={styles.routineTitle}>오늘의 루틴</Text>
            {bothDone ? (
              <Text style={styles.routineAllDone}>오늘 루틴 모두 완료했어요 🎉</Text>
            ) : (
              <View style={styles.routineBtns}>
                <TouchableOpacity
                  style={[styles.routineBtn, routine.am && styles.routineBtnDone]}
                  onPress={() => toggleRoutine('am')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.routineBtnText, routine.am && styles.routineBtnTextDone]}>
                    {routine.am ? '✓ ' : ''}☀️ AM 루틴
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.routineBtn, routine.pm && styles.routineBtnDone]}
                  onPress={() => toggleRoutine('pm')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.routineBtnText, routine.pm && styles.routineBtnTextDone]}>
                    {routine.pm ? '✓ ' : ''}🌙 PM 루틴
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── 3. 스캔 스트릭 ──────────────────────────────────────────────── */}
        {streak !== null && (
          <View style={styles.padded}>
            <View style={[styles.streakBanner, streak === 0 && styles.streakBannerEmpty]}>
              <Text style={styles.streakText}>
                {streak >= 1
                  ? `🔥 ${streak}일 연속 스캔 중!`
                  : '오늘 첫 스캔을 시작해보세요! 🩷'}
              </Text>
            </View>
          </View>
        )}

        {/* 히어로 카드 — 피부 진단 */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AIScan')}
        >
          <View style={styles.heroInner}>
            <Text style={styles.heroEmoji}>🩷</Text>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>지금 피부 진단하기</Text>
              <Text style={styles.heroDesc}>AI가 내 피부 상태를 분석해드려요</Text>
            </View>
            <Text style={styles.heroArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* 최근 활동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🩷</Text>
            <Text style={styles.emptyText}>
              첫 피부 진단을 시작하면{'\n'}활동 기록이 여기에 쌓여요
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  padded: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 4,
  },

  greetingRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  greeting: { ...Typography.h2, marginBottom: 4 },
  greetingSub: { ...Typography.bodySecondary },

  // Mode selector
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  modeCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  modeEmoji: { fontSize: 20 },
  modeLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  modeLabelSelected: { color: Colors.accent, fontWeight: '600' },

  // Score tracker
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 6,
  },
  scoreLabel: { ...Typography.caption, color: Colors.textSecondary },
  scoreValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  scoreDiff: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Routine check-in
  routineCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  routineTitle: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  routineBtns: { flexDirection: 'row', gap: Spacing.sm },
  routineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  routineBtnDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  routineBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  routineBtnTextDone: { color: Colors.surface, fontWeight: '600' },
  routineAllDone: { fontSize: 14, fontWeight: '600', color: Colors.success },

  // Streak banner
  streakBanner: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  streakBannerEmpty: {
    backgroundColor: Colors.accentLight,
  },
  streakText: { fontSize: 14, fontWeight: '600', color: Colors.surface },

  // Hero card
  heroCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroEmoji: { fontSize: 32 },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: Colors.surface, marginBottom: 2 },
  heroDesc: { fontSize: 13, color: Colors.surface, opacity: 0.85 },
  heroArrow: { fontSize: 20, color: Colors.surface, opacity: 0.7 },

  // Recent activity
  section: { paddingHorizontal: Spacing.xl },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { ...Typography.bodySecondary, textAlign: 'center', lineHeight: 22 },
});
