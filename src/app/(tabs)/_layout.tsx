import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="favorites" options={{ title: 'المفضلة' }} />
      <Tabs.Screen name="cart-slot" options={{ title: 'السلة' }} />
      <Tabs.Screen name="orders" options={{ title: 'طلباتي' }} />
      <Tabs.Screen name="account" options={{ title: 'حسابي' }} />
      {/* البحث اتشال من الشريط، لكن المسار لسه موجود
          لأن شريط البحث في الرئيسية بيفتحه. */}
      <Tabs.Screen name="search" options={{ title: 'بحث' }} />
    </Tabs>
  );
}
