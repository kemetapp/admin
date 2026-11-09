import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { PrimaryButton } from '../components/ui';
import { Screen } from '../components/Screen';
import { restaurants } from '../data/mock';
import { food } from '../theme/images';
import { colors } from '../theme';
import { toggleFavorite, useFavorites } from '../state/favorites';

export default function FavoritesScreen() {
  const router = useRouter();
  const favorites = useFavorites();
  const list = restaurants.filter((restaurant) => favorites.includes(restaurant.id));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <AppText family="display" weight="800" size={22}>
            المفضلة
          </AppText>
          <AppText family="body" size={11.5} color={colors.muted}>
            {list.length ? `${list.length} مطعم` : 'لسه فاضية'}
          </AppText>
        </View>

        {list.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="heart" size={32} color={colors.sand2} />
            </View>
            <AppText family="display" weight="700" size={16} align="center" style={{ marginTop: 14 }}>
              مفيش مطاعم في المفضلة
            </AppText>
            <AppText
              family="body"
              size={12}
              color={colors.muted}
              align="center"
              lineHeight={21}
              style={{ marginTop: 6, maxWidth: 270 }}
            >
              دوس على القلب في صفحة أي مطعم وهتلاقيه هنا على طول.
            </AppText>
            <PrimaryButton
              label="اتفرج على المطاعم"
              onPress={() => router.push('/(tabs)')}
              style={{ marginTop: 20, maxWidth: 240 }}
            />
          </View>
        ) : (
          list.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              accessibilityRole="button"
              accessibilityLabel={`${restaurant.name}، ${restaurant.cuisine}`}
              onPress={() =>
                router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.thumb}>
                <Image
                  source={food[restaurant.image]}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText family="display" weight="700" size={14} lineHeight={21} numberOfLines={1}>
                  {restaurant.name}
                </AppText>
                <AppText
                  family="body"
                  size={11.5}
                  color={colors.muted}
                  lineHeight={18}
                  numberOfLines={1}
                  style={{ marginTop: 2 }}
                >
                  {restaurant.cuisine} · تجهيز {restaurant.prep}
                </AppText>
                <View style={styles.meta}>
                  <Icon name="star" size={11} color={colors.saffron} filled />
                  <AppText family="body" weight="600" size={11} color={colors.muted}>
                    {restaurant.rating.toFixed(1)}
                  </AppText>
                  <AppText family="body" size={11} color={colors.muted}>
                    ({restaurant.reviews})
                  </AppText>
                </View>
              </View>

              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`إزالة ${restaurant.name} من المفضلة`}
                onPress={() => toggleFavorite(restaurant.id)}
                style={({ pressed }) => [styles.heart, pressed && { opacity: 0.6 }]}
              >
                <Icon name="heart" size={18} color={colors.clay} filled />
              </Pressable>
            </Pressable>
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  meta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 3 },
  heart: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(180,86,47,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
