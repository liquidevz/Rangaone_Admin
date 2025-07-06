// lib\api-stock-symbols.ts
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";

export interface StockSymbol {
  _id?: string;
  id?: string;
  symbol: string;
  exchange: string;
  name: string;
  currentPrice: string;
  previousPrice: string;
  createdAt?: string;
  updatedAt?: string;
  lastPriceUpdate?: string;
  priceHistory?: PricePoint[];
  marketStatus?: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';
  volume?: string;
  marketCap?: string;
}

export interface PricePoint {
  timestamp: string;
  price: string;
  volume?: string;
}

export interface CreateStockSymbolRequest {
  symbol: string;
  exchange: string;
  name: string;
  currentPrice: string;
  previousPrice?: string;
}

export interface UpdateStockSymbolRequest {
  symbol?: string;
  exchange?: string;
  name?: string;
  currentPrice?: string;
  previousPrice?: string;
}

export interface StockSymbolsResponse {
  success: boolean;
  count: number;
  data: StockSymbol[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  lastUpdated?: string;
  marketStatus?: string;
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
  lastUpdateTime: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastPing: Date | null;
  latency: number;
  retryCount: number;
}

// Connection monitoring
let connectionStatus: ConnectionStatus = {
  isConnected: true,
  lastPing: null,
  latency: 0,
  retryCount: 0,
};

// WebSocket connection for real-time updates
let wsConnection: WebSocket | null = null;
let wsReconnectTimeout: NodeJS.Timeout | null = null;

// Real-time update callbacks
const realtimeCallbacks = new Set<(data: StockSymbol[]) => void>();

// Enhanced fetch function with connection monitoring
const fetchWithErrorHandling = async (url: string, options?: RequestInit): Promise<Response> => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    const endTime = Date.now();
    connectionStatus.latency = endTime - startTime;
    connectionStatus.lastPing = new Date();
    connectionStatus.isConnected = response.ok;
    connectionStatus.retryCount = 0;
    
    return response;
  } catch (error) {
    connectionStatus.isConnected = false;
    connectionStatus.retryCount++;
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    
    throw error;
  }
};

// WebSocket connection management
export const initializeRealtimeConnection = (onUpdate?: (data: StockSymbol[]) => void) => {
  const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws/stock-prices';
  
  try {
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected for real-time stock updates');
      connectionStatus.isConnected = true;
      connectionStatus.retryCount = 0;
      
      // Send authentication
      const token = getAdminAccessToken();
      if (token) {
        wsConnection?.send(JSON.stringify({ type: 'auth', token }));
      }
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'priceUpdate' && data.stocks) {
          // Notify all registered callbacks
          realtimeCallbacks.forEach(callback => {
            try {
              callback(data.stocks);
            } catch (error) {
              console.error('Error in real-time callback:', error);
            }
          });
          
          // Call specific update callback if provided
          if (onUpdate) {
            onUpdate(data.stocks);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      connectionStatus.isConnected = false;
      
      // Attempt to reconnect after 5 seconds
      wsReconnectTimeout = setTimeout(() => {
        if (connectionStatus.retryCount < 5) {
          console.log('Attempting to reconnect WebSocket...');
          initializeRealtimeConnection(onUpdate);
        }
      }, 5000);
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      connectionStatus.isConnected = false;
    };
  } catch (error) {
    console.error('Failed to initialize WebSocket connection:', error);
    connectionStatus.isConnected = false;
  }
};

export const closeRealtimeConnection = () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
  
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }
  
  realtimeCallbacks.clear();
};

export const subscribeToRealtimeUpdates = (callback: (data: StockSymbol[]) => void) => {
  realtimeCallbacks.add(callback);
  
  return () => {
    realtimeCallbacks.delete(callback);
  };
};

export const getConnectionStatus = (): ConnectionStatus => {
  return { ...connectionStatus };
};

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

    const response = await fetchWithErrorHandling(
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
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
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

    const response = await fetchWithErrorHandling(
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
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
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

// Update all stock prices with enhanced monitoring
export const updateStockPrices = async (): Promise<StockPriceUpdateResult> => {
  try {
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(
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
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
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

    const response = await fetchWithErrorHandling(
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
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
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

// Create a new stock symbol
export const createStockSymbol = async (stockData: CreateStockSymbolRequest): Promise<StockSymbol> => {
  try {
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(`${API_BASE_URL}/api/stock-symbols`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(stockData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to create stock symbol");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Error creating stock symbol:", error);
    throw error;
  }
};

// Get all stock symbols with pagination and enhanced metadata
export const fetchStockSymbols = async (page: number = 1, limit: number = 50): Promise<StockSymbolsResponse> => {
  try {
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/api/stock-symbols?page=${page}&limit=${limit}`,
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
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch stock symbols");
    }

    const result = await response.json();
    
    // Add client-side metadata
    const enhancedResult: StockSymbolsResponse = {
      ...result,
      lastUpdated: new Date().toISOString(),
    };
    
    return enhancedResult;
  } catch (error) {
    console.error("Error fetching stock symbols:", error);
    throw error;
  }
};

// Get stock symbol by ID
export const fetchStockSymbolById = async (id: string): Promise<StockSymbol> => {
  try {
    if (!id) {
      throw new Error("Stock symbol ID is required");
    }

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(`${API_BASE_URL}/api/stock-symbols/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch stock symbol");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error(`Error fetching stock symbol ${id}:`, error);
    throw error;
  }
};

// Update a stock symbol
export const updateStockSymbol = async (id: string, stockData: UpdateStockSymbolRequest): Promise<StockSymbol> => {
  try {
    if (!id) {
      throw new Error("Stock symbol ID is required");
    }

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(`${API_BASE_URL}/api/stock-symbols/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(stockData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to update stock symbol");
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error(`Error updating stock symbol ${id}:`, error);
    throw error;
  }
};

// Delete a stock symbol
export const deleteStockSymbol = async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error("Stock symbol ID is required");
    }

    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required");
    }

    const response = await fetchWithErrorHandling(`${API_BASE_URL}/api/stock-symbols/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON - API may be unavailable");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to delete stock symbol");
    }
  } catch (error) {
    console.error(`Error deleting stock symbol ${id}:`, error);
    throw error;
  }
};

// Health check function for API connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};