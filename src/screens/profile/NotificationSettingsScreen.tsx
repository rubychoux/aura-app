import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'NotificationSettings'>;

const STORAGE_KEY = 'meve_notification_settings';
const ACCENT = '#FF6B9D';

type ReminderInterval = 3 | 7 | 14;

interface Settings {
  master: boolean;
  dailyRoutine: boolean;
  dailyRoutineTime: string; // "HH:mm"
  scanReminder: boolean;
  scanReminderInterval: ReminderInterval;
  community: boolean;
  marketing: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  master: true,
  dailyRoutine: false,
  dailyRoutineTime: '21:00',
  scanReminder: false,
  scanReminderInterval: 7,
  community: true,
  marketing: false,
};

function parseTime(s: string): Date {
  const [h, m] = s.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function displayTime(s: string): string {
  const [h, m] = s.split(':').map((n) => parseInt(n, 10));
  const period = h < 12 ? '오전' : '오후';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hh}:${String(m).padStart(2, '0')}`;
}

async function scheduleDailyRoutine(timeStr: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hour, minute] = timeStr.split(':').map((n) => parseInt(n, 10));
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 루틴 시간이에요 ✨',
      body: 'meve와 함께 피부를 가꿔볼까요?',
    },
    trigger: {
      hour: hour || 21,
      minute: minute || 0,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function NotificationSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next: Settings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    await persist(next);

    // Re-evaluate scheduled notifications based on the new state
    if (!next.master || !next.dailyRoutine) {
      await cancelAll();
    } else if (next.dailyRoutine) {
      await scheduleDailyRoutine(next.dailyRoutineTime);
    }
  };

  const toggleMaster = (v: boolean) => update({ master: v });
  const toggleDailyRoutine = async (v: boolean) => {
    if (v) {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) return;
      }
    }
    update({ dailyRoutine: v });
  };

  const masterOff = !settings.master;

  if (!loaded) {
    return <SafeAreaView style={styles.safeArea} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Master */}
        <Row
          title="전체 알림"
          subtitle="꺼두면 모든 알림이 중지돼요"
          value={settings.master}
          onChange={toggleMaster}
        />

        {/* Daily routine */}
        <Row
          title="데일리 루틴 알림"
          subtitle="매일 정해진 시간에 루틴을 알려드려요"
          value={settings.dailyRoutine}
          disabled={masterOff}
          onChange={toggleDailyRoutine}
        />
        {settings.dailyRoutine && !masterOff && (
          <>
            <TouchableOpacity
              style={styles.subRow}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.subRowLabel}>알림 시간</Text>
              <Text style={styles.subRowValue}>
                {displayTime(settings.dailyRoutineTime)}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={parseTime(settings.dailyRoutineTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_e, d) => {
                  if (Platform.OS !== 'ios') setShowTimePicker(false);
                  if (d) update({ dailyRoutineTime: formatTime(d) });
                }}
              />
            )}
            {Platform.OS === 'ios' && showTimePicker && (
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.doneBtnText}>완료</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Scan reminder */}
        <Row
          title="스캔 리마인더"
          subtitle={`${settings.scanReminderInterval}일마다 피부 스캔을 알려드려요`}
          value={settings.scanReminder}
          disabled={masterOff}
          onChange={(v) => update({ scanReminder: v })}
        />
        {settings.scanReminder && !masterOff && (
          <View style={styles.segmentRow}>
            {([3, 7, 14] as ReminderInterval[]).map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.segmentBtn,
                  settings.scanReminderInterval === n && styles.segmentBtnActive,
                ]}
                onPress={() => update({ scanReminderInterval: n })}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.scanReminderInterval === n && styles.segmentTextActive,
                  ]}
                >
                  {n}일
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Community */}
        <Row
          title="커뮤니티 알림"
          subtitle="좋아요·댓글 등 반응 알림을 받아요"
          value={settings.community}
          disabled={masterOff}
          onChange={(v) => update({ community: v })}
        />

        {/* Marketing */}
        <Row
          title="마케팅 알림"
          subtitle="이벤트·프로모션 소식을 받아볼게요"
          value={settings.marketing}
          disabled={masterOff}
          onChange={(v) => update({ marketing: v })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function Row({ title, subtitle, value, disabled, onChange }: RowProps) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.45 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: ACCENT, false: '#E2D5DC' }}
        thumbColor="#fff"
      />
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
  content: { padding: 20, paddingBottom: 60, gap: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F0E6EC',
    marginBottom: 6,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#2D2D2D' },
  rowSubtitle: { fontSize: 12, color: '#9A8F97', marginTop: 2 },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    marginLeft: 12,
  },
  subRowLabel: { fontSize: 13, color: '#2D2D2D', fontWeight: '500' },
  subRowValue: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8 },
  doneBtnText: { color: ACCENT, fontWeight: '600', fontSize: 14 },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    marginLeft: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E6EC',
  },
  segmentBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  segmentText: { fontSize: 13, color: '#2D2D2D' },
  segmentTextActive: { color: '#fff', fontWeight: '700' },
});
