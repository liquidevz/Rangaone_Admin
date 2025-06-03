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
  horizon?: string;
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
  horizon?: string;
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
    console.error(`Error fetching tip with id ${id}:`, error);
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

    console.log('Updating tip with data:', tipData);

    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${id}`, {
      method: "PUT",
      body: JSON.stringify(tipData),
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
    console.error(`Error updating tip with id ${id}:`, error);
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
    console.error(`Error deleting tip with id ${id}:`, error);
    throw error;
  }
};

// Create a new tip under a portfolio
export const createTip = async (
  portfolioId: string,
  tipData: CreateTipRequest
): Promise<Tip> => {
  try {
    if (!portfolioId) {
      throw new Error("Invalid portfolio ID");
    }

    console.log('Creating tip for portfolio:', portfolioId, 'with data:', tipData);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`,
      {
        method: "POST",
        body: JSON.stringify(tipData),
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
    console.error("Error creating tip:", error);
    throw error;
  }
};

// Get all tips for a portfolio
export const fetchPortfolioTips = async (
  portfolioId: string
): Promise<Tip[]> => {
  try {
    if (!portfolioId || portfolioId === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    console.log("Fetching portfolio tips for ID:", portfolioId);

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
    console.error("Error fetching portfolio tips:", error);
    throw error;
  }
};

// Get all tips (not portfolio specific)
export const fetchAllTips = async (): Promise<Tip[]> => {
  try {
    console.log("Fetching all tips");

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
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    }));
  } catch (error) {
    console.error("Error fetching all tips:", error);
    throw error;
  }
};

// Create a general tip (not tied to a portfolio)
export const createGeneralTip = async (
  tipData: CreateTipRequest
): Promise<Tip> => {
  try {
    console.log('Creating general tip with data:', tipData);

    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips`, {
      method: "POST",
      body: JSON.stringify(tipData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON"
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
    console.error("Error creating general tip:", error);
    throw error;
  }
};

// Helper function for validation
export const validateTipData = (data: CreateTipRequest): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push("Title is required");
  }

  if (!data.stockId?.trim()) {
    errors.push("Stock selection is required");
  }

  if (!data.content || data.content.length === 0) {
    errors.push("At least one content item is required");
  } else {
    data.content.forEach((item, index) => {
      if (!item.key?.trim()) {
        errors.push(`Content item ${index + 1}: Key is required`);
      }
      if (!item.value?.trim()) {
        errors.push(`Content item ${index + 1}: Value is required`);
      }
    });
  }

  if (!data.description?.trim()) {
    errors.push("Description is required");
  }

  // Validate URLs if provided
  if (data.tipUrl && data.tipUrl.trim()) {
    try {
      new URL(data.tipUrl);
    } catch {
      errors.push("Tip URL must be a valid URL");
    }
  }

  // Validate download links if provided
  if (data.downloadLinks && data.downloadLinks.length > 0) {
    data.downloadLinks.forEach((link, index) => {
      if (!link.name?.trim()) {
        errors.push(`Download link ${index + 1}: Name is required`);
      }
      if (!link.url?.trim()) {
        errors.push(`Download link ${index + 1}: URL is required`);
      } else {
        try {
          new URL(link.url);
        } catch {
          errors.push(`Download link ${index + 1}: URL must be valid`);
        }
      }
    });
  }

  // Validate action-specific fields
  if (data.action === "buy" || data.action === "sell") {
    if (!data.targetPrice && !data.targetPercentage) {
      errors.push("Target price or target percentage is recommended for buy/sell actions");
    }
  }

  if (data.action === "sell" || data.action === "partial sell" || data.action === "partial profit") {
    if (!data.exitPrice && !data.exitStatus) {
      errors.push("Exit price or exit status is recommended for sell actions");
    }
  }

  return errors;
};