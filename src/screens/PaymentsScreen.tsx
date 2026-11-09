import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { AuthField } from '../components/AuthField';
import { Lotus } from '../components/motifs';
import { PageShell } from '../components/PageShell';
import { PrimaryButton, Hairline } from '../components/ui';
import { colors } from '../theme';
import {
  addWallet,
  removePayment,
  selectPayment,
  usePayment,
  usePayments,
} from '../state/payment';

export default function PaymentsScreen() {
  const methods = usePayments();
  const current = usePayment();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');

  const canSave = label.trim().length > 0 && detail.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addWallet(label.trim(), detail.trim());
    setLabel('');
    setDetail('');
    setAdding(false);
  };

  return (
    <PageShell title="طرق الدفع" subtitle="الطريقة المختارة هي اللي بتظهر في إتمام الطلب">
      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          المحافظ والكاش
        </AppText>
      </View>

      {methods.map((method) => {
        const active = method.id === current.id;
        const removable = method.kind === 'wallet';
        return (
          <Pressable
            key={method.id}
            accessibilityRole="button"
            accessibilityLabel={`${method.label}، ${method.detail}`}
            accessibilityState={{ selected: active }}
            onPress={() => selectPayment(method.id)}
            style={[styles.card, active && styles.cardOn]}
          >
            <View style={[styles.icon, active && styles.iconOn]}>
              <Icon
                name={method.kind === 'cash' ? 'cash' : 'wallet'}
                size={16}
                color={active ? colors.white : colors.olive}
              />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText family="body" weight="700" size={13} lineHeight={20}>
                {method.label}
              </AppText>
              <AppText family="body" size={11.5} color={colors.muted} lineHeight={18}>
                {method.detail}
              </AppText>
            </View>

            {active ? <Icon name="check" size={17} color={colors.olive} strokeWidth={2.4} /> : null}

            {removable ? (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`حذف ${method.label}`}
                onPress={() => removePayment(method.id)}
                style={({ pressed }) => [styles.remove, pressed && { opacity: 0.6 }]}
              >
                <Icon
                  name="plus"
                  size={13}
                  color={colors.clay}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}

      <AppText family="body" size={11} color={colors.muted} lineHeight={18} style={{ marginTop: 8 }}>
        الكاش بيفضل موجود دايمًا كخيار احتياطي. البطاقة البنكية مش متاحة حاليًا.
      </AppText>

      <Hairline style={{ marginVertical: 20 }} />

      {adding ? (
        <View>
          <View style={styles.secHead}>
            <Lotus size={13} />
            <AppText family="display" weight="700" size={13.5}>
              محفظة جديدة
            </AppText>
          </View>

          <AuthField
            label="اسم المحفظة"
            icon="wallet"
            value={label}
            onChangeText={setLabel}
            placeholder="فودافون كاش · إنستاباي · اتصالات كاش"
          />
          <AuthField
            label="رقم المحفظة"
            icon="phone"
            value={detail}
            onChangeText={setDetail}
            keyboardType="phone-pad"
            placeholder="01xxxxxxxxx"
          />

          <PrimaryButton label="احفظ المحفظة" onPress={save} disabled={!canSave} style={{ marginTop: 6 }} />

          <Pressable
            onPress={() => setAdding(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="إلغاء الإضافة"
            style={{ marginTop: 12 }}
          >
            <AppText family="body" weight="600" size={12} color={colors.muted} align="center">
              إلغاء
            </AppText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="إضافة محفظة جديدة"
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
        >
          <Icon name="plus" size={16} color={colors.olive} />
          <AppText family="body" weight="700" size={12.5} color={colors.olive}>
            ضيف محفظة جديدة
          </AppText>
        </Pressable>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  secHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 10 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 9,
  },
  cardOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconOn: { backgroundColor: colors.olive },
  remove: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.28)',
    backgroundColor: 'rgba(180,86,47,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sand2,
    backgroundColor: colors.goldSoft,
  },
});
