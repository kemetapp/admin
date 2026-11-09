import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { type Product } from '../data/mock';
import { useCatalog } from '../api/catalog';
import { food } from '../theme/images';
import { colors } from '../theme';

export function ProductCard({
  product,
  rank,
  onPress,
}: {
  product: Product;
  rank?: number;
  onPress: () => void;
}) {
  const { getRestaurant } = useCatalog();
  const restaurant = getRestaurant(product.restaurantId);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name} من ${restaurant.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageWrap}>
        <Image source={food[product.image]} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        {rank ? (
          <View style={styles.rank}>
            <AppText family="body" weight="700" size={10} color="#3A2A05">
              {String(rank)}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText family="display" weight="700" size={12.5} numberOfLines={1} lineHeight={19}>
          {product.name}
        </AppText>
        <AppText family="body" size={10} color={colors.muted} numberOfLines={1} style={{ marginTop: 3 }}>
          {restaurant.name}
        </AppText>
        <View style={styles.foot}>
          <View style={styles.priceRow}>
            <AppText family="body" weight="700" size={12.5} lineHeight={18}>
              {String(product.price)}
            </AppText>
            <AppText family="body" weight="500" size={9.5} color={colors.muted} lineHeight={16}>
              ج.م
            </AppText>
          </View>
          <View style={styles.add}>
            <Icon name="plus" size={15} color={colors.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(184,134,47,0.22)',
    overflow: 'hidden',
  },
  imageWrap: { height: 100, backgroundColor: colors.sand },
  rank: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.saffron,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  body: { paddingHorizontal: 10, paddingTop: 9, paddingBottom: 11 },
  foot: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 3 },
  add: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
