import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AppText } from './AppText';
import { Ankh, GlyphColumn, WingedScarab } from './motifs';
import { PrimaryButton } from './ui';
import { colors } from '../theme';
import { getSession, isGuest } from '../state/session';

/** بعد قد إيه ننبّه الزائر إنه يعمل حساب. */
const NUDGE_DELAY_MS = 10_000;

/**
 * تنبيه الزائر — بردية فرعونية بتتفتح فوق التطبيق بعد 10 ثواني من التصفّح،
 * وفيها اسطوانتين زيتيتين فوق وتحت زي اللفافة، وعمودين هيروغليفيين على الجنبين.
 * بيظهر للزائر بس (مش مسجّل دخول ومش واخد قرار إنه زائر).
 */
export function GuestNudge() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [scale] = useState(() => new Animated.Value(0.92));

  // بنقرا المسار الحالي من ref جوه المؤقّت، عشان العدّاد ميتصفّرش مع كل تنقّل.
  const where = useRef(pathname);
  useEffect(() => {
    where.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let alive = true;

    const timer = setTimeout(async () => {
      if (!alive) return;
      const [session, guest] = await Promise.all([getSession(), isGuest()]);
      if (!alive || session || !guest) return;

      const path = where.current ?? '';
      // لو العميل راح صفحة الحساب بنفسه، مفيش داعي ننبهه.
      if (path.startsWith('/signup') || path.startsWith('/login')) return;

      setVisible(true);
    }, NUDGE_DELAY_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, scale]);

  const close = () => setVisible(false);

  const goSignup = () => {
    setVisible(false);
    router.push('/signup');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
          <View style={styles.roll} />

          <View style={styles.paper}>
            <View pointerEvents="none" style={[styles.sideGlyph, { left: 4 }]}>
              <GlyphColumn height={168} opacity={0.16} />
            </View>
            <View pointerEvents="none" style={[styles.sideGlyph, { right: 4 }]}>
              <GlyphColumn height={168} opacity={0.16} />
            </View>

            <WingedScarab width={74} color={colors.goldDeep} />

            <AppText
              family="display"
              weight="800"
              size={18}
              color={colors.oliveDeep}
              align="center"
              lineHeight={27}
              style={{ marginTop: 10 }}
            >
              لسه بتتفرّج كزائر
            </AppText>

            <AppText
              family="body"
              size={12.5}
              color={colors.muted}
              align="center"
              lineHeight={22}
              style={{ marginTop: 8, paddingHorizontal: 6 }}
            >
              اعمل حسابك في ثانية عشان تقدر تطلب من مطاعم أسوان، تتابع أوردرك،
              وتحتفظ بعناوينك ومفضّلاتك.
            </AppText>

            <View style={styles.ankhRow}>
              <View style={styles.ankhLine} />
              <Ankh size={13} color={colors.goldDeep} />
              <View style={styles.ankhLine} />
            </View>

            <PrimaryButton label="اعمل حسابي" onPress={goSignup} style={{ height: 52 }} />

            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="هكمّل كزائر"
              hitSlop={8}
              style={{ marginTop: 12, alignSelf: 'center' }}
            >
              <AppText family="body" weight="600" size={12} color={colors.muted} align="center">
                هكمّل كزائر
              </AppText>
            </Pressable>
          </View>

          <View style={styles.roll} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,22,12,0.55)',
    paddingHorizontal: 26,
  },
  wrap: { width: '100%', maxWidth: 340 },
  roll: {
    height: 16,
    borderRadius: 9,
    backgroundColor: colors.oliveDeep,
    marginHorizontal: -10,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.35)',
  },
  paper: {
    backgroundColor: '#FBF3DF',
    borderWidth: 1,
    borderColor: colors.goldLineStrong,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 24,
    marginVertical: -7,
    alignItems: 'center',
    overflow: 'hidden',
  },
  sideGlyph: { position: 'absolute', top: 40 },
  ankhRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    marginVertical: 16,
  },
  ankhLine: { width: 46, height: 1, backgroundColor: colors.goldLineStrong },
});
