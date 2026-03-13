import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

// ─── PrimaryButton ────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.disabledBtn, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.bg} size="small" />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── GhostButton ─────────────────────────────────────────────────────────────

export function GhostButton({ label, onPress, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.ghostBtn, disabled && styles.disabledBtn, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── IngredientFlag ───────────────────────────────────────────────────────────

type FlagLevel = 'safe' | 'caution' | 'avoid';

const flagColors: Record<FlagLevel, string> = {
  safe: Colors.flagSafe,
  caution: Colors.flagCaution,
  avoid: Colors.flagAvoid,
};

const flagLabels: Record<FlagLevel, string> = {
  safe: '안전',
  caution: '주의',
  avoid: '피하세요',
};

interface FlagProps {
  level: FlagLevel;
  style?: ViewStyle;
}

export function IngredientFlag({ level, style }: FlagProps) {
  const color = flagColors[level];
  return (
    <View style={[styles.flagContainer, style]}>
      <View style={[styles.flagDot, { backgroundColor: color }]} />
      <Text style={[styles.flagText, { color }]}>{flagLabels[level]}</Text>
    </View>
  );
}

// ─── ScoreBadge ───────────────────────────────────────────────────────────────

interface ScoreProps {
  score: number;   // 0–100
  size?: 'sm' | 'lg';
}

function scoreColor(score: number): string {
  if (score >= 70) return Colors.danger;
  if (score >= 40) return Colors.warning;
  return Colors.success;
}

export function ScoreBadge({ score, size = 'sm' }: ScoreProps) {
  const color = scoreColor(score);
  const isLarge = size === 'lg';
  return (
    <View style={[styles.scoreBadge, isLarge && styles.scoreBadgeLg, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, isLarge && styles.scoreNumberLg, { color }]}>
        {score}
      </Text>
    </View>
  );
}

// ─── StreakBadge ──────────────────────────────────────────────────────────────

interface StreakProps {
  days: number;
}

export function StreakBadge({ days }: StreakProps) {
  return (
    <View style={styles.streakContainer}>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakText}>{days}일 연속 로그 중</Text>
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ emoji, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {ctaLabel && onCta && (
        <PrimaryButton label={ctaLabel} onPress={onCta} style={styles.emptyCta} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // PrimaryButton
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryBtnText: {
    ...Typography.cta,
    color: Colors.bg,
  },
  disabledBtn: {
    opacity: 0.4,
  },

  // GhostButton
  ghostBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  ghostBtnText: {
    ...Typography.cta,
    color: Colors.textPrimary,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // IngredientFlag
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flagText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // ScoreBadge
  scoreBadge: {
    borderWidth: 2,
    borderRadius: Radius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeLg: {
    width: 80,
    height: 80,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreNumberLg: {
    fontSize: 28,
  },

  // StreakBadge
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  streakEmoji: { fontSize: 14 },
  streakText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600' },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // SectionHeader
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h3 },
  sectionAction: { ...Typography.caption, color: Colors.accent },

  // EmptyState
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, textAlign: 'center', marginBottom: Spacing.sm },
  emptySubtitle: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyCta: { minWidth: 200 },
});
