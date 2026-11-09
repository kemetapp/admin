import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { BackButton, IconButton } from '../components/ui';
import { GoldFrame } from '../components/motifs';
import { Screen } from '../components/Screen';
import { useRtlRail } from '../hooks/useRtlRail';
import { itemsLabel } from '../utils/arabic';
import { getRestaurant, productsForRestaurant } from '../data/mock';
import { food } from '../theme/images';
import { colors, shadow } from '../theme';
import { useCart } from '../state/CartContext';
import { toggleFavorite, useFavorites } from '../state/favorites';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const restaurant = getRestaurant(id ?? 'nuba');
  const menu = productsForRestaurant(restaurant.id);
  const [tab, setTab] = useState(restaurant.menuTabs[0]);
  const { count, total, restaurantId, restaurantName } = useCart();
  const favorites = useFavorites();
  const isFavorite = favorites.includes(restaurant.id);
  const conflict = count > 0 && restaurantId !== null && restaurantId !== restaurant.id;
  const {
    setRef: menuTabsRef,
    onLayout: menuTabsLayout,
    onContentSizeChange: menuTabsSize,
    onScrollBeginDrag: menuTabsDrag,
  } = useRtlRail();

  const filtered = tab === restaurant.menuTabs[0] ? menu : menu.filter((p) => p.category === tab);
  const shown = filtered.length ? filtered : menu;

  return (
    <Screen padTop={false}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: count > 0 ? 10 : 24 }}
      >
        <View style={styles.hero} testID="resto-hero">
          <Image source={food[restaurant.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(10,14,9,0.12)', 'rgba(10,14,9,0.30)', 'rgba(10,14,9,0.92)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.actions, { top: insets.top + 6 }]}>
            <BackButton variant="glass" />
            <IconButton
              name="heart"
              variant="glass"
              color={isFavorite ? colors.saffron : colors.white}
              filled={isFavorite}
              accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              onPress={() => toggleFavorite(restaurant.id)}
            />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.tag}>
              <AppText family="body" weight="600" size={11} color="#F3EEDC">
                {restaurant.cuisine}
              </AppText>
            </View>
            <AppText family="display" weight="800" size={28} color={colors.white} lineHeight={38} style={{ marginTop: 9 }}>
              {restaurant.name}
            </AppText>
            <View style={styles.goldLine} />
            <View style={styles.meta}>
              <AppText family="body" weight="700" size={12} color={colors.white}>
                {restaurant.rating.toFixed(1)}
              </AppText>
              <AppText family="body" size={12} color="rgba(255,255,255,0.85)">
                ({restaurant.reviews} تقييم)
              </AppText>
              <View style={styles.dot} />
              <AppText family="body" size={12} color="rgba(255,255,255,0.85)">
                تجهيز {restaurant.prep}
              </AppText>
            </View>
          </View>
          <GoldFrame inset={0} radiusValue={0} opacity={0.18} />
        </View>

        <View style={styles.body}>
          {conflict ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`سلتك فيها أوردر من ${restaurantName ?? 'مطعم تاني'}، اضغط لعرض السلة`}
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [styles.conflict, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.conflictIcon}>
                <Icon name="cart" size={15} color={colors.clay} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText family="body" weight="700" size={11.5} color={colors.ink} lineHeight={18}>
                  سلتك فيها أوردر من {restaurantName}
                </AppText>
                <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                  الطلب بيتقفل على مطعم واحد — اعرض السلة أو امسحها لو عايز تطلب من هنا.
                </AppText>
              </View>
              <Icon name="chevronLeft" size={16} color={colors.clay} />
            </Pressable>
          ) : null}
          <ScrollView
            testID="menu-tabs"
            ref={menuTabsRef}
            onLayout={menuTabsLayout}
            onContentSizeChange={menuTabsSize}
            onScrollBeginDrag={menuTabsDrag}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuTabs}
          >
            {restaurant.menuTabs.map((t) => {
              const active = t === tab;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.mtab, active && styles.mtabActive]}
                >
                  <AppText
                    family="body"
                    weight="600"
                    size={12.5}
                    color={active ? colors.white : colors.muted}
                  >
                    {t}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {shown.map((product) => (
            <Pressable
              key={product.id}
              accessibilityRole="button"
              accessibilityLabel={`${product.name}، ${product.price} جنيه`}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: product.id } })}
              style={({ pressed }) => [styles.mitem, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.miBody}>
                <AppText family="display" weight="700" size={14.5} lineHeight={22}>
                  {product.name}
                </AppText>
                <AppText
                  family="body"
                  size={11.5}
                  lineHeight={18.5}
                  color={colors.muted}
                  numberOfLines={2}
                  style={{ marginTop: 4 }}
                >
                  {product.description}
                </AppText>
                <View style={styles.priceRow}>
                  <AppText family="body" weight="700" size={13} lineHeight={19}>
                    {String(product.price)}
                  </AppText>
                  <AppText family="body" weight="500" size={10.5} color={colors.muted} lineHeight={17}>
                    ج.م
                  </AppText>
                </View>
              </View>
              <View style={styles.miImgWrap}>
                <View style={styles.miImg}>
                  <Image source={food[product.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
                </View>
                <View style={styles.add}>
                  <Icon name="plus" size={16} color={colors.olive} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {count > 0 ? (
        <View style={[styles.cartbarWrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`عرض السلة، ${count} ${itemsLabel(count)}، ${total} جنيه`}
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.cartbar, pressed && { opacity: 0.94 }]}
          >
            <View>
              <AppText family="body" weight="700" size={13.5} color={colors.white} lineHeight={20}>
                {count} {itemsLabel(count)}
              </AppText>
              <AppText family="body" size={11.5} color="#E9E2C4" lineHeight={17} style={{ marginTop: 2 }}>
                {total} ج.م
              </AppText>
            </View>
            <View style={styles.cartBtn}>
              <AppText family="body" weight="700" size={13.5} color={colors.olive}>
                عرض السلة
              </AppText>
            </View>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 302, backgroundColor: '#111' },
  actions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  heroInfo: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goldLine: {
    width: 46,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.saffron,
    marginTop: 8,
    opacity: 0.9,
  },
  meta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, marginTop: 8, flexWrap: 'wrap' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  body: { paddingHorizontal: 20 },
  conflict: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.28)',
    backgroundColor: 'rgba(180,86,47,0.08)',
  },
  conflictIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(180,86,47,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTabs: { flexDirection: 'row-reverse', gap: 8, paddingTop: 14, paddingBottom: 12 },
  mtab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  mtabActive: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
    borderWidth: 1,
  },
  mitem: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    alignItems: 'flex-start',
  },
  miBody: { flex: 1 },
  miImgWrap: { width: 92, height: 92, flexShrink: 0 },
  miImg: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.goldSoft,
  },
  add: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 3, marginTop: 8 },
  cartbarWrap: { paddingHorizontal: 14, backgroundColor: 'transparent' },
  cartbar: {
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.olive,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 18,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.35)',
    ...shadow,
  },
  cartBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
