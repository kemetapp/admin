import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { MapView, type LatLng } from '../components/MapView';
import { Screen } from '../components/Screen';
import { BackButton, PrimaryButton } from '../components/ui';
import { colors, fonts } from '../theme';
import { addAddress } from '../state/addresses';
import { formatMeters, haversineMeters, etaMinutes } from '../lib/geo';

/** مركز المدينة — نقطة القياس المرجعية لحد ما المطاعم يبقى لها إحداثيات. */
const ORIGIN: LatLng = { lat: 24.0915, lng: 32.8998 };

/**
 * اختيار موقع التوصيل على الخريطة — MapLibre داخل WebView (يشتغل على Expo Go).
 * بيدعم البحث بالعنوان (Nominatim)، دبوس متحرّك، وبيحسب المسافة والزمن.
 */
export default function MapScreen() {
  const router = useRouter();
  const [point, setPoint] = useState<LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [query, setQuery] = useState('');
  const [satellite, setSatellite] = useState(false);
  const [busy, setBusy] = useState(false);

  const straight = point ? haversineMeters(ORIGIN, point) : 0;

  const markers = point
    ? [
        { ...ORIGIN, label: 'مركز أسوان', color: '#4F5B2A' },
        { ...point, label: 'موقعك', color: '#B4562F' },
      ]
    : [{ ...ORIGIN, label: 'مركز أسوان', color: '#4F5B2A' }];

  const reverse = async (next: LatLng) => {
    setPoint(next);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ar&lat=${next.lat}&lon=${next.lng}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await response.json()) as { display_name?: string };
      setAddress(data.display_name ?? '');
    } catch {
      setAddress('');
    }
  };

  const search = async () => {
    if (query.trim().length < 3 || busy) return;
    setBusy(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ar&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await response.json()) as { lat: string; lon: string; display_name: string }[];
      const first = data[0];
      if (!first) {
        setAddress('مفيش نتيجة للبحث');
        return;
      }
      const next = { lat: Number(first.lat), lng: Number(first.lon) };
      await reverse(next);
      setAddress(first.display_name);
    } catch {
      setAddress('البحث فشل — جرّب تاني');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!point) return;
    addAddress({
      label: label.trim() || 'موقع على الخريطة',
      detail: address || `${point.lat}, ${point.lng}`,
      lat: point.lat,
      lng: point.lng,
      placeName: address,
    });
    router.back();
  };

  return (
    <Screen padTop={false}>
      <View style={styles.head}>
        <BackButton />
        <AppText family="display" weight="800" size={18} style={{ flex: 1, marginStart: 10 }}>
          اختيار الموقع
        </AppText>
        <Pressable
          onPress={() => setSatellite((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel="تبديل طبقة الخريطة"
          style={styles.layerBtn}
        >
          <Icon name="pin" size={14} color={colors.olive} />
          <AppText family="body" weight="700" size={11} color={colors.olive}>
            {satellite ? 'شوارع' : 'أقمار'}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث عن عنوان أو مكان…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={() => void search()}
          returnKeyType="search"
        />
        <Pressable onPress={() => void search()} style={styles.searchBtn} accessibilityRole="button" accessibilityLabel="بحث">
          <Icon name="search" size={16} color={colors.white} />
        </Pressable>
      </View>

      <MapView
        center={ORIGIN}
        zoom={13}
        satellite={satellite}
        markers={markers}
        pickable
        onPick={(next) => void reverse(next)}
        style={styles.map}
      />

      <View style={styles.sheet}>
        <View style={styles.coords}>
          <AppText family="body" size={11} color={colors.muted}>
            الإحداثيات
          </AppText>
          <AppText family="body" weight="700" size={12} color={colors.ink}>
            {point ? `${point.lat}, ${point.lng}` : 'دوس على الخريطة'}
          </AppText>
        </View>

        {address ? (
          <AppText family="body" size={11.5} color={colors.muted} lineHeight={18} numberOfLines={2}>
            {address}
          </AppText>
        ) : null}

        {point && straight > 0 ? (
          <View style={styles.stats}>
            <AppText family="body" weight="600" size={11.5} color={colors.olive}>
              خط مستقيم: {formatMeters(straight)}
            </AppText>
            <AppText family="body" weight="600" size={11.5} color={colors.olive}>
              زمن تقريبي: {etaMinutes(straight)} د
            </AppText>
          </View>
        ) : null}

        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="اسم العنوان (البيت، الشغل…)"
          placeholderTextColor={colors.muted}
          style={[styles.input, { marginTop: 8 }]}
        />

        <PrimaryButton
          label="استخدم الموقع ده"
          onPress={save}
          disabled={!point}
          style={{ marginTop: 10, height: 48 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  layerBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    textAlign: 'right',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 18,
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  coords: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.oliveSoft,
  },
});
