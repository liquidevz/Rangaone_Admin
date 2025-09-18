// lib/api-faqs.ts
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export interface FAQ {
  id: string;
  _id?: string;
  question: string;
  answer: string | string[] | object;
  tags?: string[];
  category: string;
  relatedFAQs?: string[];
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string | string[] | object;
  tags?: string[];
  category: string;
  relatedFAQs?: string[];
}

export const fetchFAQs = async (params?: {
  category?: string;
  tag?: string;
  search?: string;
}): Promise<FAQ[]> => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.tag) searchParams.append('tag', params.tag);
  if (params?.search) searchParams.append('search', params.search);

  const response = await fetchWithAuth(`${API_BASE_URL}/api/faqs?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch FAQs');
  }
  
  const faqs = await response.json();
  return faqs.map((faq: any) => ({
    ...faq,
    id: faq._id || faq.id,
  }));
};

export const fetchFAQById = async (id: string): Promise<FAQ> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/faqs/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch FAQ');
  }
  
  const faq = await response.json();
  return {
    ...faq,
    id: faq._id || faq.id,
  };
};

export const createFAQ = async (data: CreateFAQRequest): Promise<FAQ> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/faqs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create FAQ' }));
    console.error('Create FAQ error:', error);
    if (error.details) {
      console.error('Validation details:', error.details);
      const messages = error.details.map((d: any) => {
        if (typeof d === 'object' && d.message) return d.message;
        if (typeof d === 'object' && d.path) return `${d.path}: ${d.msg || 'Invalid value'}`;
        return JSON.stringify(d);
      });
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw new Error(error.message || 'Failed to create FAQ');
  }
  
  const faq = await response.json();
  return {
    ...faq,
    id: faq._id || faq.id,
  };
};

export const updateFAQ = async (id: string, data: Partial<CreateFAQRequest>): Promise<FAQ> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/faqs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update FAQ' }));
    throw new Error(error.message || 'Failed to update FAQ');
  }
  
  const faq = await response.json();
  return {
    ...faq,
    id: faq._id || faq.id,
  };
};

export const deleteFAQ = async (id: string): Promise<{ message: string }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/faqs/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete FAQ');
  }
  
  return response.json();
};