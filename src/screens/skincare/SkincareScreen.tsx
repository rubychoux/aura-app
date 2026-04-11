import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { MainTabParamList, ScanAnalysisResult } from '../../types';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Skincare'>;

// ─── Local types ────────────────────────────────────────────────────────────

interface IngredientRec {
  name: string;
  reason: string;
  benefit: string;
}
interface IngredientAvoid {
  name: string;
  reason: string;
}
interface IngredientRecs {
  recommended: IngredientRec[];
  avoid: IngredientAvoid[];
  compatibilityScore: number;
}
interface ProductRec {
  name: string;
  brand: string;
  keyIngredients: string[];
  compatibilityScore: number;
  reason: string;
}
interface IngredientItem {
  name: string;
  status: 'safe' | 'caution' | 'avoid';
  reason: string;
}
interface ProductScanResult {
  productName?: string;
  ingredients: IngredientItem[];
  overallScore: number;
  summary: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS = ['내 성분', '제품 탐색', '제품 스캔'];
const CATEGORIES = ['토너', '세럼', '크림', '선크림'];

async function callOpenAI(prompt: string, imageBase64?: string): Promise<string> {
  const content: any = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: prompt },
      ]
    : prompt;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'OpenAI 오류');
  const text = data.choices[0].message.content.trim();
  const match = text.match(/[{[][\s\S]*[}\]]/);
  if (!match) throw new Error('응답에서 JSON을 찾을 수 없어요');
  return match[0];
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  return Colors.danger;
}

function statusColor(status: 'safe' | 'caution' | 'avoid'): string {
  if (status === 'safe') return Colors.flagSafe;
  if (status === 'caution') return Colors.flagCaution;
  return Colors.flagAvoid;
}

function statusLabel(status: 'safe' | 'caution' | 'avoid'): string {
  if (status === 'safe') return '안전';
  if (status === 'caution') return '주의';
  return '피하기';
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SkincareScreen() {
  const navigation = useNavigation<Nav>();

  const [activeTab, setActiveTab] = useState(0);

  // Section 1 — 내 성분
  const [latestScan, setLatestScan] = useState<ScanAnalysisResult | null>(null);
  const [scanLoaded, setScanLoaded] = useState(false);
  const [ingredientRecs, setIngredientRecs] = useState<IngredientRecs | null>(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);

  // Section 2 — 제품 탐색
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRec[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  // Section 3 — 제품 스캔
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanStep, setScanStep] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [productScan, setProductScan] = useState<ProductScanResult | null>(null);
  const [productSaved, setProductSaved] = useState(false);

  // ── Fetch latest scan on mount ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('skin_scans')
          .select('scan_result')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data?.scan_result) setLatestScan(data.scan_result as ScanAnalysisResult);
      } finally {
        setScanLoaded(true);
      }
    };
    load();
  }, []);

  // ── Load ingredient recs when Section 1 becomes active ────────────────────
  useEffect(() => {
    if (activeTab === 0 && latestScan && !ingredientRecs && !ingredientLoading) {
      loadIngredientRecs();
    }
  }, [activeTab, latestScan]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  const loadIngredientRecs = async () => {
    setIngredientLoading(true);
    try {
      const json = await callOpenAI(
        `Based on this skin analysis result: ${JSON.stringify(latestScan)}, provide personalized skincare ingredient recommendations in Korean. Return ONLY JSON: {"recommended": [{"name": "성분명", "reason": "이유", "benefit": "효능"}], "avoid": [{"name": "성분명", "reason": "피해야 하는 이유"}], "compatibilityScore": 0}`
      );
      setIngredientRecs(JSON.parse(json));
    } catch {
      Alert.alert('오류', '성분 추천을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIngredientLoading(false);
    }
  };

  const loadProducts = async (category: string) => {
    setSelectedCategory(category);
    setProducts([]);
    setProductLoading(true);
    try {
      const recommended = ingredientRecs?.recommended.map((r) => r.name).join(', ') ?? '보습, 진정';
      const json = await callOpenAI(
        `Based on recommended skincare ingredients (${recommended}), recommend 3 Korean skincare products in the ${category} category. Return ONLY JSON array: [{"name": "제품명", "brand": "브랜드", "keyIngredients": ["성분1"], "compatibilityScore": 85, "reason": "추천 이유"}]`
      );
      setProducts(JSON.parse(json));
    } catch {
      Alert.alert('오류', '제품 추천을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setProductLoading(false);
    }
  };

  const handleProductCapture = async () => {
    if (!cameraRef.current) return;
    setScanStep('analyzing');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (!photo.base64) throw new Error('사진을 가져오지 못했어요');
      const profile = latestScan ? JSON.stringify(latestScan) : '일반 피부';
      const json = await callOpenAI(
        `Read the ingredient list from this product label photo. Then analyze each ingredient for this skin profile: ${profile}. Return ONLY JSON: {"productName": "제품명 if visible", "ingredients": [{"name": "성분명", "status": "safe", "reason": "이유"}], "overallScore": 0, "summary": "한 줄 요약"}`,
        photo.base64
      );
      setProductScan(JSON.parse(json));
      setScanStep('done');
    } catch (e: any) {
      Alert.alert('스캔 실패', e?.message ?? '다시 시도해 주세요.');
      setScanStep('idle');
    }
  };

  const handleSaveProduct = async () => {
    if (!productScan) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요해요');
      await supabase.from('products').insert({
        user_id: user.id,
        product_name: productScan.productName ?? '알 수 없는 제품',
        scan_result: productScan,
      });
      setProductSaved(true);
    } catch {
      Alert.alert('저장 실패', '다시 시도해 주세요.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 탭 스위처 */}
      <View style={styles.tabSwitcher}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]}
            onPress={() => setActiveTab(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === i && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Section 1: 내 성분 ────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!scanLoaded ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : !latestScan ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🩷</Text>
              <Text style={styles.emptyTitle}>스캔 결과가 없어요</Text>
              <Text style={styles.emptyDesc}>
                먼저 AI 피부 스캔을 해주세요.{'\n'}맞춤 성분 추천을 드릴게요!
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('AIScan')}
              >
                <Text style={styles.primaryBtnText}>AI 피부 스캔하기 →</Text>
              </TouchableOpacity>
            </View>
          ) : ingredientLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>맞춤 성분 분석 중...</Text>
            </View>
          ) : !ingredientRecs ? (
            <View style={styles.center}>
              <TouchableOpacity style={styles.primaryBtn} onPress={loadIngredientRecs}>
                <Text style={styles.primaryBtnText}>성분 추천 받기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 호환성 점수 */}
              <View style={styles.scoreRow}>
                <Text style={styles.sectionLabel}>피부 호환성</Text>
                <Text style={[styles.scoreText, { color: scoreColor(ingredientRecs.compatibilityScore) }]}>
                  {ingredientRecs.compatibilityScore}점
                </Text>
              </View>

              {/* 추천 성분 */}
              <Text style={styles.sectionTitle}>✅ 추천 성분</Text>
              {ingredientRecs.recommended.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, styles.recommendedCard]}>
                  <View style={styles.ingredientTag}>
                    <Text style={styles.ingredientTagText}>{item.name}</Text>
                  </View>
                  <Text style={styles.ingredientBenefit}>{item.benefit}</Text>
                  <Text style={styles.ingredientReason}>{item.reason}</Text>
                </View>
              ))}

              {/* 피해야 할 성분 */}
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>❌ 피해야 할 성분</Text>
              {ingredientRecs.avoid.map((item, i) => (
                <View key={i} style={[styles.ingredientCard, styles.avoidCard]}>
                  <View style={[styles.ingredientTag, styles.avoidTag]}>
                    <Text style={[styles.ingredientTagText, { color: Colors.danger }]}>{item.name}</Text>
                  </View>
                  <Text style={styles.ingredientReason}>{item.reason}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.refreshBtn} onPress={() => { setIngredientRecs(null); loadIngredientRecs(); }}>
                <Text style={styles.refreshBtnText}>새로 분석하기</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Section 2: 제품 탐색 ──────────────────────────────────────────── */}
      {activeTab === 1 && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>카테고리 선택</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                onPress={() => loadProducts(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryBtnText, selectedCategory === cat && styles.categoryBtnTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {productLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>제품 추천 중...</Text>
            </View>
          ) : products.length === 0 && selectedCategory ? null : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyDesc}>카테고리를 선택하면{'\n'}맞춤 제품을 추천해드려요</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
                {selectedCategory} 추천 제품
              </Text>
              {products.map((product, i) => (
                <View key={i} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                    </View>
                    <View style={[styles.compatBadge, { backgroundColor: scoreColor(product.compatibilityScore) + '22' }]}>
                      <Text style={[styles.compatScore, { color: scoreColor(product.compatibilityScore) }]}>
                        {product.compatibilityScore}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.keyIngredients}>
                    {product.keyIngredients.map((ing, j) => (
                      <View key={j} style={styles.ingTag}>
                        <Text style={styles.ingTagText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.productReason}>{product.reason}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(product.name)}`
                      )
                    }
                    style={styles.oliveyoungBtn}
                  >
                    <Text style={styles.oliveyoungText}>올리브영에서 보기 →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Section 3: 제품 스캔 ──────────────────────────────────────────── */}
      {activeTab === 2 && (
        <View style={styles.scanContainer}>
          {/* 권한 없음 */}
          {!cameraPermission?.granted ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🩷</Text>
              <Text style={styles.emptyTitle}>카메라 권한이 필요해요</Text>
              <Text style={styles.emptyDesc}>제품 성분표를 스캔하려면{'\n'}카메라 권한을 허용해 주세요.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={requestCameraPermission}>
                <Text style={styles.primaryBtnText}>권한 허용하기</Text>
              </TouchableOpacity>
            </View>
          ) : scanStep === 'done' && productScan ? (
            /* 결과 화면 */
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 종합 점수 */}
              <View style={styles.productScanScore}>
                <Text style={[styles.bigScore, { color: scoreColor(productScan.overallScore) }]}>
                  {productScan.overallScore}점
                </Text>
                {productScan.productName && (
                  <Text style={styles.productScanName}>{productScan.productName}</Text>
                )}
                <Text style={styles.productScanSummary}>{productScan.summary}</Text>
              </View>

              {/* 성분 리스트 */}
              <Text style={styles.sectionTitle}>성분 분석</Text>
              {productScan.ingredients.map((item, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                  <View style={styles.ingredientRowText}>
                    <Text style={styles.ingredientRowName}>{item.name}</Text>
                    <Text style={styles.ingredientRowReason}>{item.reason}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor(item.status) }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
              ))}

              {/* 버튼 */}
              <View style={styles.scanResultBtns}>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => { setScanStep('idle'); setProductScan(null); setProductSaved(false); }}
                >
                  <Text style={styles.retryBtnText}>다시 스캔하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, productSaved && styles.savedBtn]}
                  onPress={handleSaveProduct}
                  disabled={productSaved}
                >
                  <Text style={styles.primaryBtnText}>
                    {productSaved ? '저장됐어요 ✓' : '이 제품 저장하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* 카메라 + 촬영 버튼 */
            <View style={{ flex: 1 }}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
              />
              {scanStep === 'analyzing' && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator color={Colors.surface} size="large" />
                  <Text style={styles.analyzingText}>성분표를 분석하고 있어요...</Text>
                </View>
              )}
              {scanStep === 'idle' && (
                <View style={styles.cameraGuide}>
                  <Text style={styles.cameraGuideText}>제품 성분표에 카메라를 맞춰 주세요</Text>
                  <TouchableOpacity
                    style={styles.captureBtn}
                    onPress={handleProductCapture}
                    activeOpacity={0.85}
                  >
                    <View style={styles.captureBtnInner} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: { ...Typography.bodySecondary },

  // 탭 스위처
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.accent,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },

  // Empty / CTA
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.h3, textAlign: 'center' },
  emptyDesc: { ...Typography.bodySecondary, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  primaryBtnText: { ...Typography.cta, color: Colors.surface },
  savedBtn: { backgroundColor: Colors.success },
  refreshBtn: {
    marginTop: Spacing.md,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  refreshBtnText: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },

  // Section labels
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreText: { fontSize: 20, fontWeight: '700' },

  // Ingredient cards
  ingredientCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendedCard: { borderLeftWidth: 3, borderLeftColor: Colors.success },
  avoidCard: { borderLeftWidth: 3, borderLeftColor: Colors.danger },
  ingredientTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  avoidTag: { backgroundColor: Colors.danger + '22' },
  ingredientTagText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  ingredientBenefit: { ...Typography.body, fontWeight: '500' },
  ingredientReason: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  // Category buttons
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  categoryBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  categoryBtnTextActive: { color: Colors.accent, fontWeight: '600' },

  // Product cards
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: { flex: 1, gap: 2 },
  productName: { ...Typography.body, fontWeight: '700' },
  productBrand: { ...Typography.caption, color: Colors.textSecondary },
  compatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  compatScore: { fontSize: 14, fontWeight: '700' },
  keyIngredients: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingTag: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  ingTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  productReason: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  oliveyoungBtn: { alignSelf: 'flex-start' },
  oliveyoungText: { fontSize: 12, color: Colors.accent, fontWeight: '500' },

  // Section 3 — camera
  scanContainer: { flex: 1 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  analyzingText: { ...Typography.body, color: Colors.surface },
  cameraGuide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  cameraGuideText: {
    ...Typography.caption,
    color: Colors.surface,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
  },

  // Product scan result
  productScanScore: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 6,
  },
  bigScore: { fontSize: 48, fontWeight: '800' },
  productScanName: { ...Typography.h3 },
  productScanSummary: { ...Typography.bodySecondary, textAlign: 'center' },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  ingredientRowText: { flex: 1, gap: 2 },
  ingredientRowName: { ...Typography.body, fontWeight: '600' },
  ingredientRowReason: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  scanResultBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  retryBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { ...Typography.cta, color: Colors.accent },
});
