import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PapyrusBackground } from './motifs';
import { colors } from '../theme';

export function Screen({
  children,
  style,
  padTop = true,
  background = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padTop?: boolean;
  background?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.cream, paddingTop: padTop ? insets.top : 0 },
        style,
      ]}
    >
      {background ? <PapyrusBackground /> : null}
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  body: { flex: 1 },
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  between: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
});
