import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { PrimaryButton, GhostButton } from '../../components/ui';

type NotifProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'NotificationPermission'>;
};

export function NotificationPermissionScreen({ navigation }: NotifProps) {
  async function requestPermission() {
    // TODO: import { requestPermissionsAsync } from 'expo-notifications'
    // await requestPermissionsAsync();
    navigation.navigate('OnboardingComplete');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>피부 변화를{'\n'}놓치지 마세요</Text>
        <Text style={styles.subtitle}>
          매일 로그 알림으로 패턴을 더 빨리 발견하고, 피부 컨디션 변화를 바로 알 수 있어요.
        </Text>

        <View style={styles.benefitList}>
          {[
            '📊 매일 밤 로그 리마인더',
            '🧠 새로운 피부 패턴 발견 알림',
            '⚠️ 피부 컨디션 주의 알림',
          ].map((b) => (
            <Text key={b} style={styles.benefit}>{b}</Text>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="알림 켜기" onPress={requestPermission} />
        <GhostButton
          label="나중에"
          onPress={() => navigation.navigate('OnboardingComplete')}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: { ...Typography.h1, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 38 },
  subtitle: { ...Typography.bodySecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  benefitList: { gap: Spacing.sm, width: '100%' },
  benefit: { ...Typography.body, color: Colors.textSecondary },
  footer: { paddingBottom: 48, width: '100%', gap: Spacing.sm },
});
