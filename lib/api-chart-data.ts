import { API_BASE_URL, fetchWithAuth } from "@/lib/auth";

// Chart Data Types
export interface ChartDataPoint {
  _id?: string;
  id?: string;
  portfolio: string;
  date: string;
  dateOnly: string;
  portfolioValue: number;
  cashRemaining: number;
  compareIndexValue: number;
  compareIndexPriceSource: "closing" | "opening";
  usedClosingPrices: boolean;
  dataVerified: boolean;
  dataQualityIssues: string[];
}

export interface ChartDataResponse {
  success: boolean;
  count: number;
  total: number;
  pagination: {
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  data: ChartDataPoint[];
}

export interface CreateChartDataRequest {
  portfolio: string;
  date: string;
  dateOnly: string;
  portfolioValue: number;
  cashRemaining: number;
  compareIndexValue: number;
  compareIndexPriceSource?: "closing" | "opening";
  usedClosingPrices?: boolean;
  dataVerified?: boolean;
  dataQualityIssues?: string[];
}

// Chart Data API Functions
export const fetchChartData = async (
  portfolioId?: string,
  startDate?: string,
  endDate?: string,
  limit = 100,
  page = 1
): Promise<ChartDataResponse> => {
  try {
    const params = new URLSearchParams();
    if (portfolioId) params.append("portfolioId", portfolioId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("limit", limit.toString());
    params.append("page", page.toString());

    const url = `/api/chart-data?${params.toString()}`;
    console.log('Making request to:', url);
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      console.error('API Error Response:', response.status, response.statusText);
      try {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chart data:", error);
    throw error;
  }
};

export const fetchPortfolioChartData = async (
  portfolioId: string,
  startDate?: string,
  endDate?: string,
  limit = 100,
  page = 1
): Promise<ChartDataResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("limit", limit.toString());
    params.append("page", page.toString());

    const url = `${API_BASE_URL}/admin/portfolios/${portfolioId}/chart-data?${params.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching portfolio chart data:", error);
    throw error;
  }
};

export const fetchPortfolioPerformance = async (
  portfolioId: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const url = `/api/chart-data/portfolio/${portfolioId}/performance?${params.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio performance");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching portfolio performance:", error);
    throw error;
  }
};

export const cleanupDuplicates = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data/cleanup-duplicates`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to cleanup duplicates");
    }

    return await response.json();
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    throw error;
  }
};

export const createChartData = async (
  data: CreateChartDataRequest
): Promise<ChartDataPoint> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating chart data:", error);
    throw error;
  }
};

export const createPortfolioChartData = async (
  portfolioId: string,
  data: Omit<CreateChartDataRequest, 'portfolio'>
): Promise<ChartDataPoint> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/portfolios/${portfolioId}/chart-data`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create portfolio chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating portfolio chart data:", error);
    throw error;
  }
};

export const updateChartData = async (
  id: string,
  data: Partial<CreateChartDataRequest>
): Promise<ChartDataPoint> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating chart data:", error);
    throw error;
  }
};

export const deleteChartData = async (id: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete chart data");
    }
  } catch (error) {
    console.error("Error deleting chart data:", error);
    throw error;
  }
};

export const fetchChartDataById = async (id: string): Promise<ChartDataPoint> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chart data by ID:", error);
    throw error;
  }
};

export const patchChartData = async (
  id: string,
  data: Partial<CreateChartDataRequest>
): Promise<ChartDataPoint> => {
  try {
    const response = await fetchWithAuth(`/api/chart-data/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to patch chart data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error patching chart data:", error);
    throw error;
  }
};