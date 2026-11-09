import { useCallback, useEffect, useState } from 'react';
import type { ScrollViewInstance } from 'react-native';
import { useIsFocused } from 'expo-router';

/**
 * الرولات الأفقية عندنا متظبطة بـ row-reverse، يعني أول عنصر بيروح أقصى
 * اليمين. عشان كده لازم السكرول يبدأ من الآخر (scrollToEnd) قبل ما المستخدم
 * يلمس الرول — من غير كده أول عنصر بيبان بره الشاشة.
 *
 * بنعيد المحاولة مع onLayout / onContentSizeChange وكمان كل مرة الشاشة تترجع
 * للواجهة، لأن التابس بتتحفظ مخفية ووقتها مفيش قياسات والسكرول مش بيتظبط.
 *
 * بنمسك نسخة الـ ScrollView في state مش في ref، عشان قواعد React Compiler
 * (react-hooks/refs) متعتبرش الهاندلرز «وصول لـ ref أثناء الرندر».
 */
export function useRtlRail() {
  const [node, setNode] = useState<ScrollViewInstance | null>(null);
  const [userMoved, setUserMoved] = useState(false);
  const focused = useIsFocused();

  const alignToStart = useCallback(() => {
    if (!userMoved) {
      node?.scrollToEnd({ animated: false });
    }
  }, [node, userMoved]);

  const onScrollBeginDrag = useCallback(() => {
    setUserMoved(true);
  }, []);

  useEffect(() => {
    if (!focused) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(alignToStart);
    });
    // لو الصفحة مش ظاهرة (rAF بيتوقف) بنظبط بعد لحظة قصيرة كخطة بديلة.
    const timer = setTimeout(alignToStart, 80);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(timer);
    };
  }, [focused, alignToStart]);

  return {
    setRef: setNode,
    node,
    onLayout: alignToStart,
    onContentSizeChange: alignToStart,
    onScrollBeginDrag,
  };
}
