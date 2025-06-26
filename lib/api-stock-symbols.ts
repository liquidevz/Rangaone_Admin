// lib\api-stock-symbols.ts
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";

export interface StockSymbol {
  _id: string;
  symbol: string;
  exchange: string;
  name: string;
  currentPrice: string;
  previousPrice: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockSearchResult {
  success: boolean;
  count: number;
  data: StockSymbol[];
}

export interface StockPriceUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  successSymbols: string[];
  failedSymbols: string[];
  message: string;
}

// Search stock symbols by keyword
export const searchStockSymbols = async (keyword: string): Promise<StockSymbol[]> => {
  try {
    if (!keyword || keyword.trim().length < 2) {
      return [];
    }

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/stock-symbols/search?keyword=${encodeURIComponent(keyword)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to search stocks");
    }

    const result: StockSearchResult = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error searching stock symbols:", error);
    throw error;
  }
};

// Get stock symbol details by symbol
export const fetchStockSymbolBySymbol = async (symbol: string): Promise<StockSymbol> => {
  try {
    if (!symbol) {
      throw new Error("Stock symbol is required");
    }

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/stock-symbols/ticker/${symbol}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch stock details");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error(`Error fetching stock symbol ${symbol}:`, error);
    throw error;
  }
};

// Update all stock prices
export const updateStockPrices = async (): Promise<StockPriceUpdateResult> => {
  try {
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/stock-symbols/update-prices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to update stock prices");
    }

    const result: StockPriceUpdateResult = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating stock prices:", error);
    throw error;
  }
};

// Get all stock symbols
export const fetchAllStockSymbols = async (): Promise<StockSymbol[]> => {
  try {
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/stock-symbols`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch stock symbols");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Error fetching all stock symbols:", error);
    throw error;
  }
};