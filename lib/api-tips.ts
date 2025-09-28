// lib\api-tips.ts  
import { API_BASE_URL, fetchWithAuth } from "@/lib/auth";

// Content for Tips (key-value pairs)
export interface TipContent {
  key: string;
  value: string;
}

// Tip Types
export interface Tip {
  _id: string;
  id: string;
  portfolio?: string;
  title: string;
  stockId: string;
  stockSymbol?: string;
  stockName?: string;
  category: "basic" | "premium" | "social_media";
  content: TipContent[];
  description: string;
  status: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  exitedPrice?: string;
  stopLoss?: string;
  horizon?: string;
  analysistConfidence?: number;
  mpWeightage?: string;
  downloadLinks?: Array<{
    _id?: string;
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipRequest {
  title: string;
  stockId: string;
  stockSymbol?: string;
  stockName?: string;
  category: "basic" | "premium" | "social_media";
  content: TipContent[];
  description: string;
  status?: "Active" | "Closed";
  action?: string;
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  exitedPrice?: string;
  stopLoss?: string;
  horizon?: string;
  analysistConfidence?: number;
  mpWeightage?: string;
  downloadLinks?: Array<{
    name: string;
    url: string;
  }>;
}

// Get a single tip by ID
export const fetchTipById = async (id: string): Promise<Tip> => {
  try {
    if (!id) {
      throw new Error("Invalid tip ID");
    }



    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${id}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The tip might not exist."
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tip details");
    }

    const tip = await response.json();
    return {
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
  } catch (error) {

    throw error;
  }
};

// Update an existing tip
export const updateTip = async (
  id: string,
  tipData: CreateTipRequest
): Promise<Tip> => {
  try {
    if (!id) {
      throw new Error("Invalid tip ID");
    }

    // Normalize horizon field to remove extra spaces
    const processedTipData = {
      ...tipData,
      horizon: tipData.horizon?.trim() || "Long Term"
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${id}`, {
      method: "PUT",
      body: JSON.stringify(processedTipData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The tip might not exist."
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to update tip");
    }

    const tip = await response.json();
    return {
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
  } catch (error) {

    throw error;
  }
};

// Delete a tip
export const deleteTip = async (id: string): Promise<{ message: string }> => {
  try {
    if (!id) {
      throw new Error("Invalid tip ID");
    }



    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The tip might not exist."
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to delete tip");
    }

    return await response.json();
  } catch (error) {

    throw error;
  }
};

// Create a new tip under a portfolio (for portfolio-specific tips)
export const createTip = async (
  portfolioId: string,
  tipData: CreateTipRequest
): Promise<Tip> => {
  try {
    if (!portfolioId) {
      throw new Error("Invalid portfolio ID");
    }



    // Ensure content is properly formatted as an array
    if (!Array.isArray(tipData.content) || tipData.content.length === 0) {
      tipData.content = [{ key: "main", value: tipData.description || "No content provided" }];
    }

    // Ensure required fields are present
    const processedTipData = {
      ...tipData,
      status: tipData.status || "Active",
      horizon: tipData.horizon?.trim() || "Long Term",
    };

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`,
      {
        method: "POST",
        body: JSON.stringify(processedTipData),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The portfolio might not exist."
        );
      }

      const error = await response.json();

      throw new Error(error.message || "Failed to create tip");
    }

    const tip = await response.json();

    return {
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
  } catch (error) {

    throw error;
  }
};

// Get all tips for a portfolio (for portfolio-specific tips)
export const fetchPortfolioTips = async (
  portfolioId: string
): Promise<Tip[]> => {
  try {
    if (!portfolioId || portfolioId === "undefined") {
      throw new Error("Invalid portfolio ID");
    }



    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio tips");
    }

    const tips = await response.json();
    
    // Ensure all tips have proper structure and an id property
    return tips.map((tip: any) => ({
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    }));
  } catch (error) {

    throw error;
  }
};

// Get all tips (both portfolio-specific and general) - ENHANCED FOR UNIFIED VIEW
export const fetchAllTips = async (): Promise<Tip[]> => {
  try {


    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tips");
    }

    const tips = await response.json();

    
    // Ensure all tips have proper structure and an id property
    return tips.map((tip: any) => ({
      ...tip,
      id: tip._id || tip.id,
      // Handle portfolio field (could be ObjectId or undefined for RangaOne Wealth)
      portfolio: tip.portfolio || undefined,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    }));
  } catch (error) {

    throw error;
  }
};

// Create a general tip (not tied to a portfolio) - ENHANCED FOR RangaOne Wealth
export const createGeneralTip = async (
  tipData: CreateTipRequest
): Promise<Tip> => {
  try {


    // Validate required fields for RangaOne Wealth
    if (!tipData.title?.trim()) {
      throw new Error("Title is required");
    }
    
    if (!tipData.stockId?.trim()) {
      throw new Error("Stock symbol is required");
    }
    
    if (!tipData.category) {
      throw new Error("Category is required");
    }

    // Handle both string and array content formats
    if (typeof tipData.content === 'string') {
      const contentStr = tipData.content as string;
      if (!contentStr.trim()) {
        throw new Error("Content is required");
      }
      // Convert string content to array format
      tipData.content = [{ key: "main", value: contentStr }];
    } else if (Array.isArray(tipData.content)) {
      if (!tipData.content.length || !tipData.content[0]?.value?.trim()) {
        throw new Error("Content is required");
      }
    } else {
      throw new Error("Content must be a string or an array of objects");
    }
    
    if (!tipData.description?.trim()) {
      throw new Error("Description is required");
    }

    // Ensure default values for RangaOne Wealth
    const processedTipData = {
      ...tipData,
      status: tipData.status || "Active",
      horizon: tipData.horizon?.trim() || "Long Term",
      downloadLinks: tipData.downloadLinks?.filter(link => link.name?.trim() && link.url?.trim()) || [],
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips`, {
      method: "POST",
      body: JSON.stringify(processedTipData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON"
        );
      }

      const error = await response.json();

      throw new Error(error.message || "Failed to create general tip");
    }

    const tip = await response.json();

    
    return {
      ...tip,
      id: tip._id || tip.id,
      content: tip.content,
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
  } catch (error) {

    throw error;
  }
};

// Helper function for validation - ENHANCED
export const validateTipData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push("Title is required");
  }

  if (!data.stockId?.trim()) {
    errors.push("Stock ID is required");
  }

  // Handle both string and array content formats
  if (typeof data.content === 'string') {
    if (!data.content.trim()) {
      errors.push("Content is required");
    }
  } else if (Array.isArray(data.content)) {
    if (!data.content.length || !data.content[0]?.value?.trim()) {
      errors.push("Content is required");
    }
  } else {
    errors.push("Content must be a string or an array of objects");
  }

  if (!data.description?.trim()) {
    errors.push("Description is required");
  }

  if (data.status && !["Active", "Closed"].includes(data.status)) {
    errors.push("Invalid status value");
  }

  if (data.category && !["basic", "premium", "social_media"].includes(data.category)) {
    errors.push("Invalid category value");
  }

  return errors;
};

// Additional utility functions for RangaOne Wealth management

// Filter tips by various criteria
export const filterTips = (
  tips: Tip[],
  filters: {
    status?: string;
    action?: string;
    stockSymbol?: string;
    search?: string;
  }
): Tip[] => {
  return tips.filter(tip => {
    // Status filter
    if (filters.status && filters.status !== "all" && tip.status !== filters.status) {
      return false;
    }

    // Action filter
    if (filters.action && filters.action !== "all" && tip.action !== filters.action) {
      return false;
    }

    // Stock symbol filter
    if (filters.stockSymbol && !tip.stockId.toLowerCase().includes(filters.stockSymbol.toLowerCase())) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchFields = [
        tip.title,
        tip.stockId,
        tip.description,
        tip.content // Assuming content is now a string
      ].join(" ").toLowerCase();
      
      if (!searchFields.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
};

// Sort tips by various criteria
export const sortTips = (tips: Tip[], sortBy: "title" | "stockId" | "createdAt" | "status", direction: "asc" | "desc" = "desc"): Tip[] => {
  return [...tips].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "stockId":
        comparison = a.stockId.localeCompare(b.stockId);
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        return 0;
    }
    
    return direction === "asc" ? comparison : -comparison;
  });
};