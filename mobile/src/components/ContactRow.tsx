import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors } from '../theme';

/** صف تواصل قابل لإعادة الاستخدام (اتصال · واتساب · إيميل). */
export function ContactRow({
  icon,
  title,
  note,
  onPress,
}: {
  icon: IconName;
  title: string;
  note: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={16} color={colors.olive} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText family="body" weight="700" size={12.5} lineHeight={19}>
          {title}
        </AppText>
        <AppText family="body" size={11} color={colors.muted} lineHeight={17} numberOfLines={1}>
          {note}
        </AppText>
      </View>
      <Icon name="chevronLeft" size={15} color={colors.muted} />
    </Pressable>
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
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
