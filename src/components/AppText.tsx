import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fontFor, type FontWeight } from '../theme';

type Props = TextProps & {
  family?: 'display' | 'body';
  weight?: FontWeight;
  size?: number;
  color?: string;
  align?: 'right' | 'center' | 'left';
  lineHeight?: number;
};

/**
 * أرضية المقروئية — مفيش نص في التطبيق بينزل تحتها.
 *
 * قبل كده كان فيه 107 استخدام بحجم 9.5–11.5px (نص عربي صغير بيتعب في القراءة)
 * وده بيخالف مقياس MASTER §3 اللي بيبدأ من 12. الحماية هنا مركزية عشان
 * مفيش شاشة جديدة تفلت منها.
 */
const MIN_READABLE_SIZE = 12;

/**
 * ارتفاع السطر للنص العربي (MASTER §3).
 * أقل من كده الحروف العربية بتزنق على بعضها لأن التشكيل والصواعد محتاجة مساحة.
 */
const ARABIC_LINE_RATIO = 1.65;

export function AppText({
  family = 'body',
  weight = '400',
  size = 14,
  color = colors.ink,
  align = 'right',
  lineHeight,
  style,
  children,
  ...rest
}: Props) {
  // لو الحجم تحت الأرضية بنرفعه، وبعدّي نفس النسبة على ارتفاع السطر
  // عشان الإيقاع الرأسي يفضل زي ما المصمم قصده مش يتزنق.
  const resolvedSize = Math.max(MIN_READABLE_SIZE, size);
  const scale = resolvedSize / size;

  const base: TextStyle = {
    fontFamily: fontFor(family, weight),
    fontSize: resolvedSize,
    lineHeight: lineHeight
      ? Math.round(lineHeight * scale)
      : Math.round(resolvedSize * ARABIC_LINE_RATIO),
    color,
    textAlign: align,
    writingDirection: 'rtl',
  };

  return (
    <Text {...rest} style={[base, style]}>
      {children}
    </Text>
  );
}
