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
import { colors } from '../theme';
import { clearGuest, markGuest, saveSession } from '../state/session';
import { Divider } from './LoginScreen';
import { authErrorMessage, isValidEgyptianPhone, signUpWithPhone } from '../api/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(true);
  const [legalOpen, setLegalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setError(null);

    if (name.trim().length < 3) {
      setError('اكتب اسمك بالكامل (3 حروف على الأقل).');
      return;
    }
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
      const user = await signUpWithPhone({ name, phone, password });
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
              أنشئ حسابك
            </AppText>
            <AppText family="body" size={13} lineHeight={22} color={colors.muted} style={{ marginTop: 7 }}>
              دقيقة واحدة وتقدر تطلب من أي مطعم في أسوان.
            </AppText>
          </View>

          <View style={{ marginTop: 20 }}>
            <AuthField
              label="الاسم بالكامل"
              icon="user"
              value={name}
              onChangeText={setName}
              placeholder="اسمك"
            />
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

          <Pressable
            style={styles.terms}
            onPress={() => setTerms((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: terms }}
          >
            <View style={[styles.checkbox, terms && styles.checkboxOn]}>
              {terms ? <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} /> : null}
            </View>
            <AppText family="body" size={11.5} color={colors.muted} lineHeight={19} style={{ flex: 1 }}>
              أوافق على{' '}
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                الشروط والأحكام
              </AppText>{' '}
              و
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                سياسة الخصوصية
              </AppText>
              .
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setLegalOpen(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="اقرأ الشروط والأحكام وسياسة الخصوصية"
            style={{ marginTop: 6, alignSelf: 'flex-start' }}
          >
            <AppText family="body" weight="600" size={10.5} color={colors.olive}>
              اقرأ الشروط والأحكام وسياسة الخصوصية
            </AppText>
          </Pressable>

          <PrimaryButton
            label={busy ? 'بيتم إنشاء الحساب…' : 'إنشاء الحساب'}
            onPress={submit}
            disabled={!terms || busy}
            style={{ marginTop: 16 }}
          />

          <Divider />

          <AppText family="body" size={10.5} color={colors.muted} align="center" lineHeight={17}>
            التسجيل بحساب Google هيتضاف في تحديث قادم.
          </AppText>

          <Pressable onPress={() => router.replace('/login')} style={{ marginTop: 18 }} hitSlop={8}>
            <AppText family="body" size={11.5} color={colors.muted} align="center">
              عندك حساب؟{' '}
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                سجّل الدخول
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
        visible={legalOpen}
        onClose={() => setLegalOpen(false)}
        title="الشروط وسياسة الخصوصية"
        subtitle="باختصار وبالمصري"
      >
        <AppText family="display" weight="700" size={12.5} lineHeight={20}>
          الشروط والأحكام
        </AppText>
        <AppText family="body" size={11.5} color={colors.muted} lineHeight={20} style={{ marginTop: 4 }}>
          • الطلب بيتقفل على مطعم واحد كل مرة، وبيتأكد أول ما تدوس «أكد الطلب».
          {'\n'}• الأسعار بالجنيه المصري وشاملة الضريبة، ورسوم التوصيل بتظهر قبل الدفع.
          {'\n'}• لو المطعم قفل أو حصلت مشكلة، بنبلغك ونرجّع المبلغ كامل.
        </AppText>
        <AppText family="display" weight="700" size={12.5} lineHeight={20} style={{ marginTop: 14 }}>
          سياسة الخصوصية
        </AppText>
        <AppText family="body" size={11.5} color={colors.muted} lineHeight={20} style={{ marginTop: 4 }}>
          • بناخد رقم الموبايل والعنوان عشان نوصل الطلب بس.
          {'\n'}• بياناتك محفوظة على جهازك ومش بنشاركها مع أي حد غير المطعم والمندوب.
          {'\n'}• تقدر تمسح بياناتك في أي وقت من إعدادات الحساب.
        </AppText>
        <PrimaryButton
          label="فهمت"
          onPress={() => setLegalOpen(false)}
          style={{ marginTop: 16 }}
        />
      </Sheet>
    </Screen>
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
  hero: { marginTop: 24 },
  terms: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: 'rgba(166,58,43,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(166,58,43,0.28)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 10,
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
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxOn: { backgroundColor: colors.olive, borderColor: colors.olive },
});
