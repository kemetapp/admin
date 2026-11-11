import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { GoldFrame, SheetHandle } from '../components/motifs';
import { IconButton } from '../components/ui';
import { itemsLabel } from '../utils/arabic';
import { useCatalog } from '../api/catalog';
import { food } from '../theme/images';
import { colors, shadow, shadowStrong } from '../theme';
import { useAuthUid, useMyOrderDetail } from '../api/orders';
import { useOrderTracking } from '../api/tracking';
import { MapView } from '../components/MapView';
import { formatMeters, haversineMeters, etaMinutes } from '../lib/geo';

/** ظ…ط±ط§ط­ظ„ ط§ظ„طھطھط¨ط¹ â€” ط¨طھطھط­ظˆظ‘ظ„ ظ„ط­ط§ظ„ط© done / now / next ط­ط³ط¨ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ ط§ظ„ط­ظ‚ظٹظ‚ظٹط©. */
const STEP_TITLES = [
  'طھظ… طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨',
  'ط§ظ„ظ…ط·ط¹ظ… ط¨ظٹط­ط¶ظ‘ط± ط·ظ„ط¨ظƒ',
  'ط§ظ„ظ…ظ†ط¯ظˆط¨ ط§ط³طھظ„ظ… ط§ظ„ط·ظ„ط¨',
  'ظپظٹ ط§ظ„ط·ط±ظٹظ‚ ط¥ظ„ظٹظƒ',
  'طھظ… ط§ظ„طھط³ظ„ظٹظ…',
];

function stageOf(status: string): number {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 0;
    case 'preparing':
      return 1;
    case 'ready_for_pickup':
    case 'picked_up':
      return 2;
    case 'out_for_delivery':
    case 'arrived':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'ط¨ظ†ط³طھظ„ظ… ط·ظ„ط¨ظƒ',
  confirmed: 'ط·ظ„ط¨ظƒ ط§طھط£ظƒط¯',
  preparing: 'ط§ظ„ظ…ط·ط¹ظ… ط¨ظٹط¬ظ‡ظ‘ط²',
  ready_for_pickup: 'ط¬ط§ظ‡ط² ظ„ظ„ظ…ظ†ط¯ظˆط¨',
  picked_up: 'ط§ظ„ظ…ظ†ط¯ظˆط¨ ط§ط³طھظ„ظ…',
  out_for_delivery: 'ظپظٹ ط§ظ„ط·ط±ظٹظ‚ ط¥ظ„ظٹظƒ',
  arrived: 'ط§ظ„ظ…ظ†ط¯ظˆط¨ ط¹ظ†ط¯ظƒ',
  delivered: 'طھظ… ط§ظ„طھط³ظ„ظٹظ…',
  cancelled: 'ط§ظ„ط·ظ„ط¨ ظ…ظ„ط؛ظٹ',
};

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useAuthUid();
  const { order, loading } = useMyOrderDetail(uid);
  const courier = useOrderTracking(order?.id ?? null);
  const { getRestaurant } = useCatalog();

  if (!loading && !order) {
    return (
      <View style={styles.emptyWrap}>
        <Icon name="scooter" size={42} color={colors.sand2} />
        <AppText family="display" weight="800" size={17} align="center" style={{ marginTop: 14 }}>
          ظ…ظپظٹط´ ط·ظ„ط¨ ط´ط؛ط§ظ„ ط¯ظ„ظˆظ‚طھظٹ
        </AppText>
        <AppText
          family="body"
          size={12.5}
          color={colors.muted}
          align="center"
          lineHeight={21}
          style={{ marginTop: 6, maxWidth: 260 }}
        >
          ط§ط®طھط§ط± ط£ظƒظ„طھظƒ ظ…ظ† ط§ظ„ظ…ط·ط§ط¹ظ… ظˆط£ظƒظ‘ط¯ ط§ظ„ط·ظ„ط¨طŒ ظˆظ‡طھظ‚ط¯ط± طھطھط§ط¨ط¹ ظƒظ„ ط®ط·ظˆط© ظ‡ظ†ط§.
        </AppText>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="ط§طھظپط¶ظ„ ط§ظ„ظ…ط·ط§ط¹ظ…"
          style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
        >
          <AppText family="body" weight="700" size={13} color={colors.white}>
            ط§طھظپط±ط¬ ط¹ظ„ظ‰ ط§ظ„ظ…ط·ط§ط¹ظ…
          </AppText>
        </Pressable>
      </View>
    );
  }

  if (!order) {
    return <View style={styles.root} />;
  }

  const restaurant = getRestaurant(order.restaurantId);
  const stage = stageOf(order.status);
  const cancelled = order.status === 'cancelled';
  const etaValue = order.eta?.match(/\d+/)?.[0] ?? 'â€”';
  const scheduled = Boolean(order.eta && order.eta.includes('ظ…'));
  const hasCourier = Boolean(order.courierName);

  // ط§ظ„طھطھط¨ظ‘ط¹ ط§ظ„ط­ظٹ: ظ…ظˆظ‚ط¹ ط§ظ„ظ…ظ†ط¯ظˆط¨ ظ…ظ† `tracking/{orderId}` + ظ…ظˆظ‚ط¹ ط§ظ„ط¹ظ…ظٹظ„
  const destination =
    typeof order.addressLat === 'number' && typeof order.addressLng === 'number'
      ? { lat: order.addressLat, lng: order.addressLng }
      : null;

  const remaining = courier && destination ? haversineMeters(courier, destination) : 0;
  const liveMarkers = [
    ...(destination ? [{ ...destination, label: 'ط¹ظ†ظˆط§ظ†ظƒ', color: '#4F5B2A' }] : []),
    ...(courier ? [{ ...courier, label: 'ط§ظ„ظ…ظ†ط¯ظˆط¨', color: '#B4562F' }] : []),
  ];

  return (
    <View style={styles.root}>
      <MapView
        center={courier ?? destination ?? { lat: 24.0915, lng: 32.8998 }}
        zoom={15}
        markers={liveMarkers}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel="ط±ط¬ظˆط¹ ظ„ظ„ط±ط¦ظٹط³ظٹط©"
        style={[styles.floatingBack, { top: insets.top + 6 }]}
      >
        <Icon name="arrowLeft" size={19} color={colors.ink} />
      </Pressable>

      <View style={[styles.trackTop, { top: insets.top + 56 }]}>
        <View style={{ flex: 1 }}>
          <AppText family="body" weight="600" size={11} color={colors.muted} lineHeight={16}>
            {order.number ? `ط·ظ„ط¨ #${order.number}` : 'ط·ظ„ط¨ظƒ'}
          </AppText>
          <AppText family="display" weight="800" size={17} lineHeight={25} style={{ marginTop: 2 }}>
            {cancelled ? 'ط§ظ„ط·ظ„ط¨ ط§طھظ„ط؛ظ‰' : STATUS_TEXT[order.status] ?? 'ط·ظ„ط¨ظƒ ظ…ط¹ط§ظ†ط§'}
          </AppText>
        </View>
        {!cancelled ? (
          <View style={styles.eta}>
            <AppText
              family="display"
              weight="800"
              size={scheduled ? 14 : 26}
              color={colors.olive}
              align="center"
              lineHeight={scheduled ? 22 : 30}
            >
              {scheduled ? order.eta : etaValue}
            </AppText>
            <AppText family="body" size={10} color={colors.muted} align="center">
              {scheduled ? 'ظ…ظˆط¹ط¯ ط§ظ„طھظˆطµظٹظ„' : 'ط¯ظ‚ظٹظ‚ط©'}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle />
        {hasCourier ? (
          <View style={styles.courier}>
            <View style={styles.avatar}>
              <AppText family="display" weight="700" size={17} color="#F3E4BC" align="center" lineHeight={22}>
                {order.courierName.charAt(0)}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText family="body" weight="700" size={13.5} lineHeight={20}>
                {order.courierName}
              </AppText>
              <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
                ظ…ظ†ط¯ظˆط¨ ط§ظ„طھظˆطµظٹظ„
              </AppText>
            </View>
            <View style={styles.cActions}>
              <IconButton
                name="phone"
                size={40}
                color={colors.olive}
                accessibilityLabel="ط§طھطµط§ظ„ ط¨ط§ظ„ظ…ظ†ط¯ظˆط¨"
                onPress={() => {
                  if (order.courierPhone) void Linking.openURL(`tel:${order.courierPhone}`);
                }}
              />
            </View>
          </View>
        ) : null}

        {courier && remaining > 0 ? (
          <AppText family="body" weight="600" size={10.5} color={colors.olive} lineHeight={16}>
            ط§ظ„ظ…ظ†ط¯ظˆط¨ ط¹ظ„ظ‰ ط¨ط¹ط¯ {formatMeters(remaining)} آ· ~{etaMinutes(remaining)} ط¯ظ‚ظٹظ‚ط©
          </AppText>
        ) : null}
        <View style={styles.steps}>
          {STEP_TITLES.map((title, index) => {
            const done = !cancelled && index < stage;
            const now = !cancelled && index === stage;
            const last = index === STEP_TITLES.length - 1;
            return (
              <View key={title} style={[styles.step, last && { paddingBottom: 0 }]}>
                {!last ? (
                  <View style={[styles.connector, done && { backgroundColor: colors.olive }]} />
                ) : null}
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    now && styles.stepDotNow,
                  ]}
                >
                  {done ? (
                    <Icon name="check" size={11} color={colors.white} strokeWidth={2.4} />
                  ) : now ? (
                    <Icon name="scooter" size={11} color={colors.white} strokeWidth={2.4} />
                  ) : null}
                </View>
                <View style={styles.stepTxt}>
                  <AppText
                    family="body"
                    weight={now ? '700' : '600'}
                    size={12.5}
                    lineHeight={19}
                    color={done || now ? colors.ink : colors.muted}
                  >
                    {title}
                  </AppText>
                  {now ? (
                    <AppText family="body" size={10.5} color={colors.olive} lineHeight={16} style={{ marginTop: 1 }}>
                      ط¯ظ„ظˆظ‚طھظٹ
                    </AppText>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.trackOrder}>
          <View style={styles.orderThumb}>
            <Image source={food[restaurant.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
            <GoldFrame inset={2} radiusValue={10} opacity={0.35} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={12.5} lineHeight={19}>
              {order.restaurantName || restaurant.name}
            </AppText>
            <AppText family="body" size={10.5} color={colors.muted} lineHeight={16} style={{ marginTop: 2 }}>
              {order.itemsCount} {itemsLabel(order.itemsCount)} آ· {order.total} ط¬.ظ…
            </AppText>
          </View>
          <Pressable
            onPress={() => router.replace('/(tabs)/orders')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="طھظپط§طµظٹظ„ ط§ظ„ط·ظ„ط¨ط§طھ"
          >
            <AppText family="body" weight="700" size={11.5} color={colors.olive}>
              ط·ظ„ط¨ط§طھظٹ
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9E6DB' },
  floatingBack: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,253,246,0.96)',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  trackTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,253,246,0.97)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.goldLine,
    ...shadowStrong,
  },
  eta: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    paddingRight: 10,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderBottomWidth: 0,
    ...shadowStrong,
  },
  courier: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 46,
    height: 46,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,162,74,0.5)',
    flexShrink: 0,
  },
  cActions: { flexDirection: 'row-reverse', gap: 8 },
  steps: { marginTop: 14 },
  step: { flexDirection: 'row-reverse', gap: 12, paddingBottom: 13 },
  connector: {
    position: 'absolute',
    top: 20,
    right: 9,
    bottom: 0,
    width: 2,
    backgroundColor: colors.line,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.sand2,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    flexShrink: 0,
  },
  stepDotDone: { backgroundColor: colors.olive, borderColor: colors.olive },
  stepDotNow: { backgroundColor: colors.olive, borderColor: colors.olive },
  stepTxt: { flex: 1 },
  trackOrder: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  orderThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    flexShrink: 0,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyBtn: {
    marginTop: 18,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
