import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * بيقرأ إعداد «تقليل الحركة» من نظام التشغيل.
 *
 * القاعدة المرجعية (ui-ux-pro-max · Animation / Reduced Motion):
 * احترم تفضيل المستخدم للحركة، والحركة الزخرفية مش محتاجة تشتغل أصلًا.
 * الطبقة الوحيدة اللي بنحرّكها زخرفيًا هي انتقالات الشاشات والكاروسيل.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduced(enabled);
      })
      .catch(() => {
        /* الإعداد مش متاح على المنصة دي — نسيب الحركة زي ما هي */
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduced(enabled);
    });

    return () => {
      alive = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
