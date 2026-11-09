import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { Cartouche, Lotus, WingedSun } from '../components/motifs';
import { Sheet } from '../components/Sheet';
import { AddressSheet } from '../components/AddressSheet';
import { Screen } from '../components/Screen';
import { coupons, restaurants } from '../data/mock';
import { colors } from '../theme';
import { clearSession, getSession, type Session } from '../state/session';
import { useAddress } from '../state/addresses';
import { useFavorites } from '../state/favorites';
import { useOrders } from '../state/orders';
import { useUnreadCount } from '../state/notifications';
import { setPayment, usePayment } from '../state/payment';
import { useCart } from '../state/CartContext';

type Section = 'addresses' | 'favorites' | 'coupons' | 'payments' | 'help' | 'about';

const MENU: { id: Section; label: string; icon: IconName }[] = [
  { id: 'addresses', label: 'العناوين', icon: 'pin' },
  { id: 'favorites', label: 'المفضلة', icon: 'heart' },
  { id: 'coupons', label: 'أكواد الخصم', icon: 'tag' },
  { id: 'payments', label: 'طرق الدفع', icon: 'card' },
  { id: 'help', label: 'المساعدة والدعم', icon: 'message' },
  { id: 'about', label: 'عن كيميت', icon: 'star' },
];

const PAYMENT_OPTIONS: { id: string; label: string; icon: IconName; hint: string }[] = [
  { id: 'cash', label: 'كاش عند الاستلام', icon: 'cash', hint: 'ادفع للمندوب لما يوصلك' },
  { id: 'card', label: 'بطاقة بنكية', icon: 'card', hint: 'فيزا · ماستركارد · ميزة' },
  { id: 'wallet', label: 'محفظة إلكترونية', icon: 'wallet', hint: 'فودافون كاش · إنستاباي' },
];

export default function AccountScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const address = useAddress();
  const favorites = useFavorites();
  const orders = useOrders();
  const unread = useUnreadCount();
  const payment = usePayment();
  const { applyPromo, promo } = useCart();

  useEffect(() => {
    let alive = true;
    getSession().then((s) => {
      if (alive) setSession(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const name = session?.name?.trim() || 'محمود النوبي';
  const phone = session?.phone?.trim() || '010 1234 5678';
  const since = session?.memberSince || '2024';
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const favoriteRestaurants = restaurants.filter((restaurant) => favorites.includes(restaurant.id));
  const paymentLabel = PAYMENT_OPTIONS.find((option) => option.id === payment)?.label ?? 'كاش عند الاستلام';

  const logout = async () => {
    await clearSession();
    router.replace('/login');
  };

  const closeSection = () => {
    setSection(null);
    setCouponMsg(null);
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
          <WingedSun
            width={86}
            color="rgba(217,162,74,0.5)"
            style={{ position: 'absolute', top: 12, left: 14 }}
          />
          <View style={styles.avatar}>
            <Cartouche size={52} letter={name.charAt(0)} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="display" weight="800" size={18} lineHeight={26}>
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

        <View style={styles.menu}>
          {MENU.map((item, index) => {
            const hint =
              item.id === 'addresses'
                ? address.label
                : item.id === 'favorites'
                  ? `${favorites.length} مطعم`
                  : item.id === 'coupons'
                    ? promo ?? 'KEMET25'
                    : item.id === 'payments'
                      ? paymentLabel
                      : undefined;
            return (
              <Pressable
                key={item.id}
                testID={`account-${item.id}`}
                onPress={() => setSection(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
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
                  <AppText family="body" size={10.5} color={colors.muted} numberOfLines={1} style={{ maxWidth: 130 }}>
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

        <AppText family="body" size={10.5} color={colors.muted} align="center" style={{ marginTop: 18 }}>
          كيميت · أكل البلد، لحد باب البيت
        </AppText>
        <AppText family="body" size={9.5} color={colors.muted} align="center" style={{ marginTop: 2 }}>
          الإصدار 1.0.0
        </AppText>
        <View style={{ height: 16 }} />
      </ScrollView>

      <AddressSheet visible={section === 'addresses'} onClose={closeSection} />

      <Sheet
        visible={section === 'favorites'}
        onClose={closeSection}
        title="المفضلة"
        subtitle={favoriteRestaurants.length ? `${favoriteRestaurants.length} مطعم` : 'لسه مفيش مطاعم مفضلة'}
      >
        {favoriteRestaurants.length ? (
          favoriteRestaurants.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              accessibilityRole="button"
              accessibilityLabel={restaurant.name}
              onPress={() => {
                closeSection();
                router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } });
              }}
              style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.rowIcon}>
                <Icon name="heart" size={16} color={colors.clay} filled />
              </View>
              <View style={{ flex: 1 }}>
                <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                  {restaurant.name}
                </AppText>
                <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                  {restaurant.cuisine} · {restaurant.rating.toFixed(1)} ★
                </AppText>
              </View>
              <Icon name="chevronLeft" size={15} color={colors.muted} />
            </Pressable>
          ))
        ) : (
          <View style={styles.sheetEmpty}>
            <Icon name="heart" size={34} color={colors.sand2} />
            <AppText family="body" size={12} color={colors.muted} align="center" style={{ marginTop: 10 }}>
              دوس على القلب في صفحة أي مطعم عشان تضيفه هنا.
            </AppText>
          </View>
        )}
      </Sheet>

      <Sheet
        visible={section === 'coupons'}
        onClose={closeSection}
        title="أكواد الخصم"
        subtitle="دوس على الكود عشان يتطبق على سلتك"
      >
        {coupons.map((coupon) => (
          <Pressable
            key={coupon.code}
            accessibilityRole="button"
            accessibilityLabel={`${coupon.title}، كود ${coupon.code}`}
            onPress={() => {
              const result = applyPromo(coupon.code);
              setCouponMsg(result.ok ? `${coupon.code}: ${result.message}` : result.message);
            }}
            style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.rowIcon}>
              <Icon name="tag" size={16} color={colors.goldDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                {coupon.title}
              </AppText>
              <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                {coupon.hint}
              </AppText>
            </View>
            <View style={styles.codePill}>
              <AppText family="body" weight="700" size={10.5} color={colors.olive}>
                {coupon.code}
              </AppText>
            </View>
          </Pressable>
        ))}
        {couponMsg ? (
          <AppText family="body" weight="600" size={11.5} color={colors.success} align="center" style={{ marginTop: 8 }}>
            {couponMsg}
          </AppText>
        ) : null}
      </Sheet>

      <Sheet
        visible={section === 'payments'}
        onClose={closeSection}
        title="طرق الدفع"
        subtitle="اختار الطريقة اللي تريحك — بتتحفظ للطلبات الجاية"
      >
        {PAYMENT_OPTIONS.map((option) => {
          const active = payment === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
              onPress={() => setPayment(option.id)}
              style={({ pressed }) => [
                styles.rowItem,
                active && styles.rowItemOn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.rowIcon}>
                <Icon name={option.icon} size={16} color={colors.olive} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                  {option.label}
                </AppText>
                <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
                  {option.hint}
                </AppText>
              </View>
              {active ? <Icon name="check" size={18} color={colors.olive} /> : null}
            </Pressable>
          );
        })}
      </Sheet>

      <Sheet
        visible={section === 'help'}
        onClose={closeSection}
        title="المساعدة والدعم"
        subtitle="إحنا في أسوان وبنرد من 10 ص لـ 12 ب"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="اتصل بالدعم"
          onPress={() => {
            void Linking.openURL('tel:+20971234567');
          }}
          style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.rowIcon}>
            <Icon name="phone" size={16} color={colors.olive} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={12.5} lineHeight={19}>
              اتصل بينا
            </AppText>
            <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
              097 123 4567
            </AppText>
          </View>
          <Icon name="chevronLeft" size={15} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="راسل الدعم"
          onPress={() => {
            void Linking.openURL('sms:+20971234567');
          }}
          style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.rowIcon}>
            <Icon name="message" size={16} color={colors.olive} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText family="body" weight="700" size={12.5} lineHeight={19}>
              راسلنا
            </AppText>
            <AppText family="body" size={10.5} color={colors.muted} lineHeight={16}>
              بنرد في أقل من ساعة
            </AppText>
          </View>
          <Icon name="chevronLeft" size={15} color={colors.muted} />
        </Pressable>
        <View style={styles.faq}>
          <AppText family="display" weight="700" size={12} lineHeight={19}>
            أسئلة متكررة
          </AppText>
          <AppText family="body" size={11} color={colors.muted} lineHeight={18} style={{ marginTop: 6 }}>
            • الأوردر بيتأكد امتى؟ أول ما تضغط «أكد الطلب» بيوصل للمطعم فورًا.
          </AppText>
          <AppText family="body" size={11} color={colors.muted} lineHeight={18}>
            • أقدر أطلب من أكتر من مطعم؟ لأ، الطلب بيتقفل على مطعم واحد كل مرة.
          </AppText>
          <AppText family="body" size={11} color={colors.muted} lineHeight={18}>
            • بتوصلوا فين؟ أسوان والجزيرة والصداقة.
          </AppText>
        </View>
      </Sheet>

      <Sheet
        visible={section === 'about'}
        onClose={closeSection}
        title="عن كيميت"
        subtitle="أكل البلد، لحد باب البيت"
      >
        <AppText family="body" size={12} color={colors.muted} lineHeight={21}>
          كيميت تطبيق توصيل أكل أسواني، بيعمل بين مطاعم أسوان وأهلها. بنختار المطاعم بإيدينا،
          وبنوصل الأوردر لباب البيت بدفء وكرم النيل.
        </AppText>
        <View style={styles.aboutGrid}>
          <AboutFact icon="pin" title="أسوان" note="مقرنا وكل مطاعمنا" />
          <AboutFact icon="scooter" title="توصيل سريع" note="مندوبين من البلد" />
          <AboutFact icon="heart" title="دعم محلي" note="كل أوردر بيرجع للمطعم" />
          <AboutFact icon="star" title="إصدار 1.0.0" note="أول نسخة من كيميت" />
        </View>
      </Sheet>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText family="display" weight="800" size={19} color={colors.olive} align="center" lineHeight={26}>
        {value}
      </AppText>
      <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={16}>
        {label}
      </AppText>
    </View>
  );
}

function AboutFact({ icon, title, note }: { icon: IconName; title: string; note: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={15} color={colors.olive} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText family="body" weight="700" size={11.5} lineHeight={18}>
          {title}
        </AppText>
        <AppText family="body" size={10} color={colors.muted} lineHeight={15}>
          {note}
        </AppText>
      </View>
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
  menu: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 14,
    marginTop: 16,
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
  rowItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 9,
  },
  rowItemOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  codePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  sheetEmpty: { alignItems: 'center', paddingVertical: 28 },
  faq: {
    marginTop: 6,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  aboutGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  fact: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    width: '47%',
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
});
