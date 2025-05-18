import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth"

// Portfolio Types
export interface PortfolioHolding {
  symbol: string
  weight: number
  sector: string
  status: string
  price: number
}

export interface Portfolio {
  id?: string
  _id?: string
  name: string
  description: string
  riskLevel?: string
  cashRemaining?: number
  subscriptionFee?: number
  minInvestment?: number
  durationMonths?: number
  holdings?: PortfolioHolding[]
  createdAt?: string
  updatedAt?: string
}

export interface CreatePortfolioRequest {
  name: string
  description: string
  riskLevel?: string
  cashRemaining?: number
  subscriptionFee?: number
  minInvestment?: number
  durationMonths?: number
  holdings?: PortfolioHolding[]
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
        throw new Error(errorData.message || `Failed to fetch portfolios: Server returned ${response.status}`)
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

// Update the fetchPortfolioById function to use admin token
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

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    const response = await fetch(`${API_BASE_URL}/api/portfolios`, {
      method: "POST",
      headers,
      body: JSON.stringify(portfolioData),
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

// Update the updatePortfolio function to properly format and send the data
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

    // Make the request with the admin token in the Authorization header
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    }

    // Ensure all numeric values are properly converted from strings if needed
    const formattedData = {
      ...portfolioData,
      cashRemaining:
        typeof portfolioData.cashRemaining === "string"
          ? Number.parseFloat(portfolioData.cashRemaining)
          : portfolioData.cashRemaining,
      subscriptionFee:
        typeof portfolioData.subscriptionFee === "string"
          ? Number.parseFloat(portfolioData.subscriptionFee)
          : portfolioData.subscriptionFee,
      minInvestment:
        typeof portfolioData.minInvestment === "string"
          ? Number.parseFloat(portfolioData.minInvestment)
          : portfolioData.minInvestment,
      durationMonths:
        typeof portfolioData.durationMonths === "string"
          ? Number.parseInt(portfolioData.durationMonths, 10)
          : portfolioData.durationMonths,
      holdings: portfolioData.holdings?.map((holding) => ({
        ...holding,
        weight: typeof holding.weight === "string" ? Number.parseFloat(holding.weight) : holding.weight,
        price: typeof holding.price === "string" ? Number.parseFloat(holding.price) : holding.price,
      })),
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

// Update the deletePortfolio function to use admin token
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
