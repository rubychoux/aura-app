import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { AIScanStackParamList, ScanAnalysisResult } from '../../types';
import { HARDCODED_ROUTINE, oliveYoungSearchUrl, RoutineStep } from '../../constants/routine';
import { loadRoutineCheckin, RoutineCheckin } from '../../utils/routineCheckin';
import { PremiumUpsellModal } from '../../components/PremiumUpsellModal';
import { isPremiumNow } from '../../services/premium';
import { openOliveYoungSearch } from '../../services/affiliate';
import { buildLifestyleContextBlock, fetchDailyLogByDate, summarizeDailyLogRow } from '../../services/dailyLog';
import { todayYmd } from '../../utils/dateYmd';

type Nav = NativeStackNavigationProp<AIScanStackParamList, 'SkinHome'>;

// ─── Event config (inline) ───────────────────────────────────────────────────

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  wedding: 'diamond-outline',
  date: 'heart-outline',
  graduation: 'school-outline',
  travel: 'airplane-outline',
};

const EVENT_INFO: Record<string, { label: string; gradient: [string, string]; tip: string }> = {
  wedding: { label: '웨딩', gradient: ['#F5E6E8', '#E8D5D8'], tip: '트러블 제로 + 순한 성분 중심으로 관리해요' },
  date: { label: '데이트', gradient: ['#FCE4EC', '#F8BBD9'], tip: '글로우 집중 + 모공 정돈 케어' },
  graduation: { label: '졸업', gradient: ['#E3F2FD', '#BBDEFB'], tip: '화사한 피부톤 + 미백 집중' },
  travel: { label: '여행', gradient: ['#E0F7FA', '#B2EBF2'], tip: '피부 장벽 강화 + 선케어 집중' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientRec {
  name: string;
  benefit: string;
  reason: string;
}
interface IngredientAvoid {
  name: string;
  reason: string;
}
interface IngredientResult {
  recommended: IngredientRec[];
  avoid: IngredientAvoid[];
  eventTip: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export function SkincareScreen() {
  const navigation = useNavigation<Nav>();

  const [eventType, setEventType] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanAnalysisResult | null>(null);
  const [scanLoaded, setScanLoaded] = useState(false);

  // Ingredient analysis
  const [ingredientResult, setIngredientResult] = useState<IngredientResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Routine (check-in state for today; steps from HARDCODED_ROUTINE until Sprint 3)
  const [routineCheckin, setRoutineCheckin] = useState<RoutineCheckin>({ am: false, pm: false });
  const [routineTab, setRoutineTab] = useState<'am' | 'pm'>('am');
  const [lifestyleSummary, setLifestyleSummary] = useState<string | null>(null);

  const daysLeft = eventDate
    ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const eventInfo = eventType ? EVENT_INFO[eventType] : null;

  // ── Load data on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    loadEvent();
    loadLastScan();
    loadCachedIngredients();
    loadRoutine();
    loadLifestyle();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
      loadLifestyle();
    }, [])
  );

  const loadEvent = async () => {
    try {
      const [[, type], [, date]] = await AsyncStorage.multiGet([
        'meve_event_type',
        'meve_event_date',
      ]);
      if (type) setEventType(type);
      if (date) setEventDate(date);
    } catch {}
  };

  const loadLastScan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('skin_scans')
        .select('scan_result, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setLastScan(data[0].scan_result as ScanAnalysisResult);
      }
    } finally {
      setScanLoaded(true);
    }
  };

  const loadCachedIngredients = async () => {
    try {
      const raw = await AsyncStorage.getItem('meve_ingredients');
      if (raw) setIngredientResult(JSON.parse(raw));
    } catch {}
  };

  const loadRoutine = async () => {
    const today = todayYmd();
    const checkin = await loadRoutineCheckin(today);
    setRoutineCheckin(checkin);
  };

  const loadLifestyle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLifestyleSummary(null);
        return;
      }
      const row = await fetchDailyLogByDate(user.id, todayYmd());
      setLifestyleSummary(summarizeDailyLogRow(row));
    } catch {
      setLifestyleSummary(null);
    }
  };

  // ── Ingredient analysis ─────────────────────────────────────────────────────

  const analyzeIngredients = async () => {
    if (!isPremiumNow()) {
      setUpsellOpen(true);
      return;
    }
    if (!lastScan) {
      Alert.alert('피부 스캔 필요', '먼저 AI 피부 스캔을 해주세요');
      return;
    }
    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const lifestyleBlock = user ? await buildLifestyleContextBlock(user.id) : '';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 800,
          messages: [
            {
              role: 'user',
              content: `You are a Korean skincare expert.
Skin analysis result: ${JSON.stringify(lastScan)}
Upcoming event: ${eventType ?? 'none'}, ${daysLeft ?? 'unknown'} days away.

Lifestyle context (Korean app users; use to bias recommendations, e.g. low sleep or high stress → barrier/soothing/calming; ignore if empty):
${lifestyleBlock || '(no lifestyle data yet)'}
Return ONLY valid JSON no markdown:
{
  "recommended": [{"name":"성분명","benefit":"효능","reason":"이유"}],
  "avoid": [{"name":"성분명","reason":"이유"}],
  "eventTip": "D-day 케어 팁 한 줄"
}
Max 4 recommended, 3 avoid. All text in Korean.`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'OpenAI 오류');
      const content = data.choices[0].message.content.trim();
      const jsonMatch = content.match(/[{[][\s\S]*[}\]]/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');
      const result: IngredientResult = JSON.parse(jsonMatch[0]);
      setIngredientResult(result);
      await AsyncStorage.setItem('meve_ingredients', JSON.stringify(result));
    } catch (e: any) {
      Alert.alert('분석 실패', e?.message ?? '다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <PremiumUpsellModal
        visible={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        onUpgrade={() => {
          setUpsellOpen(false);
          (navigation as any).getParent?.()?.navigate?.('Paywall', { source: 'ingredient_insights' });
        }}
        subtitle="전체 맞춤 성분 분석은 프리미엄 기능이에요."
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. D-DAY BANNER ────────────────────────────────────────────── */}
        {eventInfo && daysLeft != null && (
          <LinearGradient
            colors={eventInfo.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ddayBanner}
          >
            <View style={styles.ddayRow}>
              <Ionicons
                name={EVENT_ICONS[eventType!] ?? 'calendar-outline'}
                size={22}
                color={Colors.textPrimary}
              />
              <Text style={styles.ddayTitle}>
                {eventInfo.label}까지 {daysLeft}일
              </Text>
            </View>
            <Text style={styles.ddayTip}>{eventInfo.tip}</Text>
          </LinearGradient>
        )}

        {/* ── 2. 라이프스타일 로그 ──────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.lifestyleCard}
          onPress={() => navigation.navigate('DailyLog')}
          activeOpacity={0.88}
        >
          <Ionicons name="moon-outline" size={24} color={Colors.accent} />
          <View style={styles.lifestyleText}>
            <Text style={styles.lifestyleTitle}>오늘의 라이프스타일 기록</Text>
            {lifestyleSummary ? (
              <Text style={styles.lifestyleDesc} numberOfLines={2}>
                {lifestyleSummary}
              </Text>
            ) : (
              <Text style={styles.lifestyleDesc}>수면·물·스트레스·식단을 기록해보세요</Text>
            )}
          </View>
          <Text style={styles.lifestyleCta}>{lifestyleSummary ? '수정' : '기록하기'}</Text>
        </TouchableOpacity>

        {/* ── 3. AI 피부 스캔 ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => navigation.navigate('FaceScanner')}
          activeOpacity={0.85}
        >
          <Ionicons name="scan-outline" size={28} color="#fff" />
          <View style={styles.scanCardText}>
            <Text style={styles.scanCardTitle}>AI 피부 스캔</Text>
            <Text style={styles.scanCardDesc}>AI가 피부 상태를 분석해드려요</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ── 4. 성분 스캔하기 ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.ingredientScanCard}
          onPress={() => navigation.navigate('IngredientScanner')}
          activeOpacity={0.85}
        >
          <Ionicons name="flask-outline" size={24} color={Colors.accent} />
          <View style={styles.scanCardText}>
            <Text style={styles.ingredientScanTitle}>성분 스캔하기</Text>
            <Text style={styles.ingredientScanDesc}>제품 성분표를 스캔해요</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* ── 5. 맞춤 성분 분석 ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 피부 맞춤 성분</Text>
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={analyzeIngredients}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.analyzeBtnText}>
                  {ingredientResult ? '다시 분석' : '분석하기'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {!scanLoaded ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : !lastScan && !ingredientResult ? (
            <View style={styles.emptyBox}>
              <Ionicons name="flask-outline" size={28} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>
                AI 피부 스캔 후 맞춤 성분을 분석해드려요
              </Text>
            </View>
          ) : isAnalyzing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>맞춤 성분 분석 중...</Text>
            </View>
          ) : ingredientResult ? (
            <>
              {/* 추천 성분 */}
              <Text style={styles.subTitle}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} /> 추천 성분
              </Text>
              {ingredientResult.recommended.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, styles.recommendedBorder]}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientBenefit}>{item.benefit}</Text>
                  <Text style={styles.ingredientReason}>{item.reason}</Text>
                  <TouchableOpacity
                    onPress={() => openOliveYoungSearch(item.name, { source: 'skincare_recommended_ingredient', item_name: item.name })}
                  >
                    <Text style={styles.oliveyoungLink}>올리브영에서 보기 →</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* 피해야 할 성분 */}
              <Text style={[styles.subTitle, { marginTop: Spacing.md }]}>
                <Ionicons name="close-circle" size={14} color={Colors.danger} /> 피해야 할 성분
              </Text>
              {ingredientResult.avoid.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, styles.avoidBorder]}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientReason}>{item.reason}</Text>
                </View>
              ))}

              {/* Event tip */}
              {ingredientResult.eventTip && (
                <View style={styles.eventTipBox}>
                  <Ionicons name="sparkles-outline" size={14} color={Colors.accent} />
                  <Text style={styles.eventTipText}>{ingredientResult.eventTip}</Text>
                </View>
              )}
            </>
          ) : null}
        </View>

        {/* ── 6. 내 루틴 (Sprint 2: 샘플 · Sprint 3: GPT + Supabase) ─────── */}
        <View style={styles.section}>
          <View style={styles.routineSectionHeader}>
            <Text style={styles.sectionTitle}>내 루틴</Text>
            <View style={styles.samplePill}>
              <Text style={styles.samplePillText}>샘플</Text>
            </View>
          </View>
          <Text style={styles.routineEventLabel}>{HARDCODED_ROUTINE.label}</Text>

          {!lastScan ? (
            <TouchableOpacity
              style={styles.routineScanBanner}
              onPress={() => navigation.navigate('FaceScanner')}
              activeOpacity={0.85}
            >
              <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
              <Text style={styles.routineScanBannerText}>
                피부 스캔을 하면 이 샘플 루틴이 분석 결과·D-day에 맞게 바뀌어요
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.routineToggle}>
            <TouchableOpacity
              style={[styles.routineToggleBtn, routineTab === 'am' && styles.routineToggleBtnActive]}
              onPress={() => setRoutineTab('am')}
            >
              <Ionicons name="sunny-outline" size={14} color={routineTab === 'am' ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.routineToggleText, routineTab === 'am' && styles.routineToggleTextActive]}>
                AM ({HARDCODED_ROUTINE.am_steps.length}단계)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routineToggleBtn, routineTab === 'pm' && styles.routineToggleBtnActive]}
              onPress={() => setRoutineTab('pm')}
            >
              <Ionicons name="moon-outline" size={14} color={routineTab === 'pm' ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.routineToggleText, routineTab === 'pm' && styles.routineToggleTextActive]}>
                PM ({HARDCODED_ROUTINE.pm_steps.length}단계)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routineStatus}>
            <Ionicons
              name={routineCheckin[routineTab] ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={routineCheckin[routineTab] ? Colors.success : Colors.textDisabled}
            />
            <Text style={styles.routineStatusText}>
              {routineCheckin[routineTab]
                ? `오늘 ${routineTab.toUpperCase()} 홈에서 완료했어요`
                : `홈에서 오늘 ${routineTab.toUpperCase()} 루틴을 체크해 주세요`}
            </Text>
          </View>

          {(routineTab === 'am' ? HARDCODED_ROUTINE.am_steps : HARDCODED_ROUTINE.pm_steps).map(
            (step: RoutineStep) => (
              <View key={`${routineTab}-${step.step}`} style={styles.routineStepCard}>
                <View style={styles.routineStepNum}>
                  <Text style={styles.routineStepNumText}>{step.step}</Text>
                </View>
                <View style={styles.routineStepBody}>
                  <Text style={styles.routineStepCategory}>{step.category}</Text>
                  <Text style={styles.routineStepDesc}>{step.description}</Text>
                  <Text style={styles.routineStepIngredient}>추천 성분: {step.keyIngredient}</Text>
                  <TouchableOpacity
                    onPress={() => openOliveYoungSearch(step.searchQuery, { source: 'routine_step', item_name: step.searchQuery })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.oliveyoungLink}>올리브영에서 보기 →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PAGE_BG = '#FDF6F9';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  scroll: { flex: 1 },
  content: { paddingBottom: 20, gap: 12 },

  // D-day banner
  ddayBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  ddayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ddayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ddayTip: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 30,
  },

  lifestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lifestyleText: { flex: 1, gap: 4 },
  lifestyleTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  lifestyleDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  lifestyleCta: { fontSize: 13, fontWeight: '800', color: Colors.accent },

  // AI scan card
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 18,
    gap: 14,
  },
  scanCardText: { flex: 1 },
  scanCardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  scanCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  // Ingredient scan card
  ingredientScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientScanTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  ingredientScanDesc: { fontSize: 12, color: Colors.textSecondary },

  // Section
  section: {
    marginHorizontal: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  routineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  samplePill: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  samplePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  routineEventLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  routineScanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  routineScanBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  routineStepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routineStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineStepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  routineStepBody: {
    flex: 1,
    gap: 4,
  },
  routineStepCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  routineStepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  routineStepIngredient: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  analyzeBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 70,
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Loading / empty
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Ingredient cards
  ingredientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  avoidBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ingredientBenefit: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
  ingredientReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  oliveyoungLink: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
    marginTop: 4,
  },

  // Event tip
  eventTipBox: {
    backgroundColor: '#FFF0F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  eventTipText: {
    fontSize: 13,
    color: Colors.accent,
    flex: 1,
    lineHeight: 19,
    fontWeight: '500',
  },

  // Routine
  routineToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  routineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  routineToggleBtnActive: {
    backgroundColor: Colors.accent,
  },
  routineToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  routineToggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  routineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routineStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  smallScanBtn: {
    marginTop: 4,
  },
  smallScanBtnText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
});
