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
  // Additional fields for P&L tracking
  originalBuyPrice?: number
  totalQuantityOwned?: number
  realizedPnL?: number
  soldDate?: string // Track when stock was sold for 10-day display
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

    // Send complete portfolio data, excluding only minInvestment for existing portfolios
    const { minInvestment, ...dataToUpdate } = portfolioData
    console.log("Complete portfolio data to update:", dataToUpdate)
    
    // Ensure all financial fields are included and properly formatted
    const completeData = {
      ...dataToUpdate,
      // Preserve all financial calculations
      cashBalance: dataToUpdate.cashBalance || 0,
      currentValue: dataToUpdate.currentValue || 0,
      // Ensure holdings are properly formatted
      holdings: dataToUpdate.holdings || []
    }
    
    const formattedData = formatPortfolioData(completeData as CreatePortfolioRequest)

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    console.log("Formatted data being sent:", JSON.stringify(formattedData, null, 2))

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "PATCH",
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
        console.error("400 Error details:", errorData)
        throw new Error(errorData.message || errorData.error || "Failed to update portfolio")
      } catch (jsonError) {
        console.error("400 Error (raw):", responseText)
        throw new Error(`Validation error: ${responseText || 'Invalid request data'}`)
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
    formattedData.subscriptionFee = formattedData.subscriptionFee.map((fee) => ({
      type: fee.type,
      price: typeof fee.price === "string" ? Number.parseFloat(fee.price) : fee.price,
    }))
  }

  // Format holdings
  if (formattedData.holdings && Array.isArray(formattedData.holdings)) {
    formattedData.holdings = formattedData.holdings.map(holding => {
      // Map frontend status values to backend enum values
      let status = (holding as any).status
      if (status === "Buy-More") {
        status = "addon-buy"
      }
      // Map other frontend values if needed
      if (status === "Fresh-Buy") {
        status = "Fresh-Buy" // Keep as is
      }
      if (status === "Hold Position") {
        status = "Hold"
      }
      if (status === "Complete Sell") {
        status = "Sell"
      }
      
      // Pick only the fields accepted by backend schema
      const cleanedHolding: PortfolioHolding = {
        symbol: holding.symbol,
        weight: typeof (holding as any).weight === "string" ? Number.parseFloat((holding as any).weight) : (holding as any).weight,
        sector: (holding as any).sector,
        stockCapType: (holding as any).stockCapType,
        status: status,
        buyPrice: typeof (holding as any).buyPrice === "string" ? Number.parseFloat((holding as any).buyPrice) : (holding as any).buyPrice,
        quantity: typeof (holding as any).quantity === "string" ? Number.parseInt((holding as any).quantity, 10) : (holding as any).quantity,
        minimumInvestmentValueStock: typeof (holding as any).minimumInvestmentValueStock === "string"
          ? Number.parseFloat((holding as any).minimumInvestmentValueStock)
          : (holding as any).minimumInvestmentValueStock,
        // Include P&L tracking fields if present
        ...(((holding as any).originalBuyPrice !== undefined) && { originalBuyPrice: (holding as any).originalBuyPrice }),
        ...(((holding as any).totalQuantityOwned !== undefined) && { totalQuantityOwned: (holding as any).totalQuantityOwned }),
        ...(((holding as any).realizedPnL !== undefined) && { realizedPnL: (holding as any).realizedPnL }),
        ...(((holding as any).soldDate !== undefined) && { soldDate: (holding as any).soldDate }),
      }
      return cleanedHolding
    })
  }

  // Sanitize download links (only keep fields backend expects)
  if (formattedData.downloadLinks && Array.isArray(formattedData.downloadLinks)) {
    formattedData.downloadLinks = formattedData.downloadLinks.map((link) => ({
      linkType: link.linkType,
      linkUrl: link.linkUrl,
      ...(link.linkDiscription ? { linkDiscription: link.linkDiscription } : {}),
    }))
  }

  // Sanitize YouTube links (only keep link field)
  if (formattedData.youTubeLinks && Array.isArray(formattedData.youTubeLinks)) {
    formattedData.youTubeLinks = formattedData.youTubeLinks.map((yt) => ({
      link: yt.link,
    }))
  }

  // Clean up undefined or null values to avoid sending them to the API
  // But preserve important financial fields even if they're 0
  Object.keys(formattedData).forEach((key) => {
    const value = formattedData[key as keyof CreatePortfolioRequest]
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      // Don't delete important financial fields even if they're 0
      if (!['cashBalance', 'currentValue'].includes(key)) {
        delete formattedData[key as keyof CreatePortfolioRequest]
      }
    }
  })
  
  console.log("Final formatted data with all financial fields:", formattedData)
  console.log("CashBalance in formatted data:", formattedData.cashBalance)
  console.log("CurrentValue in formatted data:", formattedData.currentValue)

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

// Specific function for updating portfolio holdings with different actions
export const updatePortfolioHoldings = async (
  id: string, 
  holdings: PortfolioHolding[], 
  action: 'update' | 'add' | 'delete' | 'replace' = 'update'
): Promise<Portfolio> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid portfolio ID")
    }

    const adminToken = getAdminAccessToken()
    if (!adminToken) {
      throw new Error("Admin authentication required to update portfolio holdings")
    }

    console.log(`Updating portfolio holdings with ID: ${id}, action: ${action}`)
    console.log("Holdings data:", JSON.stringify(holdings, null, 2))

    const requestBody = {
      holdings,
      action // Include action for flexible stock management
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log(`Holdings update response status: ${response.status}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Portfolio with ID ${id} not found. It may have been deleted or the ID is incorrect.`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML instead of JSON for holdings update")
      }

      const responseText = await response.text()
      console.error("Error response from server:", responseText)

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || errorData.error || "Failed to update portfolio holdings")
      } catch (jsonError) {
        throw new Error(`Failed to update portfolio holdings: Server returned ${response.status}`)
      }
    }

    const updatedPortfolio = await response.json()
    console.log("Successfully updated portfolio holdings")

    // Ensure the portfolio has an id property
    if (updatedPortfolio._id && !updatedPortfolio.id) {
      updatedPortfolio.id = updatedPortfolio._id
    }

    return updatedPortfolio
  } catch (error) {
    console.error(`Error updating portfolio holdings with id ${id}:`, error)
    throw error
  }
}