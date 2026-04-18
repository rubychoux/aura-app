/**
 * AI routine step shape (matches Supabase routines.am_steps / pm_steps JSONB).
 */
export interface RoutineStep {
  step: number;
  category: string;
  description: string;
  keyIngredient: string;
  searchQuery: string;
}

export interface RoutineDefinition {
  eventType: string;
  label: string;
  am_steps: RoutineStep[];
  pm_steps: RoutineStep[];
}

/** Sprint 2: placeholder until GPT-4 + Supabase (Sprint 3). */
export const HARDCODED_ROUTINE: RoutineDefinition = {
  eventType: 'date',
  label: '데이트 · 글로우',
  am_steps: [
    {
      step: 1,
      category: '클렌징',
      description: '약산성 폼클렌징',
      keyIngredient: '세라마이드',
      searchQuery: '약산성 폼클렌징',
    },
    {
      step: 2,
      category: '토너',
      description: '수분 토너',
      keyIngredient: '히알루론산',
      searchQuery: '히알루론산 토너',
    },
    {
      step: 3,
      category: '세럼',
      description: '피부 톤·광채',
      keyIngredient: '나이아신아마이드',
      searchQuery: '나이아신아마이드 세럼',
    },
    {
      step: 4,
      category: '수분크림',
      description: '가벼운 수분 잠금',
      keyIngredient: '판테놀',
      searchQuery: '판테놀 수분크림',
    },
    {
      step: 5,
      category: '선크림',
      description: '광채 무결점 베이스',
      keyIngredient: '무기자차/혼합',
      searchQuery: '톤업 선크림',
    },
  ],
  pm_steps: [
    {
      step: 1,
      category: '클렌징',
      description: '클렌징 밤/오일',
      keyIngredient: '호호바 오일',
      searchQuery: '클렌징 밤',
    },
    {
      step: 2,
      category: '클렌징',
      description: '약산성 폼',
      keyIngredient: '세라마이드',
      searchQuery: '약산성 폼클렌징',
    },
    {
      step: 3,
      category: '토너',
      description: '진정·수분',
      keyIngredient: '판테놀',
      searchQuery: '진정 토너',
    },
    {
      step: 4,
      category: '세럼',
      description: '나이트 리페어',
      keyIngredient: '레티놀(저농도) 또는 바쿠치올',
      searchQuery: '바쿠치올 세럼',
    },
    {
      step: 5,
      category: '크림',
      description: '장벽 보습',
      keyIngredient: '세라마이드',
      searchQuery: '세라마이드 크림',
    },
  ],
};

export function oliveYoungSearchUrl(searchQuery: string): string {
  return `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(searchQuery)}`;
}

/** One-line summary for home check-in cards. */
export function summarizeRoutineSteps(steps: RoutineStep[], maxItems = 4): string {
  const labels = steps.slice(0, maxItems).map((s) => s.category);
  const extra = steps.length > maxItems ? ` 외 ${steps.length - maxItems}단계` : '';
  return `${labels.join(' → ')}${extra}`;
}
