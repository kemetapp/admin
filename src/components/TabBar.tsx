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

export function TabBar({ state, navigateToTab, emitter, insets }: BottomTabBarProps) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
              size={21}
              color={focused ? colors.olive : colors.muted}
              filled={focused && name === 'favorites'}
            />
            <AppText
              family="body"
              weight="600"
              size={10.5}
              color={focused ? colors.olive : colors.muted}
              align="center"
              lineHeight={15}
            >
              {config.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * زر السلة البارز — بيتدرّج زيتي، عليه حلقة ذهبية شعرية، وأيقونة عربية الوضوح.
 * الحركة: بيرتد عند الضغط، وبيعمل نبضة ذهبية لما عدد الأصناف يزيد.
 */
function CartFab({ count, onPress }: { count: number; onPress: () => void }) {
  // قيم الحركة في state مش ref — نفس قاعدة React Compiler المتبعة في useRtlRail:
  // ممنوع الوصول لـ ref أثناء الرندر، وألوان/تحويلات الحركة بتتقرأ في الرندر.
  const [scale] = useState(() => new Animated.Value(1));
  const [pulse] = useState(() => new Animated.Value(0));
  const previous = useRef(count);

  useEffect(() => {
    if (count > previous.current) {
      pulse.setValue(0);
      Animated.timing(pulse, { toValue: 1, duration: 520, useNativeDriver: NATIVE_DRIVER }).start();
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 130, useNativeDriver: NATIVE_DRIVER }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    }
    previous.current = count;
  }, [count, pulse, scale]);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.93,
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
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
            ],
          },
        ]}
      />

      <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
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
          <Icon name="cart" size={27} color={colors.goldSoft} strokeWidth={1.7} />
        </Pressable>

        {count > 0 ? (
          <View style={styles.badge}>
            <AppText
              family="body"
              weight="700"
              size={11}
              lineHeight={16}
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

const FAB_SIZE = 66;
const FAB_TOP = -46;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 84,
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,253,246,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.goldLineStrong,
    shadowColor: colors.goldDeep,
    shadowOpacity: 0.18,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: -1 },
    elevation: 12,
  },
  tab: { width: 58, alignItems: 'center', justifyContent: 'center', gap: 4 },
  slot: { width: 62, alignSelf: 'stretch', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    top: FAB_TOP,
    left: -2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.saffron,
  },
  fabWrap: {
    position: 'absolute',
    top: FAB_TOP,
    left: -2,
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 3.5,
    borderColor: colors.card,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.oliveDeep,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: FAB_SIZE / 2 - 3.5,
  },
  fabRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: FAB_SIZE / 2 - 2,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.45)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.clay,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
