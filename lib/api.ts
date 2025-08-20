// lib/api.ts

import { API_BASE_URL, fetchWithAuth } from "@/lib/auth";
import { User } from "./api-users"; // Assuming api-users.ts exists

// =================================================================
// TYPE DEFINITIONS
// =================================================================

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
  realizedPnL: number;
  originalBuyPrice: number;
  totalQuantityOwned: number;
  symbol: string;
  weight: number;
  sector: string;
  stockCapType?: "small cap" | "mid cap" | "large cap" | "micro cap" | "mega cap";
  status: "Hold" | "Fresh-Buy" | "partial-sell" | "Sell" | "addon-buy" | "Sold" | string; // Allow string for timestamp
  buyPrice: number;
  quantity: number;
  minimumInvestmentValueStock: number;
  allocatedAmount?: number;
  actualInvestmentAmount?: number;
  leftoverAmount?: number;
  soldDate?: string; // For tracking when stock was sold
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
  id: string; // Use a single, required ID field
  _id: string;
  name: string;
  description: DescriptionItem[];
  cashBalance: number;
  currentValue: number;
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  durationMonths: number;
  PortfolioCategory: string;
  holdings: PortfolioHolding[];
  sold?: PortfolioHolding[]; // Array of sold stocks
  timeHorizon?: string;
  rebalancing?: string;
  lastRebalanceDate?: string;
  nextRebalanceDate?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  monthlyContribution?: number;
  compareWith?: string;
  expiryDate?: string;
  downloadLinks?: DownloadLink[];
  youTubeLinks?: YouTubeLink[];
  holdingsValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description: DescriptionItem[];
  subscriptionFee: SubscriptionFee[];
  minInvestment: number;
  durationMonths: number;
  holdings?: PortfolioHolding[];
  PortfolioCategory?: string;
  monthlyContribution?: number;
  timeHorizon?: string;
  rebalancing?: string;
  lastRebalanceDate?: string;
  nextRebalanceDate?: string;
  index?: string;
  details?: string;
  monthlyGains?: string;
  CAGRSinceInception?: string;
  oneYearGains?: string;
  compareWith?: string;
  downloadLinks?: DownloadLink[];
  youTubeLinks?: YouTubeLink[];
  cashBalance?: number;
  currentValue?: number;
}

// Portfolio Tip Types
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
  horizon?: "Short Term" | "Swing " | "Long Term";
  downloadLinks?: Array<{ _id?: string; name: string; url: string }>;
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
  horizon?: "Short Term" | "Swing " | "Long Term";
  downloadLinks?: Array<{ name: string; url: string }>;
}

// Config Types
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

// Subscription Types
export interface Subscription {
  _id: string;
  id?: string;
  isActive: boolean;
  status?: string;
  subscriptionType?: string; // Added for subscription type (emandate, monthly, etc.)
  lastPaidAt?: string;
  lastRenewed?: string;
  expiryDate?: string;
  missedCycles?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  portfolio?: Portfolio;
  productType?: "Portfolio" | "Bundle";
  productId?: Portfolio | any; // Can be Portfolio or Bundle
  startDate?: string;
  endDate?: string;
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


// =================================================================
// PORTFOLIO API FUNCTIONS
// =================================================================

/**
 * Fetches all portfolios.
 */
export const fetchPortfolios = async (): Promise<Portfolio[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch portfolios");
  const data = await response.json();
  return Array.isArray(data) ? data : data?.data || [];
};

/**
 * Fetches a single portfolio by its ID.
 */
export const fetchPortfolioById = async (id: string): Promise<Portfolio> => {
  if (!id) throw new Error("Invalid portfolio ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch portfolio");
  return await response.json();
};

/**
 * Creates a new portfolio.
 */
export const createPortfolio = async (portfolioData: CreatePortfolioRequest): Promise<Portfolio> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios`, {
    method: "POST",
    body: JSON.stringify(portfolioData),
  });
  if (!response.ok) {
    const responseText = await response.text();
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
    } catch (jsonError) {
      throw new Error(responseText || `Server error: ${response.status}`);
    }
  }
  return await response.json();
};

/**
 * Updates an existing portfolio. Uses PATCH for flexibility.
 */
export const updatePortfolio = async (id: string, portfolioData: Partial<CreatePortfolioRequest>): Promise<Portfolio> => {
  if (!id) throw new Error("Invalid portfolio ID");
  // Server always expects stockAction for PATCH requests
  const requestBody = {
    ...portfolioData,
    stockAction: "update"
  };
  console.log('UPDATE PORTFOLIO REQUEST BODY:', JSON.stringify(requestBody, null, 2));
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const responseText = await response.text();
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
    } catch (jsonError) {
      throw new Error(responseText || `Server error: ${response.status}`);
    }
  }
  return await response.json();
};

/**
 * Deletes a portfolio by its ID.
 */
export const deletePortfolio = async (id: string): Promise<void> => {
  if (!id) throw new Error("Invalid portfolio ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to delete portfolio");
};

/**
 * Adds a YouTube link to a portfolio.
 */
export const addPortfolioYouTubeLink = async (portfolioId: string, link: string): Promise<Portfolio> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${portfolioId}/youtube`, {
    method: "POST",
    body: JSON.stringify({ link }),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to add YouTube link");
  return await response.json();
};

/**
 * Removes a YouTube link from a portfolio.
 */
export const removePortfolioYouTubeLink = async (portfolioId: string, linkId: string): Promise<Portfolio> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${portfolioId}/youtube/${linkId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to remove YouTube link");
  return await response.json();
};

/**
 * Adds a download link to a portfolio.
 */
export const addPortfolioDownloadLink = async (portfolioId: string, linkData: Omit<DownloadLink, '_id' | 'createdAt'>): Promise<Portfolio> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${portfolioId}/downloads`, {
    method: "POST",
    body: JSON.stringify(linkData),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to add download link");
  return await response.json();
};

/**
 * Removes a download link from a portfolio.
 */
export const removePortfolioDownloadLink = async (portfolioId: string, linkId: string): Promise<Portfolio> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${portfolioId}/downloads/${linkId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to remove download link");
  return await response.json();
};


// =================================================================
// PORTFOLIO TIPS API FUNCTIONS
// =================================================================

/**
 * Fetches all tips for a specific portfolio.
 */
export const fetchPortfolioTips = async (portfolioId: string): Promise<PortfolioTip[]> => {
  if (!portfolioId) throw new Error("Invalid portfolio ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch portfolio tips");
  return await response.json();
};

/**
 * Fetches a single tip by its ID.
 */
export const fetchTipById = async (tipId: string): Promise<PortfolioTip> => {
  if (!tipId) throw new Error("Invalid tip ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${tipId}`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch tip");
  return await response.json();
};

/**
 * Creates a new tip for a portfolio.
 */
export const createPortfolioTip = async (portfolioId: string, tipData: CreatePortfolioTipRequest): Promise<PortfolioTip> => {
  if (!portfolioId) throw new Error("Invalid portfolio ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`, {
    method: "POST",
    body: JSON.stringify(tipData),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to create tip");
  return await response.json();
};

/**
 * Updates an existing tip.
 */
export const updateTip = async (tipId: string, tipData: Partial<CreatePortfolioTipRequest>): Promise<PortfolioTip> => {
  if (!tipId) throw new Error("Invalid tip ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${tipId}`, {
    method: "PUT",
    body: JSON.stringify(tipData),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to update tip");
  return await response.json();
};

/**
 * Deletes a tip by its ID.
 */
export const deleteTip = async (tipId: string): Promise<void> => {
  if (!tipId) throw new Error("Invalid tip ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/tips/${tipId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to delete tip");
};


// =================================================================
// CONFIGURATION API FUNCTIONS
// =================================================================

/**
 * Fetches all configurations, with optional filtering by category.
 */
export const fetchConfigs = async (category?: string): Promise<Config[]> => {
  const url = new URL(`${API_BASE_URL}/api/admin/configs`);
  if (category) url.searchParams.append("category", category);
  const response = await fetchWithAuth(url.toString());
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch configurations");
  return await response.json();
};

/**
 * Creates a new configuration.
 */
export const createConfig = async (configData: Omit<Config, 'createdAt' | 'updatedAt'>): Promise<Config> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs`, {
    method: "POST",
    body: JSON.stringify(configData),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to create configuration");
  return await response.json();
};

/**
 * Updates an existing configuration by its key.
 */
export const updateConfig = async (key: string, configData: Partial<Config>): Promise<Config> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs/${key}`, {
    method: "PUT",
    body: JSON.stringify(configData),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to update configuration");
  return await response.json();
};

/**
 * Deletes a configuration by its key.
 */
export const deleteConfig = async (key: string): Promise<void> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs/${key}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to delete configuration");
};

/**
 * Updates multiple configurations in a single batch request.
 */
export const bulkUpdateConfigs = async (configs: { key: string; value: string }[]): Promise<Config[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs/batch`, {
    method: "POST",
    body: JSON.stringify({ configs }),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to bulk update configurations");
  return await response.json();
};

/**
 * Sends a test email to verify SMTP configuration.
 */
export const testSmtpConfig = async (to: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/configs/test/smtp`, {
    method: "POST",
    body: JSON.stringify({ to }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to test SMTP configuration");
  return { success: true, message: data.message || "Test email sent successfully" };
};


// =================================================================
// SUBSCRIPTION API FUNCTIONS
// =================================================================

/**
 * Fetches all user subscriptions (admin).
 */
export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/subscriptions`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch subscriptions");
  const data = await response.json();
  // Handle both array response and object with subscriptions property
  return Array.isArray(data) ? data : (data?.subscriptions || []);
};

/**
 * Creates a payment order for a subscription.
 */
export const createSubscriptionOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/subscriptions/order`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to create subscription order");
  return await response.json();
};

/**
 * Verifies a payment after completion.
 */
export const verifyPayment = async (data: VerifyPaymentRequest): Promise<any> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/subscriptions/verify`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to verify payment");
  return await response.json();
};

/**
 * Fetches the current user's payment history.
 */
export const fetchPaymentHistory = async (): Promise<PaymentHistory[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/subscriptions/history`);
  if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch payment history");
  return await response.json();
};

/**
 * Cancels a user's subscription.
 */
export const cancelSubscription = async (subscriptionId: string): Promise<{ message: string }> => {
  if (!subscriptionId) throw new Error("Invalid subscription ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to cancel subscription");
  return await response.json();
};

/**
 * Updates a subscription's status.
 */
export const updateSubscriptionStatus = async (subscriptionId: string, status: string): Promise<Subscription> => {
  if (!subscriptionId) throw new Error("Invalid subscription ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/subscriptions/${subscriptionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to update subscription status");
  return await response.json();
};



/**
 * Updates portfolio holdings with specific actions
 */
export const updatePortfolioHoldings = async (
  id: string, 
  holdings: PortfolioHolding[], 
  stockAction: 'update' | 'add' | 'delete' | 'replace' = 'update'
): Promise<Portfolio> => {
  if (!id) throw new Error("Invalid portfolio ID");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/portfolios/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ holdings, stockAction }),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Failed to update portfolio holdings");
  return await response.json();
};
