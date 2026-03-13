import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

function PlaceholderScreen({ title, emoji, subtitle }: { title: string; emoji: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function ScanScreen() {
  return (
    <PlaceholderScreen
      emoji="🔍"
      title="성분 & 피부 스캔"
      subtitle="Sprint 2에서 구현 예정"
    />
  );
}

export function LogScreen() {
  return (
    <PlaceholderScreen
      emoji="📓"
      title="일일 로그"
      subtitle="Sprint 3에서 구현 예정"
    />
  );
}

export function InsightsScreen() {
  return (
    <PlaceholderScreen
      emoji="🧠"
      title="AI 인사이트"
      subtitle="Sprint 4에서 구현 예정"
    />
  );
}

export function ShopScreen() {
  return (
    <PlaceholderScreen
      emoji="🛍️"
      title="쇼핑"
      subtitle="Sprint 2에서 구현 예정"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emoji: { fontSize: 48, marginBottom: Spacing.md },
  title: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodySecondary, textAlign: 'center' },
});
