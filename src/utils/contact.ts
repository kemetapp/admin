/** روابط التواصل — بتحوّل الأرقام للإيميلات الصحيحة للاتصال. */

export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'tel:';
  if (digits.startsWith('0')) return `tel:+20${digits.slice(1)}`;
  return `tel:+${digits}`;
}

export function whatsappHref(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/';
}

export function mailHref(email: string): string {
  return `mailto:${email.trim()}`;
}

/** عرض الرقم بشكل مقروء: 0971234567 → 097 123 4567 */
export function displayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return phone;
}
