import React, { useCallback, useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { GoldFrame } from './motifs';
import { useRtlRail } from '../hooks/useRtlRail';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useCatalog } from '../api/catalog';
import { food } from '../theme/images';
import { colors } from '../theme';

/** كل قد إيه البانر بيتنقل لوحده. */
const AUTO_ADVANCE_MS = 5500;

/**
 * كاروسيل عروض 2:1 — صورة بس من غير أي كتابة فوقها.
 *
 * الترانزيشن: البطاقة اللي في النص بحجمها الكامل ووضوحها الكامل، واللي على
 * الجانبين بتصغر لـ90% وتبهت لـ50% وتنزل 12px — فالسحب بيحس إن فيه عمق
 * مش مجرد شرائح بتزحلق. بيراعي إعداد «تقليل الحركة» في النظام.
 */
export function PromoCarousel() {
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.max(240, Math.min(windowWidth, 640) - 40);
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const { promos } = useCatalog();
  const focused = useIsFocused();
  const [scrollX] = useState(() => new Animated.Value(0));
  const { setRef, node: scrollRef, onLayout, onContentSizeChange, onScrollBeginDrag } = useRtlRail();

  const goTo = useCallback(
    (next: number) => {
      setIndex(next);
      scrollRef?.scrollTo({
        x: (promos.length - 1 - next) * pageWidth,
        animated: !reducedMotion,
      });
    },
    [pageWidth, reducedMotion, scrollRef, promos.length],
  );

  // بنكتب الدالة بإيدينا بدل `Animated.event`: نسخة RN دي بترجّع كائن
  // `AnimatedEvent` مش دالة لما القيادة أصلية، والكائن ده مش بيشتغل مع
  // `ScrollView` عادي — فبندفع القيمة بنفسنا.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.setValue(e.nativeEvent.contentOffset.x);
    },
    [scrollX],
  );

  const handleMomentum = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const fromLeft = Math.round(x / pageWidth);
      const next = Math.max(0, Math.min(promos.length - 1, promos.length - 1 - fromLeft));
      setIndex(next);
    },
    [pageWidth, promos.length],
  );

  // تنقّل تلقائي هادي — بيتوقف لو المستخدم طلب تقليل الحركة، أو الشاشة مش ظاهرة.
  // مؤقّت مربوط بالـ index يعني أي سحب من المستخدم بيصفّر العدّاد من جديد.
  useEffect(() => {
    if (reducedMotion || !focused || promos.length < 2) return;
    const next = (index + 1) % promos.length;
    const timer = setTimeout(() => goTo(next), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, reducedMotion, focused, goTo, promos.length]);

  return (
    <View style={{ marginTop: 18 }}>
      <ScrollView
        ref={setRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={pageWidth}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={handleMomentum}
        contentContainerStyle={{ flexDirection: 'row-reverse' }}
      >
        {promos.map((promo, i) => {
          // في RTL أول عنصر بيروح أقصى اليمين، فموضع البطاقة معكوس.
          const offset = (promos.length - 1 - i) * pageWidth;
          const inputRange = [offset - pageWidth, offset, offset + pageWidth];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [12, 0, 12],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={promo.id}
              style={{
                width: pageWidth,
                height: pageWidth / 2,
                opacity,
                transform: [{ scale }, { translateY }],
              }}
            >
              <View
                testID="promo-slide"
                accessible
                accessibilityRole="image"
                accessibilityLabel={promo.title}
                style={styles.slide}
              >
                <Image
                  source={food[promo.image]}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                />
                <GoldFrame inset={7} radiusValue={18} opacity={0.3} />
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {promos.map((p, i) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`عرض ${i + 1}`}
            accessibilityState={{ selected: i === index }}
            hitSlop={8}
            onPress={() => goTo(i)}
            style={[styles.dot, i === index && styles.dotOn]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.oliveDeep,
  },
  dots: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sand2,
  },
  dotOn: {
    width: 18,
    backgroundColor: colors.olive,
  },
});
