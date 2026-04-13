import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

export function RoutineScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="list-outline" size={48} color={Colors.textSecondary} />
      <Text style={styles.title}>루틴</Text>
      <Text style={styles.subtitle}>Sprint 2에서 구현 예정</Text>
    </View>
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
  title: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodySecondary, textAlign: 'center' },
});
