import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.docTitle}>meve 개인정보 처리방침</Text>
        <Text style={styles.meta}>시행일: 2026년 5월 1일</Text>

        <Section title="1. 수집하는 개인정보 항목">
          <Bullet>필수: 이메일 주소, 닉네임</Bullet>
          <Bullet>선택: 프로필 사진, 생년월일, 성별</Bullet>
          <Bullet>서비스 이용 중 생성: 피부 스캔 이미지 및 분석 결과, 앱 사용 기록</Bullet>
        </Section>

        <Section title="2. 개인정보 수집 및 이용 목적">
          <Bullet>AI 피부 분석 서비스 제공</Bullet>
          <Bullet>맞춤형 스킨케어 및 메이크업 추천</Bullet>
          <Bullet>서비스 개선 및 통계 분석</Bullet>
        </Section>

        <Section title="3. 개인정보 보유 및 이용 기간">
          <Bullet>회원 탈퇴 시까지 보유 후 즉시 파기</Bullet>
          <Bullet>
            단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관
          </Bullet>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <Text style={styles.body}>
            meve는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          </Text>
        </Section>

        <Section title="5. 개인정보 처리의 위탁">
          <Bullet>Supabase Inc. (데이터베이스 및 인증 서비스)</Bullet>
          <Bullet>OpenAI (AI 분석, 이미지는 분석 후 즉시 삭제)</Bullet>
        </Section>

        <Section title="6. 이용자의 권리">
          <Bullet>개인정보 열람, 수정, 삭제 요청 가능</Bullet>
          <Bullet>삭제 요청: 마이페이지 → 계정 삭제 또는 이메일 문의</Bullet>
        </Section>

        <Section title="7. 문의처">
          <Text style={styles.body}>이메일: support@meve.app</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDF6F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#2D2D2D' },
  content: { padding: 20, paddingBottom: 60 },
  docTitle: { fontSize: 20, fontWeight: '700', color: '#2D2D2D', marginBottom: 4 },
  meta: { fontSize: 12, color: '#9A8F97', marginBottom: 18 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  body: { fontSize: 13, color: '#2D2D2D', lineHeight: 20 },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletDot: { fontSize: 13, color: '#2D2D2D', lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: '#2D2D2D', lineHeight: 20 },
});
