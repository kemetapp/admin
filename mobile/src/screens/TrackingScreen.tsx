import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { GoldFrame, SheetHandle } from '../components/motifs';
import { IconButton } from '../components/ui';
import { itemsLabel } from '../utils/arabic';
import { orders } from '../data/mock';
import { useCatalog } from '../api/catalog';
import { food } from '../theme/images';
import { colors, shadow, shadowStrong } from '../theme';
import { useLiveOrder } from '../state/orders';

const COURIER_PHONE = '+201012345678';

const STEPS: { title: string; note: string; state: 'done' | 'now' | 'next'; icon?: IconName }[] = [
  { title: 'تم تأكيد الطلب', note: '9:12 م', state: 'done', icon: 'check' },
  { title: 'المطعم بيحضّر طلبك', note: '9:18 م', state: 'done', icon: 'check' },
  { title: 'المندوب استلم الطلب', note: '9:34 م · على بعد 1.2 كم', state: 'now', icon: 'scooter' },
  { title: 'التوصيل', note: 'متوقع 9:52 م', state: 'next' },
];

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const liveOrder = useLiveOrder() ?? orders[0];
  const { getRestaurant } = useCatalog();
  const restaurant = getRestaurant(liveOrder.restaurantId);
  const eta = liveOrder.eta?.match(/\d+/)?.[0] ?? '18';
  const scheduled = Boolean(liveOrder.eta?.includes('م'));

  return (
    <View style={styles.root}>
      <MapCanvas />

      <Pressable
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel="رجوع للرئيسية"
        style={[styles.floatingBack, { top: insets.top + 6 }]}
      >
        <Icon name="arrowLeft" size={19} color={colors.ink} />
      </Pressable>

      <View style={[styles.trackTop, { top: insets.top + 56 }]}>
        <View style={{ flex: 1 }}>
          <AppText family="body" weight="600" size={11} color={colors.muted} lineHeight={16}>
            طلبك في الطريق
          </AppText>
          <AppText family="display" weight="800" size={17} lineHeight={25} style={{ marginTop: 2 }}>
            طلبك من {restaurant.name} في الطريق
          </AppText>
        </View>
        <View style={styles.eta}>
          <AppText
            family="display"
            weight="800"
            size={scheduled ? 14 : 26}
            color={colors.olive}
            align="center"
            lineHeight={scheduled ? 22 : 30}
          >
            {scheduled ? liveOrder.eta : eta}
          </AppText>
          <AppText family="body" size={10} color={colors.muted} align="center">
            {scheduled ? 'موعد التوصيل' : 'دقيقة'}
          </AppText>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle />
        <View style={styles.courier}>
          <View style={styles.avatar}>
            <AppText family="display" weight="700" size={17} color="#F3E4BC" align="center" lineHeight={22}>
              أ
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={13.5} lineHeight={20}>
              أحمد مصطفى
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
              مندوب · 4.9 ★ · سكوتر
            </AppText>
          </View>
          <View style={styles.cActions}>
            <IconButton
              name="phone"
              size={40}
              color={colors.olive}
              accessibilityLabel="اتصال بالمندوب"
              onPress={() => {
                void Linking.openURL(`tel:${COURIER_PHONE}`);
              }}
            />
            <IconButton
              name="message"
              size={40}
              color={colors.olive}
              accessibilityLabel="رسالة للمندوب"
              onPress={() => {
                void Linking.openURL(`sms:${COURIER_PHONE}`);
              }}
            />
          </View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, index) => {
            const done = step.state === 'done';
            const now = step.state === 'now';
            const last = index === STEPS.length - 1;
            return (
              <View key={step.title} style={[styles.step, last && { paddingBottom: 0 }]}>
                {!last ? (
                  <View
                    style={[
                      styles.connector,
                      done && { backgroundColor: colors.olive },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    now && styles.stepDotNow,
                  ]}
                >
                  {step.icon ? (
                    <Icon
                      name={step.icon}
                      size={11}
                      color={colors.white}
                      strokeWidth={2.4}
                    />
                  ) : null}
                </View>
                <View style={styles.stepTxt}>
                  <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                    {step.title}
                  </AppText>
                  <AppText family="body" size={10.5} color={colors.muted} lineHeight={16} style={{ marginTop: 1 }}>
                    {step.note}
                  </AppText>
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
              {restaurant.name}
            </AppText>
            <AppText family="body" size={10.5} color={colors.muted} lineHeight={16} style={{ marginTop: 2 }}>
              {liveOrder.itemsCount} {itemsLabel(liveOrder.itemsCount)} · {liveOrder.total} ج.م
            </AppText>
          </View>
          <Pressable
            onPress={() => router.replace('/(tabs)/orders')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="تفاصيل الطلبات"
          >
            <AppText family="body" weight="700" size={11.5} color={colors.olive}>
              طلباتي
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MapCanvas() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Rect width={390} height={844} fill="#E9E6DB" />
        <Rect x={24} y={500} width={118} height={92} rx={14} fill="#DCE8D8" />
        <Path
          d="M-30 90 C70 150 40 270 140 340 C240 410 210 560 320 640 C380 690 400 700 430 780"
          fill="none"
          stroke="#BFD9D6"
          strokeWidth={52}
          opacity={0.75}
        />
        <Path d="M-20 190 H410" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />
        <Path d="M-20 430 H410" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />
        <Path d="M-20 660 H410" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />
        <Path d="M110 -20 V860" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />
        <Path d="M305 -20 V860" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />
        <Path d="M-20 770 L190 600 L410 650" stroke="#FBF6E8" strokeWidth={16} strokeLinecap="round" />

        <Path d="M-20 190 H410" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="9 12" opacity={0.8} />
        <Path d="M-20 430 H410" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="9 12" opacity={0.8} />
        <Path d="M-20 660 H410" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="9 12" opacity={0.8} />
        <Path d="M110 -20 V860" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="9 12" opacity={0.8} />
        <Path d="M305 -20 V860" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="9 12" opacity={0.8} />

        <Path
          d="M300 420 C300 380 265 370 240 330 C215 290 160 250 110 200"
          fill="none"
          stroke="#B4562F"
          strokeWidth={5}
          strokeDasharray="2 13"
          strokeLinecap="round"
        />
        <Circle cx={300} cy={420} r={10} fill="#4F5B2A" stroke="#fff" strokeWidth={3} />
        <Path
          d="M110 200c-12 0-18 8-18 17a18 18 0 1 0 36 0c0-9-6-17-18-17z"
          fill="#B4562F"
          stroke="#fff"
          strokeWidth={3}
        />
        <Circle cx={110} cy={216} r={5} fill="#fff" />
        <Circle cx={240} cy={330} r={17} fill="#fff" stroke="#4F5B2A" strokeWidth={3} />
        <Circle cx={240} cy={330} r={6} fill="#4F5B2A" />
      </Svg>
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
});
