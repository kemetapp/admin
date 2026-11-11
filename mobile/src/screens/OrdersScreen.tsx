import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { itemsLabel } from '../utils/arabic';
import { food } from '../theme/images';
import { colors } from '../theme';
import { useAuthUid, useMyOrders } from '../api/orders';

type Filter = 'live' | 'past';
type OrderSort = 'new' | 'old';

export default function OrdersScreen() {
  const router = useRouter();
  const uid = useAuthUid();
  const { orders } = useMyOrders(uid);
  const [filter, setFilter] = useState<Filter>('live');
  const [sort, setSort] = useState<OrderSort>('new');

  const visible = useMemo(() => {
    const list = orders.filter((order) =>
      filter === 'live' ? order.status === 'live' : order.status === 'delivered',
    );
    return sort === 'new' ? list : [...list].reverse();
  }, [orders, filter, sort]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <AppText family="display" weight="800" size={22}>
            طلباتي
          </AppText>
          <Pressable
            onPress={() => setSort((prev) => (prev === 'new' ? 'old' : 'new'))}
            accessibilityRole="button"
            accessibilityLabel={sort === 'new' ? 'الترتيب: الأحدث أولاً' : 'الترتيب: الأقدم أولاً'}
            style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.75 }]}
          >
            <Icon name="filter" size={14} color={colors.olive} />
            <AppText family="body" weight="600" size={11} color={colors.olive}>
              {sort === 'new' ? 'الأحدث' : 'الأقدم'}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.seg}>
          {(
            [
              { id: 'live' as const, label: 'الحالية' },
              { id: 'past' as const, label: 'السابقة' },
            ]
          ).map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.segItem, active && styles.segItemOn]}
              >
                <AppText
                  family="body"
                  weight="600"
                  size={12.5}
                  color={active ? colors.ink : colors.muted}
                  align="center"
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="receipt" size={38} color={colors.sand2} />
            <AppText family="display" weight="700" size={15} align="center" style={{ marginTop: 12 }}>
              مفيش طلبات هنا
            </AppText>
            <AppText family="body" size={12} color={colors.muted} align="center" style={{ marginTop: 4 }}>
              {filter === 'live' ? 'اطلب من مطاعم أسوان وهتلاقي طلبك هنا.' : 'طلباتك القديمة هتظهر هنا.'}
            </AppText>
          </View>
        ) : (
          visible.map((order) => {
            const live = order.status === 'live';
            return (
              <View key={order.id} style={[styles.card, live && styles.cardLive]}>
                <View style={styles.status}>
                  {live ? <View style={styles.pulse} /> : null}
                  <AppText
                    family="body"
                    weight="700"
                    size={11}
                    color={live ? colors.olive : colors.muted}
                  >
                    {live ? 'في الطريق' : 'تم التوصيل'}
                  </AppText>
                  <AppText
                    family="body"
                    size={10.5}
                    color={colors.muted}
                    align="left"
                    style={{ flex: 1 }}
                  >
                    {order.when}
                  </AppText>
                </View>

                <View style={styles.resto}>
                  <View style={styles.thumb}>
                    <Image source={food[order.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText family="body" weight="700" size={13.5} lineHeight={20}>
                      {order.restaurantName}
                    </AppText>
                    <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
                      {order.itemsCount} {itemsLabel(order.itemsCount)} · {order.total} ج.م
                    </AppText>
                  </View>
                  <AppText family="body" weight="800" size={13.5} lineHeight={20}>
                    {order.total} ج.م
                  </AppText>
                </View>

                {live ? (
                  <Pressable
                    onPress={() => router.push('/tracking')}
                    style={({ pressed }) => [styles.otrack, pressed && { opacity: 0.9 }]}
                    accessibilityRole="button"
                    accessibilityLabel="تتبع الطلب"
                  >
                    <Icon name="scooter" size={16} color={colors.white} />
                    <AppText family="body" weight="700" size={12.5} color={colors.white}>
                      تتبع الطلب
                    </AppText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/restaurant/[id]',
                        params: { id: order.restaurantId },
                      })
                    }
                    style={({ pressed }) => [styles.reorder, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`أعد طلب ${order.restaurantName}`}
                  >
                    <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                      أعد الطلب
                    </AppText>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 14 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  seg: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.sand,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segItemOn: {
    backgroundColor: colors.card,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  sortBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.card,
  },
  card: {
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  cardLive: {
    borderColor: 'rgba(184,134,47,0.45)',
    backgroundColor: '#F8F9EE',
  },
  status: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  pulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.olive,
    shadowColor: colors.olive,
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  resto: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, marginTop: 12 },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  otrack: {
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.olive,
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.38)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 13,
  },
  reorder: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.olive,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
