import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { Lotus } from '../components/motifs';
import { BackButton, PrimaryButton } from '../components/ui';
import { AddressSheet } from '../components/AddressSheet';
import { OrderSummary } from '../components/OrderSummary';
import { Screen } from '../components/Screen';
import { itemsLabel } from '../utils/arabic';
import { colors, fonts } from '../theme';
import { useCart } from '../state/CartContext';
import { useAddress } from '../state/addresses';
import { addOrder } from '../state/orders';
import { selectPayment, usePayment, usePayments } from '../state/payment';
import { useSettings } from '../api/settings';

const SLOTS = ['7:30 م', '8:00 م', '8:30 م', '9:00 م'];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { total, count, subtotal, lines, restaurantId, restaurantName, clearAll, clearPromo } =
    useCart();
  const address = useAddress();
  const payment = usePayment();
  const paymentMethods = usePayments();
  const settings = useSettings();
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [note, setNote] = useState('');
  const [addressOpen, setAddressOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  // إعدادات اللوحة بتتحكم في المتجر والدفع والحد الأدنى
  const closed = !settings.storeOpen || !settings.acceptingOrders;
  const belowMin = subtotal < settings.minOrder;
  const allowedPayments = paymentMethods.filter((method) =>
    method.kind === 'cash' ? settings.payCash : settings.payWallet,
  );

  const confirmOrder = () => {
    if (count === 0) return;
    const first = lines[0];
    setPlacing(true);
    addOrder({
      id: `o-${Date.now()}`,
      restaurantId: restaurantId ?? first.restaurantId,
      restaurantName: restaurantName ?? first.restaurantName,
      itemsCount: count,
      total,
      status: 'live',
      when: when === 'now' ? 'في أقرب وقت' : `متوقع ${slot}`,
      eta: when === 'now' ? '20–30 د' : slot,
      image: first.image,
    });
    clearAll();
    clearPromo();
    router.replace('/tracking');
  };

  if (count === 0 && !placing) {
    return (
      <Screen>
        <View style={styles.head}>
          <View style={styles.headStart}>
            <BackButton />
            <AppText family="display" weight="800" size={20}>
              إتمام الطلب
            </AppText>
          </View>
        </View>
        <View style={styles.empty}>
          <Icon name="cart" size={40} color={colors.sand2} />
          <AppText family="display" weight="700" size={16} align="center" style={{ marginTop: 12 }}>
            السلة فاضية
          </AppText>
          <AppText family="body" size={12} color={colors.muted} align="center" style={{ marginTop: 4 }}>
            اختار أكلة من مطاعم أسوان الأول وبعدين كمّل الطلب.
          </AppText>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="اتفضل المطاعم"
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
          >
            <AppText family="body" weight="700" size={12.5} color={colors.white}>
              اتفرج على المطاعم
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.headStart}>
            <BackButton />
            <AppText family="display" weight="800" size={20}>
              إتمام الطلب
            </AppText>
          </View>
        </View>

        {closed ? (
          <View style={styles.notice}>
            <Icon name="clock" size={15} color={colors.clay} />
            <AppText family="body" weight="600" size={11.5} color={colors.clay} lineHeight={18} style={{ flex: 1 }}>
              المتجر مقفول حاليًا — تقدر تتصفّح، والطلب هيتاح لما يفتح.
            </AppText>
          </View>
        ) : belowMin ? (
          <View style={styles.notice}>
            <Icon name="tag" size={15} color={colors.clay} />
            <AppText family="body" weight="600" size={11.5} color={colors.clay} lineHeight={18} style={{ flex: 1 }}>
              الحد الأدنى للطلب {settings.minOrder} ج.م — ناقصك {settings.minOrder - subtotal} ج.م.
            </AppText>
          </View>
        ) : null}

        <SectionLabel title="عنوان التوصيل" first />
        <View style={styles.cardBlock}>
          <View style={styles.cardIcon}>
            <Icon name="pin" size={18} color={colors.olive} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={13} lineHeight={20}>
              {address.label}
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
              {address.detail}
            </AppText>
            {address.note ? (
              <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                {address.note}
              </AppText>
            ) : null}
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => setAddressOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="تغيير عنوان التوصيل"
          >
            <AppText family="body" weight="700" size={11.5} color={colors.olive}>
              تغيير
            </AppText>
          </Pressable>
        </View>

        <SectionLabel title={`وقت التوصيل · ~${settings.etaMinutes} دقيقة`} />
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setWhen('now')}
            style={[styles.chip, when === 'now' && styles.chipOn]}
            accessibilityRole="button"
            accessibilityLabel="التوصيل في أقرب وقت"
            accessibilityState={{ selected: when === 'now' }}
          >
            <Icon name="clock" size={13} color={when === 'now' ? colors.olive : colors.muted} />
            <AppText
              family="body"
              weight="600"
              size={11.5}
              color={when === 'now' ? colors.olive : colors.muted}
            >
              في أقرب وقت
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setWhen('later')}
            style={[styles.chip, when === 'later' && styles.chipOn]}
            accessibilityRole="button"
            accessibilityLabel="تحديد وقت للتوصيل"
            accessibilityState={{ selected: when === 'later' }}
          >
            <Icon name="clock" size={13} color={when === 'later' ? colors.olive : colors.muted} />
            <AppText
              family="body"
              weight="600"
              size={11.5}
              color={when === 'later' ? colors.olive : colors.muted}
            >
              حدد وقت
            </AppText>
          </Pressable>
        </View>
        {when === 'later' ? (
          <View style={styles.timeRow}>
            {SLOTS.map((item) => {
              const active = slot === item;
              return (
                <Pressable
                  key={item}
                  testID={`slot-${item}`}
                  onPress={() => setSlot(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`التوصيل الساعة ${item}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.timeChip, active && styles.timeChipOn]}
                >
                  <AppText
                    family="body"
                    weight="600"
                    size={11}
                    color={active ? colors.white : colors.olive}
                  >
                    {item}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <SectionLabel title="طريقة الدفع" />
        {allowedPayments.map((method) => {
          const active = payment.id === method.id;
          return (
            <Pressable
              key={method.id}
              testID={`payment-${method.id}`}
              onPress={() => selectPayment(method.id)}
              style={[styles.payOpt, active && styles.payOptOn]}
              accessibilityRole="button"
              accessibilityLabel={method.label}
              accessibilityState={{ selected: active }}
            >
              <View style={styles.payIcon}>
                <Icon
                  name={method.kind === 'cash' ? 'cash' : 'wallet'}
                  size={17}
                  color={colors.olive}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText family="body" weight="600" size={12.5} lineHeight={19}>
                  {method.label}
                </AppText>
                <AppText family="body" size={10.5} color={colors.muted} lineHeight={16} style={{ marginTop: 1 }}>
                  {method.detail}
                </AppText>
              </View>
              {active ? <Icon name="check" size={18} color={colors.olive} /> : null}
            </Pressable>
          );
        })}

        <SectionLabel title="ملاحظات للمندوب" />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="مثال: اتصل عند الوصول"
          placeholderTextColor={colors.muted}
          style={styles.noteField}
          textAlign="right"
          accessibilityLabel="ملاحظات للمندوب"
        />

        <OrderSummary />
        <AppText family="body" size={10.5} color={colors.muted} align="center" style={{ marginTop: 9 }}>
          {count} {itemsLabel(count)} · الأسعار شاملة الضريبة
        </AppText>
        <View style={{ height: 10 }} />
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          label="أكد الطلب"
          price={`${total} ج.م`}
          onPress={confirmOrder}
          disabled={placing || closed || belowMin}
        />
      </View>

      <AddressSheet visible={addressOpen} onClose={() => setAddressOpen(false)} />
    </Screen>
  );
}

function SectionLabel({ title, first = false }: { title: string; first?: boolean }) {
  return (
    <View style={[styles.secLabel, first && { marginTop: 0 }]}>
      <Lotus size={13} />
      <AppText family="display" weight="700" size={13.5}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 12 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headStart: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  secLabel: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 9,
  },
  notice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.3)',
    backgroundColor: 'rgba(180,86,47,0.08)',
    marginTop: 6,
  },
  cardBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipRow: { flexDirection: 'row-reverse', gap: 8 },
  chip: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  timeRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  timeChip: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  payOpt: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 9,
  },
  payOptOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  payIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noteField: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
  },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  emptyBtn: {
    marginTop: 18,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
