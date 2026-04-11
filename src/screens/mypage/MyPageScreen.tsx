import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { MainStackParamList, ScanAnalysisResult } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

interface ScanRow {
  id: string;
  created_at: string;
  scan_result: ScanAnalysisResult;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.warning;
  return Colors.danger;
}

export function MyPageScreen() {
  const navigation = useNavigation<Nav>();
  const { signOut } = useAuthStore();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.email) setEmail(user.email);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      if (profile?.display_name) setDisplayName(profile.display_name);

      const { data: scanData } = await supabase
        .from('skin_scans')
        .select('id, created_at, scan_result')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (scanData) setScans(scanData as ScanRow[]);
    };
    load();
  }, []);

  const handleSignOut = async () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <Text style={styles.pageTitle}>마이페이지</Text>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          {displayName && <Text style={styles.displayName}>{displayName}</Text>}
          <Text style={styles.email}>{email ?? '—'}</Text>
        </View>

        {/* 내 스캔 이력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 스캔 이력</Text>
          {scans.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🩷</Text>
              <Text style={styles.emptyText}>
                아직 스캔 기록이 없어요.{'\n'}AI 스캐너로 첫 진단을 시작해보세요!
              </Text>
            </View>
          ) : (
            <View style={styles.scanList}>
              {scans.map((row) => (
                <TouchableOpacity
                  key={row.id}
                  style={styles.scanRow}
                  onPress={() =>
                    navigation.navigate('ScanResult', {
                      result: row.scan_result,
                      isSaved: true,
                    })
                  }
                  activeOpacity={0.75}
                >
                  <View style={styles.scanRowLeft}>
                    <Text style={styles.scanDate}>{formatDate(row.created_at)}</Text>
                    <Text style={styles.scanCondition} numberOfLines={1}>
                      {row.scan_result.skinCondition}
                    </Text>
                  </View>
                  <View style={styles.scanRowRight}>
                    <Text style={[styles.scanScore, { color: scoreColor(row.scan_result.overallScore) }]}>
                      {row.scan_result.overallScore}점
                    </Text>
                    <Text style={styles.scanArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </TouchableOpacity>
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
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  pageTitle: { ...Typography.h2 },

  // 프로필
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarEmoji: { fontSize: 32 },
  displayName: { ...Typography.h3 },
  email: { ...Typography.caption, color: Colors.textSecondary },

  // 스캔 이력
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { ...Typography.bodySecondary, textAlign: 'center', lineHeight: 22 },
  scanList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scanRowLeft: { flex: 1, gap: 2 },
  scanDate: { ...Typography.caption, color: Colors.textSecondary },
  scanCondition: { ...Typography.body, color: Colors.textPrimary },
  scanRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scanScore: { fontSize: 15, fontWeight: '700' },
  scanArrow: { fontSize: 20, color: Colors.textDisabled },

  // 로그아웃
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { ...Typography.cta, color: Colors.danger },
});
