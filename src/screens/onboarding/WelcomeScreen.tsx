import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.wordmark}>AURA</Text>
          <View style={styles.taglineRow}>
            <View style={styles.accentLine} />
            <Text style={styles.tagline}>AI가 내 피부를 기억합니다</Text>
            <View style={styles.accentLine} />
          </View>
        </View>

        {/* Value props */}
        <View style={styles.props}>
          {[
            { emoji: '🔍', text: '성분 하나하나 분석해드려요' },
            { emoji: '📊', text: '수면·식단·스트레스와 피부를 연결해요' },
            { emoji: '🧠', text: 'AI가 내 피부 패턴을 발견해줘요' },
          ].map(({ emoji, text }) => (
            <View key={text} style={styles.propRow}>
              <Text style={styles.propEmoji}>{emoji}</Text>
              <Text style={styles.propText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="시작하기"
          onPress={() => navigation.navigate('PhoneAuth')}
        />
        <Text style={styles.disclaimer}>
          계속 진행하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 12,
    marginBottom: Spacing.md,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accentLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  tagline: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  props: {
    gap: Spacing.md,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  propEmoji: { fontSize: 24 },
  propText: { ...Typography.body, flex: 1 },
  footer: {
    paddingBottom: 48,
    gap: Spacing.md,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textDisabled,
    lineHeight: 18,
  },
});
