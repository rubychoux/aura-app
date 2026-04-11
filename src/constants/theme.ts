export const Colors = {
  // Backgrounds
  bg: '#FDF6F9',              // 아주 연한 핑크 화이트 — 메인 배경
  surface: '#FFFFFF',          // 카드, 입력 필드
  surfaceElevated: '#FCF0F5',  // 연한 핑크 — 섹션 구분

  // Accent — Baby Pink
  accent: '#F2A7C3',           // 메인 포인트 (버튼, CTA)
  accentMuted: '#F9D0E3',      // 연한 핑크 — 선택 카드 배경
  accentLight: '#FDE8F1',      // 아주 연한 핑크

  // Secondary — Light Blue
  secondary: '#A8D5E8',        // 라이트 블루 포인트
  secondaryMuted: '#D6EDF7',   // 연한 블루
  secondaryLight: '#EBF6FB',   // 아주 연한 블루

  // Status
  success: '#85C1AE',          // 세이지 그린 (safe)
  warning: '#F5C97A',          // 연한 옐로우 (caution)
  danger: '#F08080',           // 연한 레드 (avoid/error)

  // Text
  textPrimary: '#2D2D2D',      // 거의 블랙
  textSecondary: '#9A8F97',    // 뮤트 핑크 그레이
  textDisabled: '#C8BFC6',     // 비활성

  // UI
  border: '#F0E6EC',           // 연한 핑크 보더
  borderMuted: '#F7F0F4',
  overlay: 'rgba(45,45,45,0.4)',

  // Brand
  brandPink: '#F2A7C3',        // 메인 핑크
  brandBlue: '#A8D5E8',        // 메인 블루

  // Ingredient flag aliases (used in ui components + skincare screen)
  flagSafe: '#85C1AE',
  flagCaution: '#F5C97A',
  flagAvoid: '#F08080',
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '600' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodySecondary: { fontSize: 15, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  cta: { fontSize: 16, fontWeight: '600' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
