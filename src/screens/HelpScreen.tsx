import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ContactRow } from '../components/ContactRow';
import { Lotus } from '../components/motifs';
import { PageShell } from '../components/PageShell';
import { colors } from '../theme';
import { useSettings } from '../api/settings';
import { displayPhone, mailHref, telHref, whatsappHref } from '../utils/contact';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'الأوردر بيتأكد امتى؟',
    a: 'أول ما تدوس «أكد الطلب» بيوصل للمطعم فورًا، وبيظهر لك في «طلباتي» بحالة «في الطريق».',
  },
  {
    q: 'أقدر أطلب من أكتر من مطعم؟',
    a: 'لأ — الطلب بيتقفل على مطعم واحد كل مرة، عشان الأكل يوصل سخن وميعاد التوصيل يفضل دقيق.',
  },
  {
    q: 'بتوصلوا فين؟',
    a: 'أسوان والجزيرة والصداقة. وبنوسّع كل شهر لحيات جديدة حسب الطلب.',
  },
  {
    q: 'أقدر أدفع أونلاين؟',
    a: 'حاليًا كاش عند الاستلام أو محفظة إلكترونية (فودافون كاش / إنستاباي). البطاقة البنكية هتتضاف قريب.',
  },
];

export default function HelpScreen() {
  const settings = useSettings();

  return (
    <PageShell
      title="المساعدة والدعم"
      subtitle={`${settings.storeName} في أسوان · بنرد من ${settings.openTime} لـ ${settings.closeTime}`}
    >
      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          اتكلم معانا
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
        title="راسلنا على الإيميل"
        note={settings.email}
        onPress={() => {
          void Linking.openURL(mailHref(settings.email));
        }}
      />

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          أسئلة متكررة
        </AppText>
      </View>

      {FAQ.map((item) => (
        <View key={item.q} style={styles.faq}>
          <AppText family="display" weight="700" size={12.5} lineHeight={20}>
            {item.q}
          </AppText>
          <AppText
            family="body"
            size={11.5}
            color={colors.muted}
            lineHeight={19}
            style={{ marginTop: 5 }}
          >
            {item.a}
          </AppText>
        </View>
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  secHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 10,
  },
  row: {
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
  faq: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    marginBottom: 9,
  },
});
