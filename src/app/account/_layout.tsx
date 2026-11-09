import React from 'react';
import { Stack } from 'expo-router';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { colors } from '../../theme';

export default function AccountLayout() {
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: reducedMotion ? 'none' : 'slide_from_left',
      }}
    />
  );
}
