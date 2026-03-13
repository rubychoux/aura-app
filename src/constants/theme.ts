export const Colors = {
  // Backgrounds
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',

  // Accent
  accent: '#E8B4B8',       // blush — CTAs only
  accentMuted: '#C49498',

  // Semantic
  success: '#6FCF97',
  warning: '#F2C94C',
  danger: '#EB5757',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#9B9B9B',
  textDisabled: '#555555',

  // Ingredient flags
  flagSafe: '#6FCF97',
  flagCaution: '#F2C94C',
  flagAvoid: '#EB5757',

  // Borders
  border: '#2A2A2A',
  borderMuted: '#1F1F1F',

  // Transparent
  overlay: 'rgba(0,0,0,0.6)',
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
