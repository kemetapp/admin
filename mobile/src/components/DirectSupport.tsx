import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { colors, shadowStrong } from '../theme';
import { useSettings } from '../api/settings';
import { mailHref, telHref, whatsappHref } from '../utils/contact';

/**
 * تواصل مباشر مع الإدارة: واتساب · اتصال · إيميل · شات مباشر.
 * الشات بيفتح شاشة محادثة حقيقية (Firestore).
 */
export function DirectSupport() {
  const router = useRouter();
  const settings = useSettings();

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Icon name="message" size={15} color={colors.olive} />
        <AppText family="display" weight="800" size={13}>
          تواصل مع الدعم
        </AppText>
      </View>

      <Pressable
        onPress={() => router.push('/chat')}
        accessibilityRole="button"
        accessibilityLabel="افتح محادثة مباشرة مع الدعم"
        style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.chatIcon}>
          <Icon name="message" size={17} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText family="body" weight="700" size={12.5} color={colors.white}>
            محادثة مباشرة
          </AppText>
        </View>
        <Icon name="chevronLeft" size={15} color={colors.white} />
      </Pressable>

      <View style={styles.row}>
        <Pressable
          onPress={() => void Linking.openURL(whatsappHref(settings.whatsapp))}
          accessibilityRole="button"
          accessibilityLabel="واتساب الإدارة"
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
        >
          <AppText family="body" weight="700" size={11} color={colors.olive}>
            واتساب
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(telHref(settings.supportPhone))}
          accessibilityRole="button"
          accessibilityLabel="اتصال بالإدارة"
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
        >
          <AppText family="body" weight="700" size={11} color={colors.olive}>
            اتصال
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(mailHref(settings.email))}
          accessibilityRole="button"
          accessibilityLabel="مراسلة الإدارة بالإيميل"
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
        >
          <AppText family="body" weight="700" size={11} color={colors.olive}>
            إيميل
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
    marginBottom: 12,
  },
  head: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 10 },
  chatBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    backgroundColor: colors.olive,
    ...shadowStrong,
  },
  chatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  row: { flexDirection: 'row-reverse', gap: 6, marginTop: 8 },
  chip: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
