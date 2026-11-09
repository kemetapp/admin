import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Cartouche, TempleImage } from '../components/motifs';
import { PromoCarousel } from '../components/PromoCarousel';
import { ProductCard } from '../components/ProductCard';
import { RestaurantBanner } from '../components/RestaurantBanner';
import { Icon } from '../components/Icon';
import { Chip, IconButton, SectionHeader } from '../components/ui';
import { AddressSheet } from '../components/AddressSheet';
import { Screen } from '../components/Screen';
import { useRtlRail } from '../hooks/useRtlRail';
import { trendingIds } from '../data/mock';
import { useCatalog } from '../api/catalog';
import { useSettings } from '../api/settings';
import { food } from '../theme/images';
import { colors } from '../theme';
import { useAddress } from '../state/addresses';
import { useUnreadCount } from '../state/notifications';

export default function HomeScreen() {
  const router = useRouter();
  const address = useAddress();
  const unread = useUnreadCount();
  const [addressOpen, setAddressOpen] = useState(false);
  const [sort, setSort] = useState<'all' | 'newest' | 'rating'>('all');
  const { categories, products, restaurants, createdAtOf } = useCatalog();
  const settings = useSettings();
  const closed = !settings.storeOpen || !settings.acceptingOrders;

  const restaurantList = useMemo(() => {
    const list = [...restaurants];
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') list.sort((a, b) => createdAtOf(b.id) - createdAtOf(a.id));
    return list;
  }, [restaurants, sort, createdAtOf]);
  const {
    setRef: catRailRef,
    onLayout: catRailLayout,
    onContentSizeChange: catRailSize,
    onScrollBeginDrag: catRailDrag,
  } = useRtlRail();
  const {
    setRef: prodRailRef,
    onLayout: prodRailLayout,
    onContentSizeChange: prodRailSize,
    onScrollBeginDrag: prodRailDrag,
  } = useRtlRail();

  const trending = trendingIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <Screen>
      <ScrollView
        testID="home-scroll"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.homeTop}>
          <Cartouche size={34} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <AppText family="body" size={11} color={colors.muted} lineHeight={16}>
              التوصيل إلى
            </AppText>
            <Pressable
              style={styles.locRow}
              accessibilityRole="button"
              accessibilityLabel="تغيير العنوان"
              onPress={() => setAddressOpen(true)}
            >
              <Icon name="pin" size={15} color={colors.clay} />
              <AppText family="body" weight="600" size={13.5} numberOfLines={1}>
                {address.label} · {address.detail}
              </AppText>
              <Icon name="chevronDown" size={13} color={colors.muted} />
            </Pressable>
          </View>
          <View>
            <IconButton
              name="bell"
              accessibilityLabel={unread ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات'}
              onPress={() => router.push('/notifications')}
            />
            {unread > 0 ? <View style={styles.bellDot} /> : null}
          </View>
        </View>

        {closed ? (
          <View style={styles.closedBar}>
            <Icon name="clock" size={15} color={colors.clay} />
            <AppText
              family="body"
              weight="600"
              size={11.5}
              color={colors.clay}
              lineHeight={18}
              style={{ flex: 1 }}
            >
              المتجر مقفول حاليًا — مواعيد العمل {settings.openTime} إلى {settings.closeTime}
            </AppText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ابحث عن مطعم أو أكلة"
          onPress={() => router.push('/search')}
          style={({ pressed }) => [styles.searchbar, pressed && { opacity: 0.85 }]}
        >
          <Icon name="search" size={19} color={colors.muted} />
          <AppText family="body" size={12.5} color={colors.muted} style={{ flex: 1 }} numberOfLines={1}>
            دوّر على مطعم أو أكلة في أسوان
          </AppText>
          <View style={styles.filter}>
            <Icon name="filter" size={13} color={colors.olive} />
            <AppText family="body" weight="600" size={11} color={colors.olive}>
              فلاتر
            </AppText>
          </View>
        </Pressable>

        <PromoCarousel />

        <SectionHeader title="هتاكل إيه النهاردة؟" />
        <ScrollView
          testID="cat-rail"
          ref={catRailRef}
          onLayout={catRailLayout}
          onContentSizeChange={catRailSize}
          onScrollBeginDrag={catRailDrag}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRail}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              accessibilityLabel={cat.label}
              onPress={() => router.push({ pathname: '/search', params: { cat: cat.id } })}
              style={({ pressed }) => [styles.cat, pressed && { opacity: 0.8 }]}
            >
              <TempleImage
                source={food[cat.image]}
                width={66}
                height={66}
                radiusTop={33}
                radiusBottom={12}
              />
              <AppText
                family="body"
                weight="600"
                size={11}
                align="center"
                color={colors.ink}
                style={{ marginTop: 6 }}
              >
                {cat.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader title="ترند دلوقتي" action="الأكثر طلبًا" />
        <ScrollView
          testID="prod-rail"
          ref={prodRailRef}
          onLayout={prodRailLayout}
          onContentSizeChange={prodRailSize}
          onScrollBeginDrag={prodRailDrag}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prodRail}
        >
          {trending.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              rank={i + 1}
              onPress={() =>
                router.push({ pathname: '/item/[id]', params: { id: product.id } })
              }
            />
          ))}
        </ScrollView>

        <SectionHeader title="المطاعم" />
        <View style={styles.restoFilters}>
          <Chip label="الكل" active={sort === 'all'} onPress={() => setSort('all')} />
          <Chip label="أحدث المطاعم" active={sort === 'newest'} onPress={() => setSort('newest')} />
          <Chip label="أعلى تقييم" active={sort === 'rating'} onPress={() => setSort('rating')} />
        </View>
        <View style={{ gap: 12 }}>
          {restaurantList.map((restaurant) => (
            <RestaurantBanner
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() =>
                router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })
              }
            />
          ))}
        </View>

        <View style={{ height: 10 }} />
      </ScrollView>

      <AddressSheet visible={addressOpen} onClose={() => setAddressOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  homeTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 14,
  },
  locRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  searchbar: {
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.goldLine,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  filter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  catRail: { flexDirection: 'row-reverse', gap: 13, paddingBottom: 4 },
  closedBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.3)',
    backgroundColor: 'rgba(180,86,47,0.08)',
    marginBottom: 12,
  },
  restoFilters: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  cat: { width: 66 },
  prodRail: { flexDirection: 'row-reverse', gap: 12, paddingBottom: 4 },
  bellDot: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.clay,
    borderWidth: 1.5,
    borderColor: colors.cream,
  },
});
