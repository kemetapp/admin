import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Alexandria_400Regular,
  Alexandria_500Medium,
  Alexandria_600SemiBold,
  Alexandria_700Bold,
  Alexandria_800ExtraBold,
} from '@expo-google-fonts/alexandria';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { CartProvider } from '../state/CartContext';
import { addressListStore, addressSelectedStore } from '../state/addresses';
import { favoritesStore } from '../state/favorites';
import { ordersStore } from '../state/orders';
import { readStore } from '../state/notifications';
import { paymentListStore, paymentSelectedStore } from '../state/payment';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useCatalogSync } from '../api/catalog';
import { useSettingsSync } from '../api/settings';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

/* تحميل كامل بعد إضافة صفحات الحساب الجديدة */

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Alexandria_400Regular,
    Alexandria_500Medium,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
    Alexandria_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [loaded, error]);

  // استرجاع الحالة المحفوظة (العنوان، المفضلة، الطلبات، الإشعارات، الدفع).
  useEffect(() => {
    void Promise.all([
      addressListStore.hydrate(),
      addressSelectedStore.hydrate(),
      favoritesStore.hydrate(),
      ordersStore.hydrate(),
      readStore.hydrate(),
      paymentListStore.hydrate(),
      paymentSelectedStore.hydrate(),
    ]);
  }, []);

  const reducedMotion = useReducedMotion();
  useCatalogSync();
  useSettingsSync();

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.cream },
              // الحركة الزخرفية بتتقفل لما المستخدم يفعّل «تقليل الحركة» في النظام.
              animation: reducedMotion ? 'none' : 'slide_from_left',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="restaurant/[id]" />
            <Stack.Screen
              name="item/[id]"
              options={{
                presentation: 'transparentModal',
                animation: reducedMotion ? 'none' : 'fade',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen name="cart" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="tracking" options={{ animation: reducedMotion ? 'none' : 'fade' }} />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="account" />
          </Stack>
        </View>
      </CartProvider>
    </SafeAreaProvider>
  );
}
