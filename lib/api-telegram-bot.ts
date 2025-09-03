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
  telegram_user_id?: number;
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
    console.log('Request options:', {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body
    });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If JSON parsing fails, create a basic error object
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('API Error Response:', errorData);
      
      // Only log validation errors if they exist
      if (errorData.errors) {
        console.error('Validation errors:', errorData.errors);
        if (typeof errorData.errors === 'object') {
          Object.entries(errorData.errors).forEach(([field, errors]) => {
            console.error(`Field "${field}" errors:`, errors);
          });
        }
      }
      
      // Return a more user-friendly error message
      const errorMessage = errorData.message || errorData.error || errorData.detail || `Server error (${response.status})`;
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log('API Response data:', responseData);
    return responseData;
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
  // Add required ID field based on API docs
  const productData = {
    id: `product_${Date.now()}`, // Generate unique ID
    name: data.name,
    description: data.description
  };
  
  return await apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
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
  try {
    return await apiRequest('/api/groups/unmapped');
  } catch (error) {
    console.warn('Failed to fetch unmapped groups:', error);
    return [];
  }
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

// Health API
export const getTelegramHealth = async (): Promise<{
  success: boolean;
  botInitialized: boolean;
  hasToken: boolean;
  timestamp: string;
}> => {
  return await apiRequest('/api/telegram/health');
};

// New: Kick a user from a Telegram group (by product or group)
export interface KickUserRequestByProduct {
  product_id: string;
  telegram_user_id: number;
}

export interface KickUserRequestByGroup {
  telegram_group_id: string;
  telegram_user_id: number;
}

export interface KickUserResponse {
  success: boolean;
  message: string;
}

export const kickUser = async (
  data: KickUserRequestByProduct | KickUserRequestByGroup
): Promise<KickUserResponse> => {
  return await apiRequest('/api/telegram/kick-user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// New: Regenerate invite link for a group (by product or group)
export interface RegenerateInviteRequestByProduct {
  product_id: string;
  token?: string;
}

export interface RegenerateInviteRequestByGroup {
  telegram_group_id: string;
  token?: string;
}

export interface RegenerateInviteResponse {
  success: boolean;
  message: string;
  invite_link: string | null;
  token: string;
}

export const regenerateInvite = async (
  data: RegenerateInviteRequestByProduct | RegenerateInviteRequestByGroup
): Promise<RegenerateInviteResponse> => {
  return await apiRequest('/api/telegram/invite/regenerate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// New: Users who joined via invite link with context
export interface JoinedUserRecord {
  user: {
    id: number;
    email: string;
    telegram_user_id?: number;
  };
  product?: {
    id: string;
    name?: string;
  } | null;
  group?: {
    telegram_group_id: string;
    telegram_group_name?: string;
  } | null;
  subscription?: {
    id: number;
    status: 'active' | 'cancelled' | 'expired';
    subscription_expires_at?: string;
  } | null;
}

export const getJoinedUsers = async (params: {
  product_id?: string;
  telegram_group_id?: string;
  status?: string;
} = {}): Promise<JoinedUserRecord[]> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/users/joined?${queryString}` : '/api/users/joined';
  return await apiRequest(endpoint);
};

// New: Convenience member lists
export interface GroupMemberRecord {
  telegram_user_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  joined_at?: string;
  status?: string;
}

export const getProductMembers = async (productId: string): Promise<GroupMemberRecord[]> => {
  return await apiRequest(`/api/products/${productId}/members`);
};

export const getGroupMembers = async (telegramGroupId: string): Promise<GroupMemberRecord[]> => {
  return await apiRequest(`/api/groups/${telegramGroupId}/members`);
};