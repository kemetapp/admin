import type { Doc } from '../../lib/db';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type OperatingStatus = 'active' | 'suspended' | 'closed' | 'inactive';

export type RestaurantRow = Doc & {
  name?: string;
  nameEn?: string;
  description?: string;
  cuisine?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  area?: string;
  city?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  commission?: number;
  minOrder?: number;
  logoUrl?: string;
  image?: string;
  coverUrl?: string;
  approvalStatus?: ApprovalStatus;
  operatingStatus?: OperatingStatus;
  active?: boolean;
  createdAt?: { toMillis?: () => number };
  workingHours?: Record<string, { open?: string; close?: string; closed?: boolean }>;
  documents?: { name: string; url?: string; status?: string }[];
};

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export const OPERATING_LABEL: Record<OperatingStatus, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  closed: 'مغلق مؤقتًا',
  inactive: 'غير نشط',
};

export const APPROVAL_TONE: Record<ApprovalStatus, string> = {
  pending: 'pending',
  approved: 'delivered',
  rejected: 'cancelled',
};

export const OPERATING_TONE: Record<OperatingStatus, string> = {
  active: 'delivered',
  suspended: 'cancelled',
  closed: 'pending',
  inactive: 'off',
};

/** حالة الاعتماد — بتشتق من الحقل، ولو مش موجود نفترض معتمد (توافق مع البيانات القديمة). */
export function approvalOf(row: RestaurantRow): ApprovalStatus {
  const value = row.approvalStatus;
  if (value === 'pending' || value === 'approved' || value === 'rejected') return value;
  return row.active === false ? 'pending' : 'approved';
}

/** حالة التشغيل — منفصلة عن الاعتماد. */
export function operatingOf(row: RestaurantRow): OperatingStatus {
  const value = row.operatingStatus;
  if (value === 'active' || value === 'suspended' || value === 'closed' || value === 'inactive') {
    return value;
  }
  return row.active === false ? 'suspended' : 'active';
}

export const phoneOf = (row: RestaurantRow) =>
  typeof row.phone === 'string' ? row.phone : typeof row.ownerPhone === 'string' ? row.ownerPhone : '';

export const textOf = (value: unknown) => (typeof value === 'string' ? value : '');
export const numOf = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
export const millisOf = (value: unknown) =>
  (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;

export function initialsOf(row: RestaurantRow): string {
  const name = textOf(row.name).trim();
  return name ? name.charAt(0) : 'م';
}
