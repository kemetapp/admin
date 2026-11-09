import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { BackButton } from '../components/ui';
import { Screen } from '../components/Screen';
import { colors, shadow } from '../theme';
import { markAllRead, markRead, useNotifications, type NotificationItem } from '../state/notifications';

const KIND: Record<NotificationItem['kind'], { icon: IconName; tint: string; bg: string }> = {
  order: { icon: 'scooter', tint: colors.olive, bg: colors.oliveSoft },
  offer: { icon: 'tag', tint: colors.goldDeep, bg: colors.goldSoft },
  info: { icon: 'bell', tint: colors.clay, bg: 'rgba(180,86,47,0.10)' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const items = useNotifications();
  const unread = items.filter((item) => !item.read).length;

  return (
    <Screen>
      <View style={styles.head}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText family="display" weight="800" size={20} lineHeight={28}>
            الإشعارات
          </AppText>
          <AppText family="body" size={11} color={colors.muted} lineHeight={17}>
            {unread ? `${unread} إشعار جديد` : 'كل الإشعارات مقروءة'}
          </AppText>
        </View>
        {unread ? (
          <Pressable
            onPress={markAllRead}
            accessibilityRole="button"
            accessibilityLabel="تحديد الكل كمقروء"
            hitSlop={8}
            style={({ pressed }) => [styles.markAll, pressed && { opacity: 0.7 }]}
          >
            <Icon name="check" size={13} color={colors.olive} strokeWidth={2.4} />
            <AppText family="body" weight="600" size={11} color={colors.olive}>
              مقروء كله
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const kind = KIND[item.kind];
          return (
            <Pressable
              key={item.id}
              testID={`notification-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}، ${item.body}`}
              accessibilityState={{ selected: !item.read }}
              onPress={() => markRead(item.id)}
              style={({ pressed }) => [
                styles.card,
                !item.read && styles.cardUnread,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: kind.bg }]}>
                <Icon name={kind.icon} size={18} color={kind.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText family="body" weight="700" size={12.5} lineHeight={19} style={{ flex: 1 }}>
                    {item.title}
                  </AppText>
                  {!item.read ? <View style={styles.dot} /> : null}
                </View>
                <AppText family="body" size={11.5} lineHeight={18} color={colors.muted} style={{ marginTop: 3 }}>
                  {item.body}
                </AppText>
                <AppText family="body" size={10} color={colors.muted} lineHeight={16} style={{ marginTop: 6 }}>
                  {item.when}
                </AppText>
              </View>
            </Pressable>
          );
        })}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="bell" size={38} color={colors.sand2} />
            <AppText family="display" weight="700" size={15} align="center" style={{ marginTop: 12 }}>
              مفيش إشعارات
            </AppText>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="العودة للرئيسية"
          style={({ pressed }) => [styles.backHome, pressed && { opacity: 0.8 }]}
        >
          <AppText family="body" weight="600" size={12} color={colors.olive}>
            العودة للرئيسية
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  markAll: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.oliveSoft,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: colors.goldLine,
    backgroundColor: '#F8F9EE',
    ...(shadow as object),
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.clay },
  empty: { alignItems: 'center', paddingVertical: 48 },
  backHome: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
