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

// Updated Portfolio Types to match the new schema
export interface DescriptionItem {
  key: string;
  value: string;
}

export interface SubscriptionFee {
  type: "monthly" | "quarterly" | "yearly";
  price: number;
}

export interface PortfolioHolding {
  symbol: string;
  weight: number;
  sector: string;
  stockCapType?: "small cap" | "mid cap" | "large cap" | "micro cap" | "mega cap";
  status: "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "Addon";
  buyPrice: number;
  quantity: number;
  minimumInvestmentValueStock: number;
  price?: number; // For backward compatibility
}

export interface DownloadLink {
  _id?: string;
  linkType: string;
  linkUrl: string;
  linkDiscription?: string;
  name?: string;
  createdAt?: string;
}

export interface YouTubeLink {
  _id?: string;
  link: string;
  createdAt?: string;
}

export interface Portfolio {
  id?: string;
  _id?: string;
  name: string;
  description: DescriptionItem[];
  cashBalance: number;
  currentValue: number;
  timeHorizon?: string;
  rebalancing?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  durationMonths: number;
  PortfolioCategory: string;
  compareWith?: string;
  expiryDate?: string;
  holdings: PortfolioHolding[];
  downloadLinks?: DownloadLink[];
  youTubeLinks?: YouTubeLink[];
  holdingsValue?: number; // Virtual field
  createdAt?: string;
  updatedAt?: string;
  
  // Legacy fields for backward compatibility
  riskLevel?: string;
  cashRemaining?: number;
  subscriptionFee_legacy?: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description: DescriptionItem[];
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  durationMonths: number;
  expiryDate?: string;
  holdings?: PortfolioHolding[];
  PortfolioCategory?: string;
  downloadLinks?: DownloadLink[];
  youTubeLinks?: YouTubeLink[];
  timeHorizon?: string;
  rebalancing?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  compareWith?: string;
  cashBalance?: number;
  currentValue?: number;
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
    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolios");
      }

      const error = await response.json();
      throw new Error(error.message || `Failed to fetch portfolios: Server returned ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    let portfolios: Portfolio[] = Array.isArray(data) ? data : 
                                data.data ? data.data :
                                data.portfolios ? data.portfolios :
                                data.results ? data.results : [];

    // Ensure all portfolios have valid IDs and filter out any without IDs
    return portfolios
      .filter(portfolio => portfolio.id || portfolio._id)
      .map(portfolio => ({
        ...portfolio,
        id: portfolio.id || portfolio._id || ''
      }));
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    
    // Return mock data if in development or if API fails
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true"
    ) {
      return getMockPortfolios();
    }
    
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

// Updated mock portfolio data to match new schema
function getMockPortfolios(): Portfolio[] {
  return [
    {
      id: generateMockObjectId(),
      name: "Conservative Portfolio",
      description: [
        { key: "home card", value: "A low-risk portfolio focused on capital preservation with some income generation." },
        { key: "checkout card", value: "Perfect for conservative investors seeking stable returns." },
        { key: "portfolio card", value: "Blue-chip stocks with proven track record." }
      ],
      cashBalance: 15000,
      currentValue: 100000,
      subscriptionFee: [
        { type: "monthly", price: 999 },
        { type: "yearly", price: 9999 }
      ],
      minInvestment: 100000,
      durationMonths: 12,
      PortfolioCategory: "Basic",
      timeHorizon: "Long-term",
      rebalancing: "Quarterly",
      index: "NIFTY 50",
      monthlyGains: "1.5%",
      CAGRSinceInception: "12%",
      oneYearGains: "15%",
      compareWith: "NIFTY 50 Index",
      holdings: [
        {
          symbol: "HDFC",
          weight: 20,
          sector: "Banking",
          status: "Hold",
          buyPrice: 1500,
          quantity: 13,
          minimumInvestmentValueStock: 19500,
          stockCapType: "large cap"
        },
        {
          symbol: "TCS",
          weight: 15,
          sector: "Technology",
          status: "Fresh-Buy",
          buyPrice: 3200,
          quantity: 4,
          minimumInvestmentValueStock: 12800,
          stockCapType: "large cap"
        },
        {
          symbol: "ITC",
          weight: 15,
          sector: "Consumer Goods",
          status: "Hold",
          buyPrice: 420,
          quantity: 35,
          minimumInvestmentValueStock: 14700,
          stockCapType: "large cap"
        }
      ],
      downloadLinks: [
        {
          linkType: "prospectus",
          linkUrl: "https://example.com/conservative-prospectus.pdf",
          linkDiscription: "Detailed prospectus for conservative portfolio"
        }
      ],
      youTubeLinks: [
        {
          link: "https://youtube.com/watch?v=example1"
        }
      ],
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: generateMockObjectId(),
      name: "Balanced Growth",
      description: [
        { key: "home card", value: "A balanced portfolio aiming for moderate growth with reasonable risk." },
        { key: "checkout card", value: "Ideal for investors seeking balanced exposure." },
        { key: "portfolio card", value: "Mix of growth and value stocks." }
      ],
      cashBalance: 10000,
      currentValue: 250000,
      subscriptionFee: [
        { type: "monthly", price: 1499 },
        { type: "yearly", price: 14999 }
      ],
      minInvestment: 250000,
      durationMonths: 24,
      PortfolioCategory: "Premium",
      timeHorizon: "Medium-term",
      rebalancing: "Semi-annually",
      index: "NIFTY 100",
      monthlyGains: "2.1%",
      CAGRSinceInception: "16%",
      oneYearGains: "18%",
      compareWith: "NIFTY 100 Index",
      holdings: [
        {
          symbol: "TATAMOTORS",
          weight: 15,
          sector: "Automotive",
          status: "Fresh-Buy",
          buyPrice: 650,
          quantity: 57,
          minimumInvestmentValueStock: 37050,
          stockCapType: "large cap"
        },
        {
          symbol: "ICICIBANK",
          weight: 15,
          sector: "Banking",
          status: "Hold",
          buyPrice: 950,
          quantity: 39,
          minimumInvestmentValueStock: 37050,
          stockCapType: "large cap"
        }
      ],
      downloadLinks: [
        {
          linkType: "research",
          linkUrl: "https://example.com/balanced-research.pdf",
          linkDiscription: "Research report for balanced growth portfolio"
        }
      ],
      youTubeLinks: [
        {
          link: "https://youtube.com/watch?v=example2"
        }
      ],
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: generateMockObjectId(),
      name: "Aggressive Growth",
      description: [
        { key: "home card", value: "A high-risk, high-reward portfolio focused on maximum capital appreciation." },
        { key: "checkout card", value: "For aggressive investors seeking maximum returns." },
        { key: "portfolio card", value: "High-growth potential stocks." }
      ],
      cashBalance: 5000,
      currentValue: 500000,
      subscriptionFee: [
        { type: "monthly", price: 1999 },
        { type: "yearly", price: 19999 }
      ],
      minInvestment: 500000,
      durationMonths: 36,
      PortfolioCategory: "Advanced",
      timeHorizon: "Long-term",
      rebalancing: "Monthly",
      index: "NIFTY NEXT 50",
      monthlyGains: "3.2%",
      CAGRSinceInception: "22%",
      oneYearGains: "25%",
      compareWith: "NIFTY NEXT 50 Index",
      holdings: [
        {
          symbol: "ADANIENT",
          weight: 15,
          sector: "Infrastructure",
          status: "Fresh-Buy",
          buyPrice: 2200,
          quantity: 34,
          minimumInvestmentValueStock: 74800,
          stockCapType: "large cap"
        },
        {
          symbol: "ZOMATO",
          weight: 15,
          sector: "Technology",
          status: "Hold",
          buyPrice: 120,
          quantity: 625,
          minimumInvestmentValueStock: 75000,
          stockCapType: "mid cap"
        }
      ],
      downloadLinks: [
        {
          linkType: "fact-sheet",
          linkUrl: "https://example.com/aggressive-factsheet.pdf",
          linkDiscription: "Fact sheet for aggressive growth portfolio"
        }
      ],
      youTubeLinks: [
        {
          link: "https://youtube.com/watch?v=example3"
        }
      ],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
}

export const fetchPortfolioById = async (id: string): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    console.log(
      `Fetching portfolio with ID ${id} from: ${API_BASE_URL}/api/portfolios/${id}`
    );

    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`);

    console.log(`Portfolio detail API response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for portfolio details"
        );
      }

      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to fetch portfolio: Server returned ${response.status}`
        );
      } catch (jsonError) {
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
    
    // Return mock data if in development or if API fails
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true"
    ) {
      const mockPortfolios = getMockPortfolios();
      const mockPortfolio = mockPortfolios.find(p => p.id === id);
      if (mockPortfolio) {
        return mockPortfolio;
      }
    }
    
    throw error;
  }
};

export const createPortfolio = async (
  portfolioData: CreatePortfolioRequest
): Promise<Portfolio> => {
  try {
    console.log("Creating portfolio with data:", JSON.stringify(portfolioData, null, 2));

    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`, {
      method: "POST",
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolio creation");
      }

      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to create portfolio"
        );
      } catch (jsonError) {
        throw new Error(
          `Failed to create portfolio: Server returned ${response.status}`
        );
      }
    }

    const createdPortfolio = await response.json();
    console.log("Successfully created portfolio:", createdPortfolio);

    // Ensure the portfolio has an id property (API might return _id)
    if (createdPortfolio._id && !createdPortfolio.id) {
      createdPortfolio.id = createdPortfolio._id;
    }

    return createdPortfolio;
  } catch (error) {
    console.error("Error creating portfolio:", error);
    
    // Return mock data if in development or if API fails
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true"
    ) {
      return getMockCreatedPortfolio(portfolioData);
    }
    
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
    subscriptionFee: portfolioData.subscriptionFee,
    minInvestment: portfolioData.minInvestment,
    durationMonths: portfolioData.durationMonths,
    PortfolioCategory: portfolioData.PortfolioCategory || "Basic",
    holdings: portfolioData.holdings || [],
    downloadLinks: portfolioData.downloadLinks || [],
    youTubeLinks: portfolioData.youTubeLinks || [],
    timeHorizon: portfolioData.timeHorizon || "",
    rebalancing: portfolioData.rebalancing || "",
    index: portfolioData.index || "",
    details: portfolioData.details || "",
    monthlyGains: portfolioData.monthlyGains || "",
    CAGRSinceInception: portfolioData.CAGRSinceInception || "",
    oneYearGains: portfolioData.oneYearGains || "",
    compareWith: portfolioData.compareWith || "",
    cashBalance: portfolioData.cashBalance || 0,
    currentValue: portfolioData.currentValue || portfolioData.minInvestment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

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
    console.log("Update data:", JSON.stringify(portfolioData, null, 2));

    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "PUT",
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for portfolio update"
        );
      }

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

export const deletePortfolio = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned an HTML response instead of JSON. The portfolio might not exist."
        );
      }

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
  return [];
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
  return [];
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