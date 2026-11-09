import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getSession, isOnboarded } from '../state/session';

type Target = '/onboarding' | '/login' | '/(tabs)';

/**
 * شاشة البداية: بتقرر فين يروح المستخدم بناءً على اللي محفوظ محليًا.
 * - عنده جلسة  → الرئيسية
 * - خلّص الأونبوردنج → تسجيل الدخول
 * - أول مرة  → الأونبوردنج
 */
export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const session = await getSession();
      if (!alive) return;
      if (session) {
        setTarget('/(tabs)');
        return;
      }
      const onboarded = await isOnboarded();
      if (!alive) return;
      setTarget(onboarded ? '/login' : '/onboarding');
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!target) return null;
  return <Redirect href={target} />;
}
