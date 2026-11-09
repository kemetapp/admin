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
import { WingedScarab } from '../components/motifs';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { colors, shadow } from '../theme';
import { clearGuest, markGuest, saveSession } from '../state/session';
import { authErrorMessage, isValidEgyptianPhone, signInWithPhone } from '../api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError(null);

    if (!isValidEgyptianPhone(phone)) {
      setError('اكتب رقم موبايل مصري صح — 11 رقم ويبدأ بـ010 أو 011 أو 012 أو 015.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة السر لازم 6 حروف على الأقل.');
      return;
    }

    setBusy(true);
    try {
      const user = await signInWithPhone({ phone, password });
      await clearGuest();
      await saveSession({
        name: user.name,
        phone: user.phone,
        memberSince: String(new Date().getFullYear()),
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const browseAsGuest = () => {
    void markGuest();
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
              <WingedScarab width={44} color={colors.goldDeep} />
              <View>
                <AppText
                  family="display"
                  weight="800"
                  size={16}
                  color={colors.oliveDeep}
                  lineHeight={22}
                  style={styles.wordmark}
                >
                  KEMET
                </AppText>
                <AppText family="body" size={8.5} color={colors.muted} style={styles.wordmarkSub}>
                  DELIVERY APP
                </AppText>
              </View>
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

          {error ? (
            <View style={styles.errorBox}>
              <AppText family="body" weight="600" size={11.5} color={colors.danger} lineHeight={18}>
                {error}
              </AppText>
            </View>
          ) : null}

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

          <PrimaryButton
            label={busy ? 'بيتم الدخول…' : 'دخول'}
            onPress={submit}
            disabled={busy}
            style={{ marginTop: 14 }}
          />

          <Divider />

          <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={17}>
            الدخول بحساب Google هيتضاف في تحديث قادم.
          </AppText>

          <Pressable onPress={() => router.replace('/signup')} style={{ marginTop: 18 }} hitSlop={8}>
            <AppText family="body" size={11.5} color={colors.muted} align="center">
              ماعندكش حساب؟{' '}
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                أنشئ حساب جديد
              </AppText>
            </AppText>
          </Pressable>

          <Pressable
            onPress={browseAsGuest}
            accessibilityRole="button"
            accessibilityLabel="تصفح كزائر"
            style={{ marginTop: 12 }}
            hitSlop={8}
          >
            <AppText family="body" weight="600" size={12} color={colors.muted} align="center">
              تصفح كزائر
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
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  wordmark: { letterSpacing: 2.4 },
  wordmarkSub: { letterSpacing: 1.6, marginTop: -1 },
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
  errorBox: {
    backgroundColor: 'rgba(166,58,43,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(166,58,43,0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
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
