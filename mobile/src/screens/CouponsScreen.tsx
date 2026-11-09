import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { GoldFrame, Lotus } from '../components/motifs';
import { PageShell } from '../components/PageShell';
import { coupons } from '../data/mock';
import { colors } from '../theme';
import { useCart } from '../state/CartContext';

export default function CouponsScreen() {
  const { promo, applyPromo, clearPromo } = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const apply = (code: string) => {
    const result = applyPromo(code);
    setOk(result.ok);
    setMessage(result.ok ? `${code} — ${result.message}` : result.message);
  };

  return (
    <PageShell title="أكواد الخصم" subtitle="دوس على الكود يتطبق على سلتك على طول">
      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          متاح دلوقتي
        </AppText>
      </View>

      {coupons.map((coupon) => {
        const active = promo === coupon.code;
        return (
          <Pressable
            key={coupon.code}
            accessibilityRole="button"
            accessibilityLabel={`${coupon.title}، كود ${coupon.code}`}
            accessibilityState={{ selected: active }}
            onPress={() => apply(coupon.code)}
            style={({ pressed }) => [styles.ticket, active && styles.ticketOn, pressed && { opacity: 0.88 }]}
          >
            <GoldFrame inset={6} radiusValue={14} opacity={0.22} />

            <View style={[styles.icon, active && styles.iconOn]}>
              <Icon name="tag" size={17} color={active ? colors.white : colors.goldDeep} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText family="display" weight="700" size={14} lineHeight={21}>
                {coupon.title}
              </AppText>
              <AppText family="body" size={11.5} color={colors.muted} lineHeight={18}>
                {coupon.hint}
              </AppText>
            </View>

            <View style={[styles.codePill, active && styles.codePillOn]}>
              <AppText
                family="body"
                weight="700"
                size={11}
                color={active ? colors.white : colors.olive}
              >
                {coupon.code}
              </AppText>
            </View>
          </Pressable>
        );
      })}

      {message ? (
        <AppText
          family="body"
          weight="600"
          size={12}
          color={ok ? colors.success : colors.danger}
          align="center"
          style={{ marginTop: 10 }}
        >
          {message}
        </AppText>
      ) : null}

      {promo ? (
        <Pressable
          onPress={() => {
            clearPromo();
            setMessage(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="إزالة الكود المطبق"
          style={({ pressed }) => [styles.clear, pressed && { opacity: 0.8 }]}
        >
          <Icon
            name="plus"
            size={13}
            color={colors.clay}
            style={{ transform: [{ rotate: '45deg' }] }}
          />
          <AppText family="body" weight="600" size={12} color={colors.clay}>
            إزالة كود {promo}
          </AppText>
        </Pressable>
      ) : null}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  secHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 10 },
  ticket: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
    marginBottom: 10,
    overflow: 'hidden',
  },
  ticketOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.goldLine,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  codePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.goldDeep,
    flexShrink: 0,
  },
  codePillOn: { backgroundColor: colors.olive, borderStyle: 'solid', borderColor: colors.olive },
  clear: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.3)',
    backgroundColor: 'rgba(180,86,47,0.07)',
    marginTop: 14,
  },
});
