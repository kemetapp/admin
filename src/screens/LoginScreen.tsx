import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { AuthField } from '../components/AuthField';
import { BackButton, PrimaryButton } from '../components/ui';
import { Cartouche } from '../components/motifs';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { colors, shadow } from '../theme';
import { saveSession } from '../state/session';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('010 1234 5678');
  const [password, setPassword] = useState('12345678');
  const [remember, setRemember] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    void saveSession({ name: 'محمود النوبي', phone, memberSince: '2024' });
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          testID="auth-scroll"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.head}>
            <View style={styles.brand}>
              <Cartouche size={28} />
              <AppText family="display" weight="800" size={15} color={colors.olive} lineHeight={22}>
                كيميت
              </AppText>
            </View>
            <BackButton onPress={() => router.replace('/onboarding')} />
          </View>

          <View style={styles.hero}>
            <AppText family="display" weight="800" size={26} lineHeight={36}>
              أهلًا بيك تاني
            </AppText>
            <AppText family="body" size={13} lineHeight={22} color={colors.muted} style={{ marginTop: 7 }}>
              ادخل بياناتك عشان تطلب من مطاعم أسوان وتتابع أوردرك خطوة بخطوة.
            </AppText>
            <View style={styles.badge}>
              <Icon name="pin" size={13} color={colors.olive} />
              <AppText family="body" weight="600" size={10.5} color="#4B5B2A">
                التوصيل في أسوان · كورنيش النيل
              </AppText>
            </View>
          </View>

          <View style={{ marginTop: 22 }}>
            <AuthField
              label="رقم الموبايل"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="01xxxxxxxxx"
            />
            <AuthField
              label="كلمة السر"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              secure
              placeholder="••••••••"
            />
          </View>

          <View style={styles.row}>
            <Pressable
              onPress={() => setRemember((v) => !v)}
              style={styles.remember}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember ? <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} /> : null}
              </View>
              <AppText family="body" weight="500" size={11.5} color={colors.muted}>
                فاكرني
              </AppText>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setResetPhone(phone);
                setSent(false);
                setForgotOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="نسيت كلمة السر"
            >
              <AppText family="body" weight="600" size={11.5} color={colors.olive}>
                نسيت كلمة السر؟
              </AppText>
            </Pressable>
          </View>

          <PrimaryButton label="دخول" onPress={submit} style={{ marginTop: 14 }} />

          <Divider />

          <SocialButton label="متابعة بحساب Google" onPress={submit} />

          <Pressable onPress={() => router.replace('/signup')} style={{ marginTop: 18 }} hitSlop={8}>
            <AppText family="body" size={11.5} color={colors.muted} align="center">
              ماعندكش حساب؟{' '}
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                أنشئ حساب جديد
              </AppText>
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Sheet
        visible={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="استعادة كلمة السر"
        subtitle="اكتب رقمك وهنبعتلك كود تأكيد"
      >
        {sent ? (
          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
            <View style={styles.sentIcon}>
              <Icon name="check" size={22} color={colors.olive} strokeWidth={2.6} />
            </View>
            <AppText family="display" weight="700" size={14} align="center" style={{ marginTop: 10 }}>
              بعتنالك كود على {resetPhone || phone}
            </AppText>
            <AppText family="body" size={11.5} color={colors.muted} align="center" lineHeight={19} style={{ marginTop: 6 }}>
              الكود التجريبي 1234 — استخدمه لتغيير كلمة السر.
            </AppText>
            <PrimaryButton
              label="تمام"
              onPress={() => setForgotOpen(false)}
              style={{ marginTop: 16, width: '100%' }}
            />
          </View>
        ) : (
          <>
            <AuthField
              label="رقم الموبايل"
              icon="phone"
              value={resetPhone}
              onChangeText={setResetPhone}
              keyboardType="phone-pad"
              placeholder="01xxxxxxxxx"
            />
            <PrimaryButton
              label="ابعت كود الاستعادة"
              onPress={() => setSent(true)}
              disabled={!resetPhone.trim()}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </Sheet>
    </Screen>
  );
}

export function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <AppText family="body" weight="500" size={11} color={colors.muted}>
        أو
      </AppText>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.social, pressed && { opacity: 0.8 }]}
    >
      <AppText family="display" weight="800" size={15} color="#4285F4" align="center" lineHeight={20}>
        G
      </AppText>
      <AppText family="body" weight="600" size={12.5} color={colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 26 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    minHeight: 44,
  },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  hero: { marginTop: 26 },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.oliveSoft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(184,134,47,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  remember: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  sentIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  divider: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  social: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    ...shadow,
  },
});
