import { API_BASE_URL, fetchWithAuth, getAdminAccessToken } from "@/lib/auth";
import { User } from "./api-users";

// Configuration Types
export interface Config {
  key: string;
  value: string;
  category?: string;
  description?: string;
  isSecret?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigsResponse {
  results: Config[];
  total: number;
  page: number;
  limit: number;
}

// Configuration API Functions
export const fetchConfigs = async (
  page = 1,
  limit = 10,
  category?: string
): Promise<Config[]> => {
  try {
    let url = `${API_BASE_URL}/api/admin/configs`;

    // Add query parameters if needed
    const params = new URLSearchParams();
    if (category) {
      params.append("category", category);
    }

    // Append the query string if we have parameters
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch configurations");
    }

    // The API returns an array directly, not a paginated response
    const configs = await response.json();
    return configs;
  } catch (error) {
    console.error("Error fetching configurations:", error);

    // Return mock data if in development or if API fails
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true"
    ) {
      return getMockConfigs();
    }

    throw error;
  }
};

// Helper function to generate mock configuration data
function getMockConfigs(): Config[] {
  return [
    {
      key: "SITE_NAME",
      value: "Ranga One Wealth",
      category: "general",
      description: "Name of the website",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      key: "MAINTENANCE_MODE",
      value: "false",
      category: "general",
      description: "Whether the site is in maintenance mode",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      key: "EMAIL_HOST",
      value: "smtp.gmail.com",
      category: "smtp",
      description: "SMTP server host",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      key: "EMAIL_PORT",
      value: "587",
      category: "smtp",
      description: "SMTP server port",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      key: "EMAIL_USER",
      value: "support@rangaonewealth.com",
      category: "smtp",
      description: "SMTP username",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      key: "EMAIL_PASSWORD",
      value: "********",
      category: "smtp",
      description: "SMTP password",
      isSecret: true,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      key: "RAZORPAY_KEY_ID",
      value: "rzp_test_*******",
      category: "payment",
      description: "Razorpay API Key ID",
      isSecret: true,
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      key: "RAZORPAY_KEY_SECRET",
      value: "********",
      category: "payment",
      description: "Razorpay API Key Secret",
      isSecret: true,
      isActive: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      key: "JWT_SECRET",
      value: "********",
      category: "security",
      description: "Secret key for JWT token generation",
      isSecret: true,
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      key: "SESSION_TIMEOUT",
      value: "3600",
      category: "security",
      description: "Session timeout in seconds",
      isSecret: false,
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];
}

export const fetchConfigByKey = async (key: string): Promise<Config> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/configs/${key}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch configuration");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching configuration with key ${key}:`, error);

    // Return mock data if in development or if API fails
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true"
    ) {
      const mockConfig = getMockConfigs().find((config) => config.key === key);
      if (mockConfig) {
        return mockConfig;
      }
    }

    throw error;
  }
};

export const createConfig = async (configData: {
  key: string;
  value: string;
  category?: string;
  description?: string;
  isSecret?: boolean;
}): Promise<Config> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs`, {
      method: "POST",
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to create configuration");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating configuration:", error);
    throw error;
  }
};

export const updateConfig = async (
  key: string,
  configData: {
    value: string;
    description?: string;
    isActive?: boolean;
    isSecret?: boolean;
  }
): Promise<Config> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/configs/${key}`,
      {
        method: "PUT",
        body: JSON.stringify(configData),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to update configuration");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating configuration with key ${key}:`, error);
    throw error;
  }
};

export const deleteConfig = async (key: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/configs/${key}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to delete configuration");
    }
  } catch (error) {
    console.error(`Error deleting configuration with key ${key}:`, error);
    throw error;
  }
};

export const bulkUpdateConfigs = async (
  configs: { key: string; value: string }[]
): Promise<Config[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/configs/batch`,
      {
        method: "POST",
        body: JSON.stringify({ configs }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to update configurations");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating configurations in bulk:", error);
    throw error;
  }
};

export const testSmtpConfig = async (
  to: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/configs/test/smtp`,
      {
        method: "POST",
        body: JSON.stringify({ to }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to test SMTP configuration");
    }

    return {
      success: true,
      message: data.message || "Test email sent successfully",
    };
  } catch (error) {
    console.error("Error testing SMTP configuration:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to test SMTP configuration",
    };
  }
};

// Portfolio Types
export interface PortfolioHolding {
  symbol: string;
  weight: number;
  sector: string;
  status: string;
  price: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  cashRemaining?: number;
  subscriptionFee?: number;
  minInvestment?: number;
  durationMonths?: number;
  holdings?: PortfolioHolding[];
  createdAt?: string;
  updatedAt?: string;
  downloadLinks?: DownloadLink[];
}

export interface DownloadLink {
  link: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description: string;
  riskLevel: string;
  cashRemaining?: number;
  subscriptionFee?: number;
  minInvestment?: number;
  durationMonths?: number;
  holdings?: PortfolioHolding[];
  downloadLinks?: DownloadLink[];
}

// Portfolio Tip Types
export interface PortfolioTip {
  _id: string;
  portfolio: string;
  title: string;
  content: string;
  status: string;
  targetPrice?: number;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioTipRequest {
  title: string;
  content: string;
  type?: string;
  targetPrice?: number;
}

// Portfolio API Functions
export const fetchPortfolios = async (): Promise<Portfolio[]> => {
  try {
    // Log the API request for debugging
    console.log(`Fetching portfolios from: ${API_BASE_URL}/api/portfolios`);

    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`);

    // Log the response status for debugging
    console.log(`Portfolio API response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolios");
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to fetch portfolios: Server returned ${response.status}`
        );
      } catch (jsonError) {
        // If we can't parse the error as JSON, throw a generic error with the status code
        throw new Error(
          `Failed to fetch portfolios: Server returned ${response.status}`
        );
      }
    }

    // Parse the response as JSON
    const portfolios = await response.json();

    // Ensure all portfolios have valid IDs
    const validatedPortfolios = portfolios.map((portfolio: Portfolio) => {
      if (!portfolio.id && portfolio._id) {
        console.log(
          "Portfolio has _id but no id, copying _id to id:",
          portfolio.name
        );
        return {
          ...portfolio,
          id: portfolio._id,
        };
      }
      return portfolio;
    });

    // Log the number of portfolios fetched for debugging
    console.log(`Fetched ${validatedPortfolios.length} portfolios from API`);

    return validatedPortfolios;
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    throw error;
  }
};

// Helper function to generate MongoDB-like ObjectIDs for new entities
export function generateObjectId(): string {
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

// Add this helper function to generate MongoDB-like ObjectIDs
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

// Add this helper function to generate mock portfolio data
function getMockPortfolios(): Portfolio[] {
  return [
    {
      id: generateMockObjectId(),
      name: "Conservative Portfolio",
      description:
        "A low-risk portfolio focused on capital preservation with some income generation.",
      riskLevel: "low",
      cashRemaining: 15000,
      subscriptionFee: 999,
      minInvestment: 10000,
      durationMonths: 12,
      holdings: [
        {
          symbol: "HDFC",
          weight: 20,
          sector: "Banking",
          status: "active",
          price: 1500,
        },
        {
          symbol: "TCS",
          weight: 15,
          sector: "Technology",
          status: "active",
          price: 3200,
        },
        {
          symbol: "ITC",
          weight: 15,
          sector: "Consumer Goods",
          status: "active",
          price: 420,
        },
        {
          symbol: "RELIANCE",
          weight: 10,
          sector: "Energy",
          status: "active",
          price: 2400,
        },
        {
          symbol: "INFY",
          weight: 10,
          sector: "Technology",
          status: "active",
          price: 1600,
        },
        {
          symbol: "BHARTIARTL",
          weight: 10,
          sector: "Telecom",
          status: "active",
          price: 850,
        },
        {
          symbol: "HDFCBANK",
          weight: 10,
          sector: "Banking",
          status: "active",
          price: 1650,
        },
        {
          symbol: "SUNPHARMA",
          weight: 10,
          sector: "Healthcare",
          status: "active",
          price: 1100,
        },
      ],
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: generateMockObjectId(),
      name: "Balanced Growth",
      description:
        "A balanced portfolio aiming for moderate growth with reasonable risk.",
      riskLevel: "medium",
      cashRemaining: 10000,
      subscriptionFee: 1499,
      minInvestment: 25000,
      durationMonths: 24,
      holdings: [
        {
          symbol: "TATAMOTORS",
          weight: 15,
          sector: "Automotive",
          status: "active",
          price: 650,
        },
        {
          symbol: "ICICIBANK",
          weight: 15,
          sector: "Banking",
          status: "active",
          price: 950,
        },
        {
          symbol: "WIPRO",
          weight: 10,
          sector: "Technology",
          status: "active",
          price: 450,
        },
        {
          symbol: "ASIANPAINT",
          weight: 10,
          sector: "Consumer Goods",
          status: "active",
          price: 3100,
        },
        {
          symbol: "AXISBANK",
          weight: 10,
          sector: "Banking",
          status: "active",
          price: 950,
        },
        {
          symbol: "HCLTECH",
          weight: 10,
          sector: "Technology",
          status: "active",
          price: 1200,
        },
        {
          symbol: "MARUTI",
          weight: 10,
          sector: "Automotive",
          status: "active",
          price: 9800,
        },
        {
          symbol: "TITAN",
          weight: 10,
          sector: "Consumer Goods",
          status: "active",
          price: 2800,
        },
        {
          symbol: "BAJFINANCE",
          weight: 10,
          sector: "Financial Services",
          status: "active",
          price: 6500,
        },
      ],
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: generateMockObjectId(),
      name: "Aggressive Growth",
      description:
        "A high-risk, high-reward portfolio focused on maximum capital appreciation.",
      riskLevel: "high",
      cashRemaining: 5000,
      subscriptionFee: 1999,
      minInvestment: 50000,
      durationMonths: 36,
      holdings: [
        {
          symbol: "ADANIENT",
          weight: 15,
          sector: "Infrastructure",
          status: "active",
          price: 2200,
        },
        {
          symbol: "ZOMATO",
          weight: 15,
          sector: "Technology",
          status: "active",
          price: 120,
        },
        {
          symbol: "NYKAA",
          weight: 10,
          sector: "Retail",
          status: "active",
          price: 180,
        },
        {
          symbol: "POLICYBZR",
          weight: 10,
          sector: "Financial Services",
          status: "active",
          price: 650,
        },
        {
          symbol: "PAYTM",
          weight: 10,
          sector: "Financial Technology",
          status: "active",
          price: 450,
        },
        {
          symbol: "IRCTC",
          weight: 10,
          sector: "Travel",
          status: "active",
          price: 680,
        },
        {
          symbol: "INDIGO",
          weight: 10,
          sector: "Aviation",
          status: "active",
          price: 2400,
        },
        {
          symbol: "TATASTEEL",
          weight: 10,
          sector: "Steel",
          status: "active",
          price: 120,
        },
        {
          symbol: "JINDALSTEL",
          weight: 10,
          sector: "Steel",
          status: "active",
          price: 650,
        },
      ],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
}

// Update the fetchPortfolioById function to use admin token
export const fetchPortfolioById = async (id: string): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    // Log the API request for debugging
    console.log(
      `Fetching portfolio with ID ${id} from: ${API_BASE_URL}/api/portfolios/${id}`
    );

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to access portfolio");
    }

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "GET",
      headers,
    });

    // Log the response status for debugging
    console.log(`Portfolio detail API response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for portfolio details"
        );
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to fetch portfolio: Server returned ${response.status}`
        );
      } catch (jsonError) {
        // If we can't parse the error as JSON, throw a generic error with the status code
        throw new Error(
          `Failed to fetch portfolio: Server returned ${response.status}`
        );
      }
    }

    const portfolio = await response.json();
    console.log(`Successfully fetched portfolio: ${portfolio.name}`);

    // Ensure the portfolio has an id property (API might return _id)
    if (portfolio._id && !portfolio.id) {
      portfolio.id = portfolio._id;
    }

    return portfolio;
  } catch (error) {
    console.error(`Error fetching portfolio with id ${id}:`, error);
    throw error;
  }
};

// Helper function to create a mock portfolio
const getMockCreatedPortfolio = (
  portfolioData: CreatePortfolioRequest
): Portfolio => {
  return {
    id: generateMockObjectId(),
    name: portfolioData.name,
    description: portfolioData.description,
    riskLevel: portfolioData.riskLevel,
    cashRemaining: portfolioData.cashRemaining,
    subscriptionFee: portfolioData.subscriptionFee,
    minInvestment: portfolioData.minInvestment,
    durationMonths: portfolioData.durationMonths,
    holdings: portfolioData.holdings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Update the updatePortfolio function to use admin token
export const updatePortfolio = async (
  id: string,
  portfolioData: CreatePortfolioRequest
): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      console.error("Invalid portfolio ID provided to updatePortfolio:", id);
      throw new Error("Invalid portfolio ID");
    }

    console.log(`Updating portfolio with ID: ${id}`);

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to update portfolio");
    }

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for portfolio update"
        );
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to update portfolio"
        );
      } catch (jsonError) {
        throw new Error(
          `Failed to update portfolio: Server returned ${response.status}`
        );
      }
    }

    // Parse the response
    const updatedPortfolio = await response.json();

    // Ensure the portfolio has an id property (API might return _id)
    if (updatedPortfolio._id && !updatedPortfolio.id) {
      updatedPortfolio.id = updatedPortfolio._id;
    }

    console.log(
      "Successfully updated portfolio with ID:",
      updatedPortfolio.id || updatedPortfolio._id
    );
    return updatedPortfolio;
  } catch (error) {
    console.error(`Error updating portfolio with id ${id}:`, error);
    throw error;
  }
};

// Update the deletePortfolio function to use admin token
export const deletePortfolio = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to delete portfolio");
    }

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The portfolio might not exist."
        );
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to delete portfolio"
        );
      } catch (jsonError) {
        throw new Error(
          `Failed to delete portfolio: Server returned ${response.status}`
        );
      }
    }
  } catch (error) {
    console.error(`Error deleting portfolio with id ${id}:`, error);
    throw error;
  }
};

// Portfolio Tips API Functions
export const fetchPortfolioTips = async (
  portfolioId: string
): Promise<PortfolioTip[]> => {
  try {
    if (!portfolioId || portfolioId === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    // According to the docs, the endpoint is /api/tips/portfolios/{portfolioId}/tips
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Failed to fetch portfolio tips: Server returned HTML");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio tips");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching portfolio tips:", error);

    // If it's a mock portfolio ID, return mock tips
    if (portfolioId.startsWith("mock_")) {
      return getMockPortfolioTips(portfolioId);
    }

    throw error;
  }
};

// Helper function to generate mock portfolio tips
function getMockPortfolioTips(portfolioId: string): PortfolioTip[] {
  return [
    {
      _id: generateMockObjectId(),
      portfolio: portfolioId,
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
      portfolio: portfolioId,
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
      portfolio: portfolioId,
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
}

export const createPortfolio = async (
  portfolioData: CreatePortfolioRequest
): Promise<Portfolio> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`, {
      method: "POST",
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to create portfolio");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating portfolio:", error);
    throw error;
  }
};

export const fetchTipById = async (tipId: string): Promise<PortfolioTip> => {
  try {
    if (!tipId) {
      throw new Error("Invalid tip ID");
    }

    // According to the docs, the endpoint is /api/tips/{id}
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/tips/${tipId}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for tip details");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tip details");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching tip with id ${tipId}:`, error);

    // If we're in development or mock data is enabled, return a mock tip
    if (
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      return {
        _id: tipId,
        portfolio: generateMockObjectId(), // Generate a mock portfolio ID
        title: "Mock Tip Details",
        content:
          "This is a detailed view of a mock portfolio tip for testing purposes.",
        status: "active",
        type: "suggestion",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      };
    }

    throw error;
  }
};

export const createPortfolioTip = async (
  portfolioId: string,
  tipData: CreatePortfolioTipRequest
): Promise<PortfolioTip> => {
  try {
    if (!portfolioId || portfolioId === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    console.log(
      `Creating tip for portfolio ${portfolioId} with data:`,
      tipData
    );

    // Use our own API route instead of the external API directly
    const url = `/api/portfolios/${portfolioId}/tips`;
    console.log(`Using API endpoint: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tipData),
    });

    console.log(`Tip creation API response status: ${response.status}`);

    if (!response.ok) {
      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to create portfolio tip"
        );
      } catch (jsonError) {
        throw new Error(
          `Failed to create portfolio tip: Server returned ${response.status}`
        );
      }
    }

    const createdTip = await response.json();
    console.log("Successfully created tip:", createdTip);
    return createdTip;
  } catch (error) {
    console.error("Error creating portfolio tip:", error);

    // If we're in development or mock data is enabled, return a mock created tip
    if (
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("Falling back to mock data for tip creation due to error");
      return getMockCreatedTip(portfolioId, tipData);
    }

    throw error;
  }
};

// Helper function to create a mock tip
function getMockCreatedTip(
  portfolioId: string,
  tipData: CreatePortfolioTipRequest
): PortfolioTip {
  return {
    _id: generateMockObjectId(),
    portfolio: portfolioId,
    title: tipData.title,
    content: tipData.content,
    status: "active",
    type: tipData.type || "general",
    targetPrice: tipData.targetPrice,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const updateTip = async (
  tipId: string,
  tipData: CreatePortfolioTipRequest
): Promise<PortfolioTip> => {
  try {
    if (!tipId) {
      throw new Error("Invalid tip ID");
    }

    // According to the docs, the endpoint is /api/tips/{id}
    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${tipId}`, {
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
    console.error(`Error updating tip with id ${tipId}:`, error);
    throw error;
  }
};

export const deleteTip = async (tipId: string): Promise<void> => {
  try {
    if (!tipId) {
      throw new Error("Invalid tip ID");
    }

    // According to the docs, the endpoint is /api/tips/{id}
    const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${tipId}`, {
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
  } catch (error) {
    console.error(`Error deleting tip with id ${tipId}:`, error);
    throw error;
  }
};

// Subscription Types
export interface Subscription {
  id: string;
  isActive: boolean;
  lastPaidAt?: string;
  missedCycles?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  portfolio?: Portfolio;
}

export interface PaymentHistory {
  _id: string;
  user: string;
  portfolio: string;
  subscription: string;
  amount: number;
  currency: string;
  status: string;
  paymentId: string;
  orderId: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  portfolioId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

// Subscription API Functions
export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/subscriptions`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for subscriptions"
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch subscriptions");
    }

    const finalData = await response.json();

    return finalData?.subscriptions || [];
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    // Return mock data as fallback for any error
    console.log("Using mock subscription data due to API error");
    return getMockSubscriptions();
  }
};

// Add this helper function to generate mock subscription data
function getMockSubscriptions(): Subscription[] {
  return [
    {
      id: "sub_mock1",
      userId: "user123",
      portfolioId: "port123",
      status: "active",
      startDate: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
      endDate: new Date(Date.now() + 335 * 86400000).toISOString(), // 335 days in future
      amount: 1999,
      paymentId: "pay_123456",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "sub_mock2",
      userId: "user456",
      portfolioId: "port456",
      status: "pending",
      startDate: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
      endDate: new Date(Date.now() + 360 * 86400000).toISOString(), // 360 days in future
      amount: 2999,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "sub_mock3",
      userId: "user789",
      portfolioId: "port789",
      status: "cancelled",
      startDate: new Date(Date.now() - 180 * 86400000).toISOString(), // 180 days ago
      endDate: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago (expired)
      amount: 999,
      paymentId: "pay_345678",
      createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];
}

export const fetchSubscriptionById = async (
  id: string
): Promise<Subscription> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid subscription ID");
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/subscriptions/${id}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch subscription");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching subscription with id ${id}:`, error);
    throw error;
  }
};

export const createSubscriptionOrder = async (
  data: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    // According to the docs, the endpoint is /api/subscriptions/order
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/subscriptions/order`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to create subscription order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating subscription order:", error);
    throw error;
  }
};

export const verifyPayment = async (
  data: VerifyPaymentRequest
): Promise<any> => {
  try {
    // According to the docs, the endpoint is /api/subscriptions/verify
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/subscriptions/verify`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to verify payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

export const fetchPaymentHistory = async (): Promise<PaymentHistory[]> => {
  try {
    // According to the docs, the endpoint is /api/subscriptions/history
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/subscriptions/history`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for payment history"
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch payment history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching payment history:", error);
    // Return mock data as fallback for any error
    console.log("Using mock payment history data due to API error");
    return getMockPaymentHistory();
  }
};

// Add this helper function to generate mock payment history data
function getMockPaymentHistory(): PaymentHistory[] {
  return [
    {
      id: "pay_mock1",
      userId: "user123",
      portfolioId: "port123",
      amount: 1999,
      currency: "INR",
      status: "completed",
      paymentId: "pay_123456",
      orderId: "order_123456",
      paymentMethod: "card",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "pay_mock2",
      userId: "user456",
      portfolioId: "port456",
      amount: 2999,
      currency: "INR",
      status: "pending",
      paymentId: "pay_234567",
      orderId: "order_234567",
      paymentMethod: "upi",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: "pay_mock3",
      userId: "user789",
      portfolioId: "port789",
      amount: 999,
      currency: "INR",
      status: "failed",
      paymentId: "pay_345678",
      orderId: "order_345678",
      paymentMethod: "netbanking",
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
  ];
}

export const updateSubscriptionStatus = async (
  id: string,
  status: string
): Promise<Subscription> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid subscription ID");
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/subscriptions/${id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to update subscription status");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating subscription status with id ${id}:`, error);
    throw error;
  }
};
