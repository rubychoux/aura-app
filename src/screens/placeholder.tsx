import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

function PlaceholderScreen({
  title,
  icon,
  subtitle,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={Colors.textSecondary} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function ScanScreen() {
  return (
    <PlaceholderScreen
      icon="search-outline"
      title="성분 & 피부 스캔"
      subtitle="Sprint 2에서 구현 예정"
    />
  );
}

export function LogScreen() {
  return (
    <PlaceholderScreen
      icon="journal-outline"
      title="일일 로그"
      subtitle="Sprint 3에서 구현 예정"
    />
  );
}

export function InsightsScreen() {
  return (
    <PlaceholderScreen
      icon="bar-chart-outline"
      title="AI 인사이트"
      subtitle="Sprint 4에서 구현 예정"
    />
  );
}

export function ShopScreen() {
  return (
    <PlaceholderScreen
      icon="bag-outline"
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
  icon: { marginBottom: Spacing.md },
  title: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodySecondary, textAlign: 'center' },
});
