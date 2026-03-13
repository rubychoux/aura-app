import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Card, ScoreBadge, StreakBadge, SectionHeader, EmptyState } from '../../components/ui';

export function HomeScreen() {
  const { user } = useAuthStore();

  // TODO: fetch real data from Supabase
  const breakoutScore = 28;
  const streak = 3;
  const hasScans = false;
  const hasInsights = false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>AURA</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Breakout Prediction Score */}
      <Card style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>오늘의 피부 컨디션</Text>
            <Text style={styles.scoreDesc}>
              {breakoutScore < 40
                ? '오늘 피부 상태가 좋아요 🌿'
                : breakoutScore < 70
                ? '피부에 조금 신경 써주세요'
                : '오늘 피부 컨디션 주의가 필요해요'}
            </Text>
          </View>
          <ScoreBadge score={breakoutScore} size="lg" />
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { emoji: '🔍', label: '스캔하기' },
          { emoji: '📓', label: '로그 남기기' },
          { emoji: '🧠', label: '인사이트' },
        ].map(({ emoji, label }) => (
          <TouchableOpacity key={label} style={styles.quickBtn}>
            <Text style={styles.quickEmoji}>{emoji}</Text>
            <Text style={styles.quickLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Streak */}
      {streak > 0 && (
        <View style={styles.streakRow}>
          <StreakBadge days={streak} />
        </View>
      )}

      {/* Skin Timeline */}
      <View style={styles.section}>
        <SectionHeader title="피부 타임라인" action="전체 보기" />
        {hasScans ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* TODO: map over scan history */}
          </ScrollView>
        ) : (
          <EmptyState
            emoji="📸"
            title="아직 스캔 기록이 없어요"
            subtitle="첫 피부 스캔을 해보세요"
            ctaLabel="스캔 시작"
            onCta={() => {}}
          />
        )}
      </View>

      {/* Latest Insight */}
      <View style={styles.section}>
        <SectionHeader title="최근 인사이트" action="더 보기" />
        {hasInsights ? (
          <Card><Text style={{color:'#9B9B9B'}}>인사이트 로딩 중...</Text></Card>
        ) : (
          <Card style={styles.insightPlaceholder}>
            <Text style={styles.insightPlaceholderText}>
              🧠 14일 이상 로그를 남기면 피부 패턴을 분석해드려요
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  wordmark: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 4 },
  settingsBtn: { padding: Spacing.xs },
  settingsIcon: { fontSize: 20 },
  scoreCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreInfo: { flex: 1, marginRight: Spacing.md },
  scoreLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  scoreDesc: { ...Typography.body, fontWeight: '500' },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickEmoji: { fontSize: 20 },
  quickLabel: { ...Typography.caption, color: Colors.textSecondary },
  streakRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  insightPlaceholder: {
    paddingVertical: Spacing.lg,
  },
  insightPlaceholderText: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
