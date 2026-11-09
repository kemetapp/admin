import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { colors, fonts } from '../theme';

export function AuthField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = 'default',
}: {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <AppText family="body" weight="600" size={11.5} color={colors.muted} style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.input, focused && styles.inputFocused]}>
        <Icon name={icon} size={18} color={colors.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.text}
          textAlign="right"
          selectionColor={colors.olive}
          autoCapitalize="none"
          accessibilityLabel={label}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
          >
            <Icon name="eye" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  input: {
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: colors.olive, backgroundColor: colors.white },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
    paddingVertical: 0,
  },
});
