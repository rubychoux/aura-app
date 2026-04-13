import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MainTabParamList, MainStackParamList } from '../../types';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { EVENT_CONFIG, EventKey } from '../../constants/events';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;
  const unique = [...new Set(isoDates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 0;
  let expected = unique[0];
  for (const d of unique) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

function todayRoutineKey() {
  return `meve_routine_${new Date().toISOString().slice(0, 10)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

function formatEventDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanRecord {
  date: string; // YYYY-MM-DD
  score: number;
}

interface Routine {
  am: boolean;
  pm: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { eventType, eventDate, setEvent } = useAuthStore();
  const { width } = useWindowDimensions();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [routine, setRoutine] = useState<Routine>({ am: false, pm: false });

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Initial data loads ──────────────────────────────────────────────────────
  useEffect(() => {
    loadProfile();
    loadScans();
    loadRoutine();
    loadEventFromStorage();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) fetchDisplayName(session.user.id);
      }
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) fetchDisplayName(session.user.id);
  };

  const fetchDisplayName = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', userId)
      .single();
    if (data?.display_name) setDisplayName(data.display_name);
  };

  const loadScans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('skin_scans')
      .select('scan_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return;

    const records: ScanRecord[] = data.map((r: any) => ({
      date: r.created_at.slice(0, 10),
      score: r.scan_result?.overallScore ?? 0,
    }));
    setScanRecords(records);
    setStreak(calculateStreak(data.map((r: any) => r.created_at)));
  };

  const loadRoutine = async () => {
    try {
      const raw = await AsyncStorage.getItem(todayRoutineKey());
      if (raw) setRoutine(JSON.parse(raw));
    } catch {}
  };

  const loadEventFromStorage = async () => {
    if (eventType) return;
    try {
      const [[, storedType], [, storedDate], [, storedDirections]] =
        await AsyncStorage.multiGet(['meve_event_type', 'meve_event_date', 'meve_care_direction']);
      if (storedType) {
        const directions = storedDirections ? JSON.parse(storedDirections) : [];
        setEvent(storedType, storedDate ?? '', directions);
      }
    } catch {}
  };

  const toggleRoutine = async (type: 'am' | 'pm') => {
    const next = { ...routine, [type]: !routine[type] };
    setRoutine(next);
    try {
      await AsyncStorage.setItem(todayRoutineKey(), JSON.stringify(next));
    } catch {}
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const greeting = displayName ? `${displayName}님 안녕하세요 :)` : '안녕하세요 :)';
  const eventConfig = eventType ? EVENT_CONFIG[eventType as EventKey] : null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ddayCount = eventDate
    ? Math.ceil((new Date(eventDate).setHours(0, 0, 0, 0) - today.getTime()) / 86_400_000)
    : null;

  // Build scanMap for calendar: date string → score
  const scanMap: Record<string, number> = {};
  for (const r of scanRecords) {
    if (!(r.date in scanMap) || scanMap[r.date] < r.score) {
      scanMap[r.date] = r.score;
    }
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const todayStr = now.toISOString().slice(0, 10);
  const eventDateStr = eventDate ? eventDate.slice(0, 10) : null;

  // Selected day scan info
  const selectedDateStr = selectedDay
    ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedScore = selectedDateStr ? scanMap[selectedDateStr] : undefined;

  function scoreColor(score: number) {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  // Build 6-row grid cells
  const totalCells = 42;
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ];

  const cellSize = Math.floor((width - 40 - 32) / 7); // width - marginHorizontal*2 - padding*2

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF6F9" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>meve</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="settings-outline" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {/* ── GREETING ───────────────────────────────────────────────────── */}
        <Text style={styles.greeting}>{greeting}</Text>

        {/* ── D-DAY HERO CARD ────────────────────────────────────────────── */}
        {eventConfig && ddayCount != null ? (
          <LinearGradient
            colors={['#FFD6E7', '#C9B8FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ddayCard}
          >
            <View style={styles.ddayTopRow}>
              <Ionicons
                name={eventType === 'wedding' ? 'diamond-outline' :
                      eventType === 'date' ? 'heart-outline' :
                      eventType === 'graduation' ? 'school-outline' :
                      eventType === 'travel' ? 'airplane-outline' : 'sparkles-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.ddayDateText}>{formatEventDate(eventDate!)}</Text>
              <Ionicons name="sparkles" size={14} color="#fff" style={styles.ddaySparkles} />
            </View>
            <Text style={styles.ddayCount}>{eventConfig.label}까지 D-{ddayCount}</Text>
            <Text style={styles.ddaySub}>특별한 날을 위해 준비해요</Text>
            <TouchableOpacity
              style={styles.ddayChangeBtn}
              onPress={() => navigation.navigate('EventFlow')}
              activeOpacity={0.7}
            >
              <Text style={styles.ddayChangeBtnText}>변경하기</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#FFD6E7', '#C9B8FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ddayCard}
          >
            <Ionicons name="calendar-outline" size={28} color="rgba(255,255,255,0.9)" style={{ marginBottom: 10 }} />
            <Text style={[styles.ddayCount, { fontSize: 20 }]}>특별한 날을 준비하고 있나요?</Text>
            <Text style={styles.ddaySub}>이벤트를 설정하면 D-day를 함께 준비해드려요</Text>
            <TouchableOpacity
              style={styles.ddaySetBtn}
              onPress={() => navigation.navigate('EventFlow')}
              activeOpacity={0.8}
            >
              <Text style={styles.ddaySetBtnText}>이벤트를 설정해봐요 →</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* ── CALENDAR ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>피부 기록</Text>
        <View style={styles.calendarCard}>
          {/* Month nav */}
          <View style={styles.calMonthRow}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={18} color="#999" />
            </TouchableOpacity>
            <Text style={styles.calMonthText}>{calYear}년 {calMonth + 1}월</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.calDayHeaders}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.calDayHeader,
                  i === 0 && { color: '#FF6B6B' },
                  i === 6 && { color: '#74B9FF' },
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calGrid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={[styles.calCell, { width: cellSize }]} />;
              }

              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = day === selectedDay;
              const isDday = dateStr === eventDateStr;
              const score = scanMap[dateStr];
              const colIdx = idx % 7;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.calCell, { width: cellSize }]}
                  onPress={() => setSelectedDay(day === selectedDay ? null : day)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.calDayCircle,
                    { width: cellSize - 4, height: cellSize - 4 },
                    isToday && styles.calDayCircleToday,
                    isSelected && !isToday && styles.calDayCircleSelected,
                  ]}>
                    <Text style={[
                      styles.calDayNum,
                      colIdx === 0 && { color: '#FF6B6B' },
                      colIdx === 6 && { color: '#74B9FF' },
                      isToday && { color: '#fff', fontWeight: '700' },
                      isSelected && !isToday && { color: '#F2A7C3', fontWeight: '700' },
                    ]}>
                      {day}
                    </Text>
                    {isDday && eventConfig && (
                      <View style={styles.calDdayBadge}>
                        <Ionicons
                          name={eventType === 'wedding' ? 'diamond' :
                                eventType === 'date' ? 'heart' :
                                eventType === 'graduation' ? 'school' : 'airplane'}
                          size={8}
                          color={eventConfig.accentColor}
                        />
                      </View>
                    )}
                  </View>
                  {score !== undefined ? (
                    <View style={[styles.calDot, { backgroundColor: scoreColor(score) }]} />
                  ) : (
                    <View style={styles.calDotEmpty} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected day info */}
          {selectedDateStr && (
            <View style={styles.calSelectedInfo}>
              {selectedScore !== undefined ? (
                <View style={styles.calSelectedScore}>
                  <View style={[styles.calSelectedDot, { backgroundColor: scoreColor(selectedScore) }]} />
                  <Text style={styles.calSelectedText}>
                    {calMonth + 1}월 {selectedDay}일 피부 점수: <Text style={{ fontWeight: '700', color: '#2D2D2D' }}>{selectedScore}점</Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.calSelectedEmpty}>
                  {calMonth + 1}월 {selectedDay}일 — 스캔 기록이 없어요
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── AM/PM ROUTINE ──────────────────────────────────────────────── */}
        <View style={styles.routineRow}>
          {/* AM */}
          <TouchableOpacity
            style={[styles.routineCard, routine.am && styles.routineCardAmDone]}
            onPress={() => toggleRoutine('am')}
            activeOpacity={0.8}
          >
            <Ionicons name="sunny-outline" size={24} color={routine.am ? '#F2A7C3' : '#ccc'} />
            <Text style={styles.routineLabel}>AM 루틴</Text>
            <View style={[
              styles.routineCheckCircle,
              routine.am && { backgroundColor: '#F2A7C3', borderWidth: 0 },
            ]}>
              {routine.am && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>

          {/* PM */}
          <TouchableOpacity
            style={[styles.routineCard, routine.pm && styles.routineCardPmDone]}
            onPress={() => toggleRoutine('pm')}
            activeOpacity={0.8}
          >
            <Ionicons name="moon-outline" size={24} color={routine.pm ? '#A8D5E8' : '#ccc'} />
            <Text style={styles.routineLabel}>PM 루틴</Text>
            <View style={[
              styles.routineCheckCircle,
              routine.pm && { backgroundColor: '#A8D5E8', borderWidth: 0 },
            ]}>
              {routine.pm && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── STREAK BANNER ──────────────────────────────────────────────── */}
        {streak > 0 && (
          <LinearGradient
            colors={['#FFE4A0', '#FFD57E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakBanner}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="flame" size={18} color="#B8860B" />
              <Text style={styles.streakTitle}>{streak}일 연속 스캔 중!</Text>
            </View>
            <Text style={styles.streakSub}>꾸준히 기록하고 있어요</Text>
          </LinearGradient>
        )}

        {/* ── SCAN HERO CARD ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.scanHero}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Skin')}
        >
          <Ionicons name="scan-outline" size={28} color="#fff" />
          <View style={styles.scanHeroText}>
            <Text style={styles.scanHeroTitle}>지금 피부 진단하기</Text>
            <Text style={styles.scanHeroDesc}>AI가 내 피부 상태를 분석해드려요</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PAGE_BG = '#FDF6F9';
const CARD_BG = '#FFFFFF';
const PINK = '#F2A7C3';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  scroll: { flex: 1, backgroundColor: PAGE_BG },
  content: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '700',
    color: PINK,
    letterSpacing: -0.5,
  },

  // Greeting
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D2D2D',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // D-Day card
  ddayCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  ddayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  ddayDateText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 8,
    opacity: 0.9,
    flex: 1,
  },
  ddaySparkles: { marginLeft: 'auto' as any },
  ddayCount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  ddaySub: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginBottom: 12,
  },
  ddayChangeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ddayChangeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  ddaySetBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  ddaySetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Calendar
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  calendarCard: {
    marginHorizontal: 20,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  calMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calMonthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  calDayHeaders: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    alignItems: 'center',
    paddingVertical: 3,
  },
  calDayCircle: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCircleToday: {
    backgroundColor: PINK,
  },
  calDayCircleSelected: {
    backgroundColor: '#FFE8F3',
  },
  calDayNum: {
    fontSize: 13,
    color: '#2D2D2D',
  },
  calDdayBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  calDotEmpty: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  calSelectedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5EEF3',
  },
  calSelectedScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calSelectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calSelectedText: {
    fontSize: 13,
    color: '#666',
  },
  calSelectedEmpty: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
  },

  // Routine
  routineRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 14,
  },
  routineCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6EC',
    gap: 8,
  },
  routineCardAmDone: {
    backgroundColor: '#FFF0F6',
    borderColor: PINK,
  },
  routineCardPmDone: {
    backgroundColor: '#F0F6FF',
    borderColor: '#A8D5E8',
  },
  routineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  routineCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Streak
  streakBanner: {
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B8860B',
  },
  streakSub: {
    fontSize: 12,
    color: '#B8860B',
    opacity: 0.8,
    marginTop: 2,
  },

  // Scan hero
  scanHero: {
    marginHorizontal: 20,
    backgroundColor: PINK,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  scanHeroText: { flex: 1 },
  scanHeroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  scanHeroDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
});
