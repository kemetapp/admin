import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { Cartouche } from '../components/motifs';
import { BackButton, Hairline, PrimaryButton, Stepper } from '../components/ui';
import { OrderSummary } from '../components/OrderSummary';
import { Screen } from '../components/Screen';
import { food } from '../theme/images';
import { colors, fonts } from '../theme';
import { useCart } from '../state/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    lines,
    total,
    promo,
    increment,
    decrement,
    clearAll,
    applyPromo,
    clearPromo,
  } = useCart();

  const [promoOpen, setPromoOpen] = useState(false);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const restaurantName = lines[0]?.restaurantName;

  const submitCode = () => {
    if (!code.trim()) return;
    const result = applyPromo(code);
    setFeedback(result);
    if (result.ok) {
      setPromoOpen(false);
      setCode('');
    }
  };

  if (lines.length === 0) {
    return (
      <Screen>
        <View style={styles.head}>
          <View style={styles.headStart}>
            <BackButton />
            <AppText family="display" weight="800" size={20}>
              السلة
            </AppText>
          </View>
        </View>
        <View style={styles.empty}>
          <Cartouche size={62} letter="ك" />
          <AppText family="display" weight="800" size={20} align="center" style={{ marginTop: 18 }}>
            سلتك فاضية
          </AppText>
          <AppText
            family="body"
            size={12.5}
            color={colors.muted}
            align="center"
            lineHeight={21}
            style={{ marginTop: 8, maxWidth: 260 }}
          >
            اختار أكلتك المفضلة من مطاعم أسوان وإحنا نوصلها لحد باب البيت.
          </AppText>
          <PrimaryButton
            label="اتفضل المطاعم"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 22, maxWidth: 240 }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        testID="cart-scroll"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View style={styles.headStart}>
            <BackButton />
            <AppText family="display" weight="800" size={20}>
              السلة
            </AppText>
          </View>
          <Pressable
            onPress={clearAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="امسح الكل"
          >
            <AppText family="body" weight="600" size={12} color={colors.clay}>
              امسح الكل
            </AppText>
          </Pressable>
        </View>

        <View style={styles.restoStrip}>
          <View style={styles.restoThumb}>
            <Image
              source={food[lines[0].image]}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={13} lineHeight={20}>
              {restaurantName}
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
              التوصيل 30–40 دقيقة
            </AppText>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/restaurant/[id]',
                params: { id: lines[0].restaurantId },
              })
            }
            hitSlop={8}
          >
            <AppText family="body" weight="700" size={11.5} color={colors.olive}>
              تعديل
            </AppText>
          </Pressable>
        </View>

        {lines.map((line) => (
          <View key={line.key} style={styles.citem}>
            <View style={styles.thumb}>
              <Image
                source={food[line.image]}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
            <View style={styles.cb}>
              <AppText family="body" weight="700" size={13} lineHeight={20} numberOfLines={1}>
                {line.name}
              </AppText>
              {line.options.length ? (
                <AppText
                  family="body"
                  size={11}
                  color={colors.muted}
                  lineHeight={17}
                  numberOfLines={2}
                  style={{ marginTop: 3 }}
                >
                  {line.options.join(' · ')}
                </AppText>
              ) : null}
            </View>
            <View style={styles.citemEnd}>
              <AppText family="body" weight="800" size={13} lineHeight={19}>
                {line.unitPrice * line.qty} ج.م
              </AppText>
              <Stepper
                small
                value={line.qty}
                onMinus={() => decrement(line.key)}
                onPlus={() => increment(line.key)}
              />
            </View>
          </View>
        ))}

        {promoOpen ? (
          <View style={styles.promoBox}>
            <View style={styles.promoInputRow}>
              <Icon name="tag" size={16} color={colors.goldDeep} />
              <TextInput
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  setFeedback(null);
                }}
                placeholder="اكتب كود الخصم"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                style={styles.promoInput}
                textAlign="right"
                onSubmitEditing={submitCode}
                returnKeyType="done"
                accessibilityLabel="كود الخصم"
              />
              <Pressable
                onPress={submitCode}
                style={styles.applyBtn}
                accessibilityRole="button"
                accessibilityLabel="تطبيق الكود"
              >
                <AppText family="body" weight="700" size={11.5} color={colors.white}>
                  تطبيق
                </AppText>
              </Pressable>
            </View>
            {feedback ? (
              <AppText
                family="body"
                size={11}
                color={feedback.ok ? colors.success : colors.danger}
                style={{ marginTop: 8 }}
              >
                {feedback.message}
              </AppText>
            ) : (
              <AppText family="body" size={10.5} color={colors.muted} style={{ marginTop: 8 }}>
                جرّب KEMET25 أو ASWAN0
              </AppText>
            )}
          </View>
        ) : promo ? (
          <View style={styles.promoApplied}>
            <Icon name="tag" size={16} color={colors.success} />
            <AppText family="body" weight="600" size={12} color={colors.success} style={{ flex: 1 }}>
              كود {promo} مطبّق
            </AppText>
            <Pressable
              onPress={() => {
                clearPromo();
                setFeedback(null);
              }}
              hitSlop={8}
            >
              <AppText family="body" weight="700" size={11.5} color={colors.clay}>
                إزالة
              </AppText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setPromoOpen(true)}
            style={styles.promoRow}
            accessibilityRole="button"
            accessibilityLabel="عندك كود خصم؟ تطبيق"
          >
            <Icon name="tag" size={16} color={colors.goldDeep} />
            <AppText family="body" weight="600" size={12} color="#7A5B12" style={{ flex: 1 }}>
              عندك كود خصم؟
            </AppText>
            <AppText family="body" weight="700" size={11.5} color={colors.olive}>
              تطبيق
            </AppText>
          </Pressable>
        )}

        <OrderSummary />
        <AppText family="body" size={10.5} color={colors.muted} align="center" style={{ marginTop: 9 }}>
          الأسعار شاملة الضريبة · الدفع عند الاستلام
        </AppText>
        <Hairline style={{ marginTop: 20 }} />
        <View style={{ height: 10 }} />
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          label="روح للدفع"
          price={`${total} ج.م`}
          onPress={() => router.push('/checkout')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 12 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headStart: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 60 },
  restoStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: 'rgba(184,134,47,0.22)',
    marginBottom: 6,
  },
  restoThumb: {
    width: 46,
    height: 46,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  citem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  cb: { flex: 1, minWidth: 0 },
  citemEnd: { alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  promoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sand2,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 13,
  },
  promoBox: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
    padding: 12,
  },
  promoInputRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  promoInput: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
  },
  applyBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplied: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(63,107,53,0.32)',
    backgroundColor: 'rgba(63,107,53,0.08)',
    paddingHorizontal: 13,
  },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
});
