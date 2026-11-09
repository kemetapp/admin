import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seedCart, type CartLine } from '../data/mock';
import { loadJSON, saveJSON } from './storage';
import { useSettings } from '../api/settings';

type AddLineInput = Omit<CartLine, 'key'>;
type SavedCart = { lines: CartLine[]; promo: string | null };

const CART_KEY = 'cart';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  /** ضريبة محسوبة من نسبة الضريبة في إعدادات اللوحة. */
  tax: number;
  /** أقل مبلغ للطلب — من الإعدادات. */
  minOrder: number;
  promo: string | null;
  /** المطعم اللي السلة بتاعته — الطلب بيتقفل على مطعم واحد. */
  restaurantId: string | null;
  restaurantName: string | null;
  addLine: (line: AddLineInput) => void;
  /** بيمسح السلة ويحط الصنف الجديد (لما المستخدم يوافق على تغيير المطعم). */
  replaceCart: (line: AddLineInput) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeLine: (key: string) => void;
  clearAll: () => void;
  applyPromo: (code: string) => { ok: boolean; message: string };
  clearPromo: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const DISCOUNT_VALUE = 25;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const [lines, setLines] = useState<CartLine[]>(seedCart);
  const [promo, setPromo] = useState<string | null>('KEMET25');
  const [hydrated, setHydrated] = useState(false);

  // استرجاع السلة المحفوظة أول ما التطبيق يفتح
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadJSON<SavedCart>(CART_KEY);
      if (!alive) return;
      if (saved) {
        setLines(Array.isArray(saved.lines) ? saved.lines : []);
        setPromo(saved.promo ?? null);
      }
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // حفظ أي تغيير في السلة
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(CART_KEY, { lines, promo } satisfies SavedCart);
  }, [lines, promo, hydrated]);

  const addLine = useCallback((line: AddLineInput) => {
    setLines((prev) => {
      const signature = line.options.join('|');
      const existing = prev.find(
        (l) => l.productId === line.productId && l.options.join('|') === signature,
      );
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, qty: l.qty + line.qty } : l));
      }
      return [
        ...prev,
        { ...line, key: `${line.productId}-${Date.now()}-${Math.round(Math.random() * 999)}` },
      ];
    });
  }, []);

  /** بيمسح السلة كلها ويبدأ بصنف واحد من مطعم تاني. */
  const replaceCart = useCallback((line: AddLineInput) => {
    setLines([
      { ...line, key: `${line.productId}-${Date.now()}-${Math.round(Math.random() * 999)}` },
    ]);
  }, []);

  const increment = useCallback((key: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)));
  }, []);

  const decrement = useCallback((key: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearAll = useCallback(() => setLines([]), []);

  const applyPromo = useCallback(
    (code: string) => {
      if (!settings.couponsEnabled) {
        return { ok: false, message: 'الكوبونات مش مفعّلة حاليًا' };
      }
      const clean = code.trim().toUpperCase();
      if (clean === 'KEMET25') {
        setPromo('KEMET25');
        return { ok: true, message: `تم تطبيق خصم ${DISCOUNT_VALUE} ج.م` };
      }
      if (clean === 'ASWAN0') {
        setPromo('ASWAN0');
        return { ok: true, message: 'التوصيل بقى مجاني' };
      }
      return { ok: false, message: 'الكود مش صحيح' };
    },
    [settings.couponsEnabled],
  );

  const clearPromo = useCallback(() => setPromo(null), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const delivery =
      lines.length === 0
        ? 0
        : promo === 'ASWAN0' ||
            (settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver)
          ? 0
          : settings.deliveryFee;
    const tax = Math.round((subtotal * settings.taxPercent) / 100);
    const discount =
      promo === 'KEMET25' && subtotal > 0
        ? Math.min(DISCOUNT_VALUE, settings.maxDiscount, subtotal)
        : 0;
    const total = Math.max(0, subtotal + delivery + tax - discount);
    const first = lines[0];
    return {
      lines,
      count,
      subtotal,
      delivery,
      discount,
      tax,
      minOrder: settings.minOrder,
      total,
      promo,
      restaurantId: first ? first.restaurantId : null,
      restaurantName: first ? first.restaurantName : null,
      addLine,
      replaceCart,
      increment,
      decrement,
      removeLine,
      clearAll,
      applyPromo,
      clearPromo,
    };
  }, [
    lines,
    promo,
    settings,
    addLine,
    replaceCart,
    increment,
    decrement,
    removeLine,
    clearAll,
    applyPromo,
    clearPromo,
  ]);

  if (!hydrated) return null;

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
