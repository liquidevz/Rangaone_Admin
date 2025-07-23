// lib\api-portfolios.ts  
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth"

// Portfolio Types
export interface DescriptionItem {
  key: string
  value: string
}

export interface SubscriptionFee {
  type: 'monthly' | 'quarterly' | 'yearly'
  price: number
}

export interface PortfolioHolding {
  symbol: string
  weight: number
  sector: string
  stockCapType?: 'small cap' | 'mid cap' | 'large cap' | 'micro cap' | 'mega cap'
  status: 'Hold' | 'Fresh-Buy' | 'partial-sell' | 'Sell' | 'addon-buy' // Add 'addon-buy'
  buyPrice: number
  quantity: number
  minimumInvestmentValueStock: number
}

export interface DownloadLink {
  _id?: string
  linkType: string
  linkUrl: string
  name?: string
  linkDiscription?: string
  createdAt?: string
}

export interface YouTubeLink {
  _id?: string
  link: string
  createdAt?: string
}

export interface Portfolio {
  id?: string
  _id?: string
  name: string
  description: DescriptionItem[]
  cashBalance: number
  currentValue: number
  timeHorizon?: string
  rebalancing?: string
  index?: string
  details?: string
  monthlyGains?: string
  CAGRSinceInception?: string
  oneYearGains?: string
  subscriptionFee: SubscriptionFee[]
  minInvestment: number
  durationMonths: number
  PortfolioCategory: string
  compareWith?: string
  expiryDate?: string
  monthlyContribution?: number
  // Support both naming conventions for rebalancing dates
  nextRebalanceDate?: string
  nextRebalancingDate?: string
  lastRebalanceDate?: string
  lastRebalancingDate?: string
  holdings: PortfolioHolding[]
  downloadLinks?: DownloadLink[]
  youTubeLinks?: YouTubeLink[]
  holdingsValue?: number // Virtual field
  createdAt?: string
  updatedAt?: string
}

export interface CreatePortfolioRequest {
  name: string
  description?: DescriptionItem[]
  cashBalance?: number
  currentValue?: number
  timeHorizon?: string
  rebalancing?: string
  index?: string
  details?: string
  monthlyGains?: string
  CAGRSinceInception?: string
  oneYearGains?: string
  subscriptionFee: SubscriptionFee[]
  minInvestment: number
  durationMonths: number
  PortfolioCategory?: string
  compareWith?: string
  expiryDate?: string
  monthlyContribution?: number
  // Support both naming conventions for rebalancing dates
  nextRebalanceDate?: string
  nextRebalancingDate?: string
  lastRebalanceDate?: string
  lastRebalancingDate?: string
  holdings?: PortfolioHolding[]
  downloadLinks?: DownloadLink[]
  youTubeLinks?: YouTubeLink[]
}

// Portfolio API Functions
export const fetchPortfolios = async (): Promise<Portfolio[]> => {
  try {
    // Get the admin access token
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to fetch portfolios")
    }

    // Log the API request for debugging
    console.log(`Fetching portfolios from: ${API_BASE_URL}/api/portfolios`)
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
      method: "GET",
      headers,
    })

    // Log the response status for debugging
    console.log(`Portfolio API response status: ${response.status}`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolios")
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || `Failed to fetch portfolios: Server returned ${response.status}`)
      } catch (jsonError) {
        // If we can't parse the error as JSON, throw a generic error with the status code
        throw new Error(`Failed to fetch portfolios: Server returned ${response.status}`)
      }
    }

    // Parse the response as JSON
    const responseText = await response.text()
    console.log("Raw API response:", responseText)

    let portfolios
    try {
      portfolios = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from server")
    }

    console.log("Parsed portfolios:", portfolios)

    // Check if the response is an array
    if (!Array.isArray(portfolios)) {
      console.error("API did not return an array of portfolios:", portfolios)

      // If the response has a data property that is an array, use that
      if (portfolios && Array.isArray(portfolios.data)) {
        portfolios = portfolios.data
      } else {
        throw new Error("API response format is not as expected")
      }
    }

    // Ensure all portfolios have valid IDs
    const validatedPortfolios = portfolios.map((portfolio: Portfolio) => {
      if (!portfolio.id && portfolio._id) {
        console.log(`Portfolio ${portfolio.name} has _id (${portfolio._id}) but no id, copying _id to id`)
        return {
          ...portfolio,
          id: portfolio._id,
        }
      }
      return portfolio
    })

    // Log the number of portfolios fetched for debugging
    console.log(`Fetched ${validatedPortfolios.length} portfolios from API`)

    return validatedPortfolios
  } catch (error) {
    console.error("Error fetching portfolios:", error)
    throw error
  }
}

export const fetchPortfolioById = async (id: string): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID")
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to access portfolio")
    }

    // Log the API request for debugging
    console.log(`Fetching portfolio with ID ${id} from: ${API_BASE_URL}/api/portfolios/${id}`)
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "GET",
      headers,
    })

    // Log the response status for debugging
    console.log(`Portfolio detail API response status: ${response.status}`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolio details")
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json()
        throw new Error(
          errorData.message || errorData.error || `Failed to fetch portfolio: Server returned ${response.status}`,
        )
      } catch (jsonError) {
        // If we can't parse the error as JSON, throw a generic error with the status code
        throw new Error(`Failed to fetch portfolio: Server returned ${response.status}`)
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text()
    console.log("Raw API response for portfolio detail:", responseText)

    let portfolio
    try {
      portfolio = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from server")
    }

    console.log("Parsed portfolio:", portfolio)

    // Check if the response has a data property
    if (portfolio && portfolio.data && typeof portfolio.data === "object") {
      portfolio = portfolio.data
    }

    // Ensure the portfolio has an id property (API might return _id)
    if (portfolio._id && !portfolio.id) {
      console.log(`Portfolio ${portfolio.name} has _id (${portfolio._id}) but no id, copying _id to id`)
      portfolio.id = portfolio._id
    }

    return portfolio
  } catch (error) {
    console.error(`Error fetching portfolio with id ${id}:`, error)
    throw error
  }
}

export const createPortfolio = async (portfolioData: CreatePortfolioRequest): Promise<Portfolio> => {
  try {
    // Get the admin access token
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to create portfolio")
    }

    // Log the API request for debugging
    console.log(`Creating portfolio at: ${API_BASE_URL}/api/portfolios`)
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`)
    console.log("Portfolio data being sent:", JSON.stringify(portfolioData, null, 2))

    // Validate and format the data before sending
    const formattedData = formatPortfolioData(portfolioData)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
      method: "POST",
      headers,
      body: JSON.stringify(formattedData),
    })

    console.log(`Create portfolio response status: ${response.status}`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON")
      }

      // Try to get the error message from the response
      const responseText = await response.text()
      console.error("Error response from server:", responseText)

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || errorData.error || "Failed to create portfolio")
      } catch (jsonError) {
        throw new Error(`Failed to create portfolio: Server returned ${response.status}`)
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text()
    console.log("Raw API response for portfolio creation:", responseText)

    let portfolio
    try {
      portfolio = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from server")
    }

    console.log("Created portfolio response:", portfolio)

    // Check if the response has a data property
    if (portfolio && portfolio.data && typeof portfolio.data === "object") {
      portfolio = portfolio.data
    }

    // Ensure the portfolio has an id property (API might return _id)
    if (portfolio._id && !portfolio.id) {
      console.log(`Created portfolio has _id (${portfolio._id}) but no id, copying _id to id`)
      portfolio.id = portfolio._id
    }

    return portfolio
  } catch (error) {
    console.error("Error creating portfolio:", error)
    throw error
  }
}

export const updatePortfolio = async (id: string, portfolioData: CreatePortfolioRequest): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      console.error("Invalid portfolio ID provided to updatePortfolio:", id)
      throw new Error("Invalid portfolio ID")
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to update portfolio")
    }

    console.log(`Updating portfolio with ID: ${id}`)
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`)
    console.log("Portfolio data being sent:", JSON.stringify(portfolioData, null, 2))

    // Validate and format the data before sending
    const formattedData = formatPortfolioData(portfolioData)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    console.log("Formatted data being sent:", JSON.stringify(formattedData, null, 2))

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(formattedData),
    })

    console.log(`Update response status: ${response.status}`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for portfolio update")
      }

      // Try to get the error message from the response
      const responseText = await response.text()
      console.error("Error response from server:", responseText)

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || errorData.error || "Failed to update portfolio")
      } catch (jsonError) {
        throw new Error(`Failed to update portfolio: Server returned ${response.status}`)
      }
    }

    // Parse the response as text first to inspect it
    const responseText = await response.text()
    console.log("Raw API response for portfolio update:", responseText)

    let updatedPortfolio
    try {
      updatedPortfolio = JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON response:", error)
      throw new Error("Invalid JSON response from server")
    }

    console.log("Updated portfolio response:", updatedPortfolio)

    // Check if the response has a data property
    if (updatedPortfolio && updatedPortfolio.data && typeof updatedPortfolio.data === "object") {
      updatedPortfolio = updatedPortfolio.data
    }

    // Ensure the portfolio has an id property (API might return _id)
    if (updatedPortfolio._id && !updatedPortfolio.id) {
      console.log(`Updated portfolio has _id (${updatedPortfolio._id}) but no id, copying _id to id`)
      updatedPortfolio.id = updatedPortfolio._id
    }

    console.log("Successfully updated portfolio with ID:", updatedPortfolio.id || updatedPortfolio._id)
    return updatedPortfolio
  } catch (error) {
    console.error(`Error updating portfolio with id ${id}:`, error)
    throw error
  }
}

export const deletePortfolio = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID")
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to delete portfolio")
    }

    console.log(`Deleting portfolio with ID: ${id}`)
    console.log(`Using admin token: ${adminToken.substring(0, 10)}...`)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "DELETE",
      headers,
    })

    console.log(`Delete response status: ${response.status}`)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned an HTML response instead of JSON. The portfolio might not exist.")
      }

      // Try to get the error message from the response
      const responseText = await response.text()
      console.error("Error response from server:", responseText)

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || errorData.error || "Failed to delete portfolio")
      } catch (jsonError) {
        throw new Error(`Failed to delete portfolio: Server returned ${response.status}`)
      }
    }

    console.log("Successfully deleted portfolio with ID:", id)
  } catch (error) {
    console.error(`Error deleting portfolio with id ${id}:`, error)
    throw error
  }
}

// Helper function to format and validate portfolio data
const formatPortfolioData = (data: CreatePortfolioRequest) => {
  // Ensure numeric fields are properly converted
  const formattedData = {
    ...data,
    minInvestment: typeof data.minInvestment === "string" ? Number.parseFloat(data.minInvestment) : data.minInvestment,
    durationMonths: typeof data.durationMonths === "string" ? Number.parseInt(data.durationMonths, 10) : data.durationMonths,
    cashBalance: typeof data.cashBalance === "string" ? Number.parseFloat(data.cashBalance) : data.cashBalance,
    currentValue: typeof data.currentValue === "string" ? Number.parseFloat(data.currentValue) : data.currentValue,
    monthlyContribution: typeof data.monthlyContribution === "string" ? Number.parseFloat(data.monthlyContribution) : data.monthlyContribution,
  }
  
  // Ensure rebalancing dates are properly formatted and use both field names
  if (data.lastRebalanceDate) {
    formattedData.lastRebalanceDate = data.lastRebalanceDate;
    formattedData.lastRebalancingDate = data.lastRebalanceDate;
  } else if (data.lastRebalancingDate) {
    formattedData.lastRebalanceDate = data.lastRebalancingDate;
    formattedData.lastRebalancingDate = data.lastRebalancingDate;
  }
  
  if (data.nextRebalanceDate) {
    formattedData.nextRebalanceDate = data.nextRebalanceDate;
    formattedData.nextRebalancingDate = data.nextRebalanceDate;
  } else if (data.nextRebalancingDate) {
    formattedData.nextRebalanceDate = data.nextRebalancingDate;
    formattedData.nextRebalancingDate = data.nextRebalancingDate;
  }

  // Format subscription fees
  if (formattedData.subscriptionFee && Array.isArray(formattedData.subscriptionFee)) {
    formattedData.subscriptionFee = formattedData.subscriptionFee.map(fee => ({
      ...fee,
      price: typeof fee.price === "string" ? Number.parseFloat(fee.price) : fee.price,
    }))
  }

  // Format holdings
  if (formattedData.holdings && Array.isArray(formattedData.holdings)) {
    formattedData.holdings = formattedData.holdings.map(holding => ({
      ...holding,
      weight: typeof holding.weight === "string" ? Number.parseFloat(holding.weight) : holding.weight,
      buyPrice: typeof holding.buyPrice === "string" ? Number.parseFloat(holding.buyPrice) : holding.buyPrice,
      quantity: typeof holding.quantity === "string" ? Number.parseInt(holding.quantity, 10) : holding.quantity,
      minimumInvestmentValueStock: typeof holding.minimumInvestmentValueStock === "string" 
        ? Number.parseFloat(holding.minimumInvestmentValueStock) 
        : holding.minimumInvestmentValueStock,
    }))
  }

  // Clean up undefined values to avoid sending them to the API
  Object.keys(formattedData).forEach(key => {
    if (formattedData[key as keyof CreatePortfolioRequest] === undefined) {
      delete formattedData[key as keyof CreatePortfolioRequest]
    }
  })

  return formattedData
}

// Additional API functions for managing links (if needed)
export const addYouTubeLink = async (portfolioId: string, link: string): Promise<Portfolio> => {
  try {
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/youtube-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ link }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || "Failed to add YouTube link")
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding YouTube link:", error)
    throw error
  }
}

export const removeYouTubeLink = async (portfolioId: string, linkId: string): Promise<Portfolio> => {
  try {
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/youtube-links/${linkId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || "Failed to remove YouTube link")
    }

    return await response.json()
  } catch (error) {
    console.error("Error removing YouTube link:", error)
    throw error
  }
}

export const addDownloadLink = async (portfolioId: string, linkData: Omit<DownloadLink, '_id' | 'createdAt'>): Promise<Portfolio> => {
  try {
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/download-links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(linkData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || "Failed to add download link")
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding download link:", error)
    throw error
  }
}

export const removeDownloadLink = async (portfolioId: string, linkId: string): Promise<Portfolio> => {
  try {
    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${portfolioId}/download-links/${linkId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || "Failed to remove download link")
    }

    return await response.json()
  } catch (error) {
    console.error("Error removing download link:", error)
    throw error
  }
}