import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { AppText } from '../components/AppText';
import { Icon } from '../components/Icon';
import { Lotus } from '../components/motifs';
import { PageShell } from '../components/PageShell';
import { colors, fonts } from '../theme';
import { db } from '../lib/firebase';
import { getSession } from '../state/session';

type Idea = {
  id: string;
  title: string;
  body?: string;
  votes?: number;
  author?: string;
  createdAt?: { toMillis?: () => number };
};

/** مجتمع كيميت — العملاء بيقترحوا أفكار ويصوّتوا على أفكار غيرهم. */
export default function CommunityScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [voted, setVoted] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'suggestions'),
      (snap) => {
        const rows = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Idea, 'id'>) }));
        rows.sort((a, b) => {
          const diff = (b.votes ?? 0) - (a.votes ?? 0);
          if (diff !== 0) return diff;
          return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
        });
        setIdeas(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, []);

  const submit = async () => {
    const cleanTitle = title.trim();
    if (cleanTitle.length < 4 || sending) {
      setNote('اكتب عنوان واضح للفكرة (4 حروف على الأقل)');
      return;
    }
    setSending(true);
    setNote(null);
    try {
      const session = await getSession();
      await addDoc(collection(db, 'suggestions'), {
        title: cleanTitle,
        body: body.trim(),
        votes: 0,
        author: session?.name ?? 'عميل كيميت',
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setBody('');
      setNote('تم — فكرتك بقت في المجتمع ✓');
    } catch {
      setNote('الإرسال فشل — جرّب تاني');
    } finally {
      setSending(false);
    }
  };

  const vote = async (idea: Idea) => {
    if (voted.includes(idea.id)) return;
    setVoted((prev) => [...prev, idea.id]);
    try {
      await updateDoc(doc(db, 'suggestions', idea.id), { votes: increment(1) });
    } catch {
      setVoted((prev) => prev.filter((id) => id !== idea.id));
    }
  };

  return (
    <PageShell
      title="مجتمع كيميت"
      subtitle="ساعدنا نطوّر التطبيق — اقترح فكرة أو صوّت على أفكار غيرك"
    >
      <View style={styles.card}>
        <View style={styles.secHead}>
          <Lotus size={12} />
          <AppText family="display" weight="700" size={13}>
            عندك فكرة؟
          </AppText>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="الفكرة في سطر — مثال: أضيفوا دفع بالبطاقة"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="تفاصيل إضافية (اختياري)"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <Pressable
          onPress={() => void submit()}
          disabled={sending}
          accessibilityRole="button"
          accessibilityLabel="إرسال الاقتراح"
          style={({ pressed }) => [styles.sendBtn, (pressed || sending) && { opacity: 0.85 }]}
        >
          <AppText family="body" weight="700" size={12} color={colors.white}>
            {sending ? 'بيتم الإرسال…' : 'أرسل الفكرة'}
          </AppText>
        </Pressable>
        {note ? (
          <AppText family="body" size={10.5} color={colors.muted} style={{ marginTop: 6 }}>
            {note}
          </AppText>
        ) : null}
      </View>

      <View style={styles.secHead}>
        <Lotus size={13} />
        <AppText family="display" weight="700" size={13.5}>
          أفكار المجتمع ({ideas.length})
        </AppText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.olive} />
        </View>
      ) : ideas.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="star" size={30} color={colors.sand2} />
          <AppText family="display" weight="700" size={13} align="center" style={{ marginTop: 8 }}>
            لسه مفيش أفكار
          </AppText>
          <AppText family="body" size={11} color={colors.muted} align="center" lineHeight={18}>
            كن أول واحد يقترح تحسين.
          </AppText>
        </View>
      ) : (
        ideas.map((idea) => {
          const isVoted = voted.includes(idea.id);
          return (
            <View key={idea.id} style={styles.idea}>
              <Pressable
                onPress={() => void vote(idea)}
                accessibilityRole="button"
                accessibilityLabel={`صوّت لفكرة ${idea.title}`}
                style={[styles.vote, isVoted && styles.voteOn]}
              >
                <Icon name="chevronDown" size={12} color={isVoted ? colors.white : colors.olive} />
                <AppText
                  family="body"
                  weight="800"
                  size={12}
                  color={isVoted ? colors.white : colors.olive}
                >
                  {idea.votes ?? 0}
                </AppText>
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText family="body" weight="700" size={12.5} lineHeight={19}>
                  {idea.title}
                </AppText>
                {idea.body ? (
                  <AppText
                    family="body"
                    size={11}
                    color={colors.muted}
                    lineHeight={18}
                    style={{ marginTop: 2 }}
                  >
                    {idea.body}
                  </AppText>
                ) : null}
                <AppText family="body" size={9.5} color={colors.muted} style={{ marginTop: 4 }}>
                  {idea.author ?? 'عميل'}
                </AppText>
              </View>
            </View>
          );
        })
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.goldSoft,
    marginBottom: 14,
  },
  secHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 11,
    height: 42,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'right',
    marginBottom: 7,
  },
  multiline: { height: 68, paddingTop: 10, textAlignVertical: 'top' },
  sendBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { paddingVertical: 30, alignItems: 'center' },
  empty: {
    alignItems: 'center',
    paddingVertical: 26,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  idea: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  vote: {
    width: 44,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.oliveSoft,
    alignItems: 'center',
    gap: 1,
  },
  voteOn: { backgroundColor: colors.olive, borderColor: colors.olive },
});
