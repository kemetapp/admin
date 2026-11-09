import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useCart } from '../state/CartContext';
import { itemsLabel } from '../utils/arabic';
import { colors } from '../theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'الرئيسية', icon: 'home' },
  favorites: { label: 'المفضلة', icon: 'heart' },
  'cart-slot': { label: 'السلة', icon: 'cart' },
  orders: { label: 'طلباتي', icon: 'receipt' },
  account: { label: 'حسابي', icon: 'user' },
};

const ORDER = ['index', 'favorites', 'cart-slot', 'orders', 'account'];

/** مشغّل الحركة الأصلي بيزعّج على الويب، فبنفصله حسب المنصة. */
const NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * شريط سفلي عائم في نص الشاشة — مش عريض من الحرف للحرف.
 * الزر الأوسط للسلة بنفس لغة التصميم بتاعته: تدرّج زيتي + حلقة ذهبية.
 */
export function TabBar({ state, navigateToTab, emitter, insets }: BottomTabBarProps) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.pill}>
        {ORDER.map((name) => {
          const route = state.routes.find((r) => r.name === name);
          const config = TABS[name];
          if (!route || !config) return null;
          const focused = state.routes[state.index]?.name === name;

          if (name === 'cart-slot') {
            return <CartFab key={name} count={count} onPress={() => router.push('/cart')} />;
          }

          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={config.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigateToTab(route.key);
                }
              }}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
            >
              <Icon
                name={config.icon}
                size={19}
                color={focused ? colors.olive : colors.muted}
                filled={focused && name === 'favorites'}
              />
              <AppText
                family="body"
                weight="600"
                size={10.5}
                color={focused ? colors.olive : colors.muted}
                align="center"
                lineHeight={14}
              >
                {config.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * زر السلة — بيقعد في نص الشريط بالظبط، بنفس تدرّج وحلقة زر السلة الكبير.
 * بيرتد عند الضغط، وبيعمل نبضة ذهبية لما عدد الأصناف يزيد.
 */
function CartFab({ count, onPress }: { count: number; onPress: () => void }) {
  // قيم الحركة في state مش ref — قاعدة React Compiler المتبعة في useRtlRail.
  const [scale] = useState(() => new Animated.Value(1));
  const [pulse] = useState(() => new Animated.Value(0));
  const previous = useRef(count);

  useEffect(() => {
    if (count > previous.current) {
      pulse.setValue(0);
      Animated.timing(pulse, { toValue: 1, duration: 480, useNativeDriver: NATIVE_DRIVER }).start();
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 120, useNativeDriver: NATIVE_DRIVER }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    }
    previous.current = count;
  }, [count, pulse, scale]);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 6,
      tension: 180,
      useNativeDriver: NATIVE_DRIVER,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: NATIVE_DRIVER,
    }).start();

  return (
    <View style={styles.slot}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulse,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) },
            ],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          testID="cart-fab"
          accessibilityRole="button"
          accessibilityLabel={`السلة${count ? `، ${count} ${itemsLabel(count)}` : ''}`}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={styles.fab}
        >
          <LinearGradient
            colors={[colors.oliveLight, colors.oliveDeep]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.fabFill}
          />
          <View pointerEvents="none" style={styles.fabRing} />
          <Icon name="cart" size={21} color={colors.goldSoft} strokeWidth={1.8} />
        </Pressable>

        {count > 0 ? (
          <View style={styles.badge}>
            <AppText
              family="body"
              weight="700"
              size={10.5}
              lineHeight={13}
              color={colors.white}
              align="center"
            >
              {String(count)}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const FAB = 50;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  pill: {
    height: 64,
    borderRadius: 26,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,253,246,0.98)',
    borderWidth: 1,
    borderColor: colors.goldLineStrong,
    shadowColor: colors.goldDeep,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: { width: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  slot: { width: 64, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    backgroundColor: colors.saffron,
  },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.oliveDeep,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: FAB / 2 - 3,
  },
  fabRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: FAB / 2 - 2,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.45)',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.clay,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
