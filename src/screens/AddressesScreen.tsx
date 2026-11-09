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
  addAddress,
  removeAddress,
  selectAddress,
  useAddress,
  useAddresses,
} from '../state/addresses';

export default function AddressesScreen() {
  const addresses = useAddresses();
  const current = useAddress();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [note, setNote] = useState('');

  const canSave = label.trim().length > 0 && detail.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addAddress({ label: label.trim(), detail: detail.trim(), note: note.trim() || undefined });
    setLabel('');
    setDetail('');
    setNote('');
    setAdding(false);
  };

  return (
    <PageShell title="العناوين" subtitle="عنوان التوصيل بيظهر في الرئيسية وفي إتمام الطلب">
      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          عناوينك
        </AppText>
      </View>

      {addresses.map((address) => {
        const active = address.id === current.id;
        const canRemove = addresses.length > 1;
        return (
          <Pressable
            key={address.id}
            accessibilityRole="button"
            accessibilityLabel={`${address.label}، ${address.detail}`}
            accessibilityState={{ selected: active }}
            onPress={() => selectAddress(address.id)}
            style={[styles.card, active && styles.cardOn]}
          >
            <View style={[styles.icon, active && styles.iconOn]}>
              <Icon name="pin" size={16} color={active ? colors.white : colors.olive} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText family="body" weight="700" size={13} lineHeight={20}>
                {address.label}
              </AppText>
              <AppText family="body" size={11.5} color={colors.muted} lineHeight={18}>
                {address.detail}
              </AppText>
              {address.note ? (
                <AppText family="body" size={11} color={colors.muted} lineHeight={17}>
                  {address.note}
                </AppText>
              ) : null}
            </View>

            {active ? (
              <View style={styles.activeChip}>
                <Icon name="check" size={11} color={colors.olive} strokeWidth={2.6} />
                <AppText family="body" weight="700" size={10.5} color={colors.olive}>
                  الحالي
                </AppText>
              </View>
            ) : null}

            {canRemove ? (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`حذف ${address.label}`}
                onPress={() => removeAddress(address.id)}
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
        {addresses.length > 1
          ? 'دوس على أي عنوان عشان تخليه عنوان التوصيل الافتراضي.'
          : 'لازم يفضل عنوان واحد على الأقل عشان نقدر نوصلك.'}
      </AppText>

      <Hairline style={{ marginVertical: 20 }} />

      {adding ? (
        <View>
          <View style={styles.secHead}>
            <Lotus size={13} />
            <AppText family="display" weight="700" size={13.5}>
              عنوان جديد
            </AppText>
          </View>

          <AuthField label="اسم العنوان" icon="home" value={label} onChangeText={setLabel} placeholder="مثال: البيت، الشغل" />
          <AuthField label="العنوان بالتفصيل" icon="pin" value={detail} onChangeText={setDetail} placeholder="الشارع، رقم العمارة، الدور" />
          <AuthField label="ملاحظات للمندوب (اختياري)" icon="message" value={note} onChangeText={setNote} placeholder="جرس، علامة مميزة…" />

          <PrimaryButton label="احفظ العنوان" onPress={save} disabled={!canSave} style={{ marginTop: 6 }} />

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
          accessibilityLabel="إضافة عنوان جديد"
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
        >
          <Icon name="plus" size={16} color={colors.olive} />
          <AppText family="body" weight="700" size={12.5} color={colors.olive}>
            ضيف عنوان جديد
          </AppText>
        </Pressable>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  secHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
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
  activeChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.goldLine,
    flexShrink: 0,
  },
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
