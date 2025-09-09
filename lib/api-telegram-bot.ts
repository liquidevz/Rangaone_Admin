// lib/api-telegram-bot.ts
"use client";

import { fetchWithAuth, getAdminAccessToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

// Use the same base URL as the main API (as confirmed by user)
const getApiBaseUrl = () => {
  return API_BASE_URL;
};

// Log the API base URL for debugging (only in development)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('API Base URL:', API_BASE_URL);
  console.log('getApiBaseUrl() returns:', getApiBaseUrl());
}

// Types based on the actual API documentation
export interface Product {
  id: string | number;
  name: string;
  description: string;
  price?: number;
  category?: string;
  telegram_group?: any;
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
  price?: number;
  category?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
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
    console.log('Making Telegram API request to:', url);
    console.log('Request method:', options.method || 'GET');
    console.log('Base URL:', baseUrl);
    console.log('Endpoint:', endpoint);

    // Get authentication token
    const token = getAdminAccessToken();
    console.log('Authentication token available:', !!token);
    console.log('Token preview:', token ? `${token.substring(0, 10)}...` : 'No token');
    
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options,
    };

    console.log('Request config:', requestConfig);
    
    const response = await fetch(url, requestConfig);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Always try to get response data first
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      responseData = { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    console.log('API Response data:', responseData);
    
    // Check if the response indicates an error (either HTTP status or success field)
    if (!response.ok || responseData.success === false) {
      console.error('API Error Response:', responseData);
      
      // Log validation errors if they exist
      if (responseData.errors) {
        console.error('Validation errors:', responseData.errors);
        if (typeof responseData.errors === 'object') {
          Object.entries(responseData.errors).forEach(([field, errors]) => {
            console.error(`Field "${field}" errors:`, errors);
          });
        }
      }
      
      // Return a more user-friendly error message
      const errorMessage = responseData.error || responseData.message || responseData.detail || `Server error (${response.status})`;
      throw new Error(errorMessage);
    }
    
    return responseData;
  } catch (error) {
    console.error('Telegram Bot API Error:', error);
    throw error;
  }
};

// Products API
export const getProducts = async (): Promise<Product[]> => {
  const response = await apiRequest('/api/admin/telegram/products');
  console.log('getProducts response:', response);
  // API returns { success: true, data: [...], total: number }
  return response.data || [];
};

export const getProduct = async (productId: string): Promise<Product> => {
  const response = await apiRequest(`/api/admin/telegram/products/${productId}`);
  return response.data;
};

export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  // Format the request data according to the API schema
  const productData = {
    name: data.name,
    description: data.description,
    price: data.price || 0,
    category: data.category || 'telegram_product'
  };
  
  console.log('Creating product with data:', productData);
  
  try {
    const response = await apiRequest('/api/admin/telegram/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    
    console.log('Create product response:', response);
    
    // Handle successful response
    if (response.success) {
      // If the API returns the created product data, use it
      if (response.data && Object.keys(response.data).length > 0) {
        return {
          ...response.data,
          price: response.data.price || productData.price,
          category: response.data.category || productData.category,
        };
      }
      
      // Otherwise, return a constructed product object
      return {
        id: Date.now(), // Temporary ID until we can fetch the real one
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        telegram_group: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
    // Handle error response
    throw new Error(response.error || response.message || 'Failed to create product');
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, data: UpdateProductRequest): Promise<Product> => {
  const response = await apiRequest(`/api/admin/telegram/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  
  console.log('Update product response:', response);
  // API returns { success: true, data: {}, message: "Product updated successfully" }
  if (response.success) {
    // Return updated product data or refetch it
    return await getProduct(productId);
  }
  
  throw new Error(response.message || 'Failed to update product');
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const response = await apiRequest(`/api/admin/telegram/products/${productId}`, {
    method: 'DELETE',
  });
  
  console.log('Delete product response:', response);
  // API returns { success: true, message: "Product deleted successfully" }
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete product');
  }
};

// Groups API
export const getGroups = async (): Promise<TelegramGroup[]> => {
  const response = await apiRequest('/api/admin/telegram/groups');
  return response.data || [];
};

export const getUnmappedGroups = async (): Promise<TelegramGroup[]> => {
  try {
    const response = await apiRequest('/api/admin/telegram/groups/unmapped');
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch unmapped groups:', error);
    return [];
  }
};

export const createGroup = async (data: { name: string; description: string; telegram_group_id: string }): Promise<TelegramGroup> => {
  const response = await apiRequest('/api/admin/telegram/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

// Mapping API
export const mapProductToGroup = async (productId: string, data: MapProductRequest): Promise<void> => {
  console.log('mapProductToGroup called with:');
  console.log('Product ID:', productId);
  console.log('Data:', data);
  console.log('Request body:', JSON.stringify(data));
  
  const response = await apiRequest(`/api/admin/telegram/products/${productId}/map`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  console.log('Map product response:', response);
  // API returns { success: true, data: {} }
  if (!response.success) {
    throw new Error(response.message || 'Failed to map product to group');
  }
};

export const unmapProductFromGroup = async (productId: string): Promise<void> => {
  const response = await apiRequest(`/api/admin/telegram/products/${productId}/unmap`, {
    method: 'DELETE',
  });
  
  console.log('Unmap product response:', response);
  // API returns { success: true, message: "string" }
  if (!response.success) {
    throw new Error(response.message || 'Failed to unmap product from group');
  }
};

export const getProductGroupMapping = async (productId: string): Promise<{ telegram_group_id: string; telegram_group_name: string } | null> => {
  try {
    const response = await apiRequest(`/api/admin/telegram/products/${productId}/group`);
    return response.data;
  } catch (error) {
    console.warn('Failed to get product group mapping:', error);
    return null;
  }
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
  user_id?: string;
} = {}): Promise<SubscriptionsResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/admin/telegram/subscriptions?${queryString}` : '/api/admin/telegram/subscriptions';
  
  return await apiRequest(endpoint);
};

export const createSubscription = async (data: CreateSubscriptionRequest): Promise<{
  data: any;
  message: string;
  invite_link: string;
  invite_expires_at: string;
  subscription_expires_at: string;
}> => {
  return await apiRequest('/api/admin/telegram/subscribe', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelSubscription = async (data: { email: string; product_id: string }): Promise<{ success: boolean; message: string }> => {
  return await apiRequest('/api/admin/telegram/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

export const cancelSubscriptionById = async (subscriptionId: string): Promise<{ success: boolean; message: string }> => {
  return await apiRequest(`/api/admin/telegram/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
  });
};

// Remove duplicate functions - already defined above

// Users API
export const getUsers = async (): Promise<User[]> => {
  const response = await apiRequest('/api/admin/telegram/users');
  return response.data || [];
};

// Webhook API
export const testWebhook = async (): Promise<{
  success: boolean;
  message: string;
  webhook_url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date: string | null;
  last_error_message: string | null;
  max_connections: number;
}> => {
  return await apiRequest('/api/admin/telegram/webhook/test');
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
  // Note: These endpoints may need to be implemented in the new API
  return await apiRequest('/api/admin/telegram/kick-user', {
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
  // Note: These endpoints may need to be implemented in the new API
  return await apiRequest('/api/admin/telegram/invite/regenerate', {
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
  const endpoint = queryString ? `/api/admin/telegram/users/joined?${queryString}` : '/api/admin/telegram/users/joined';
  const response = await apiRequest(endpoint);
  return response.data || [];
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
  const response = await apiRequest(`/api/admin/telegram/products/${productId}/members`);
  return response.data || [];
};

export const getGroupMembers = async (telegramGroupId: string): Promise<GroupMemberRecord[]> => {
  const response = await apiRequest(`/api/admin/telegram/groups/${telegramGroupId}/members`);
  return response.data || [];
};