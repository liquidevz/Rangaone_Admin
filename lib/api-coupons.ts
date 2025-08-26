// lib/api-coupons.ts
import { getAdminAccessToken } from './auth';

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  title: string;
  description: string;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicableProducts: {
    portfolios: string[];
    bundles: string[];
    applyToAll: boolean;
  };
  minOrderValue: number;
  maxDiscountAmount: number;
  userRestrictions: {
    allowedUsers: string[];
    blockedUsers: string[];
    newUsersOnly: boolean;
    oneUsePerUser: boolean;
  };
  status: 'active' | 'inactive' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  title: string;
  description: string;
  usageLimit: number;
  validFrom: string;
  validUntil: string;
  applicableProducts: {
    portfolios: string[];
    bundles: string[];
    applyToAll: boolean;
  };
  minOrderValue: number;
  maxDiscountAmount: number;
  userRestrictions: {
    newUsersOnly: boolean;
    oneUsePerUser: boolean;
  };
}

export interface CouponsResponse {
  success: boolean;
  coupons: Coupon[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCoupons: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidateCouponRequest {
  code: string;
  productType: 'Bundle' | 'Portfolio';
  productId: string;
  orderValue: number;
}

export interface ValidateCouponResponse {
  success: boolean;
  message: string;
  coupon: {
    code: string;
    title: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
  discount: number;
  finalAmount: number;
  originalAmount: number;
  savings: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchCoupons(params?: {
  page?: number;
  limit?: number;
  status?: string;
  discountType?: string;
  search?: string;
}): Promise<CouponsResponse> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.discountType) searchParams.set('discountType', params.discountType);
  if (params?.search) searchParams.set('search', params.search);

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons?${searchParams}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch coupons');
  return response.json();
}

export async function fetchCouponById(id: string): Promise<{ success: boolean; coupon: Coupon }> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch coupon');
  return response.json();
}

export async function createCoupon(data: CreateCouponRequest): Promise<{ success: boolean; coupon: Coupon }> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create coupon');
  }
  return response.json();
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<{ success: boolean; coupon: Coupon }> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update coupon');
  }
  return response.json();
}

export async function deleteCoupon(id: string): Promise<{ success: boolean }> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete coupon');
  }
  return response.json();
}

export async function validateCoupon(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
  const token = getAdminAccessToken();
  if (!token) throw new Error('Admin authentication required');

  const response = await fetch(`${API_BASE_URL}/api/admin/coupons/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate coupon');
  }
  return response.json();
}