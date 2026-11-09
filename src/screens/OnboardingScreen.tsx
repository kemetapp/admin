import React, { useCallback, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import {
  Ankh,
  GlyphColumn,
  PalmFrond,
  PapyrusBackground,
  PatternBand,
  TempleImage,
  WingedScarab,
} from '../components/motifs';
import { food, type FoodKey } from '../theme/images';
import { colors } from '../theme';
import { markGuest, markOnboarded } from '../state/session';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useRtlRail } from '../hooks/useRtlRail';

type Slide = {
  image: FoodKey;
  badge: string;
  title: string;
  body: string;
  cta: string;
};

const slides: Slide[] = [
  {
    image: 'grill',
    badge: 'أكل بلدي أصيل',
    title: 'مرحبًا بك في كيميت',
    body: 'تطبيق توصيل طلباتك المفضل\nبلمسة مصرية أصيلة',
    cta: 'ابدأ الآن',
  },
  {
    image: 'rice',
    badge: 'أسرع توصيل',
    title: 'اطلب في ثواني',
    body: 'اختار أكلك وحدد الإضافات، وإحنا نوصل الباقي\nلحد باب البيت.',
    cta: 'التالي',
  },
  {
    image: 'dessert',
    badge: 'توصيل مجاني',
    title: 'تابع طلبك خطوة بخطوة',
    body: 'شوف المندوب على الخريطة وكل مرحلة في الطلب\nواستلم أكلك سخن.',
    cta: 'التالي',
  },
];

/**
 * شاشات الافتتاح — قوس المعبد في النص، الجعران المجنّح فوق اسم التطبيق،
 * وأعمدة هيروغليفية على الجانبين وشريط زخرفي تحت.
 * السحب بين الصفحات بيدخل بعمق (تصغير + بهتان للجانبين).
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const { setRef, node, onLayout, onContentSizeChange, onScrollBeginDrag } = useRtlRail();

  const last = index === slides.length - 1;

  // القوس بيتوسّط المساحة بين عمودي الهيروغليفية بالظبط:
  // بنحسب عرض العمود الأول وبعدين بنطرح هوامشه من عرض الشاشة.
  const glyphHeight = Math.min(280, Math.max(216, Math.round(height * 0.34)) + 20);
  const glyphWidth = Math.round((glyphHeight * 20) / 240);
  const artWidth = Math.min(300, Math.max(190, width - 2 * glyphWidth - 36));
  const artHeight = Math.min(330, Math.max(196, Math.round(height * 0.34)));

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setIndex(clamped);
      node?.scrollTo({
        x: (slides.length - 1 - clamped) * width,
        animated: !reducedMotion,
      });
    },
    [node, width, reducedMotion],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.setValue(e.nativeEvent.contentOffset.x);
    },
    [scrollX],
  );

  const handleMomentum = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const fromLeft = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex(Math.max(0, Math.min(slides.length - 1, slides.length - 1 - fromLeft)));
    },
    [width],
  );

  const finish = () => {
    if (last) {
      // آخر صفحة بتودّي الرئيسية كزائر — يتصفّح الأول، وبعدها بننبهه يعمل حساب.
      void markOnboarded();
      void markGuest();
      router.replace('/(tabs)');
      return;
    }
    goTo(index + 1);
  };

  const skip = () => {
    void markOnboarded();
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#FDF8E9', '#F3E0BC']} style={styles.bg} />
      <PapyrusBackground />

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="تخطي" onPress={skip} hitSlop={10}>
          <AppText family="body" weight="600" size={12} color={colors.muted}>
            تخطي
          </AppText>
        </Pressable>
      </View>

      <View style={styles.logo}>
        <WingedScarab width={Math.min(96, Math.round(width * 0.24))} color={colors.goldDeep} />
        <AppText
          family="display"
          weight="800"
          size={27}
          color={colors.oliveDeep}
          align="center"
          lineHeight={36}
          style={styles.wordmark}
        >
          KEMET
        </AppText>
        <View style={styles.subRow}>
          <View style={styles.subLine} />
          <AppText family="body" weight="600" size={9} color={colors.muted} style={styles.subText}>
            DELIVERY APP
          </AppText>
          <View style={styles.subLine} />
        </View>
      </View>

      <View pointerEvents="none" style={[styles.glyph, { left: 6 }]}>
        <GlyphColumn height={glyphHeight} />
      </View>
      <View pointerEvents="none" style={[styles.glyph, { right: 6 }]}>
        <GlyphColumn height={glyphHeight} />
      </View>

      <ScrollView
        ref={setRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={handleMomentum}
        contentContainerStyle={{ flexDirection: 'row-reverse' }}
      >
        {slides.map((slide, i) => {
          const offset = (slides.length - 1 - i) * width;
          const inputRange = [offset - width, offset, offset + width];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.93, 1, 0.93],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });

          return (
            <View key={slide.image} style={{ width }}>
              <ScrollView
                contentContainerStyle={styles.page}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Animated.View
                  style={[
                    styles.archFrame,
                    {
                      width: artWidth,
                      height: artHeight,
                      opacity,
                      transform: [{ scale }],
                      borderTopLeftRadius: Math.round(artWidth / 2),
                      borderTopRightRadius: Math.round(artWidth / 2),
                    },
                  ]}
                >
                  <TempleImage
                    source={food[slide.image]}
                    width={artWidth - 12}
                    height={artHeight - 12}
                    radiusTop={Math.round((artWidth - 12) / 2)}
                    radiusBottom={24}
                  >
                    <LinearGradient
                      colors={['rgba(20,24,14,0.05)', 'rgba(20,24,14,0.32)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.badge}>
                      <AppText family="body" weight="700" size={10.5} color="#3A2A05">
                        {slide.badge}
                      </AppText>
                    </View>
                  </TempleImage>
                </Animated.View>

                <AppText
                  family="display"
                  weight="800"
                  size={25}
                  color={colors.oliveDeep}
                  align="center"
                  lineHeight={35}
                  style={{ marginTop: 20, paddingHorizontal: 20 }}
                >
                  {slide.title}
                </AppText>

                <AppText
                  family="body"
                  size={13}
                  color={colors.muted}
                  align="center"
                  lineHeight={23}
                  style={{ marginTop: 8, paddingHorizontal: 28 }}
                >
                  {slide.body}
                </AppText>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* سعف النخيل في الأركان تحت — بيرسم ورا الزرار */}
      <View pointerEvents="none" style={[styles.palm, { left: -16, bottom: insets.bottom - 6 }]}>
        <PalmFrond width={88} opacity={0.34} mirrored />
      </View>
      <View pointerEvents="none" style={[styles.palm, { right: -16, bottom: insets.bottom - 6 }]}>
        <PalmFrond width={88} opacity={0.34} />
      </View>

      <View style={styles.bottom}>
        <View style={styles.ankhRow}>
          <View style={styles.ankhLine} />
          <Ankh size={14} color={colors.goldDeep} />
          <View style={styles.ankhLine} />
        </View>

        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.image}
              accessibilityRole="button"
              accessibilityLabel={`الشاشة ${i + 1}`}
              accessibilityState={{ selected: i === index }}
              hitSlop={10}
              onPress={() => goTo(i)}
              style={[styles.dot, i === index && styles.dotOn]}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={slides[index].cta}
          onPress={finish}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        >
          <Icon name="chevronLeft" size={17} color="#F6EFD9" />
          <AppText family="body" weight="700" size={14.5} color="#F6EFD9" align="center" style={{ flex: 1 }}>
            {slides[index].cta}
          </AppText>
          <View style={{ width: 17 }} />
        </Pressable>
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <PatternBand height={18} color={colors.oliveDeep} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  bg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  top: { paddingHorizontal: 24, alignItems: 'flex-start' },
  logo: { alignItems: 'center', paddingTop: 6 },
  wordmark: { letterSpacing: 3.5, marginTop: 2 },
  subRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 2 },
  subLine: { width: 22, height: 1, backgroundColor: colors.goldLineStrong },
  subText: { letterSpacing: 2.6 },
  glyph: { position: 'absolute', top: '34%' },
  palm: { position: 'absolute', zIndex: 0 },
  page: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  archFrame: {
    borderWidth: 1,
    borderColor: colors.goldLineStrong,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,253,246,0.5)',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 10,
    backgroundColor: colors.saffron,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '-3deg' }],
  },
  bottom: { paddingHorizontal: 24, paddingTop: 4 },
  ankhRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ankhLine: { width: 54, height: 1, backgroundColor: colors.goldLineStrong },
  dots: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sand2 },
  dotOn: { width: 26, backgroundColor: colors.olive },
  cta: {
    height: 58,
    borderRadius: 26,
    backgroundColor: colors.oliveDeep,
    // السهم على الشمال زي التصميم، والنص في نص الزرار.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.45)',
  },
});
