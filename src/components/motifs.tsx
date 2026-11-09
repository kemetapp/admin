import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from './AppText';
import { colors, radius } from '../theme';

/* ------------------------------------------------------------------ */
/*  الخرطوش — شعار التطبيق                                             */
/* ------------------------------------------------------------------ */
export function Cartouche({
  size = 40,
  letter = 'ك',
  style,
}: {
  size?: number;
  letter?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const height = Math.round(size * 1.18);
  return (
    <View style={[{ width: size, alignItems: 'center' }, style]}>
      <LinearGradient
        colors={[colors.oliveLight, colors.oliveDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{
          width: size,
          height,
          borderTopLeftRadius: size / 2,
          borderTopRightRadius: size / 2,
          borderBottomLeftRadius: size * 0.24,
          borderBottomRightRadius: size * 0.24,
          borderWidth: 1,
          borderColor: 'rgba(217,162,74,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText
          family="display"
          weight="800"
          size={Math.round(size * 0.44)}
          color="#F3E4BC"
          align="center"
          style={{ lineHeight: Math.round(size * 0.6) }}
        >
          {letter}
        </AppText>
      </LinearGradient>
      <View
        style={{
          width: Math.round(size * 0.72),
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.saffron,
          opacity: 0.85,
          marginTop: 3,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  الشمس المجنحة                                                      */
/* ------------------------------------------------------------------ */
export function WingedSun({
  width = 132,
  color = colors.saffron,
  opacity = 1,
  style,
}: {
  width?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const height = Math.round((width * 32) / 128);
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 128 32"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={64} cy={16} r={7.5} fill={color} opacity={opacity} />
      <Path d="M56 11C43 11 28 7 13 2c8 9 22 14 43 14z" fill={color} opacity={opacity} />
      <Path d="M56 16.5C40 16.5 24 16 6 12c12 8 30 11 50 11z" fill={color} opacity={opacity} />
      <Path d="M56 21c-12 0-24 2-36 7 9-10 21-13 36-13z" fill={color} opacity={opacity} />
      <Path d="M72 11c13 0 28-4 43-9-8 9-22 14-43 14z" fill={color} opacity={opacity} />
      <Path d="M72 16.5c16 0 32-.5 50-4.5-12 8-30 11-50 11z" fill={color} opacity={opacity} />
      <Path d="M72 21c12 0 24 2 36 7-9-10-21-13-36-13z" fill={color} opacity={opacity} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  لوتس النيل                                                         */
/* ------------------------------------------------------------------ */
export function Lotus({
  size = 14,
  color = colors.goldDeep,
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M12 2.6c2.9 2.6 4.1 5.5 4.1 8.2 0 3.3-1.8 5.9-4.1 7.2-2.3-1.3-4.1-3.9-4.1-7.2 0-2.7 1.2-5.6 4.1-8.2z"
        fill={color}
      />
      <Path
        d="M12 17.4c-3.9-2.6-6.7-2.8-9.1-1.5 1.5 2.8 4.6 4.6 9.1 4.6s7.6-1.8 9.1-4.6c-2.4-1.3-5.2-1.1-9.1 1.5z"
        fill={color}
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  عقد المعبد — إطار الصور                                           */
/* ------------------------------------------------------------------ */
export function TempleImage({
  source,
  width,
  height,
  radiusTop,
  radiusBottom = 14,
  children,
  style,
}: {
  source: number;
  width?: number | `${number}%`;
  height: number;
  radiusTop?: number;
  radiusBottom?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const top = radiusTop ?? Math.min(160, Math.round(Number(height) / 2));
  return (
    <View
      style={[
        {
          width: width ?? '100%',
          height,
          borderTopLeftRadius: top,
          borderTopRightRadius: top,
          borderBottomLeftRadius: radiusBottom,
          borderBottomRightRadius: radiusBottom,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.goldLineStrong,
          backgroundColor: colors.sand,
        },
        style,
      ]}
    >
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  إطار ذهبي داخلي                                                    */
/* ------------------------------------------------------------------ */
export function GoldFrame({
  inset = 7,
  radiusValue = 16,
  opacity = 0.3,
}: {
  inset?: number;
  radiusValue?: number;
  opacity?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: inset,
        bottom: inset,
        left: inset,
        right: inset,
        borderRadius: radiusValue,
        borderWidth: 1,
        borderColor: `rgba(217,162,74,${opacity})`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  خلفية بردية                                                        */
/* ------------------------------------------------------------------ */
const FIBERS = Array.from({ length: 140 });

export function PapyrusBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <LinearGradient
        colors={['rgba(217,162,74,0.075)', 'rgba(217,162,74,0)']}
        style={{ height: 240, width: '100%' }}
      />
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', opacity: 1 }]}>
        {FIBERS.map((_, i) => (
          <View
            key={i}
            style={{
              width: 1,
              height: '100%',
              marginRight: 5,
              backgroundColor: 'rgba(35,39,26,0.018)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  خلفية الشاشة                                                       */
/* ------------------------------------------------------------------ */
export function SheetHandle() {
  return (
    <LinearGradient
      colors={[colors.goldDeep, colors.sand2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        width: 44,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
      }}
    />
  );
}

export const motifStyles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  goldHairline: { height: 1, backgroundColor: colors.goldLine, borderRadius: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
});
