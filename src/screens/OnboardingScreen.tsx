import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Cartouche, TempleImage, WingedSun } from '../components/motifs';
import { PrimaryButton } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { food, type FoodKey } from '../theme/images';
import { colors, shadow } from '../theme';
import { markOnboarded } from '../state/session';

type Slide = {
  image: FoodKey;
  badge: string;
  chipTitle: string;
  chipSub: string;
  chipIcon: IconName;
  title: string;
  body: string;
  cta: string;
};

const slides: Slide[] = [
  {
    image: 'grill',
    badge: 'أكل بلدي أصيل',
    chipTitle: 'أسوان، كورنيش النيل',
    chipSub: 'توصيل في 30 دقيقة',
    chipIcon: 'pin',
    title: 'كل أكل البلد\nفي مكان واحد',
    body: 'من الكشري والمشويات لأم علي والحلويات — اطلب من أحسن مطاعم أسوان ووصلك لحد باب البيت.',
    cta: 'يلا نبدأ',
  },
  {
    image: 'rice',
    badge: 'أسرع توصيل',
    chipTitle: '20–30 دقيقة',
    chipSub: 'متوسط وقت التوصيل',
    chipIcon: 'clock',
    title: 'اطلب في ثواني\nوتابع كل خطوة',
    body: 'اختار أكلك، حدد الإضافات، وادفع بالطريقة اللي تريحك. إحنا بنوصل الباقي.',
    cta: 'التالي',
  },
  {
    image: 'dessert',
    badge: 'توصيل مجاني',
    chipTitle: 'أحمد في الطريق',
    chipSub: 'على بعد 1.2 كم · 18 دقيقة',
    chipIcon: 'scooter',
    title: 'تابع طلبك\nلحد باب البيت',
    body: 'شوف المندوب على الخريطة، كل مرحلة في الطلب، واستلم أكلك سخن.',
    cta: 'أنشئ حسابك',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const artHeight = Math.min(356, Math.max(236, Math.round(height * 0.42)));
  const artWidth = Math.round((artHeight * 300) / 356);

  const next = () => {
    if (index === slides.length - 1) {
      void markOnboarded();
      router.replace('/signup');
      return;
    }
    setIndex((i) => i + 1);
  };

  const skip = () => {
    void markOnboarded();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.brand}>
          <Cartouche size={24} />
          <AppText family="display" weight="800" size={17} color={colors.olive} lineHeight={24}>
            كيميت
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تخطي"
          onPress={skip}
          hitSlop={10}
        >
          <AppText family="body" weight="600" size={12.5} color={colors.muted}>
            تخطي
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={{ width: artWidth, height: artHeight }}>
            <TempleImage
              source={food[slide.image]}
              height={artHeight}
              radiusTop={Math.round(artWidth / 2)}
              radiusBottom={30}
              width={artWidth}
            >
              <View style={styles.artGlow} />
              <WingedSun
                width={Math.round(artWidth * 0.31)}
                color="rgba(255,244,214,0.95)"
                style={{ position: 'absolute', top: 16, alignSelf: 'center' }}
              />
              <View style={styles.badge}>
                <AppText family="body" weight="700" size={11} color="#3A2A05">
                  {slide.badge}
                </AppText>
              </View>
            </TempleImage>

            <View style={styles.chip}>
              <View style={styles.chipIcon}>
                <Icon name={slide.chipIcon} size={17} color={colors.olive} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <AppText family="body" weight="700" size={11.5} lineHeight={17}>
                  {slide.chipTitle}
                </AppText>
                <AppText family="body" size={10} color={colors.muted} lineHeight={15}>
                  {slide.chipSub}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <Pressable
                key={s.image}
                accessibilityRole="button"
                accessibilityLabel={`الشاشة ${i + 1}`}
                onPress={() => setIndex(i)}
                style={[styles.dot, i === index && styles.dotOn]}
              />
            ))}
          </View>

          <AppText family="display" weight="800" size={30} lineHeight={39}>
            {slide.title}
          </AppText>
          <AppText family="body" size={13.5} lineHeight={23.5} color={colors.muted} style={{ marginTop: 10 }}>
            {slide.body}
          </AppText>

          <PrimaryButton label={slide.cta} onPress={next} style={{ marginTop: 18 }} />

          {index === slides.length - 1 ? (
            <Pressable onPress={skip} style={{ marginTop: 12 }} hitSlop={8}>
              <AppText family="body" size={11.5} color={colors.muted} align="center">
                عندك حساب؟{' '}
                <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                  تسجيل الدخول
                </AppText>
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    height: 46,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    flexShrink: 0,
  },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  scroll: { flexGrow: 1, paddingBottom: 26 },
  artGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(20,24,14,0.10)',
  },
  badge: {
    position: 'absolute',
    top: 22,
    right: -12,
    backgroundColor: colors.saffron,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-4deg' }],
    ...shadow,
  },
  chip: {
    position: 'absolute',
    bottom: 16,
    left: -14,
    maxWidth: 220,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    ...shadow,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { marginTop: 'auto', paddingHorizontal: 24, paddingTop: 26 },
  dots: { flexDirection: 'row-reverse', gap: 6, marginBottom: 16 },
  dot: { width: 8, height: 6, borderRadius: 3, backgroundColor: 'rgba(184,134,47,0.28)' },
  dotOn: {
    width: 26,
    backgroundColor: colors.olive,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.55)',
  },
});
