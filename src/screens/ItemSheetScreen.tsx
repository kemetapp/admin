import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { TempleImage, SheetHandle } from '../components/motifs';
import { PrimaryButton, Stepper } from '../components/ui';
import { ConfirmDialog } from '../components/Sheet';
import { getProduct, getRestaurant, type Option } from '../data/mock';
import { food } from '../theme/images';
import { colors, fonts, shadowStrong } from '../theme';
import { useCart } from '../state/CartContext';

export default function ItemSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const product = getProduct(id ?? 'nuba-kofta');
  const restaurant = getRestaurant(product.restaurantId);
  const { addLine, replaceCart, restaurantId, restaurantName } = useCart();

  const [size, setSize] = useState<Option | undefined>(product.sizes?.[0]);
  const [extras, setExtras] = useState<string[]>(
    product.extras?.filter((e) => e.id === 'cheese').map((e) => e.id) ?? [],
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [conflictOpen, setConflictOpen] = useState(false);

  const extrasTotal = useMemo(
    () =>
      (product.extras ?? [])
        .filter((e) => extras.includes(e.id))
        .reduce((sum, e) => sum + e.price, 0),
    [extras, product.extras],
  );

  const unitPrice = product.price + (size?.price ?? 0) + extrasTotal;
  const total = unitPrice * qty;

  const toggleExtra = (extraId: string) => {
    setExtras((prev) =>
      prev.includes(extraId) ? prev.filter((x) => x !== extraId) : [...prev, extraId],
    );
  };

  const buildLine = () => ({
    productId: product.id,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    name: product.name,
    image: product.image,
    unitPrice,
    qty,
    options: [
      ...(size ? [size.label] : []),
      ...(product.extras ?? []).filter((e) => extras.includes(e.id)).map((e) => e.label),
      ...(note.trim() ? [note.trim()] : []),
    ],
  });

  const addToCart = () => {
    // الطلب بيتقفل على مطعم واحد: لو السلة فيها مطعم تاني نسأل الأول.
    if (restaurantId && restaurantId !== restaurant.id) {
      setConflictOpen(true);
      return;
    }
    addLine(buildLine());
    router.back();
  };

  const confirmReplace = () => {
    setConflictOpen(false);
    replaceCart(buildLine());
    router.back();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="إغلاق"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sheetScrim }]} />
      </Pressable>

      <View testID="item-sheet" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle />
        <ScrollView
          style={{ flexShrink: 1 }}
          contentContainerStyle={{ paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.head}>
            <TempleImage
              source={food[product.image]}
              width={66}
              height={66}
              radiusTop={33}
              radiusBottom={14}
            />
            <View style={{ flex: 1 }}>
              <AppText family="display" weight="700" size={19} lineHeight={28}>
                {product.name}
              </AppText>
              <AppText family="body" size={11} color={colors.muted} lineHeight={17}>
                {product.serving ?? 'طبق فردي'}
              </AppText>
            </View>
            <AppText family="body" weight="700" size={16} color={colors.ink}>
              {product.price} ج.م
            </AppText>
          </View>

          <AppText family="body" size={12} lineHeight={20} color={colors.muted} style={{ marginTop: 12 }}>
            {product.description}
          </AppText>

          {product.sizes?.length ? (
            <View style={styles.group}>
              <View style={styles.groupHead}>
                <AppText family="display" weight="700" size={13.5}>
                  الحجم
                </AppText>
              </View>
              {product.sizes.map((option) => {
                const active = size?.id === option.id;
                return (
                  <Pressable key={option.id} style={styles.choice} onPress={() => setSize(option)}>
                    <View style={[styles.radio, active && styles.radioOn]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <AppText family="body" weight="500" size={12.5} style={{ flex: 1 }}>
                      {option.label}
                    </AppText>
                    <AppText family="body" weight="500" size={11.5} color={colors.muted}>
                      {option.price === 0 ? '+0' : `+${option.price} ج.م`}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {product.extras?.length ? (
            <View style={styles.group}>
              <View style={styles.groupHead}>
                <AppText family="display" weight="700" size={13.5}>
                  إضافات
                </AppText>
                <AppText family="body" size={10.5} color={colors.muted}>
                  اختياري
                </AppText>
              </View>
              {product.extras.map((option) => {
                const active = extras.includes(option.id);
                return (
                  <Pressable key={option.id} style={styles.choice} onPress={() => toggleExtra(option.id)}>
                    <View style={[styles.checkbox, active && styles.checkboxOn]}>
                      {active ? <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} /> : null}
                    </View>
                    <AppText family="body" weight="500" size={12.5} style={{ flex: 1 }}>
                      {option.label}
                    </AppText>
                    <AppText family="body" weight="500" size={11.5} color={colors.muted}>
                      +{option.price} ج.م
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="ملاحظات للمطعم…"
            placeholderTextColor={colors.muted}
            style={styles.note}
            textAlign="right"
            multiline
            accessibilityLabel="ملاحظات للمطعم"
          />
        </ScrollView>

        <View style={styles.foot}>
          <Stepper value={qty} onMinus={() => setQty((q) => Math.max(1, q - 1))} onPlus={() => setQty((q) => q + 1)} />
          <PrimaryButton
            label={`أضف للسلة · ${total} ج.م`}
            onPress={addToCart}
            style={{ flex: 1, height: 50, borderRadius: 16 }}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={conflictOpen}
        title="سلتك فيها مطعم تاني"
        message={`السلة فيها أوردر من ${restaurantName ?? 'مطعم تاني'}. لو ضفت ${product.name} هنمسح السلة القديمة ونبدأ من ${restaurant.name}.`}
        confirmLabel="امسح وضيف"
        onConfirm={confirmReplace}
        onCancel={() => setConflictOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderBottomWidth: 0,
    ...shadowStrong,
  },
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  group: { marginTop: 16 },
  groupHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  choice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.stone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.olive },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.stone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  note: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  foot: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginTop: 12 },
});
