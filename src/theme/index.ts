import { Platform } from 'react-native';

/**
 * KEMET — «فرعوني معاصر»
 * الزيتي أساسي، الكريمي خلفية، والذهب للنقوش فقط.
 */
export const colors = {
  olive: '#4F5B2A',
  oliveDeep: '#3E4A20',
  oliveLight: '#5D6B33',
  oliveSoft: '#EDEFDD',
  cream: '#FBF6E8',
  card: '#FFFDF6',
  ink: '#23271A',
  muted: '#5F6549',
  clay: '#B4562F',
  saffron: '#D9A24A',
  goldSoft: '#F8EDD6',
  sand: '#EFE1BE',
  sand2: '#E3CE9F',
  goldDeep: '#B8862F',
  stone: '#D9C9A6',
  white: '#FFFFFF',
  success: '#3F6B35',
  danger: '#A63A2B',
  line: 'rgba(35,39,26,0.10)',
  lineSoft: 'rgba(35,39,26,0.06)',
  goldLine: 'rgba(184,134,47,0.24)',
  goldLineStrong: 'rgba(217,162,74,0.42)',
  oliveTint: 'rgba(79,91,42,0.08)',
  scrim: 'rgba(20,24,14,0.55)',
  sheetScrim: 'rgba(18,22,12,0.42)',
} as const;

export const fonts = {
  display: 'Alexandria_700Bold',
  displayRegular: 'Alexandria_400Regular',
  displayMedium: 'Alexandria_500Medium',
  displaySemi: 'Alexandria_600SemiBold',
  displayExtra: 'Alexandria_800ExtraBold',
  body: 'IBMPlexSansArabic_400Regular',
  bodyMedium: 'IBMPlexSansArabic_500Medium',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
  bodyBold: 'IBMPlexSansArabic_700Bold',
} as const;

export type FontWeight = '400' | '500' | '600' | '700' | '800';

export function fontFor(family: 'display' | 'body', weight: FontWeight = '400') {
  if (family === 'display') {
    switch (weight) {
      case '500':
        return fonts.displayMedium;
      case '600':
        return fonts.displaySemi;
      case '700':
        return fonts.display;
      case '800':
        return fonts.displayExtra;
      default:
        return fonts.displayRegular;
    }
  }
  switch (weight) {
    case '500':
      return fonts.bodyMedium;
    case '600':
      return fonts.bodySemi;
    case '700':
      return fonts.bodyBold;
    default:
      return fonts.body;
  }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  pill: 999,
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#23271A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
  default: {
    shadowColor: '#23271A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});

export const shadowStrong = Platform.select({
  ios: {
    shadowColor: '#23271A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: 8 },
  default: {
    shadowColor: '#23271A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
});

export const typography = {
  h1: { fontFamily: fonts.displayExtra, fontSize: 30, lineHeight: 42, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 36, color: colors.ink },
  h3: { fontFamily: fonts.display, fontSize: 19, lineHeight: 28, color: colors.ink },
  h4: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 23, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 22, color: colors.muted },
  bodySm: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, color: colors.muted },
  caption: { fontFamily: fonts.body, fontSize: 10.5, lineHeight: 16, color: colors.muted },
} as const;
