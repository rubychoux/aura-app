// Community feed — MEVE-193. Beauty Report hero + 내 핏 / 전체 tabs + FAB.
// Storage bucket 'community-posts' with public read must exist (created via migration).
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import {
  MainStackParamList,
  MainTabParamList,
  Post,
  ProductTag,
  FaceAnalysisResult,
} from '../../types';

const logo = require('../../../assets/images/meve-logo.png');

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Community'>,
  NativeStackNavigationProp<MainStackParamList>
>;

const PINK = '#FF6B9D';
const BLUE = '#5BA3D9';
const PURPLE = '#9B59B6';

interface EventChip {
  key: string | null;
  label: string;
}

const EVENT_CHIPS: EventChip[] = [
  { key: null, label: '전체' },
  { key: 'wedding', label: '웨딩 💍' },
  { key: 'date', label: '데이트 💕' },
  { key: 'graduation', label: '졸업 🎓' },
  { key: 'travel', label: '여행 ✈️' },
  { key: 'photoshoot', label: '촬영 📸' },
];

const EVENT_EMOJI: Record<string, string> = {
  wedding: '💍',
  date: '💕',
  graduation: '🎓',
  travel: '✈️',
  photoshoot: '📸',
};

const EVENT_LABEL: Record<string, string> = {
  wedding: '웨딩',
  date: '데이트',
  graduation: '졸업',
  travel: '여행',
  photoshoot: '촬영',
};

const SKIN_TYPES = ['건성', '지성', '복합성', '민감성'];
const PERSONAL_COLORS = ['봄 웜톤', '여름 쿨톤', '가을 웜톤', '겨울 쿨톤'];
const VIBES = ['청순', '글로우', '볼드', '내추럴', '빈티지', '클린걸', '테토녀', '에겐녀'];
const FACE_SHAPES = ['계란형', '하트형', '둥근형', '각진형', '긴형'];

function normalizePersonalColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const t = input.replace(/\s+/g, '');
  if (t.includes('여름') && t.includes('쿨톤')) return '여름 쿨톤';
  if (t.includes('겨울') && t.includes('쿨톤')) return '겨울 쿨톤';
  if (t.includes('봄') && t.includes('웜톤')) return '봄 웜톤';
  if (t.includes('가을') && t.includes('웜톤')) return '가을 웜톤';
  return input;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

type PostWithMeta = Post & {
  _isLiked: boolean;
  _likeCount: number;
  _commentCount: number;
};

interface MyProfile {
  skinScore: number | null;
  personal_color: string | null;
  vibe: string | null;
  face_shape: string | null;
  event_type: string | null;
  dday_count: number | null;
  skin_type: string | null;
}

const EMPTY_PROFILE: MyProfile = {
  skinScore: null,
  personal_color: null,
  vibe: null,
  face_shape: null,
  event_type: null,
  dday_count: null,
  skin_type: null,
};

type FeedTab = 'mine' | 'all';
type FilterKey = 'event' | 'skin' | 'color' | 'vibe' | 'face';

export function CommunityScreen() {
  const navigation = useNavigation<Nav>();

  const [feedTab, setFeedTab] = useState<FeedTab>('mine');

  // My profile (for 내 핏 + hero card)
  const [profile, setProfile] = useState<MyProfile>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [similarCount, setSimilarCount] = useState<number | null>(null);

  // Manual filters (used in 전체 tab; also overlaid onto auto-filters)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedSkinType, setSelectedSkinType] = useState<string | null>(null);
  const [selectedPersonalColor, setSelectedPersonalColor] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedFaceShape, setSelectedFaceShape] = useState<string | null>(null);
  const [expandedFilter, setExpandedFilter] = useState<FilterKey | null>(null);

  // Removed auto-filter keys for 내 핏 tab (user can ✕ a my-fit pill)
  const [excludedAutoKeys, setExcludedAutoKeys] = useState<Set<keyof MyProfile>>(
    new Set()
  );

  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load profile ─────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const pairs = await AsyncStorage.multiGet([
        'meve_personal_color',
        'meve_vibe',
        'meve_face_analysis',
        'meve_event_type',
        'meve_event_date',
        'meve_last_scan_score',
      ]);
      const m = Object.fromEntries(pairs) as Record<string, string | null>;

      const personal_color = normalizePersonalColor(m['meve_personal_color']);
      const vibe = m['meve_vibe'];

      let face_shape: string | null = null;
      if (m['meve_face_analysis']) {
        try {
          const parsed = JSON.parse(m['meve_face_analysis']) as FaceAnalysisResult;
          face_shape = parsed.faceShape ?? null;
        } catch {}
      }

      const event_type = m['meve_event_type'];
      let dday_count: number | null = null;
      if (m['meve_event_date']) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(m['meve_event_date']);
        target.setHours(0, 0, 0, 0);
        dday_count = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
      }

      // Skin score: AsyncStorage primary, fallback to most recent skin_scans row
      let skinScore: number | null = m['meve_last_scan_score']
        ? Number(m['meve_last_scan_score']) || null
        : null;
      let skin_type: string | null = null;

      if (user) {
        if (skinScore == null) {
          const { data: scanRows } = await supabase
            .from('skin_scans')
            .select('scan_result')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (scanRows && scanRows.length > 0) {
            const sc = (scanRows[0] as any).scan_result?.overallScore;
            if (typeof sc === 'number') skinScore = sc;
          }
        }
        const { data: profRow } = await supabase
          .from('user_profiles')
          .select('skin_type')
          .eq('id', user.id)
          .maybeSingle();
        skin_type = profRow?.skin_type ?? null;
      }

      setProfile({
        skinScore,
        personal_color,
        vibe,
        face_shape,
        event_type,
        dday_count,
        skin_type,
      });
    } catch {
      setProfile(EMPTY_PROFILE);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  // ── Fetch posts ──────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id ?? null;

      let query = supabase
        .from('posts')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (feedTab === 'mine') {
        // Auto-filter by profile, excluding any keys the user ✕'d
        if (profile.personal_color && !excludedAutoKeys.has('personal_color'))
          query = query.eq('personal_color', profile.personal_color);
        if (profile.vibe && !excludedAutoKeys.has('vibe'))
          query = query.eq('vibe', profile.vibe);
        if (profile.face_shape && !excludedAutoKeys.has('face_shape'))
          query = query.eq('face_shape', profile.face_shape);
        if (
          profile.event_type &&
          profile.event_type !== '기타' &&
          !excludedAutoKeys.has('event_type')
        )
          query = query.eq('event_type', profile.event_type);
        if (profile.skin_type && !excludedAutoKeys.has('skin_type'))
          query = query.eq('skin_type', profile.skin_type);
      } else {
        // Manual filters (전체 tab)
        if (selectedEvent) query = query.eq('event_type', selectedEvent);
        if (selectedSkinType) query = query.eq('skin_type', selectedSkinType);
        if (selectedPersonalColor)
          query = query.eq('personal_color', selectedPersonalColor);
        if (selectedVibe) query = query.eq('vibe', selectedVibe);
        if (selectedFaceShape) query = query.eq('face_shape', selectedFaceShape);
      }

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Post[];

      const postIds = rows.map((r) => r.id);
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const likedIds = new Set<string>();
      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};
      const profiles: Record<
        string,
        { display_name: string | null; avatar_url: string | null }
      > = {};

      if (postIds.length > 0) {
        const [{ data: allLikes }, { data: allComments }, { data: profRows }] =
          await Promise.all([
            supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
            supabase.from('comments').select('post_id').in('post_id', postIds),
            userIds.length > 0
              ? supabase
                  .from('user_profiles')
                  .select('id, display_name, avatar_url')
                  .in('id', userIds)
              : Promise.resolve({ data: [] as any[] }),
          ]);
        for (const row of allLikes ?? []) {
          likeCounts[row.post_id] = (likeCounts[row.post_id] ?? 0) + 1;
          if (currentUserId && row.user_id === currentUserId) likedIds.add(row.post_id);
        }
        for (const row of allComments ?? []) {
          commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
        }
        for (const p of (profRows ?? []) as any[]) {
          profiles[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        }
      }

      const withMeta: PostWithMeta[] = rows.map((r) => ({
        ...r,
        image_urls: Array.isArray(r.image_urls) ? (r.image_urls as string[]) : [],
        product_tags: Array.isArray(r.product_tags)
          ? (r.product_tags as ProductTag[])
          : [],
        user_profiles: profiles[r.user_id] ?? null,
        _isLiked: likedIds.has(r.id),
        _likeCount: likeCounts[r.id] ?? r.likes_count ?? 0,
        _commentCount: commentCounts[r.id] ?? r.comments_count ?? 0,
      }));
      setPosts(withMeta);
    } catch (e: any) {
      Alert.alert('불러오기 실패', e?.message ?? '게시글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    feedTab,
    profile,
    excludedAutoKeys,
    selectedEvent,
    selectedSkinType,
    selectedPersonalColor,
    selectedVibe,
    selectedFaceShape,
  ]);

  // ── Fetch similar-profile count for hero card ────────────────────────────
  const fetchSimilarCount = useCallback(async () => {
    if (!profileLoaded) return;
    try {
      let q = supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true);
      if (profile.personal_color) q = q.eq('personal_color', profile.personal_color);
      if (profile.vibe) q = q.eq('vibe', profile.vibe);
      if (profile.skin_type) q = q.eq('skin_type', profile.skin_type);
      if (profile.event_type) q = q.eq('event_type', profile.event_type);
      // Only query if at least one filter applies
      const hasAny =
        profile.personal_color || profile.vibe || profile.skin_type || profile.event_type;
      if (!hasAny) {
        setSimilarCount(null);
        return;
      }
      const { count } = await q;
      setSimilarCount(count ?? 0);
    } catch {
      setSimilarCount(null);
    }
  }, [profile, profileLoaded]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  useEffect(() => {
    if (profileLoaded) {
      setLoading(true);
      fetchPosts();
      fetchSimilarCount();
    }
  }, [profileLoaded, fetchPosts, fetchSimilarCount]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile().then(() => {
      fetchPosts();
      fetchSimilarCount();
    });
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const toggleLike = async (postId: string, isLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('로그인이 필요해요');
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, _isLiked: !isLiked, _likeCount: p._likeCount + (isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    } catch (e: any) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _isLiked: isLiked, _likeCount: p._likeCount + (isLiked ? 1 : -1) }
            : p
        )
      );
      Alert.alert('실패', e?.message ?? '다시 시도해 주세요.');
    }
  };

  const sharePost = async (post: PostWithMeta) => {
    try {
      const content = post.content?.slice(0, 80) ?? '';
      await Share.share({
        message: `meve 커뮤니티 — ${content}${content.length >= 80 ? '…' : ''}`,
      });
    } catch {}
  };

  const goSkin = () => navigation.navigate('MainTabs', { screen: 'Skin' } as any);
  const goLook = () => navigation.navigate('FaceAnalysis');

  // ── Derived ──────────────────────────────────────────────────────────────
  const hasProfile =
    !!profile.personal_color ||
    !!profile.vibe ||
    !!profile.face_shape ||
    !!profile.event_type ||
    !!profile.skin_type ||
    profile.skinScore != null;

  const myFitPills: Array<{ key: keyof MyProfile; label: string; color: string; bg: string }> = [];
  if (profile.event_type && !excludedAutoKeys.has('event_type'))
    myFitPills.push({
      key: 'event_type',
      label: `${EVENT_EMOJI[profile.event_type] ?? '✨'} ${EVENT_LABEL[profile.event_type] ?? profile.event_type}${
        profile.dday_count != null ? ` D-${profile.dday_count}` : ''
      }`,
      color: PINK,
      bg: '#FFF0F5',
    });
  if (profile.personal_color && !excludedAutoKeys.has('personal_color'))
    myFitPills.push({
      key: 'personal_color',
      label: profile.personal_color,
      color: PURPLE,
      bg: '#F0E8FD',
    });
  if (profile.vibe && !excludedAutoKeys.has('vibe'))
    myFitPills.push({
      key: 'vibe',
      label: profile.vibe,
      color: PINK,
      bg: '#FFF0F5',
    });
  if (profile.skin_type && !excludedAutoKeys.has('skin_type'))
    myFitPills.push({
      key: 'skin_type',
      label: profile.skin_type,
      color: BLUE,
      bg: '#E8F4FD',
    });
  if (profile.face_shape && !excludedAutoKeys.has('face_shape'))
    myFitPills.push({
      key: 'face_shape',
      label: profile.face_shape,
      color: '#5A5A65',
      bg: '#F5F5F5',
    });

  const removeAutoKey = (k: keyof MyProfile) =>
    setExcludedAutoKeys((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });

  // ── Renderers ────────────────────────────────────────────────────────────
  const renderHeroCard = () => {
    if (!profileLoaded) {
      return (
        <View style={styles.heroCard}>
          <ActivityIndicator color={PINK} />
        </View>
      );
    }
    if (!hasProfile) {
      return (
        <View style={styles.heroCard}>
          <Text style={styles.heroEmptyText}>
            SKIN · LOOK 탭에서 진단받으면{'\n'}나와 딱 맞는 피드를 보여드려요 ✨
          </Text>
          <View style={styles.heroEmptyBtnRow}>
            <TouchableOpacity style={styles.heroEmptyBtn} onPress={goSkin} activeOpacity={0.85}>
              <Text style={styles.heroEmptyBtnText}>피부 스캔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroEmptyBtn, styles.heroEmptyBtnSecondary]}
              onPress={goLook}
              activeOpacity={0.85}
            >
              <Text style={[styles.heroEmptyBtnText, { color: PINK }]}>얼굴 분석</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>My Beauty Report</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heroPillRow}
        >
          {profile.skinScore != null && (
            <View style={[styles.heroPill, { backgroundColor: '#E8F4FD' }]}>
              <Text style={[styles.heroPillText, { color: BLUE }]}>
                스킨 {profile.skinScore}점
              </Text>
            </View>
          )}
          {profile.personal_color && (
            <View style={[styles.heroPill, { backgroundColor: '#F0E8FD' }]}>
              <Text style={[styles.heroPillText, { color: PURPLE }]}>
                {profile.personal_color}
              </Text>
            </View>
          )}
          {profile.vibe && (
            <View style={[styles.heroPill, { backgroundColor: '#FFF0F5' }]}>
              <Text style={[styles.heroPillText, { color: PINK }]}>
                {profile.vibe}
              </Text>
            </View>
          )}
          {profile.event_type && (
            <View style={[styles.heroPill, { backgroundColor: '#FFF0F5' }]}>
              <Text style={[styles.heroPillText, { color: PINK }]}>
                {EVENT_EMOJI[profile.event_type] ?? '✨'}{' '}
                {profile.dday_count != null
                  ? `D-${profile.dday_count}`
                  : EVENT_LABEL[profile.event_type] ?? profile.event_type}
              </Text>
            </View>
          )}
        </ScrollView>
        {similarCount != null && similarCount > 0 && (
          <TouchableOpacity onPress={() => setFeedTab('mine')} activeOpacity={0.75}>
            <Text style={styles.heroFooter}>
              나와 비슷한 {similarCount}명이 활동 중이에요 →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFilterTypeChip = (
    key: FilterKey,
    label: string,
    selectedValue: string | null,
    accent: string,
    onClear: () => void
  ) => {
    const isExpanded = expandedFilter === key;
    const hasValue = !!selectedValue;
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.filterTypeChip,
          (hasValue || isExpanded) && { borderColor: accent, backgroundColor: '#fff' },
        ]}
        onPress={() => setExpandedFilter(isExpanded ? null : key)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.filterTypeText,
            (hasValue || isExpanded) && { color: accent, fontWeight: '700' },
          ]}
        >
          {hasValue ? `${label}: ${selectedValue}` : label}
        </Text>
        {hasValue ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            hitSlop={6}
          >
            <Ionicons name="close" size={12} color={accent} />
          </TouchableOpacity>
        ) : (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={isExpanded ? accent : '#8A8A9A'}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderOptionChip = (
    label: string,
    active: boolean,
    onPress: () => void,
    accent: string,
    bg: string
  ) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, active && { backgroundColor: bg, borderColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && { color: accent, fontWeight: '700' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <Image source={logo} style={styles.logo} />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.title}>커뮤니티</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtnWrap}
            onPress={() => navigation.navigate('GlamSyncList')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBtn, styles.iconBtnGlam]}>
              <Ionicons name="people" size={20} color={PINK} />
            </View>
            <Text style={[styles.iconBtnLabel, { color: PINK }]}>글램</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnWrap}
            onPress={() => navigation.navigate('LookPollList')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBtn, styles.iconBtnPoll]}>
              <Ionicons name="thumbs-up" size={18} color={BLUE} />
            </View>
            <Text style={[styles.iconBtnLabel, { color: BLUE }]}>투표</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderHeroCard()}

      {/* Feed tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, feedTab === 'mine' && styles.tabActive]}
          onPress={() => setFeedTab('mine')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabText, feedTab === 'mine' && styles.tabTextActive]}
          >
            내 핏 ✨
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, feedTab === 'all' && styles.tabActive]}
          onPress={() => setFeedTab('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabText, feedTab === 'all' && styles.tabTextActive]}
          >
            전체
          </Text>
        </TouchableOpacity>
      </View>

      {/* 내 핏 active filter pills */}
      {feedTab === 'mine' && myFitPills.length > 0 && (
        <View style={styles.myFitRow}>
          <Text style={styles.myFitLabel}>내 핏 기준:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.myFitPillRow}
          >
            {myFitPills.map((p) => (
              <View
                key={p.key}
                style={[styles.myFitPill, { backgroundColor: p.bg, borderColor: p.color }]}
              >
                <Text style={[styles.myFitPillText, { color: p.color }]}>{p.label}</Text>
                <TouchableOpacity onPress={() => removeAutoKey(p.key)} hitSlop={6}>
                  <Ionicons name="close" size={12} color={p.color} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Manual filter chips (전체 tab only) */}
      {feedTab === 'all' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {renderFilterTypeChip(
              'event',
              '이벤트',
              selectedEvent
                ? EVENT_CHIPS.find((c) => c.key === selectedEvent)?.label ?? null
                : null,
              PINK,
              () => setSelectedEvent(null)
            )}
            {renderFilterTypeChip('skin', '피부', selectedSkinType, BLUE, () =>
              setSelectedSkinType(null)
            )}
            {renderFilterTypeChip('color', '컬러', selectedPersonalColor, PURPLE, () =>
              setSelectedPersonalColor(null)
            )}
            {renderFilterTypeChip('vibe', '추구미', selectedVibe, PINK, () =>
              setSelectedVibe(null)
            )}
            {renderFilterTypeChip('face', '얼굴형', selectedFaceShape, '#5A5A65', () =>
              setSelectedFaceShape(null)
            )}
          </ScrollView>

          {expandedFilter && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {expandedFilter === 'event' &&
                EVENT_CHIPS.map((c) =>
                  renderOptionChip(
                    c.label,
                    selectedEvent === c.key,
                    () => {
                      setSelectedEvent(c.key);
                      setExpandedFilter(null);
                    },
                    PINK,
                    '#FFF0F5'
                  )
                )}
              {expandedFilter === 'skin' &&
                SKIN_TYPES.map((s) =>
                  renderOptionChip(
                    s,
                    selectedSkinType === s,
                    () => {
                      setSelectedSkinType(selectedSkinType === s ? null : s);
                      setExpandedFilter(null);
                    },
                    BLUE,
                    '#E8F4FD'
                  )
                )}
              {expandedFilter === 'color' &&
                PERSONAL_COLORS.map((pc) =>
                  renderOptionChip(
                    pc,
                    selectedPersonalColor === pc,
                    () => {
                      setSelectedPersonalColor(selectedPersonalColor === pc ? null : pc);
                      setExpandedFilter(null);
                    },
                    PURPLE,
                    '#F0E8FD'
                  )
                )}
              {expandedFilter === 'vibe' &&
                VIBES.map((v) =>
                  renderOptionChip(
                    v,
                    selectedVibe === v,
                    () => {
                      setSelectedVibe(selectedVibe === v ? null : v);
                      setExpandedFilter(null);
                    },
                    PINK,
                    '#FFF0F5'
                  )
                )}
              {expandedFilter === 'face' &&
                FACE_SHAPES.map((f) =>
                  renderOptionChip(
                    f,
                    selectedFaceShape === f,
                    () => {
                      setSelectedFaceShape(selectedFaceShape === f ? null : f);
                      setExpandedFilter(null);
                    },
                    '#5A5A65',
                    '#F5F5F5'
                  )
                )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={PINK} />
        </View>
      );
    }
    if (feedTab === 'mine' && !hasProfile) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>아직 AI 진단을 받지 않으셨어요 ✨</Text>
          <Text style={styles.emptyDesc}>
            SKIN · LOOK 탭에서 진단받으면{'\n'}나와 비슷한 분들의 게시글을 추천해드려요
          </Text>
          <View style={styles.emptyBtnRow}>
            <TouchableOpacity style={styles.emptyCta} onPress={goSkin} activeOpacity={0.85}>
              <Text style={styles.emptyCtaText}>피부 스캔하러 가기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyCta, styles.emptyCtaSecondary]}
              onPress={goLook}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyCtaText, { color: PINK }]}>
                얼굴 분석하러 가기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>
          {feedTab === 'mine'
            ? '아직 나와 비슷한 분들의 게시글이 없어요 🌿'
            : '아직 게시글이 없어요 ✨'}
        </Text>
        <Text style={styles.emptyDesc}>조건에 맞는 첫 번째 게시글을 올려봐요!</Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => navigation.navigate('CreatePost')}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyCtaText}>게시글 올리기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={() => toggleLike(item.id, item._isLiked)}
            onOpen={() => navigation.navigate('PostDetail', { postId: item.id })}
            onShare={() => sharePost(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PINK}
            colors={[PINK]}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.85}
      >
        <Ionicons name="create" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────

interface PostCardProps {
  post: PostWithMeta;
  onToggleLike: () => void;
  onOpen: () => void;
  onShare: () => void;
}

function PostCard({ post, onToggleLike, onOpen, onShare }: PostCardProps) {
  const displayName =
    post.user_profiles?.display_name ?? post.display_name ?? '익명';
  const avatarUrl = post.user_profiles?.avatar_url ?? null;
  const initial = displayName?.[0] ?? '?';

  const openProduct = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.9} onPress={onOpen}>
      <View style={styles.postHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.postName}>{displayName}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {post.dday_count != null && post.event_type && (
          <View style={[styles.tag, styles.tagPink]}>
            <Text style={styles.tagPinkText}>
              {EVENT_EMOJI[post.event_type] ?? '✨'} D-{post.dday_count}
            </Text>
          </View>
        )}
        {post.personal_color && (
          <View style={[styles.tag, styles.tagPurple]}>
            <Text style={styles.tagPurpleText}>{post.personal_color}</Text>
          </View>
        )}
        {post.vibe && (
          <View style={[styles.tag, styles.tagPink]}>
            <Text style={styles.tagPinkText}>{post.vibe}</Text>
          </View>
        )}
        {post.skin_type && (
          <View style={[styles.tag, styles.tagBlue]}>
            <Text style={styles.tagBlueText}>{post.skin_type}</Text>
          </View>
        )}
        {post.face_shape && (
          <View style={[styles.tag, styles.tagGray]}>
            <Text style={styles.tagGrayText}>{post.face_shape}</Text>
          </View>
        )}
      </View>

      {post.post_type === 'before_after' && post.before_photo_url && post.after_photo_url ? (
        <View style={styles.beforeAfterRow}>
          <View style={styles.beforeAfterCol}>
            <Image source={{ uri: post.before_photo_url }} style={styles.beforeAfterImg} />
            <View style={[styles.baLabel, { backgroundColor: '#8A8A9A' }]}>
              <Text style={styles.baLabelText}>BEFORE</Text>
            </View>
          </View>
          <View style={styles.beforeAfterCol}>
            <Image source={{ uri: post.after_photo_url }} style={styles.beforeAfterImg} />
            <View style={[styles.baLabel, { backgroundColor: PINK }]}>
              <Text style={styles.baLabelText}>AFTER</Text>
            </View>
          </View>
        </View>
      ) : post.image_urls && post.image_urls.length > 0 ? (
        <Image source={{ uri: post.image_urls[0] }} style={styles.postHero} />
      ) : post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.postHero} />
      ) : null}

      {!!post.content && (
        <Text style={styles.postContent} numberOfLines={4}>
          {post.content}
        </Text>
      )}

      {post.product_tags && post.product_tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
        >
          {post.product_tags.map((p, i) => (
            <TouchableOpacity
              key={`${p.name}-${i}`}
              style={styles.productChip}
              onPress={() => openProduct(p.oliveyoung_url)}
              activeOpacity={0.75}
            >
              <Ionicons name="pricetag-outline" size={12} color={PINK} />
              <Text style={styles.productChipText} numberOfLines={1}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerItem} onPress={onToggleLike} hitSlop={6}>
          <Ionicons
            name={post._isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post._isLiked ? PINK : '#8A8A9A'}
          />
          <Text style={styles.footerText}>{post._likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={onOpen} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={19} color="#8A8A9A" />
          <Text style={styles.footerText}>{post._commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={onShare} hitSlop={6}>
          <Ionicons name="share-social-outline" size={19} color="#8A8A9A" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFBFC' },
  listContent: { paddingBottom: 100 },

  topBar: { paddingHorizontal: 20, paddingTop: 4 },
  logo: {
    width: 170,
    height: 68,
    resizeMode: 'contain',
    alignSelf: 'flex-start',
    marginLeft: -40,
    marginBottom: -8,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  headerIcons: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBtnWrap: { alignItems: 'center', gap: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnGlam: { backgroundColor: '#FFF0F5' },
  iconBtnPoll: { backgroundColor: '#E8F4FD' },
  iconBtnLabel: { fontSize: 10, fontWeight: '700' },

  // Hero card
  heroCard: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220,220,230,0.5)',
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  heroTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.3 },
  heroPillRow: { flexDirection: 'row', gap: 6 },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  heroPillText: { fontSize: 12, fontWeight: '700' },
  heroFooter: { fontSize: 12, color: '#8A8A9A', fontWeight: '600', marginTop: 2 },
  heroEmptyText: {
    fontSize: 13,
    color: '#1A1A2E',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroEmptyBtnRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  heroEmptyBtn: {
    flex: 1,
    backgroundColor: PINK,
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: 'center',
  },
  heroEmptyBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PINK,
  },
  heroEmptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Feed tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: PINK },
  tabText: { fontSize: 13, fontWeight: '700', color: '#8A8A9A' },
  tabTextActive: { color: '#fff' },

  // 내 핏 active pills
  myFitRow: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 10,
    gap: 4,
  },
  myFitLabel: { fontSize: 11, color: '#8A8A9A', fontWeight: '700' },
  myFitPillRow: { flexDirection: 'row', gap: 6 },
  myFitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
  },
  myFitPillText: { fontSize: 11, fontWeight: '700' },

  // Manual filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 10,
    alignItems: 'center',
  },
  filterTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTypeText: { fontSize: 12, color: '#8A8A9A' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipText: { fontSize: 12, color: '#8A8A9A' },

  // Empty
  emptyWrap: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#8A8A9A', textAlign: 'center', lineHeight: 19 },
  emptyBtnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  emptyCta: {
    backgroundColor: PINK,
    borderRadius: 50,
    height: 52,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: PINK,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Post card
  postCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220,220,230,0.5)',
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FFC4D6',
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: PINK, fontWeight: '800', fontSize: 14 },
  postName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  postTime: { fontSize: 12, color: '#8A8A9A', marginTop: 1 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  tagPink: { backgroundColor: '#FFF0F5', borderColor: '#FFC4D6' },
  tagPinkText: { fontSize: 11, color: PINK, fontWeight: '600' },
  tagPurple: { backgroundColor: '#F0E8FD', borderColor: '#D8C4EF' },
  tagPurpleText: { fontSize: 11, color: PURPLE, fontWeight: '600' },
  tagBlue: { backgroundColor: '#E8F4FD', borderColor: '#B8D8F0' },
  tagBlueText: { fontSize: 11, color: BLUE, fontWeight: '600' },
  tagGray: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  tagGrayText: { fontSize: 11, color: '#5A5A65', fontWeight: '600' },

  postHero: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0E6EC',
  },

  beforeAfterRow: { flexDirection: 'row', gap: 8 },
  beforeAfterCol: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  beforeAfterImg: { width: '100%', height: 200, backgroundColor: '#F0E6EC' },
  baLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  baLabelText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  postContent: { fontSize: 14, color: '#1A1A2E', lineHeight: 22, marginTop: 4 },

  productRow: { gap: 6, paddingRight: 14 },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F9',
    borderWidth: 1,
    borderColor: '#FFC4D6',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 160,
  },
  productChipText: { fontSize: 11, color: PINK, fontWeight: '600' },

  postFooter: {
    flexDirection: 'row',
    gap: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EEF3',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#8A8A9A', fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
