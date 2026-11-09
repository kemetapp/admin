import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { SheetHandle } from './motifs';
import { colors, shadowStrong } from '../theme';

/**
 * شيت سفلي قابل لإعادة الاستخدام (بيشتغل على الموبايل والويب).
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <SheetHandle />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <AppText family="display" weight="800" size={17} lineHeight={25}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText family="body" size={11} color={colors.muted} lineHeight={17} style={{ marginTop: 2 }}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              style={styles.close}
            >
              <Icon name="plus" size={16} color={colors.ink} style={{ transform: [{ rotate: '45deg' }] }} />
            </Pressable>
          </View>
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

/** تأكيد سريع (زي «هتمسح سلة مطعم تاني؟»). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmRoot}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIcon}>
            <Icon name="lock" size={20} color={colors.clay} />
          </View>
          <AppText family="display" weight="800" size={16} lineHeight={24} align="center">
            {title}
          </AppText>
          <AppText
            family="body"
            size={12}
            color={colors.muted}
            align="center"
            lineHeight={20}
            style={{ marginTop: 8 }}
          >
            {message}
          </AppText>
          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            style={({ pressed }) => [styles.confirmPrimary, pressed && { opacity: 0.9 }]}
          >
            <AppText family="body" weight="700" size={13.5} color={colors.white} align="center">
              {confirmLabel}
            </AppText>
          </Pressable>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            style={({ pressed }) => [styles.confirmGhost, pressed && { opacity: 0.7 }]}
          >
            <AppText family="body" weight="600" size={12.5} color={colors.muted} align="center">
              {cancelLabel}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.sheetScrim,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.goldLine,
    borderBottomWidth: 0,
    ...shadowStrong,
  },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    paddingHorizontal: 26,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.goldLine,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    ...shadowStrong,
  },
  confirmIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(180,86,47,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(180,86,47,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmPrimary: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.olive,
    borderWidth: 1,
    borderColor: colors.goldLineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  confirmGhost: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
