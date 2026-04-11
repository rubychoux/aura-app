import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface Slide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🔍',
    title: '왜 내 피부가 이래요?',
    description: 'AI가 내 피부를 정확히 진단해 드려요.',
    accent: Colors.accent,
  },
  {
    id: '2',
    emoji: '🧴',
    title: '내 피부에 맞는 성분만',
    description: '수천 개 성분 중 나에게 맞는 것만 골라드려요.',
    accent: Colors.success,
  },
  {
    id: '3',
    emoji: '📅',
    title: 'AI가 처방하는 나만의 30일 루틴',
    description: 'AI 코치가 루틴을 함께 만들어 드려요.',
    accent: Colors.accent,
  },
];

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.navigate('AuthGate');
    } else {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }
  };

  const handleSkip = () => {
    navigation.navigate('AuthGate');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>meve</Text>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 슬라이드 */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiCircle, { backgroundColor: item.accent + '18' }]}>
              <Text style={styles.slideEmoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.description}</Text>
          </View>
        )}
        style={styles.flatList}
      />

      {/* 하단 */}
      <View style={styles.footer}>
        {/* 도트 인디케이터 */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          label={isLast ? '시작하기' : '다음'}
          onPress={handleNext}
        />

        <Text style={styles.disclaimer}>
          시작하기를 누르면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 4,
  },
  skipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  flatList: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  slideEmoji: { fontSize: 52 },
  slideTitle: {
    ...Typography.h1,
    textAlign: 'center',
    lineHeight: 38,
  },
  slideDesc: {
    ...Typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dot: {
    height: 6,
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.border,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textDisabled,
    lineHeight: 18,
  },
});
