import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Lotus } from './motifs';
import { colors, radius, shadow } from '../theme';

/* ------------------------------------------------------------------ */
/*  زر أساسي                                                           */
/* ------------------------------------------------------------------ */
export function PrimaryButton({
  label,
  price,
  onPress,
  disabled = false,
  style,
  icon,
}: {
  label: string;
  price?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        primaryStyles.button,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.88, transform: [{ scale: 0.995 }] },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
        {icon ? <Icon name={icon} size={18} color={colors.white} /> : null}
        <AppText family="body" weight="700" size={15} color={colors.white} align="center">
          {label}
        </AppText>
        {price ? (
          <AppText family="body" weight="600" size={13} color="rgba(255,255,255,0.92)">
            {price}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const primaryStyles = StyleSheet.create({
  button: {
    width: '100%',
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.olive,
    borderWidth: 1,
    borderColor: colors.goldLineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowColor: colors.olive,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 10 },
  },
});

/* ------------------------------------------------------------------ */
/*  زر أيقونة                                                          */
/* ------------------------------------------------------------------ */
export function IconButton({
  name,
  onPress,
  size = 44,
  color = colors.ink,
  variant = 'light',
  style,
  accessibilityLabel,
  filled = false,
}: {
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  variant?: 'light' | 'glass' | 'ghost';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  filled?: boolean;
}) {
  const bg =
    variant === 'glass' ? 'rgba(255,255,255,0.16)' : variant === 'ghost' ? 'transparent' : colors.card;
  const border =
    variant === 'glass' ? 'rgba(255,255,255,0.24)' : variant === 'ghost' ? 'transparent' : colors.line;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size > 40 ? 14 : 13,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Icon name={name} size={Math.round(size * 0.46)} color={color} filled={filled} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  عنوان قسم + لوتس                                                   */
/* ------------------------------------------------------------------ */
export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[sectionStyles.row, style]}>
      <View style={sectionStyles.titleWrap}>
        <Lotus size={15} />
        <AppText family="display" weight="700" size={19} color={colors.ink}>
          {title}
        </AppText>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <AppText family="body" weight="600" size={12.5} color={colors.olive}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 13,
  },
  titleWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
});

/* ------------------------------------------------------------------ */
/*  عداد كمية                                                          */
/* ------------------------------------------------------------------ */
export function Stepper({
  value,
  onMinus,
  onPlus,
  small = false,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  small?: boolean;
}) {
  const h = small ? 38 : 50;
  const w = small ? 32 : 42;
  // الهدف المرئي 32–42px، فبنوسّع منطقة اللمس عشان توصل 44pt على الأقل
  // (MASTER §5 + قاعدة Touch Target Size في ui-ux-pro-max).
  const hitSlop = { top: 8, bottom: 8, left: 6, right: 6 };
  return (
    <View style={[stepStyles.wrap, { height: h, borderRadius: small ? 12 : 14 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="أقل"
        hitSlop={hitSlop}
        onPress={onMinus}
        style={({ pressed }) => [stepStyles.btn, { width: w }, pressed && { opacity: 0.6 }]}
      >
        <Icon name="minus" size={small ? 15 : 17} color={colors.olive} />
      </Pressable>
      <AppText
        family="body"
        weight="700"
        size={small ? 13 : 15}
        color={colors.ink}
        align="center"
        style={{ width: small ? 24 : 30, lineHeight: h }}
      >
        {String(value)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="أكتر"
        hitSlop={hitSlop}
        onPress={onPlus}
        style={({ pressed }) => [stepStyles.btn, { width: w }, pressed && { opacity: 0.6 }]}
      >
        <Icon name="plus" size={small ? 15 : 17} color={colors.olive} />
      </Pressable>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    overflow: 'hidden',
    flexShrink: 0,
  },
  btn: { height: '100%', alignItems: 'center', justifyContent: 'center' },
});

/* ------------------------------------------------------------------ */
/*  زر رجوع                                                            */
/* ------------------------------------------------------------------ */
export function BackButton({
  onPress,
  variant = 'light',
  style,
}: {
  onPress?: () => void;
  variant?: 'light' | 'glass';
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  return (
    <IconButton
      name="arrowLeft"
      accessibilityLabel="رجوع"
      variant={variant}
      size={44}
      color={variant === 'glass' ? colors.white : colors.ink}
      onPress={onPress ?? (() => router.back())}
      style={style}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  شيب                                                                */
/* ------------------------------------------------------------------ */
export function Chip({
  label,
  active = false,
  onPress,
  icon,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        chipStyles.wrap,
        active && chipStyles.active,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={active ? colors.olive : colors.muted} /> : null}
      <AppText
        family="body"
        weight="600"
        size={11.5}
        color={active ? colors.olive : colors.muted}
        align="center"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  active: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
});

/* ------------------------------------------------------------------ */
/*  فاصل                                                               */
/* ------------------------------------------------------------------ */
export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}

/* ------------------------------------------------------------------ */
/*  شارة صغيرة                                                         */
/* ------------------------------------------------------------------ */
export function Badge({ label }: { label: string }) {
  return (
    <View style={badgeStyles.wrap}>
      <AppText family="body" weight="600" size={10.5} color={colors.olive}>
        {label}
      </AppText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.oliveSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(184,134,47,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
