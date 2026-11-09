import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { GoldFrame } from './motifs';
import type { Restaurant } from '../data/mock';
import { food } from '../theme/images';
import { colors, shadow } from '../theme';

/**
 * بانر المطعم: صورة المطعم بعرض كامل فوق، وتحت البانر اسم المطعم
 * والتصنيف ووقت التجهيز.
 */
export function RestaurantBanner({
  restaurant,
  onPress,
}: {
  restaurant: Restaurant;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}، ${restaurant.cuisine}، تجهيز ${restaurant.prep}`}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.96 }]}
    >
      <View style={styles.cover}>
        <Image
          source={food[restaurant.image]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
        />
        <GoldFrame inset={7} radiusValue={16} opacity={0.28} />
        {restaurant.sticker ? (
          <View style={styles.sticker}>
            <AppText family="body" weight="700" size={10.5} color="#3A2A05">
              {restaurant.sticker}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <AppText
            family="display"
            weight="800"
            size={15.5}
            color={colors.ink}
            lineHeight={23}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {restaurant.name}
          </AppText>
          <View style={styles.rating}>
            <Icon name="star" size={12} color={colors.goldDeep} filled />
            <AppText family="body" weight="700" size={11} color={colors.ink}>
              {restaurant.rating.toFixed(1)}
            </AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <AppText family="body" weight="600" size={11} color={colors.muted}>
            {restaurant.cuisine}
          </AppText>
          <View style={styles.dot} />
          <AppText family="body" size={11} color={colors.muted}>
            تجهيز {restaurant.prep}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.goldLine,
    overflow: 'hidden',
    ...(shadow as object),
  },
  cover: {
    width: '100%',
    aspectRatio: 2,
    backgroundColor: colors.oliveDeep,
  },
  sticker: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.saffron,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    transform: [{ rotate: '-3deg' }],
    zIndex: 4,
  },
  info: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 13,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sand,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.stone,
  },
});
