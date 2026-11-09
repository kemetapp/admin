import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { addresses } from '../data/mock';
import { colors } from '../theme';
import { selectAddress, useAddress } from '../state/addresses';

/** شيت اختيار عنوان التوصيل — مستخدم في الرئيسية وإتمام الطلب. */
export function AddressSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const address = useAddress();

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="بتوصل فين؟"
      subtitle="اختار عنوان التوصيل — كل العناوين في أسوان"
    >
      {addresses.map((item) => {
        const active = item.id === address.id;
        return (
          <Pressable
            key={item.id}
            testID={`address-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}، ${item.detail}`}
            accessibilityState={{ selected: active }}
            onPress={() => {
              selectAddress(item.id);
              onClose();
            }}
            style={[styles.row, active && styles.rowOn]}
          >
            <View style={[styles.icon, active && styles.iconOn]}>
              <Icon name="pin" size={16} color={active ? colors.white : colors.olive} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText family="body" weight="700" size={13} lineHeight={20}>
                {item.label}
              </AppText>
              <AppText family="body" size={11} color={colors.muted} lineHeight={17}>
                {item.detail}
              </AppText>
              {item.note ? (
                <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                  {item.note}
                </AppText>
              ) : null}
            </View>
            {active ? <Icon name="check" size={18} color={colors.olive} strokeWidth={2.4} /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 9,
  },
  rowOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: { backgroundColor: colors.olive },
});
