// lib\api.ts  
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
    throw error;
  }
};

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
  status: "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "addon-buy";
  buyPrice: number;
  quantity: number;
  minimumInvestmentValueStock: number;
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
  lastRebalancingDate?: string;
  nextRebalancingDate?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  monthlyContribution?: number;
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
  
  // Legacy fields
  riskLevel?: string;
  cashRemaining?: number;
  subscriptionFee_legacy?: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description: DescriptionItem[];
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  monthlyContribution?: number;
  durationMonths: number;
  expiryDate?: string;
  holdings?: PortfolioHolding[];
  PortfolioCategory?: string;
  downloadLinks?: DownloadLink[];
  youTubeLinks?: YouTubeLink[];
  timeHorizon?: string;
  rebalancing?: string;
  lastRebalancingDate?: string;
  nextRebalancingDate?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  compareWith?: string;
  cashBalance?: number;
  currentValue?: number;
}

// Updated Portfolio Tip Types
export interface TipContent {
  key: string;
  value: string;
}

export interface PortfolioTip {
  _id: string;
  id: string;
  portfolio_id?: string;
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status: "Active" | "Closed";
  action?: "buy" | "sell" | "partial sell" | "partial profit" | "hold";
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
  downloadLinks?: Array<{
    _id?: string;
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioTipRequest {
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status: "Active" | "Closed"
  action?: "buy" | "sell" | "partial sell" | "partial profit" | "hold";
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
  downloadLinks?: Array<{
    name: string;
    url: string;
  }>;
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
    throw error;
  }
};

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
    throw error;
  }
};

export const createPortfolio = async (
  portfolioData: CreatePortfolioRequest
): Promise<Portfolio> => {
  try {
    console.log("=== API CREATE PORTFOLIO DEBUG ===");
    console.log("Portfolio Name:", portfolioData.name);
    console.log("Holdings in API request:", portfolioData.holdings);
    console.log("Holdings count:", portfolioData.holdings?.length || 0);
    console.log("API Request Body:", JSON.stringify(portfolioData, null, 2));
    console.log("=== END API DEBUG ===");

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
    throw error;
  }
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

//Portfolio Tip Types
export interface TipContent {
  key: string;
  value: string;
}

export interface PortfolioTip {
  _id: string;
  id: string;
  portfolio?: string;
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status: "Active" | "Closed";
  action?: "buy" | "sell" | "partial sell" | "partial profit" | "hold";
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
  downloadLinks?: Array<{
    _id?: string;
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioTipRequest {
  title: string;
  stockId: string;
  content: TipContent[];
  description: string;
  status: "Active" | "Closed";
  action?: "buy" | "sell" | "partial sell" | "partial profit" | "hold";
  buyRange?: string;
  targetPrice?: string;
  targetPercentage?: string;
  addMoreAt?: string;
  tipUrl?: string;
  exitPrice?: string;
  exitStatus?: string;
  exitStatusPercentage?: string;
  horizon?: "Short Term" | "Medium Term" | "Long Term";
  downloadLinks?: Array<{
    name: string;
    url: string;
  }>;
}

// Portfolio Tips API Functions 
export const fetchPortfolioTips = async (
  portfolioId: string
): Promise<PortfolioTip[]> => {
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
        throw new Error("Failed to fetch portfolio tips: Server returned HTML");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio tips");
    }

    const tips = await response.json();
    
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

export const fetchTipById = async (tipId: string): Promise<PortfolioTip> => {
  try {
    if (!tipId) {
      throw new Error("Invalid tip ID");
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/${tipId}`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for tip details");
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tip details");
    }

    const tip = await response.json();
    
    // Ensure proper structure
    return {
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
  } catch (error) {
    console.error(`Error fetching tip with id ${tipId}:`, error);
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

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`,
      {
        method: "POST",
        body: JSON.stringify(tipData),
      }
    );

    console.log(`Tip creation API response status: ${response.status}`);

    if (!response.ok) {
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
    
    // Ensure proper structure
    return {
      ...createdTip,
      id: createdTip._id || createdTip.id,
      content: Array.isArray(createdTip.content) ? createdTip.content : 
               typeof createdTip.content === 'string' ? [{ key: "Content", value: createdTip.content }] : [],
      downloadLinks: Array.isArray(createdTip.downloadLinks) ? createdTip.downloadLinks : [],
    };
  } catch (error) {
    console.error("Error creating portfolio tip:", error);
    throw error;
  }
};

export const updateTip = async (
  tipId: string,
  tipData: CreatePortfolioTipRequest
): Promise<PortfolioTip> => {
  try {
    if (!tipId) {
      throw new Error("Invalid tip ID");
    }

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

    const tip = await response.json();
    
    // Ensure proper structure
    return {
      ...tip,
      id: tip._id || tip.id,
      content: Array.isArray(tip.content) ? tip.content : 
               typeof tip.content === 'string' ? [{ key: "Content", value: tip.content }] : [],
      downloadLinks: Array.isArray(tip.downloadLinks) ? tip.downloadLinks : [],
    };
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
  user: User | string;
  portfolio: Portfolio | string;
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
    throw error;
  }
};

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
    throw error;
  }
};

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

export const cancelSubscription = async (subscriptionId: string): Promise<{ message: string }> => {
  try {
    if (!subscriptionId || subscriptionId === "undefined") {
      throw new Error("Invalid subscription ID");
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      const error = await response.json();
      
      // Handle specific error cases from API documentation
      if (response.status === 400) {
        throw new Error(error.message || "Cannot cancel during commitment period");
      }
      if (response.status === 404) {
        throw new Error(error.message || "Subscription not found");
      }
      
      throw new Error(error.message || "Failed to cancel subscription");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error canceling subscription with id ${subscriptionId}:`, error);
    throw error;
  }
};

export const fetchActiveSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/subscriptions/active`
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          "Server returned HTML instead of JSON for active subscriptions"
        );
      }

      const error = await response.json();
      throw new Error(error.message || "Failed to fetch active subscriptions");
    }

    const data = await response.json();
    return data?.subscriptions || [];
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    throw error;
  }
};