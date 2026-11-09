import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { Cartouche, GoldFrame, Lotus, WingedSun } from '../components/motifs';
import { ContactRow } from '../components/ContactRow';
import { PageShell } from '../components/PageShell';
import { categories, products, restaurants } from '../data/mock';
import { colors, shadowStrong } from '../theme';
import { useSettings } from '../api/settings';
import { displayPhone, mailHref, telHref, whatsappHref } from '../utils/contact';

const FACTS: { icon: IconName; title: string; note: string }[] = [
  { icon: 'pin', title: 'أسوان بس', note: 'بنشتغل في مدينتنا ومش بنوزّع مجهودنا على 30 محافظة.' },
  { icon: 'scooter', title: 'مندوبين من البلد', note: 'بيعرفوا الشوارع والجرس والعلامة اللي في الحيطة.' },
  { icon: 'heart', title: 'دعم محلي', note: 'كل جنيه في الأوردر بيرجع لمطعم أسواني.' },
  { icon: 'star', title: 'حساب واضح', note: 'رسوم التوصيل والخصم بيظهروا قبل ما تدفع، مش بعدها.' },
];

export default function AboutScreen() {
  const settings = useSettings();

  return (
    <PageShell title={`عن ${settings.storeName}`}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[colors.oliveLight, colors.oliveDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.heroFill}
        />
        <GoldFrame inset={7} radiusValue={22} opacity={0.35} />

        <View style={styles.heroArt}>
          <WingedSun width={132} color="rgba(243,228,188,0.92)" />
          <View style={{ marginTop: 10 }}>
            <Cartouche size={54} />
          </View>
          <AppText
            family="display"
            weight="800"
            size={24}
            color="#F3E4BC"
            align="center"
            lineHeight={34}
            style={{ marginTop: 12 }}
          >
            كيميت
          </AppText>
          <AppText family="body" size={12} color="rgba(243,228,188,0.8)" align="center" lineHeight={20}>
            أكل البلد، لحد باب البيت
          </AppText>
        </View>

        <View style={styles.heroBar} />
      </View>

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          الحكاية
        </AppText>
      </View>

      <AppText family="body" size={13} color={colors.muted} lineHeight={24}>
        «كيميت» هو الاسم القديم لمصر. اخترناه لأن أسوان بوابة المعابد — فيلة وإدفو وأبو
        سمبل — وفي البلد دي الأكل مش بس أكل، ده كرم وضيافة.
      </AppText>
      <AppText
        family="body"
        size={13}
        color={colors.muted}
        lineHeight={24}
        style={{ marginTop: 10 }}
      >
        بدأنا بسؤال بسيط: ليه لما تطلب أكل من مطعم في أسوان، مبيعرفش مين بيطبخ ولا إمتى
        هيوصل؟ فجمعنا مطاعم البلد في مكان واحد، وخلّينا كل خطوة في الطلب واضحة قدامك.
      </AppText>

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          ليه كيميت؟
        </AppText>
      </View>

      <View style={styles.grid}>
        {FACTS.map((fact) => (
          <View key={fact.title} style={styles.fact}>
            <View style={styles.factIcon}>
              <Icon name={fact.icon} size={15} color={colors.olive} />
            </View>
            <AppText family="body" weight="700" size={12} lineHeight={19}>
              {fact.title}
            </AppText>
            <AppText family="body" size={11} color={colors.muted} lineHeight={18} style={{ marginTop: 3 }}>
              {fact.note}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        <Stat value={String(restaurants.length)} label="مطعم" />
        <View style={styles.divider} />
        <Stat value={String(products.length)} label="صنف" />
        <View style={styles.divider} />
        <Stat value={String(categories.length)} label="قسم" />
      </View>

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          بنوصل فين
        </AppText>
      </View>

      <View style={styles.areaCard}>
        <Icon name="pin" size={16} color={colors.olive} />
        <AppText family="body" size={12.5} lineHeight={21} style={{ flex: 1 }}>
          {settings.serviceAreas}
        </AppText>
      </View>

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          تواصل معانا
        </AppText>
      </View>

      <ContactRow
        icon="phone"
        title="اتصل بينا"
        note={displayPhone(settings.supportPhone)}
        onPress={() => {
          void Linking.openURL(telHref(settings.supportPhone));
        }}
      />
      <ContactRow
        icon="message"
        title="واتساب"
        note="أسرع طريقة للتواصل"
        onPress={() => {
          void Linking.openURL(whatsappHref(settings.whatsapp));
        }}
      />
      <ContactRow
        icon="user"
        title="الإيميل"
        note={settings.email}
        onPress={() => {
          void Linking.openURL(mailHref(settings.email));
        }}
      />

      <View style={styles.footer}>
        <View style={styles.goldLine} />
        <Lotus size={14} />
        <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={18}>
          كيميت · الإصدار 1.0.0 · اتصنع في أسوان
        </AppText>
        <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={18}>
          كل البيانات هنا تجريبية للعرض.
        </AppText>
      </View>
    </PageShell>
  );
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
  hero: {
    height: 230,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.oliveDeep,
    marginTop: 4,
    ...shadowStrong,
  },
  heroFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  heroArt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 14 },
  heroBar: {
    width: 54,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.saffron,
    alignSelf: 'center',
    marginBottom: 18,
    opacity: 0.9,
  },
  secHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 10,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  fact: {
    width: '47.5%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  stats: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.oliveSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 18,
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 30, backgroundColor: colors.goldLine },
  footer: { alignItems: 'center', gap: 6, marginTop: 26 },
  areaCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
  },
  goldLine: {
    width: 46,
    height: 1,
    backgroundColor: colors.goldLineStrong,
    marginBottom: 8,
  },
});
