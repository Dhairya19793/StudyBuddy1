/* ────────────────────────────────────────────────────────────
 *  StudyMode Design System
 *  Warm off-white + deep ink green + forest green actions +
 *  sage surfaces + muted gold accent + terracotta error.
 * ──────────────────────────────────────────────────────────── */

export const Colors = {
  // Primary — Forest Green action family
  primary: {
    50: '#E7EFE8',
    100: '#C5DAC9',
    200: '#9FC2A5',
    300: '#6B9A73',
    400: '#488B55',
    500: '#2F6B45',
    600: '#275B3B',
    700: '#214E34',
    800: '#193E29',
    900: '#193326',
  },
  // Secondary — Muted Gold accent
  secondary: {
    50: '#FBF6E8',
    100: '#F5E9C3',
    200: '#EDDA9B',
    300: '#E4C96F',
    400: '#DDBF50',
    500: '#D4A72C',
    600: '#B89025',
    700: '#96751E',
    800: '#745A17',
    900: '#52400F',
  },
  // Accent — Soft Sage surfaces
  accent: {
    50: '#EFF3EF',
    100: '#DBE4DB',
    200: '#C3D4C3',
    300: '#A8C1A8',
    400: '#8DAF8D',
    500: '#6B8E6B',
    600: '#587558',
    700: '#465D46',
    800: '#354635',
    900: '#232E23',
  },
  // Neutral — Warm grays
  neutral: {
    0: '#FFFFFF',
    50: '#F8F6F0',
    100: '#F0EDE6',
    200: '#E4DFD7',
    300: '#D1CAC0',
    400: '#B5ADA1',
    500: '#81796F',
    600: '#6F665F',
    700: '#524B45',
    800: '#3A3530',
    900: '#193326',
    950: '#141210',
  },
  // Success — earthy green
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
  },
  // Warning — warm amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  // Error — muted terracotta
  error: {
    50: '#FDF2F0',
    100: '#F9DDD8',
    200: '#F0B8AF',
    300: '#D9887E',
    400: '#C96A5F',
    500: '#B9534B',
    600: '#9E3F38',
  },
  // Semantic
  background: '#F8F6F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FDFBF5',
  sage: '#E7EFE8',
  ink: '#193326',
  textSecondary: '#81796F',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  h3: {
    fontFamily: 'SourceSerifPro-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  bodySemiBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  captionMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  small: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#193326',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#193326',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#193326',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};
