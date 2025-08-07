// lib/api-telegram-bot.ts
"use client";

import { fetchWithAuth } from "@/lib/auth";
import { TELEGRAM_API_BASE_URL } from "@/lib/config";

// Always use the Telegram API base URL
const getApiBaseUrl = () => {
  return TELEGRAM_API_BASE_URL;
};

// Log the API base URL for debugging (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Telegram API Base URL:', TELEGRAM_API_BASE_URL);
  console.log('Using proxy for development');
}

// Types based on the actual API documentation
export interface Product {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TelegramGroup {
  id: number;
  telegram_group_id: string;
  telegram_group_name: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  product_id: string;
  status: 'active' | 'cancelled' | 'expired';
  subscription_expires_at: string;
  invite_link_url: string;
  invite_link_expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionsResponse {
  items: Subscription[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  id: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
}

export interface MapProductRequest {
  telegram_group_id: string;
  telegram_group_name: string;
}

export interface CreateSubscriptionRequest {
  email: string;
  product_id?: string;
  product_name?: string;
  expiration_datetime: string;
}

export interface CancelSubscriptionRequest {
  email: string;
  product_id: string;
}

// API client functions
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
         if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       console.error('API Error Response:', errorData);
       console.error('Validation errors:', errorData.errors);
       if (errorData.errors && typeof errorData.errors === 'object') {
         Object.entries(errorData.errors).forEach(([field, errors]) => {
           console.error(`Field "${field}" errors:`, errors);
         });
       }
       throw new Error(errorData.message || errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
     }
    
    return await response.json();
  } catch (error) {
    console.error('Telegram Bot API Error:', error);
    throw error;
  }
};

// Products API
export const getProducts = async (): Promise<Product[]> => {
  const response = await apiRequest('/api/products');
  console.log('getProducts response:', response);
  // The API returns products directly, not wrapped in a data property
  return response || [];
};

export const getProduct = async (productId: string): Promise<Product> => {
  return await apiRequest(`/api/products/${productId}`);
};

export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  return await apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProduct = async (productId: string, data: UpdateProductRequest): Promise<Product> => {
  return await apiRequest(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await apiRequest(`/api/products/${productId}`, {
    method: 'DELETE',
  });
};

// Groups API
export const getGroups = async (): Promise<TelegramGroup[]> => {
  return await apiRequest('/api/groups');
};

export const getUnmappedGroups = async (): Promise<TelegramGroup[]> => {
  return await apiRequest('/api/groups/unmapped');
};

// Mapping API
export const mapProductToGroup = async (productId: string, data: MapProductRequest): Promise<TelegramGroup> => {
  return await apiRequest(`/api/products/${productId}/map`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const unmapProductFromGroup = async (productId: string): Promise<void> => {
  await apiRequest(`/api/products/${productId}/unmap`, {
    method: 'DELETE',
  });
};

// Subscriptions API
export const getSubscriptions = async (params: {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  product_id?: string;
  user_id?: number;
} = {}): Promise<SubscriptionsResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/subscriptions?${queryString}` : '/api/subscriptions';
  
  return await apiRequest(endpoint);
};

export const createSubscription = async (data: CreateSubscriptionRequest): Promise<{
  message: string;
  invite_link: string;
  invite_expires_at: string;
  subscription_expires_at: string;
}> => {
  return await apiRequest('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelSubscription = async (data: CancelSubscriptionRequest): Promise<{ message: string }> => {
  return await apiRequest('/api/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

export const cancelSubscriptionById = async (subscriptionId: number): Promise<{ message: string }> => {
  return await apiRequest(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
  });
};

// Users API
export const getUsers = async (): Promise<User[]> => {
  return await apiRequest('/api/users');
};

// Webhook API
export const testWebhook = async (): Promise<{
  message: string;
  webhook_url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date: string | null;
  last_error_message: string | null;
  max_connections: number;
}> => {
  return await apiRequest('/api/telegram/webhook/test');
};