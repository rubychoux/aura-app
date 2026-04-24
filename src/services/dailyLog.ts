import { supabase } from './supabase';
import { addDaysYmd, todayYmd } from '../utils/dateYmd';
import type { LifestyleDietTag } from '../types';

export interface DailyLogRow {
  id?: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  water_intake: number | null;
  stress_level: number | null;
  diet_tags: LifestyleDietTag[] | null;
  notes: string | null;
}

const TABLE = 'daily_logs';

function stressLabel(level: number | null | undefined): string {
  if (level == null) return 'unknown';
  const map: Record<number, string> = {
    1: 'very low',
    2: 'low',
    3: 'medium',
    4: 'high',
    5: 'very high',
  };
  return map[level] ?? 'unknown';
}

export async function fetchDailyLogByDate(userId: string, ymd: string): Promise<DailyLogRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, user_id, date, sleep_hours, water_intake, stress_level, diet_tags, notes')
    .eq('user_id', userId)
    .eq('date', ymd)
    .maybeSingle();

  if (error) {
    console.warn('[daily_logs] load failed:', error.message);
    return null;
  }
  return (data as DailyLogRow) ?? null;
}

export function summarizeDailyLogRow(row: DailyLogRow | null): string | null {
  if (!row) return null;
  const parts: string[] = [];
  if (row.sleep_hours != null) parts.push(`sleep ${row.sleep_hours}h`);
  if (row.water_intake != null) parts.push(`water ${row.water_intake}/8 glasses`);
  if (row.stress_level != null) parts.push(`stress L${row.stress_level} (${stressLabel(row.stress_level)})`);
  if (row.diet_tags && row.diet_tags.length > 0) parts.push(`diet: ${row.diet_tags.join(', ')}`);
  if (row.notes && row.notes.trim()) parts.push(`note: ${row.notes.trim()}`);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

export async function buildLifestyleContextBlock(userId: string): Promise<string> {
  const t = todayYmd();
  const y = addDaysYmd(t, -1);
  const [todayRow, ydayRow] = await Promise.all([
    fetchDailyLogByDate(userId, t),
    fetchDailyLogByDate(userId, y),
  ]);

  const lines: string[] = [];
  const tSum = summarizeDailyLogRow(todayRow);
  const ySum = summarizeDailyLogRow(ydayRow);
  if (ySum) lines.push(`Yesterday (${y}): ${ySum}`);
  if (tSum) lines.push(`Today (${t}): ${tSum}`);

  if (lines.length === 0) return '';
  return ['Recent lifestyle check-ins:', ...lines.map((l) => `- ${l}`)].join('\n');
}

export async function upsertDailyLogForDate(input: {
  userId: string;
  ymd: string;
  sleepHours: number;
  waterCups: number;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  dietTags: LifestyleDietTag[];
  notes: string;
}): Promise<{ error: string | null }> {
  const payload = {
    user_id: input.userId,
    date: input.ymd,
    sleep_hours: input.sleepHours,
    water_intake: input.waterCups,
    stress_level: input.stressLevel,
    diet_tags: input.dietTags,
    notes: input.notes.trim() ? input.notes.trim() : null,
  };

  const existing = await fetchDailyLogByDate(input.userId, input.ymd);

  if (existing?.id) {
    const { error } = await supabase
      .from(TABLE)
      .update({
        sleep_hours: payload.sleep_hours,
        water_intake: payload.water_intake,
        stress_level: payload.stress_level,
        diet_tags: payload.diet_tags,
        notes: payload.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) return { error: error.message };
    return { error: null };
  }

  const { error } = await supabase.from(TABLE).insert(payload);
  if (error) return { error: error.message };
  return { error: null };
}
