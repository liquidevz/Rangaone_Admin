// lib\api-bundles.ts  
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";
import { Portfolio } from "./api";

// Bundle Types
export interface PortfolioReference {
  id: string;
  name?: string;
  description?: string;
  subscriptionFee?: Array<{
    type: "monthly" | "quarterly" | "yearly";
    price: number;
  }>;
}

export interface Bundle {
 _id?: string;
  id?: string;
   name: string;
  description: string;
  portfolios: Array<string | Portfolio | PortfolioReference>;
  category: "basic" | "premium";
  monthlyPrice?: number | null;
  monthlyemandateprice?: number | null;
  quarterlyPrice?: number | null;
  quarterlyemandateprice?: number | null;
  yearlyPrice?: number | null;
  yearlyemandateprice?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBundleRequest {
  name: string;
  description: string;
  portfolios: Array<string | PortfolioReference>;
  category: "basic" | "premium";
  monthlyPrice?: number | null;
  monthlyemandateprice?: number | null;
  quarterlyPrice?: number | null;
  quarterlyemandateprice?: number | null;
  yearlyPrice?: number | null;
  yearlyemandateprice?: number | null;
}

// Helper function to safely extract portfolio ID
export const getPortfolioId = (portfolioItem: string | Portfolio | PortfolioReference): string => {
  if (typeof portfolioItem === 'string') {
    return portfolioItem;
  }
  if (typeof portfolioItem === 'object' && portfolioItem !== null) {
    return (portfolioItem as any).id || (portfolioItem as any)._id || '';
  }
  return '';
};

// Helper function to get portfolio name safely
export const getPortfolioName = (
  portfolioItem: string | Portfolio | PortfolioReference,
  portfolioLookup: Record<string, Portfolio> = {}
): string => {
  if (typeof portfolioItem === 'string') {
    const portfolio = portfolioLookup[portfolioItem];
    return portfolio?.name || `Portfolio ${portfolioItem.substring(0, 8)}...`;
  }
  if (typeof portfolioItem === 'object' && portfolioItem !== null) {
    return (portfolioItem as any).name || `Portfolio ${getPortfolioId(portfolioItem).substring(0, 8)}...`;
  }
  return 'Unknown Portfolio';
};

// Helper function to get primary subscription fee
export const getPortfolioPrimaryFee = (
  portfolioItem: string | Portfolio | PortfolioReference,
  portfolioLookup: Record<string, Portfolio> = {},
  preferEmandate: boolean = false
): number => {
  let portfolio: Portfolio | undefined;
  
  if (typeof portfolioItem === 'string') {
    portfolio = portfolioLookup[portfolioItem];
  } else if (typeof portfolioItem === 'object' && portfolioItem !== null) {
    portfolio = portfolioItem as Portfolio;
  }
  
  if (!portfolio) {
    return 0;
  }
  
  // Choose fee array based on preference
  const feeArray = preferEmandate && Array.isArray(portfolio.emandateSubriptionFees) && portfolio.emandateSubriptionFees.length > 0
    ? portfolio.emandateSubriptionFees
    : portfolio.subscriptionFee;
  
  if (!Array.isArray(feeArray) || feeArray.length === 0) {
    return 0;
  }
  
  // First try to find monthly fee
  const monthlyFee = feeArray.find(fee => fee.type === 'monthly');
  if (monthlyFee) {
    return monthlyFee.price;
  }
  
  // Otherwise return the first fee
  return feeArray[0].price;
};

// Bundle API Functions
export const fetchBundles = async (): Promise<Bundle[]> => {
  try {
    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to fetch bundles");
    }

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/bundles`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for bundles");
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch bundles: Server returned ${response.status}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch bundles: Server returned ${response.status}`);
      }
    }

    const bundles = await response.json();

    // Check if the response is an array
    let bundleArray = bundles;
    if (!Array.isArray(bundleArray)) {
      // If the response has a data property that is an array, use that
      if (bundleArray && Array.isArray(bundleArray.data)) {
        bundleArray = bundleArray.data;
      } else {
        throw new Error("API response format is not as expected");
      }
    }

    // Ensure all bundles have valid IDs
    const validatedBundles = bundleArray.map((bundle: Bundle) => {
      if (!bundle.id && bundle._id) {
        return {
          ...bundle,
          id: bundle._id,
        };
      }
      return bundle;
    });

    return validatedBundles;
  } catch (error) {
    throw error;
  }
};

export const fetchBundleById = async (id: string): Promise<Bundle> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid bundle ID");
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to access bundle");
    }

    // Log the API request for debugging
    console.log(`Fetching bundle with ID ${id} from: ${API_BASE_URL}/api/bundles/${id}`);
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`);

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/bundles/${id}`, {
      method: "GET",
      headers,
    });

    // Log the response status for debugging
    console.log(`Bundle detail API response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for bundle details");
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || `Failed to fetch bundle: Server returned ${response.status}`,
        );
      } catch (jsonError) {
        throw new Error(`Failed to fetch bundle: Server returned ${response.status}`);
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text();
    console.log("Raw API response for bundle detail:", responseText);

    let bundle;
    try {
      bundle = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }

    console.log("Parsed bundle:", bundle);

    // Check if the response has a data property
    if (bundle && bundle.data && typeof bundle.data === "object") {
      bundle = bundle.data;
    }

    // Ensure the bundle has an id property (API might return _id)
    if (bundle._id && !bundle.id) {
      console.log(`Bundle ${bundle.name} has _id (${bundle._id}) but no id, copying _id to id`);
      bundle.id = bundle._id;
    }

    return bundle;
  } catch (error) {
    console.error(`Error fetching bundle with id ${id}:`, error);
    throw error;
  }
};

export const createBundle = async (bundleData: CreateBundleRequest): Promise<Bundle> => {
  try {
    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to create bundle");
    }

    // Make sure we always send string[] for portfolios
    const sanitizedData = {
      ...bundleData,
      portfolios: bundleData.portfolios.map(portfolioItem => 
        typeof portfolioItem === 'object' && portfolioItem !== null ? portfolioItem.id : portfolioItem
      )
    };

    // Log the API request for debugging
    console.log(`Creating bundle at: ${API_BASE_URL}/api/bundles`);
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`);
    console.log("Bundle data being sent:", JSON.stringify(sanitizedData, null, 2));

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/bundles`, {
      method: "POST",
      headers,
      body: JSON.stringify(sanitizedData),
    });

    console.log(`Create bundle response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON");
      }

      // Try to get the error message from the response
      const responseText = await response.text();
      console.error("Error response from server:", responseText);

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || errorData.error || "Failed to create bundle");
      } catch (jsonError) {
        throw new Error(`Failed to create bundle: Server returned ${response.status}`);
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text();
    console.log("Raw API response for bundle creation:", responseText);

    let bundle;
    try {
      bundle = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }

    console.log("Created bundle response:", bundle);

    // Check if the response has a data property
    if (bundle && bundle.data && typeof bundle.data === "object") {
      bundle = bundle.data;
    }

    // Ensure the bundle has an id property (API might return _id)
    if (bundle._id && !bundle.id) {
      console.log(`Created bundle has _id (${bundle._id}) but no id, copying _id to id`);
      bundle.id = bundle._id;
    }

    return bundle;
  } catch (error) {
    console.error("Error creating bundle:", error);
    throw error;
  }
};

export const updateBundle = async (
  id: string,
  bundleData: Partial<CreateBundleRequest>
): Promise<Bundle> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid bundle ID");
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to update bundle");
    }

    // Ensure we sanitize portfolio IDs if they're present
    const sanitizedData = { ...bundleData };
    if (bundleData.portfolios) {
      sanitizedData.portfolios = bundleData.portfolios.map(portfolioItem => 
        typeof portfolioItem === 'object' && portfolioItem !== null ? portfolioItem.id : portfolioItem
      );
    }

    console.log(`Updating bundle with ID: ${id}`);
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`);
    console.log("Bundle data being sent:", JSON.stringify(sanitizedData, null, 2));

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/bundles/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(sanitizedData),
    });

    console.log(`Update response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for bundle update");
      }

      // Try to get the error message from the response
      const responseText = await response.text();
      console.error("Error response from server:", responseText);

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || errorData.error || "Failed to update bundle");
      } catch (jsonError) {
        throw new Error(`Failed to update bundle: Server returned ${response.status}`);
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text();
    console.log("Raw API response for bundle update:", responseText);

    let updatedBundle;
    try {
      updatedBundle = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }

    console.log("Updated bundle response:", updatedBundle);

    // Check if the response has a data property
    if (updatedBundle && updatedBundle.data && typeof updatedBundle.data === "object") {
      updatedBundle = updatedBundle.data;
    }

    // Ensure the bundle has an id property (API might return _id)
    if (updatedBundle._id && !updatedBundle.id) {
      console.log(`Updated bundle has _id (${updatedBundle._id}) but no id, copying _id to id`);
      updatedBundle.id = updatedBundle._id;
    }

    return updatedBundle;
  } catch (error) {
    console.error(`Error updating bundle with id ${id}:`, error);
    throw error;
  }
};

export const deleteBundle = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid bundle ID");
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required to delete bundle");
    }

    console.log(`Deleting bundle with ID: ${id}`);
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`);

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/bundles/${id}`, {
      method: "DELETE",
      headers,
    });

    console.log(`Delete response status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON. The bundle might not exist.");
      }

      // Try to get the error message from the response
      const responseText = await response.text();
      console.error("Error response from server:", responseText);

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || errorData.error || "Failed to delete bundle");
      } catch (jsonError) {
        throw new Error(`Failed to delete bundle: Server returned ${response.status}`);
      }
    }

    console.log("Successfully deleted bundle with ID:", id);
  } catch (error) {
    console.error(`Error deleting bundle with id ${id}:`, error);
    throw error;
  }
};

// Enhanced fetch function to include portfolio details
export const fetchBundleWithPortfolioDetails = async (id: string): Promise<Bundle> => {
  try {
    // First fetch the bundle
    const bundle = await fetchBundleById(id);
    
    // If we have portfolio IDs but not full objects, fetch the portfolio details
    if (bundle.portfolios && Array.isArray(bundle.portfolios) && 
        bundle.portfolios.length > 0 && typeof bundle.portfolios[0] === 'string') {
      try {
        // Import dynamically to avoid circular dependencies
        const api = await import('./api');
        const portfolios = await api.fetchPortfolios();
        
        // Map portfolio IDs to full portfolio objects
        const portfolioIds = bundle.portfolios as string[];
        const portfolioObjects = portfolioIds.map(portfolioId => {
          const portfolio = portfolios.find(p => p.id === portfolioId);
          
          // If we can't find the portfolio, return a simple object with id, name, and description
          if (!portfolio) {
            return { 
              id: portfolioId, 
              name: `Portfolio ${portfolioId.substring(0, 8)}...`, 
              description: "Portfolio details not available",
              subscriptionFee: []
            };
          }
          
          return portfolio;
        });
        
        // Return the bundle with full portfolio objects
        return {
          ...bundle,
          portfolios: portfolioObjects
        };
      } catch (error) {
        console.error("Error fetching portfolio details:", error);
        // Return the original bundle if we can't fetch portfolio details
        return bundle;
      }
    }
    
    return bundle;
  } catch (error) {
    console.error(`Error fetching bundle with ID ${id}:`, error);
    throw error;
  }
};

// Helper function to safely create portfolio options for MultiSelect
export const createPortfolioOptions = (portfolios: Portfolio[]) => {
  return portfolios
    .filter(portfolio => {
      const id = portfolio.id || portfolio._id;
      return id && id.trim() !== '';
    })
    .map((portfolio) => {
      const id = portfolio.id || portfolio._id || "";
      
      // Get home card description
      const homeCardDesc = Array.isArray(portfolio.description) 
        ? portfolio.description.find(d => d.key === "home card")?.value || ""
        : "";
      
      // Get primary subscription fee (monthly preferred, otherwise first)
      const primaryFee = Array.isArray(portfolio.subscriptionFee) && portfolio.subscriptionFee.length > 0
        ? (() => {
            const monthlyFee = portfolio.subscriptionFee.find(fee => fee.type === 'monthly');
            return monthlyFee ? monthlyFee.price : portfolio.subscriptionFee[0].price;
          })()
        : 0;
      
      return {
        label: portfolio.name || `Portfolio ${id.substring(0, 8)}...`,
        value: id,
        description: primaryFee > 0 
          ? `Fee: ₹${primaryFee}` 
          : homeCardDesc || ''
      };
    });
};

// Helper function to format portfolio data for display
export const formatPortfolioForDisplay = (portfolio: Portfolio) => {
  const homeCardDescription = Array.isArray(portfolio.description)
    ? portfolio.description.find(d => d.key === "home card")?.value || ""
    : "";
    
  const primaryFee = Array.isArray(portfolio.subscriptionFee) && portfolio.subscriptionFee.length > 0
    ? (() => {
        const monthlyFee = portfolio.subscriptionFee.find(fee => fee.type === 'monthly');
        return monthlyFee ? monthlyFee.price : portfolio.subscriptionFee[0].price;
      })()
    : 0;
    
  return {
    id: portfolio.id || portfolio._id || "",
    name: portfolio.name || "Unknown Portfolio",
    description: homeCardDescription,
    primaryFee: primaryFee,
    category: portfolio.PortfolioCategory || "Basic"
  };
};