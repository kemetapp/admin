import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { Lotus } from './motifs';
import { colors, shadowStrong } from '../theme';
import { deviceLocationStore, locationAskedStore } from '../state/location';

/**
 * بيطلب إذن الموقع أول ما العميل يفتح التطبيق — مرة واحدة بس.
 * لو المستخدم رفض، التطبيق بيكمّل عادي بالعنوان اليدوي.
 */
export function LocationGate() {
  const asked = locationAskedStore.use();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      deviceLocationStore.set({
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      });
    } catch {
      /* مفيش GPS متاح — مش مشكلة */
    }
  }, []);

  useEffect(() => {
    if (asked) return;
    // لو الإذن ممنوح من قبل، بناخد الموقع بهدوء من غير ما نزعّج المستخدم.
    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.granted) {
        await capture();
        locationAskedStore.set(true);
        return;
      }
      setOpen(true);
    })();
  }, [asked, capture]);

  const allow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) await capture();
    } catch {
      /* المستخدم رفض أو الجهاز مش مدعوم */
    } finally {
      locationAskedStore.set(true);
      setBusy(false);
      setOpen(false);
    }
  };

  const skip = () => {
    locationAskedStore.set(true);
    setOpen(false);
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={skip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="pin" size={26} color={colors.olive} />
          </View>

          <AppText family="display" weight="800" size={18} align="center" lineHeight={28}>
            نحدد موقعك؟
          </AppText>
          <AppText
            family="body"
            size={12}
            color={colors.muted}
            align="center"
            lineHeight={21}
            style={{ marginTop: 8 }}
          >
            بنستخدم موقعك عشان نعرض المطاعم الأقرب ليك ونحسب وقت التوصيل بدقة.
            بياناتك مش بتتشارك مع حد.
          </AppText>

          <View style={styles.rows}>
            <View style={styles.row}>
              <Lotus size={11} />
              <AppText family="body" size={11} color={colors.ink} lineHeight={18} style={{ flex: 1 }}>
                أقرب المطاعم لعنوانك
              </AppText>
            </View>
            <View style={styles.row}>
              <Lotus size={11} />
              <AppText family="body" size={11} color={colors.ink} lineHeight={18} style={{ flex: 1 }}>
                وقت توصيل أدق
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={() => void allow()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="اسمح بالوصول للموقع"
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText family="body" weight="700" size={13.5} color={colors.white}>
                اسمح بالموقع
              </AppText>
            )}
          </Pressable>

          <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="مش دلوقتي" style={styles.skip}>
            <AppText family="body" weight="600" size={12} color={colors.muted}>
              مش دلوقتي
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 33, 22, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.goldLine,
    ...shadowStrong,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    marginBottom: 12,
  },
  rows: { marginTop: 14, gap: 6 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  primary: {
    marginTop: 16,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: { alignSelf: 'center', paddingVertical: 12 },
});
