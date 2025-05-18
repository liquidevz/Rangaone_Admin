import { API_BASE_URL, fetchWithAuth } from "@/lib/auth";

// Tip Types
export interface Tip {
  _id: string;
  portfolio: string;
  title: string;
  content: string;
  status: "Active" | "Closed";
  buyRange?: string;
  targetprice?: string;
  addMoreAt?: string;
  tipUrl?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipRequest {
  portfolio: string;
  title: string;
  content: string;
  status: "Active" | "Inactive" | "Closed";
  buyRange?: string;
  targetprice?: string;
  addMoreAt?: string;
  tipUrl?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
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

    return await response.json();
  } catch (error) {
    console.error(`Error fetching tip with id ${id}:`, error);
    throw error;
  }
};

// Update an existing tip
export const updateTip = async (
  id: string,
  tipData: Partial<CreateTipRequest>
): Promise<Tip> => {
  try {
    if (!id) {
      throw new Error("Invalid tip ID");
    }

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

    return await response.json();
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

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`,
      {
        method: "POST",
        body: JSON.stringify({
          ...tipData,
          content: tipData.content.toString(),
        }),
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

    return await response.json();
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
    let response;

    console.log("Fetching portfolio tips for ID:", portfolioId);

    if (portfolioId) {
      // Updated endpoint according to the API documentation
      response = await fetchWithAuth(
        `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`
      );
    } else {
      response = await fetchWithAuth(`${API_BASE_URL}/api/tips`);
    }

    // Check if response is OK and is JSON
    if (!response?.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio tips");
    }

    if (response?.ok) {
      // If we get here, we have a valid JSON response
      return await response.json();
    }

    return {} as unknown as Tip[];
  } catch (error) {
    console.error("Error fetching portfolio tips:", error);
    throw error;
  }
};

// Helper function to generate MongoDB-like ObjectIDs for new entities
function generateMockObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const machineId = Math.floor(Math.random() * 16777216)
    .toString(16)
    .padStart(6, "0");
  const processId = Math.floor(Math.random() * 65536)
    .toString(16)
    .padStart(4, "0");
  const counter = Math.floor(Math.random() * 16777216)
    .toString(16)
    .padStart(6, "0");

  return timestamp + machineId + processId + counter;
}

// Add this helper function to generate mock tips
export const getMockTips = (portfolioId?: string): Tip[] => {
  const id = portfolioId || generateMockObjectId();
  return [
    {
      _id: generateMockObjectId(),
      portfolio: id,
      title: "Consider increasing exposure to technology sector",
      content:
        "With the recent market trends, technology stocks are showing strong growth potential. Consider increasing your allocation to this sector for better returns.",
      status: "active",
      type: "suggestion",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      _id: generateMockObjectId(),
      portfolio: id,
      title: "Potential buying opportunity for HDFC Bank",
      content:
        "HDFC Bank has recently corrected by 5% due to market volatility. This presents a good buying opportunity as the fundamentals remain strong.",
      status: "active",
      targetPrice: 1600,
      type: "buy",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      _id: generateMockObjectId(),
      portfolio: id,
      title: "Consider booking profits in ITC",
      content:
        "ITC has rallied significantly in the last quarter and is now trading at a premium valuation. Consider booking partial profits.",
      status: "active",
      targetPrice: 450,
      type: "sell",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
};

export const usingMockData =
  process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" ||
  process.env.NODE_ENV === "development";
