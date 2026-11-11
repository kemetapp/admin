import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { BackButton } from '../components/ui';
import { colors, fonts } from '../theme';
import { db } from '../lib/firebase';
import { getChatId } from '../state/chat';
import { getSession } from '../state/session';

type Message = { id: string; text?: string; sender?: string; createdAt?: { toMillis?: () => number } };

const millis = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

/** شات مباشر بين العميل والإدارة — الرسائل لحظية من Firestore. */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);

  useEffect(() => {
    void getChatId().then(setChatId);
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(
          snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Message, 'id'>) })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [chatId]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || !chatId || sending) return;
    setSending(true);
    try {
      const session = await getSession();
      await setDoc(
        doc(db, 'chats', chatId),
        {
          customerId: chatId,
          name: session?.name ?? 'زائر',
          phone: session?.phone ?? '',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: body,
        sender: 'customer',
        createdAt: serverTimestamp(),
      });
      setText('');
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    } catch {
      /* الشبكة وقعت — المستخدم يقدر يحاول تاني */
    } finally {
      setSending(false);
    }
  }, [text, chatId, sending]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6 }]}>
      <View style={styles.head}>
        <BackButton />
        <View style={{ flex: 1, marginStart: 8 }}>
          <AppText family="display" weight="800" size={15}>
            الدعم الفني
          </AppText>
          <AppText family="body" size={10} color={colors.muted}>
            بنرد عليك من هنا
          </AppText>
        </View>
        <View style={styles.online}>
          <View style={styles.dot} />
          <AppText family="body" size={10} color={colors.olive}>
            متصل
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.olive} />
          </View>
        ) : (
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.intro}>
                <Icon name="message" size={26} color={colors.sand2} />
                <AppText family="body" size={11.5} color={colors.muted} align="center" lineHeight={19}>
                  ابدأ المحادثة — اكتب رسالتك والإدارة هترد عليك هنا.
                </AppText>
              </View>
            ) : (
              messages.map((message) => {
                const mine = message.sender === 'customer';
                return (
                  <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    <AppText
                      family="body"
                      size={12}
                      lineHeight={19}
                      color={mine ? colors.white : colors.ink}
                    >
                      {message.text ?? ''}
                    </AppText>
                    <AppText
                      family="body"
                      size={9}
                      color={mine ? 'rgba(255,255,255,0.7)' : colors.muted}
                      style={{ marginTop: 3 }}
                    >
                      {millis(message.createdAt)
                        ? new Date(millis(message.createdAt)).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </AppText>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="اكتب رسالتك…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={() => void send()}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="إرسال"
            style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}
          >
            <Icon name="message" size={17} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldLine,
  },
  online: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.olive },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, gap: 8, flexGrow: 1 },
  intro: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, paddingHorizontal: 24 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
  },
  mine: { alignSelf: 'flex-start', backgroundColor: colors.olive, borderTopStartRadius: 4 },
  theirs: {
    alignSelf: 'flex-end',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopEndRadius: 4,
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.cream,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'right',
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
