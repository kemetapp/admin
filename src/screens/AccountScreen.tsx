import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { Cartouche, Lotus, WingedSun } from '../components/motifs';
import { Screen } from '../components/Screen';
import { coupons } from '../data/mock';
import { colors, shadow } from '../theme';
import { clearGuest, clearSession, getSession, type Session } from '../state/session';
import { seedCatalog } from '../api/seed';
import { authErrorMessage } from '../api/auth';
import { auth, db } from '../lib/firebase';
import { useAddress } from '../state/addresses';
import { useFavorites } from '../state/favorites';
import { useOrders } from '../state/orders';
import { useUnreadCount } from '../state/notifications';
import { usePayment } from '../state/payment';
import { useCart } from '../state/CartContext';

type MenuItem = {
  id: string;
  label: string;
  icon: IconName;
  href: string;
};

const MENU: MenuItem[] = [
  { id: 'addresses', label: 'العناوين', icon: 'pin', href: '/account/addresses' },
  { id: 'favorites', label: 'المفضلة', icon: 'heart', href: '/(tabs)/favorites' },
  { id: 'coupons', label: 'أكواد الخصم', icon: 'tag', href: '/account/coupons' },
  { id: 'payments', label: 'طرق الدفع', icon: 'wallet', href: '/account/payments' },
  { id: 'help', label: 'المساعدة والدعم', icon: 'message', href: '/account/help' },
  { id: 'about', label: 'عن كيميت', icon: 'star', href: '/account/about' },
];

export default function AccountScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const address = useAddress();
  const favorites = useFavorites();
  const orders = useOrders();
  const unread = useUnreadCount();
  const payment = usePayment();
  const { promo } = useCart();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [cloud, setCloud] = useState<'checking' | 'signed-out' | 'customer' | 'admin'>('checking');

  // حالة الحساب في Firebase — عشان أداة التهيئة تقولّك بالظبط إيه الناقص.
  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!alive) return;
      if (!user) {
        setCloud('signed-out');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = (snap.data() as { role?: string } | undefined)?.role;
        if (alive) setCloud(role === 'admin' ? 'admin' : 'customer');
      } catch {
        if (alive) setCloud('customer');
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getSession().then((value) => {
      if (alive) setSession(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const name = session?.name?.trim() || 'محمود النوبي';
  const phone = session?.phone?.trim() || '010 1234 5678';
  const since = session?.memberSince || '2024';
  const delivered = orders.filter((order) => order.status === 'delivered').length;

  const hintFor = (id: string): string | undefined => {
    switch (id) {
      case 'addresses':
        return address.label;
      case 'favorites':
        return `${favorites.length} مطعم`;
      case 'coupons':
        return promo ?? 'KEMET25';
      case 'payments':
        return payment.label;
      default:
        return undefined;
    }
  };

  const logout = async () => {
    await clearSession();
    await clearGuest();
    router.replace('/login');
  };

  const runSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedCatalog();
      setSeedMessage(
        `تم — ${result.restaurants} مطعم · ${result.products} صنف · ${result.categories} قسم · ${result.promos} عرض`,
      );
    } catch (e) {
      setSeedMessage(authErrorMessage(e));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <AppText family="display" weight="800" size={22}>
            حسابي
          </AppText>
          <Pressable
            style={styles.bell}
            accessibilityRole="button"
            accessibilityLabel={unread ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات'}
            onPress={() => router.push('/notifications')}
          >
            <Icon name="bell" size={19} color={colors.ink} />
            {unread > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        <View style={styles.profile}>
          <LinearGoldFrame />
          <WingedSun
            width={92}
            color="rgba(217,162,74,0.45)"
            style={{ position: 'absolute', top: 10, left: 12 }}
          />

          <View style={styles.avatar}>
            <Cartouche size={54} letter={name.charAt(0)} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText family="display" weight="800" size={18} lineHeight={26} numberOfLines={1}>
              {name}
            </AppText>
            <AppText family="body" size={11.5} color={colors.muted} lineHeight={18} style={{ marginTop: 2 }}>
              {phone}
            </AppText>
            <View style={styles.member}>
              <Lotus size={11} color={colors.goldDeep} />
              <AppText family="body" weight="600" size={10.5} color="#7A5B12">
                عضو كيميت · من {since}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={String(orders.length)} label="طلب" />
          <View style={styles.statDivider} />
          <Stat value={String(delivered * 40 + 20)} label="نقطة" />
          <View style={styles.statDivider} />
          <Stat value={String(coupons.length)} label="كوبونات" />
        </View>

        <View style={styles.secHead}>
          <Lotus size={13} />
          <AppText family="display" weight="700" size={13.5}>
            إعداداتك
          </AppText>
        </View>

        <View style={styles.menu}>
          {MENU.map((item, index) => {
            const hint = hintFor(item.id);
            return (
              <Pressable
                key={item.id}
                testID={`account-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.menuRow,
                  index !== MENU.length - 1 && styles.menuRowBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.menuIcon}>
                  <Icon name={item.icon} size={17} color={colors.olive} />
                </View>
                <AppText family="body" weight="600" size={13} style={{ flex: 1 }}>
                  {item.label}
                </AppText>
                {hint ? (
                  <AppText
                    family="body"
                    size={10.5}
                    color={colors.muted}
                    numberOfLines={1}
                    style={{ maxWidth: 130 }}
                  >
                    {hint}
                  </AppText>
                ) : null}
                <Icon name="chevronLeft" size={15} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="تسجيل الخروج"
        >
          <Icon name="arrowLeft" size={17} color={colors.clay} />
          <AppText family="body" weight="700" size={13} color={colors.clay}>
            تسجيل الخروج
          </AppText>
        </Pressable>

        {__DEV__ ? (
          <View style={styles.devBox}>
            <AppText family="body" weight="600" size={11} color={colors.muted}>
              أدوات المطوّر
            </AppText>

            <AppText
              family="body"
              weight="600"
              size={10.5}
              lineHeight={18}
              color={
                cloud === 'admin'
                  ? colors.success
                  : cloud === 'checking'
                    ? colors.muted
                    : colors.danger
              }
            >
              {cloud === 'checking'
                ? 'بيفحص حساب Firebase…'
                : cloud === 'signed-out'
                  ? 'مش مسجّل دخول في Firebase — سجّل دخول الأول.'
                  : cloud === 'customer'
                    ? 'الحساب دوره customer — افتح Firestore → users وغيّر role لـ admin.'
                    : 'أدمن ✓ — جاهز للتهيئة.'}
            </AppText>

            <Pressable
              onPress={runSeed}
              disabled={cloud !== 'admin' || seeding}
              accessibilityRole="button"
              accessibilityLabel="تهيئة بيانات العرض في Firestore"
              accessibilityState={{ disabled: cloud !== 'admin' || seeding }}
              style={({ pressed }) => [
                styles.devBtn,
                (cloud !== 'admin' || seeding) && { opacity: 0.45 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                {seeding ? 'بيتم الرفع…' : 'تهيئة بيانات العرض'}
              </AppText>
            </Pressable>

            {seedMessage ? (
              <AppText family="body" size={10.5} color={colors.muted} lineHeight={17}>
                {seedMessage}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.goldLine} />
          <AppText family="body" size={10.5} color={colors.muted} align="center">
            كيميت · أكل البلد، لحد باب البيت
          </AppText>
          <AppText family="body" size={10} color={colors.muted} align="center">
            الإصدار 1.0.0
          </AppText>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </Screen>
  );
}

/** إطار ذهبي داخلي للبروفايل — خط رفيع زي عقد المعبد. */
function LinearGoldFrame() {
  return <View pointerEvents="none" style={styles.innerFrame} />;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText family="display" weight="800" size={19} color={colors.olive} align="center" lineHeight={26}>
        {value}
      </AppText>
      <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={17}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.clay,
    borderWidth: 1.5,
    borderColor: colors.cream,
  },
  profile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
    ...shadow,
  },
  innerFrame: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(184,134,47,0.22)',
  },
  avatar: { flexShrink: 0 },
  member: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.goldSoft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.goldLine,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  stats: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingVertical: 12,
    marginTop: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: colors.line },
  secHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 10,
  },
  menu: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logout: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(180,86,47,0.35)',
    backgroundColor: 'rgba(180,86,47,0.06)',
    marginTop: 16,
  },
  footer: { alignItems: 'center', gap: 4, marginTop: 20 },
  devBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sand2,
    backgroundColor: colors.goldSoft,
    gap: 8,
  },
  devBtn: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldLine: { width: 44, height: 1, backgroundColor: colors.goldLineStrong, marginBottom: 6 },
});
