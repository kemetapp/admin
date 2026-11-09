import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme';
import { useCart } from '../state/CartContext';

export function OrderSummary({ style }: { style?: StyleProp<ViewStyle> }) {
  const { subtotal, delivery, discount, total, promo, tax } = useCart();

  return (
    <View style={[styles.sum, style]}>
      <View style={styles.row}>
        <AppText family="body" size={12.5} color={colors.muted}>
          المجموع الفرعي
        </AppText>
        <AppText family="body" weight="700" size={12.5}>
          {subtotal} ج.م
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText family="body" size={12.5} color={colors.muted}>
          رسوم التوصيل
        </AppText>
        <AppText family="body" weight="700" size={12.5}>
          {delivery === 0 ? 'مجاني' : `${delivery} ج.م`}
        </AppText>
      </View>
      {tax > 0 ? (
        <View style={styles.row}>
          <AppText family="body" size={12.5} color={colors.muted}>
            الضريبة
          </AppText>
          <AppText family="body" weight="700" size={12.5}>
            {tax} ج.م
          </AppText>
        </View>
      ) : null}
      {discount > 0 ? (
        <View style={styles.row}>
          <AppText family="body" size={12.5} color={colors.muted}>
            خصم {promo}
          </AppText>
          <AppText family="body" weight="700" size={12.5} color={colors.success}>
            −{discount} ج.م
          </AppText>
        </View>
      ) : null}
      <View style={styles.totalRow}>
        <AppText family="display" weight="800" size={15}>
          الإجمالي
        </AppText>
        <AppText family="display" weight="800" size={16} color={colors.ink}>
          {total} ج.م
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sum: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    marginTop: 7,
    paddingTop: 12,
    paddingBottom: 2,
  },
});
