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
import { colors } from '../theme';
import { saveSession } from '../state/session';
import { Divider, SocialButton } from './LoginScreen';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('محمود النوبي');
  const [phone, setPhone] = useState('010 1234 5678');
  const [password, setPassword] = useState('12345678');
  const [terms, setTerms] = useState(true);
  const [legalOpen, setLegalOpen] = useState(false);

  const submit = () => {
    void saveSession({ name, phone, memberSince: String(new Date().getFullYear()) });
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
            label="إنشاء الحساب"
            onPress={submit}
            disabled={!terms}
            style={{ marginTop: 16 }}
          />

          <Divider />
          <SocialButton label="التسجيل بحساب Google" onPress={submit} />

          <Pressable onPress={() => router.replace('/login')} style={{ marginTop: 18 }} hitSlop={8}>
            <AppText family="body" size={11.5} color={colors.muted} align="center">
              عندك حساب؟{' '}
              <AppText family="body" weight="700" size={11.5} color={colors.olive}>
                سجّل الدخول
              </AppText>
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
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  hero: { marginTop: 24 },
  terms: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
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
