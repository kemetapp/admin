import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { BackButton } from './ui';
import { Screen } from './Screen';
import { colors } from '../theme';

/**
 * هيكل موحّد لصفحات الحساب الداخلية: رجوع + عنوان + محتوى بيتمرّر.
 * الشريط السفلي مش ظاهر في الصفحات دي لأنها بره مجموعة التابس.
 */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Screen>
      <View style={styles.head}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText family="display" weight="800" size={20} lineHeight={28}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              family="body"
              size={11.5}
              color={colors.muted}
              lineHeight={18}
              style={{ marginTop: 2 }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
});
