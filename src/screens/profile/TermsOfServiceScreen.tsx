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

type Nav = NativeStackNavigationProp<MainStackParamList, 'TermsOfService'>;

export function TermsOfServiceScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.docTitle}>meve 서비스 이용약관</Text>
        <Text style={styles.meta}>시행일: 2026년 5월 1일</Text>

        <Article title="제1조 (목적)">
          본 약관은 meve(이하 "회사")가 제공하는 AI 뷰티 서비스의 이용에 관한 조건 및 절차를 규정합니다.
        </Article>

        <Article title="제2조 (서비스 대상)">
          만 14세 이상의 사용자가 이용할 수 있습니다.
        </Article>

        <Article title="제3조 (계정)">
          <Bullet>이용자는 정확한 정보로 계정을 생성해야 합니다.</Bullet>
          <Bullet>계정 정보는 타인과 공유할 수 없습니다.</Bullet>
        </Article>

        <Article title="제4조 (금지 행위)">
          <Bullet>타인의 개인정보 수집 및 도용</Bullet>
          <Bullet>서비스의 정상적인 운영을 방해하는 행위</Bullet>
          <Bullet>커뮤니티에 불법, 음란, 혐오 콘텐츠 게시</Bullet>
        </Article>

        <Article title="제5조 (AI 분석 결과 면책)">
          meve의 AI 피부 분석 결과는 참고 정보이며, 의료적 진단이나 처방을 대체하지 않습니다. 피부 질환이나 이상 증상은 반드시 전문 의료기관을 방문하세요.
        </Article>

        <Article title="제6조 (서비스 변경 및 중단)">
          회사는 서비스 내용을 변경하거나 중단할 수 있으며, 사전에 공지합니다.
        </Article>

        <Article title="제7조 (문의)">
          이메일: support@meve.app
        </Article>
      </ScrollView>
    </SafeAreaView>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof children === 'string' ? (
        <Text style={styles.body}>{children}</Text>
      ) : (
        <View>{children}</View>
      )}
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
