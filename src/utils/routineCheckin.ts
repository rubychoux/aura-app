import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RoutineCheckin {
  am: boolean;
  pm: boolean;
}

export function routineCheckinStorageKey(isoDate: string): string {
  return `meve_routine_${isoDate.slice(0, 10)}`;
}

export async function loadRoutineCheckin(isoDate: string): Promise<RoutineCheckin> {
  try {
    const raw = await AsyncStorage.getItem(routineCheckinStorageKey(isoDate));
    if (!raw) return { am: false, pm: false };
    const parsed = JSON.parse(raw) as Partial<RoutineCheckin>;
    return {
      am: Boolean(parsed.am),
      pm: Boolean(parsed.pm),
    };
  } catch {
    return { am: false, pm: false };
  }
}

/** Load AM/PM check-in state for each day in YYYY-MM-DD list. */
export async function loadRoutineCheckinsForDates(
  dates: string[]
): Promise<Record<string, RoutineCheckin>> {
  if (dates.length === 0) return {};
  try {
    const pairs = await AsyncStorage.multiGet(dates.map((d) => routineCheckinStorageKey(d)));
    const out: Record<string, RoutineCheckin> = {};
    for (const [key, raw] of pairs) {
      const dateStr = key.replace('meve_routine_', '');
      if (!raw) {
        out[dateStr] = { am: false, pm: false };
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<RoutineCheckin>;
        out[dateStr] = { am: Boolean(parsed.am), pm: Boolean(parsed.pm) };
      } catch {
        out[dateStr] = { am: false, pm: false };
      }
    }
    return out;
  } catch {
    return {};
  }
}
