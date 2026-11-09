import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/ProductCard';
import { SectionHeader } from '../components/ui';
import { Screen } from '../components/Screen';
import { useRtlRail } from '../hooks/useRtlRail';
import { categories, products, restaurants, trendingIds } from '../data/mock';
import { food } from '../theme/images';
import { colors, fonts } from '../theme';

type Sort = 'near' | 'rating' | 'fast';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'near', label: 'الأنسب' },
  { id: 'rating', label: 'الأعلى تقييمًا' },
  { id: 'fast', label: 'أسرع تجهيز' },
];

/** أول رقم في نص وقت التجهيز (مثال: «20–25 د» → 20). */
function prepMinutes(prep: string) {
  const match = prep.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/** يطابق نص مع كلمة الفلتر مع تجاهل «ال» التعريف. */
function matchesLabel(text: string, label: string) {
  const strip = (s: string) => s.replace(/^ال/, '').trim();
  return text.includes(label) || strip(text).includes(strip(label));
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cat?: string; q?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('near');
  const [showFilters, setShowFilters] = useState(false);

  // استقبال التصنيف أو كلمة البحث من الشاشات التانية (زي أقسام الرئيسية).
  // بنظبط الحالة وقت الـ render بشكل محكوم بدل effect عشان نتجنب الرندر الزيادة.
  const catParam = params.cat;
  const qParam = params.q;
  const paramsKey = `${catParam ?? ''}|${qParam ?? ''}`;
  const [appliedParams, setAppliedParams] = useState<string | null>(null);
  if ((catParam || qParam) && paramsKey !== appliedParams) {
    setAppliedParams(paramsKey);
    if (catParam) setCategory(catParam);
    if (qParam) setQuery(qParam);
  }

  const {
    setRef: chipRailRef,
    onLayout: chipRailLayout,
    onContentSizeChange: chipRailSize,
    onScrollBeginDrag: chipRailDrag,
  } = useRtlRail();
  const {
    setRef: prodRailRef,
    onLayout: prodRailLayout,
    onContentSizeChange: prodRailSize,
    onScrollBeginDrag: prodRailDrag,
  } = useRtlRail();

  const normalized = query.trim();
  const activeCat = categories.find((c) => c.id === category) ?? null;
  const filtering = Boolean(normalized || activeCat);

  const trending = useMemo(
    () =>
      trendingIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [],
  );

  const productResults = useMemo(() => {
    if (!filtering) return [];
    const cat = activeCat?.label;
    const byQuery = products.filter(
      (p) =>
        !normalized ||
        p.name.includes(normalized) ||
        p.description.includes(normalized) ||
        p.category.includes(normalized),
    );
    if (!cat) return byQuery;

    // الأول: الأصناف اللي تصنيفها نفسه مطابق (مشويات، حلويات…)
    const byCategory = byQuery.filter((p) => matchesLabel(p.category, cat));
    if (byCategory.length) return byCategory;

    // لو التصنيف مش موجود كتصنيف أصناف (زي «نوبي» أو «كشري»)
    // نرجّع أصناف المطاعم اللي مطبخها مطابق.
    return byQuery.filter((p) => {
      const resto = restaurants.find((r) => r.id === p.restaurantId);
      return resto ? matchesLabel(resto.cuisine, cat) : false;
    });
  }, [filtering, normalized, activeCat]);

  const restaurantResults = useMemo(() => {
    const cat = activeCat?.label;
    let list = restaurants.filter((r) => {
      if (
        normalized &&
        !r.name.includes(normalized) &&
        !r.cuisine.includes(normalized) &&
        !r.tags.includes(normalized)
      ) {
        return false;
      }
      if (!cat) return true;
      return matchesLabel(r.cuisine, cat) || matchesLabel(r.tags, cat);
    });
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'fast') list = [...list].sort((a, b) => prepMinutes(a.prep) - prepMinutes(b.prep));
    return list;
  }, [normalized, activeCat, sort]);

  const showEmpty =
    filtering && productResults.length === 0 && restaurantResults.length === 0;

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
    setSort('near');
    setShowFilters(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <AppText family="display" weight="800" size={22}>
            بحث
          </AppText>
          <AppText family="body" size={11.5} color={colors.muted}>
            أسوان · كورنيش النيل
          </AppText>
        </View>

        <View style={styles.searchbar}>
          <Icon name="search" size={19} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="دوّر على مطعم أو أكلة"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlign="right"
            returnKeyType="search"
            accessibilityLabel="بحث"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="مسح البحث">
              <Icon name="plus" size={16} color={colors.muted} style={{ transform: [{ rotate: '45deg' }] }} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowFilters((v) => !v)}
              style={styles.filter}
              accessibilityRole="button"
              accessibilityLabel="الفلاتر"
              accessibilityState={{ expanded: showFilters }}
            >
              <Icon name="filter" size={13} color={colors.olive} />
              <AppText family="body" weight="600" size={11} color={colors.olive}>
                فلاتر
              </AppText>
            </Pressable>
          )}
        </View>

        {showFilters ? (
          <View style={styles.filterPanel} testID="filter-panel">
            <AppText family="body" weight="600" size={11} color={colors.muted}>
              الترتيب
            </AppText>
            {SORTS.map((option) => {
              const active = sort === option.id;
              return (
                <Pressable
                  key={option.id}
                  testID={`sort-${option.id}`}
                  onPress={() => setSort(option.id)}
                  style={[styles.sortChip, active && styles.sortChipOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`ترتيب: ${option.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <AppText
                    family="body"
                    weight="600"
                    size={11.5}
                    color={active ? colors.white : colors.muted}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <ScrollView
          testID="chip-rail"
          ref={chipRailRef}
          onLayout={chipRailLayout}
          onContentSizeChange={chipRailSize}
          onScrollBeginDrag={chipRailDrag}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRail}
        >
          {filtering || sort !== 'near' ? (
            <Pressable
              onPress={clearFilters}
              style={styles.clearChip}
              accessibilityRole="button"
              accessibilityLabel="مسح الفلاتر"
            >
              <Icon
                name="plus"
                size={12}
                color={colors.clay}
                style={{ transform: [{ rotate: '45deg' }] }}
              />
              <AppText family="body" weight="600" size={11.5} color={colors.clay}>
                مسح
              </AppText>
            </Pressable>
          ) : null}
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                testID={`chip-${cat.id}`}
                onPress={() => setCategory(active ? null : cat.id)}
                style={[styles.chip, active && styles.chipOn]}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
                accessibilityState={{ selected: active }}
              >
                <AppText
                  family="body"
                  weight="600"
                  size={12}
                  color={active ? colors.white : colors.muted}
                >
                  {cat.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {showEmpty ? (
          <View style={styles.empty}>
            <Icon name="search" size={38} color={colors.sand2} />
            <AppText family="display" weight="700" size={15} align="center" style={{ marginTop: 12 }}>
              مفيش نتايج{normalized ? ` لـ «${normalized}»` : ''}
            </AppText>
            <AppText family="body" size={12} color={colors.muted} align="center" style={{ marginTop: 4 }}>
              جرّب كلمة تانية زي «كشري» أو «مشويات»، أو امسح الفلاتر.
            </AppText>
          </View>
        ) : null}

        {!filtering ? (
          <>
            <SectionHeader title="الأكثر طلبًا" />
            <ScrollView
              testID="search-prod-rail"
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
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        ) : productResults.length ? (
          <>
            <SectionHeader title="أكلات" />
            {productResults.map((product) => {
              const resto = restaurants.find((r) => r.id === product.restaurantId);
              return (
                <Pressable
                  key={product.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: product.id } })}
                  style={({ pressed }) => [styles.result, pressed && { opacity: 0.85 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${product.name} من ${resto?.name ?? ''}`}
                >
                  <View style={styles.resultThumb}>
                    <Image source={food[product.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText family="body" weight="700" size={13} lineHeight={20} numberOfLines={1}>
                      {product.name}
                    </AppText>
                    <AppText family="body" size={11} color={colors.muted} lineHeight={17} numberOfLines={1}>
                      {resto?.name ?? ''} · {product.category}
                    </AppText>
                  </View>
                  <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                    {product.price} ج.م
                  </AppText>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {!filtering || restaurantResults.length ? (
          <>
            <SectionHeader title={filtering ? 'مطاعم' : 'مطاعم قريبة'} />
            {restaurantResults.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })}
                style={({ pressed }) => [styles.restoRow, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`${restaurant.name}، ${restaurant.cuisine}`}
              >
                <View style={styles.restoThumb}>
                  <Image source={food[restaurant.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText family="display" weight="700" size={14} lineHeight={21}>
                    {restaurant.name}
                  </AppText>
                  <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
                    {restaurant.cuisine} · تجهيز {restaurant.prep}
                  </AppText>
                  <View style={styles.meta}>
                    <Icon name="star" size={11} color={colors.saffron} filled />
                    <AppText family="body" weight="600" size={10.5} color={colors.muted}>
                      {restaurant.rating.toFixed(1)}
                    </AppText>
                    <AppText family="body" size={10.5} color={colors.muted}>
                      ({restaurant.reviews})
                    </AppText>
                  </View>
                </View>
                <Icon name="chevronLeft" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </>
        ) : null}

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
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    paddingVertical: 0,
  },
  filter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  filterPanel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  sortChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  chipRail: { flexDirection: 'row-reverse', gap: 8, paddingTop: 14, paddingBottom: 2 },
  chip: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  clearChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.35)',
    backgroundColor: 'rgba(180,86,47,0.08)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  prodRail: { flexDirection: 'row-reverse', gap: 12, paddingBottom: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  result: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  resultThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  restoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  restoThumb: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  meta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 3 },
});
