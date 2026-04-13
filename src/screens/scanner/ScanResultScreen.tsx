import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ScanResult'>;
type Route = RouteProp<MainStackParamList, 'ScanResult'>;

const ZONE_LABELS: Record<string, string> = {
  forehead: '이마',
  leftCheek: '왼쪽 볼',
  rightCheek: '오른쪽 볼',
  nose: '코',
  chin: '턱',
};

function severityColor(level: number): string {
  if (level <= 1) return Colors.success;
  if (level <= 2) return '#A8D5A2';
  if (level <= 3) return Colors.warning;
  if (level <= 4) return '#F2994A';
  return Colors.danger;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  return Colors.danger;
}

function scoreLabel(score: number): string {
  if (score >= 80) return '양호';
  if (score >= 60) return '보통';
  return '주의 필요';
}

export function ScanResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { result, isSaved: initialSaved = false } = route.params;

  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요해요');
      const { error } = await supabase.from('skin_scans').insert({
        user_id: user.id,
        scan_result: result,
      });
      if (error) throw error;
      setSaved(true);
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <Text style={styles.pageTitle}>피부 분석 결과</Text>

        {/* 종합 점수 카드 */}
        <View style={styles.scoreCard}>
          <View style={[styles.scoreBadge, { borderColor: scoreColor(result.overallScore) }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor(result.overallScore) }]}>
              {result.overallScore}
            </Text>
            <Text style={styles.scoreUnit}>점</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreStatus, { color: scoreColor(result.overallScore) }]}>
              {scoreLabel(result.overallScore)}
            </Text>
            <Text style={styles.skinCondition}>{result.skinCondition}</Text>
            <Text style={styles.acneType}>{result.acneType} · 심각도 {result.severity}/5</Text>
          </View>
        </View>

        {/* 부위별 상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>부위별 상태</Text>
          <View style={styles.zonesGrid}>
            {Object.entries(result.zones).map(([key, level]) => {
              const label = ZONE_LABELS[key];
              const hasRedness =
                result.redness?.detected &&
                result.redness.zones.includes(label);
              const dotColor = hasRedness ? Colors.danger : severityColor(level);
              return (
                <View key={key} style={styles.zoneItem}>
                  <View style={[styles.zoneDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.zoneLabel}>{label}</Text>
                  <Text style={[styles.zoneLevel, { color: dotColor }]}>Lv.{level}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 홍조 / 자극 */}
        {result.redness?.detected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>홍조 / 자극</Text>
            <View style={[styles.listCard, styles.rednessCard]}>
              <View style={styles.listRow}>
                <View style={[styles.bullet, { backgroundColor: Colors.danger }]} />
                <Text style={styles.listText}>{result.redness.description}</Text>
              </View>
              <View style={styles.rednessZones}>
                {result.redness.zones.map((zone) => (
                  <View key={zone} style={styles.rednessZoneBadge}>
                    <Text style={styles.rednessZoneText}>{zone}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 주요 소견 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주요 소견</Text>
          <View style={styles.listCard}>
            {result.keyFindings.map((finding, i) => (
              <View key={i} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{finding}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI 추천 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 추천</Text>
          <View style={styles.listCard}>
            {result.recommendations.map((rec, i) => (
              <View key={i} style={styles.recItem}>
                <View style={styles.listRow}>
                  <Text style={styles.recIndex}>{i + 1}</Text>
                  <Text style={styles.listText}>{rec}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(rec)}`
                    )
                  }
                  style={styles.oliveyoungBtn}
                >
                  <Text style={styles.oliveyoungText}>올리브영에서 보기 →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.saveBtn, (saved || saving) && styles.saveBtnDone]}
            onPress={handleSave}
            disabled={saved || saving}
          >
            <Text style={styles.saveBtnText}>
              {saved ? '저장됐어요 ✓' : saving ? '저장 중...' : '결과 저장하기'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.buttons, styles.buttonsBottom]}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>다시 스캔하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.retryBtnText}>홈으로</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.lg,
  },

  pageTitle: { ...Typography.h2, textAlign: 'center' },

  // 점수 카드
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  scoreNumber: { fontSize: 32, fontWeight: '700' },
  scoreUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  scoreInfo: { flex: 1, gap: 4 },
  scoreStatus: { fontSize: 16, fontWeight: '700' },
  skinCondition: { ...Typography.body, color: Colors.textPrimary },
  acneType: { ...Typography.caption, color: Colors.textSecondary },

  // 섹션
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3 },

  // 부위별
  zonesGrid: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneItem: {
    width: '28%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  zoneDot: { width: 36, height: 36, borderRadius: 18 },
  zoneLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  zoneLevel: { fontSize: 12, fontWeight: '600' },

  // 리스트 카드
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  listText: { ...Typography.body, flex: 1, lineHeight: 22 },
  recItem: {
    gap: 4,
  },
  recIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentMuted,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
    lineHeight: 20,
  },

  oliveyoungBtn: {
    alignSelf: 'flex-start',
    paddingLeft: 28, // align under text (past the index badge)
  },
  oliveyoungText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },

  // 홍조 카드
  rednessCard: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  rednessZones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  rednessZoneBadge: {
    backgroundColor: '#FFCDD2',
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  rednessZoneText: { fontSize: 11, fontWeight: '600', color: Colors.danger },

  // 버튼
  buttons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  buttonsBottom: { marginBottom: 80 },
  retryBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { ...Typography.cta, color: Colors.accent },
  saveBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDone: {
    backgroundColor: Colors.success,
  },
  saveBtnText: { ...Typography.cta, color: Colors.surface },
});
