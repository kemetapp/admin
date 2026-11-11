import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { MapView, type LatLng } from '../components/MapView';
import { PrimaryButton } from '../components/ui';
import { colors, fonts, shadowStrong } from '../theme';
import { addAddress } from '../state/addresses';
import { deviceLocationStore } from '../state/location';
import { useZones, zoneAt } from '../api/zones';

type Mode = 'choose' | 'here' | 'other';

export default function AddressChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: Mode =
    params.mode === 'here' ? 'here' : params.mode === 'other' ? 'other' : 'choose';
  const { zones } = useZones();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [point, setPoint] = useState<LatLng | null>(null);
  const [area, setArea] = useState('');
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const [satellite, setSatellite] = useState(true);
  const [locating, setLocating] = useState(false);

  const reverse = useCallback(async (next: LatLng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ar&lat=${next.lat}&lon=${next.lng}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await response.json()) as { display_name?: string; address?: Record<string, string> };
      const parts = data.address ?? {};
      const areaGuess =
        parts.suburb ?? parts.neighbourhood ?? parts.city_district ?? parts.city ?? parts.town ?? '';
      if (areaGuess) setArea((prev) => prev || areaGuess);
    } catch {
      /* الشبكة مش متاحة — المستخدم بيكتب العنوان بنفسه */
    }
  }, []);

  /* الخيار 1: مكاني الحالي — بناخد GPS فورًا */
  const startHere = useCallback(async () => {
    setMode('here');
    setLocating(true);
    try {
      let current = deviceLocationStore.get();
      if (!current) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          current = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          };
          deviceLocationStore.set(current);
        }
      }
      if (current) {
        setPoint(current);
        await reverse(current);
      }
    } catch {
      /* نسيبه يحدد على الخريطة */
    } finally {
      setLocating(false);
    }
  }, [reverse]);

  const booted = useRef(false);
  useEffect(() => {
    if (initialMode === 'here' && !booted.current) {
      booted.current = true;
      void startHere();
    }
  }, [initialMode, startHere]);

  const zone = point ? zoneAt(point, zones) : null;
  const outside = Boolean(point && zones.length > 0 && !zone);
  const canSave = Boolean(point) && label.trim().length > 1 && detail.trim().length > 3 && !outside;

  const save = () => {
    if (!point || !canSave) return;
    addAddress({
      label: label.trim() || 'عنوان التوصيل',
      detail: detail.trim(),
      lat: point.lat,
      lng: point.lng,
      placeName: zone?.name,
    });
    router.back();
  };

  if (mode === 'choose') {
    return (
      <View style={styles.root}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={styles.back}
        >
          <Icon name="arrowLeft" size={19} color={colors.ink} />
        </Pressable>

        <AppText family="display" weight="800" size={20} align="center" style={{ marginTop: 26 }}>
          هتستلم طلبك فين؟
        </AppText>
        <AppText family="body" size={12} color={colors.muted} align="center" lineHeight={21} style={{ marginTop: 6 }}>
          اختار طريقة التوصيل وهنوصل لك في المكان اللي تحدده
        </AppText>

        <Pressable
          onPress={() => void startHere()}
          accessibilityRole="button"
          accessibilityLabel="هستلم طلبي في مكاني"
          style={({ pressed }) => [styles.option, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.optionIcon}>
            <Icon name="pin" size={20} color={colors.olive} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="display" weight="800" size={15}>
              هستلم طلبي في مكاني
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={18} style={{ marginTop: 2 }}>
              بنحدد موقعك الحالي بالـGPS وتكتب المنطقة والعنوان
            </AppText>
          </View>
          <Icon name="chevronLeft" size={16} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={() => setMode('other')}
          accessibilityRole="button"
          accessibilityLabel="هستلم في مكان تاني"
          style={({ pressed }) => [styles.option, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.optionIcon}>
            <Icon name="pin" size={20} color={colors.olive} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="display" weight="800" size={15}>
              هستلم في مكان تاني
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={18} style={{ marginTop: 2 }}>
              تختار المكان على الخريطة بالأقمار الصناعية
            </AppText>
          </View>
          <Icon name="chevronLeft" size={16} color={colors.muted} />
        </Pressable>

        {zones.length > 0 ? (
          <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={17} style={{ marginTop: 14 }}>
            التوصيل متاح في {zones.length} منطقة: {zones.map((item) => item.name).join(' · ')}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Pressable
          onPress={() => setMode('choose')}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={styles.backInline}
        >
          <Icon name="arrowLeft" size={19} color={colors.ink} />
        </Pressable>
        <AppText family="display" weight="800" size={16} style={{ flex: 1 }}>
          {mode === 'here' ? 'تأكيد مكانك' : 'حدد المكان على الخريطة'}
        </AppText>
        <Pressable
          onPress={() => setSatellite((value) => !value)}
          style={styles.layerBtn}
          accessibilityRole="button"
          accessibilityLabel="تبديل الطبقة"
        >
          <AppText family="body" weight="700" size={10.5} color={colors.olive}>
            {satellite ? 'شوارع' : 'أقمار'}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          center={point ?? { lat: 24.0915, lng: 32.8998 }}
          zoom={16}
          satellite={satellite}
          markers={[]}
          centerPin
          onPick={(next) => setPoint(next)}
          style={styles.map}
        />
        {locating ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.olive} />
            <AppText family="body" size={11} color={colors.muted} style={{ marginTop: 6 }}>
              بنحدد موقعك…
            </AppText>
          </View>
        ) : null}
      </View>

      {outside ? (
        <View style={styles.outside}>
          <Icon name="minus" size={14} color={colors.clay} />
          <AppText family="body" weight="700" size={11.5} color={colors.clay} lineHeight={18} style={{ flex: 1 }}>
            خارج نطاق الخدمة — اختار مكان تاني جوه حدود التوصيل
          </AppText>
        </View>
      ) : zone ? (
        <View style={styles.inside}>
          <Icon name="check" size={13} color={colors.olive} />
          <AppText family="body" weight="600" size={11} color={colors.olive}>
            داخل نطاق {zone.name}
          </AppText>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="اسم العنوان — البيت · الشغل · بيت العيلة"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="العنوان بالتفصيل — شارع، مبنى، دور"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <TextInput
          value={area}
          onChangeText={setArea}
          placeholder="المنطقة (مثال: كورنيش النيل)"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        {point ? (
          <AppText family="body" size={10} color={colors.muted} align="center" style={{ marginTop: 6 }}>
            {point.lat}, {point.lng}
          </AppText>
        ) : null}

        <PrimaryButton
          label={mode === 'here' ? 'تأكيد مكاني' : 'استخدم المكان ده'}
          onPress={save}
          disabled={!canSave}
          style={{ marginTop: 10, height: 50 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 16 },
  back: { marginTop: 44, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  backInline: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 44,
    marginBottom: 10,
  },
  layerBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldLine,
    padding: 14,
    marginTop: 12,
    ...shadowStrong,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oliveSoft,
  },
  mapWrap: { flex: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 10 },
  map: { flex: 1 },
  loading: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,245,232,0.75)',
  },
  outside: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(180,86,47,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.35)',
    marginBottom: 8,
  },
  inside: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.oliveSoft,
    marginBottom: 8,
  },
  form: { paddingBottom: 24 },
  input: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 8,
  },
  multiline: { height: 70, paddingTop: 12, textAlignVertical: 'top' },
});
