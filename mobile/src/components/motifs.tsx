import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
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

/* ------------------------------------------------------------------ */
/*  الجعران المجنّح — شعار شاشات الافتتاح                                */
/* ------------------------------------------------------------------ */
export function WingedScarab({
  width = 96,
  color = colors.goldDeep,
  opacity = 1,
  style,
}: {
  width?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const height = Math.round((width * 44) / 120);
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 120 44"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill={color} opacity={opacity}>
        <Path d="M54 20C42 11 26 6 6 9c10 12 26 19 48 20z" />
        <Path d="M54 26C44 31 30 35 12 37c8 8 22 8 42 1z" />
        <Path d="M66 20c12-9 28-14 48-11-10 12-26 19-48 20z" />
        <Path d="M66 26c10 5 24 9 42 11-8 8-22 8-42 1z" />
        <Ellipse cx="60" cy="22" rx="6.5" ry="12" />
        <Ellipse cx="60" cy="9" rx="4.5" ry="4" />
        <Path
          d="M57 6c-2-3-5-4-8-5M63 6c2-3 5-4 8-5"
          stroke={color}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  عنخ — فاصل بين النصوص                                              */
/* ------------------------------------------------------------------ */
export function Ankh({
  size = 15,
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
      height={Math.round(size * 1.3)}
      viewBox="0 0 24 31"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ellipse cx={12} cy={8.5} rx={5} ry={7} stroke={color} strokeWidth={2} fill="none" />
      <Path
        d="M12 15.5V29M4.5 18.5h15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  عمود هيروغليفي — زخرفة على جانبي الشاشة                            */
/* ------------------------------------------------------------------ */
export function GlyphColumn({
  height = 300,
  color = colors.goldDeep,
  opacity = 0.34,
  style,
}: {
  height?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const width = Math.round((height * 20) / 240);
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 240"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill={color} opacity={opacity}>
        <Rect x={4} y={4} width={12} height={18} rx={6} />
        <Circle cx={10} cy={36} r={6} />
        <Path d="M10 50l7 12H3z" />
        <Rect x={3} y={70} width={14} height={4} rx={2} />
        <Rect x={3} y={79} width={14} height={4} rx={2} />
        <Path
          d="M3 93c4 0 4 8 8 8s4-8 8-8"
          stroke={color}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx={10} cy={116} r={3} />
        <Rect x={4} y={126} width={12} height={16} rx={3} />
        <Path d="M10 150l6 10H4z" />
        <Rect x={3} y={168} width={14} height={4} rx={2} />
        <Circle cx={10} cy={184} r={6} fill="none" stroke={color} strokeWidth={2.4} />
        <Rect x={4} y={198} width={12} height={18} rx={6} />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  شريط زخرفي أسفل الشاشة                                             */
/* ------------------------------------------------------------------ */
export function PatternBand({
  height = 22,
  color = colors.oliveDeep,
  style,
}: {
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const W = 360;
  const teeth = Array.from({ length: 20 });
  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect width={W} height={height} fill={color} />
      {teeth.map((_, i) => (
        <Path
          key={i}
          d={`M${i * 18 + 3} ${height} l6 -7 l6 7 z`}
          fill="rgba(251,246,232,0.22)"
        />
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  سعف النخيل — زخرفة أركان شاشات الافتتاح                            */
/* ------------------------------------------------------------------ */
export function PalmFrond({
  width = 76,
  color = colors.olive,
  opacity = 0.4,
  mirrored = false,
  style,
}: {
  width?: number;
  color?: string;
  opacity?: number;
  mirrored?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const height = Math.round((width * 130) / 90);
  const leaves = Array.from({ length: 7 });

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 90 130"
      style={[mirrored ? { transform: [{ scaleX: -1 }] } : null, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G opacity={opacity} stroke={color} fill="none" strokeLinecap="round">
        <Path d="M10 122C26 96 44 62 68 22" strokeWidth={2.4} />
        {leaves.map((_, i) => {
          const t = i / (leaves.length - 1);
          const px = 10 + t * 58;
          const py = 122 - t * 100;
          const len = 24 - t * 9;
          return (
            <React.Fragment key={i}>
              <Path
                d={`M${px} ${py}q${len * 0.65} ${-len * 0.15} ${len} ${-len * 0.8}`}
                strokeWidth={2}
              />
              <Path
                d={`M${px} ${py}q${-len * 0.65} ${-len * 0.15} ${-len} ${-len * 0.8}`}
                strokeWidth={2}
              />
            </React.Fragment>
          );
        })}
      </G>
    </Svg>
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
