import { fetchWithAuth } from "@/lib/auth"

// Zerodha API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://stocks-backend-cmjxc.ondigitalocean.app"

// Interface for stock instrument
export interface StockInstrument {
  instrument_token: number
  exchange_token: number
  tradingsymbol: string
  name: string
  last_price: number
  expiry?: string
  strike?: number
  tick_size: number
  lot_size: number
  instrument_type: string
  segment: string
  exchange: string
}

// Cache for instruments to avoid repeated API calls
let instrumentsCache: StockInstrument[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes cache for live data

/**
 * Fetches stock instruments from Zerodha API
 */
export async function fetchZerodhaStocks(): Promise<StockInstrument[]> {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now()
    if (instrumentsCache && now - lastFetchTime < CACHE_DURATION) {
      console.log("Using cached Zerodha instruments data")
      return instrumentsCache
    }

    console.log("Fetching instruments from Zerodha API")

    // Make API request to our backend proxy
    const response = await fetchWithAuth(`${API_BASE_URL}/api/zerodha/instruments`)

    if (!response.ok) {
      throw new Error(`Failed to fetch Zerodha instruments: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Update cache
    instrumentsCache = data
    lastFetchTime = now

    return data
  } catch (error) {
    console.error("Error fetching Zerodha instruments:", error)

    // Return mock data if API fails
    console.log("Using mock instruments data due to API error")
    return getMockInstruments()
  }
}

/**
 * Gets instrument details by symbol
 */
export async function getStockBySymbol(symbol: string): Promise<StockInstrument | null> {
  if (!symbol) return null

  try {
    const stocks = await fetchZerodhaStocks()
    return stocks.find((stock) => stock.tradingsymbol === symbol) || null
  } catch (error) {
    console.error("Error getting stock by symbol:", error)
    return null
  }
}

/**
 * Mock instruments data for development and testing
 */
export function getMockInstruments(): StockInstrument[] {
  return [
    {
      instrument_token: 256265,
      exchange_token: 1001,
      tradingsymbol: "RELIANCE",
      name: "RELIANCE INDUSTRIES LTD",
      last_price: 2456.75,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2885634,
      exchange_token: 11271,
      tradingsymbol: "TCS",
      name: "TATA CONSULTANCY SERVICES LTD",
      last_price: 3567.8,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 408065,
      exchange_token: 1594,
      tradingsymbol: "INFY",
      name: "INFOSYS LTD",
      last_price: 1478.25,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2953217,
      exchange_token: 11536,
      tradingsymbol: "TATAMOTORS",
      name: "TATA MOTORS LTD",
      last_price: 678.45,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 738561,
      exchange_token: 2885,
      tradingsymbol: "HDFCBANK",
      name: "HDFC BANK LTD",
      last_price: 1689.3,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 341249,
      exchange_token: 1333,
      tradingsymbol: "ICICIBANK",
      name: "ICICI BANK LTD",
      last_price: 987.65,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 895745,
      exchange_token: 3499,
      tradingsymbol: "ITC",
      name: "ITC LTD",
      last_price: 432.15,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2815745,
      exchange_token: 11000,
      tradingsymbol: "SUNPHARMA",
      name: "SUN PHARMACEUTICAL INDUSTRIES LTD",
      last_price: 1245.8,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 779521,
      exchange_token: 3045,
      tradingsymbol: "HINDALCO",
      name: "HINDALCO INDUSTRIES LTD",
      last_price: 567.9,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2714625,
      exchange_token: 10604,
      tradingsymbol: "SBIN",
      name: "STATE BANK OF INDIA",
      last_price: 678.35,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    // Add more stocks for better testing
    {
      instrument_token: 3861249,
      exchange_token: 15083,
      tradingsymbol: "WIPRO",
      name: "WIPRO LTD",
      last_price: 432.5,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 3465729,
      exchange_token: 13538,
      tradingsymbol: "ULTRACEMCO",
      name: "ULTRATECH CEMENT LTD",
      last_price: 8765.3,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 969473,
      exchange_token: 3787,
      tradingsymbol: "KOTAKBANK",
      name: "KOTAK MAHINDRA BANK LTD",
      last_price: 1765.45,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2977281,
      exchange_token: 11630,
      tradingsymbol: "TECHM",
      name: "TECH MAHINDRA LTD",
      last_price: 1234.55,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2939649,
      exchange_token: 11483,
      tradingsymbol: "TATASTEEL",
      name: "TATA STEEL LTD",
      last_price: 876.65,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 1270529,
      exchange_token: 4964,
      tradingsymbol: "MARUTI",
      name: "MARUTI SUZUKI INDIA LTD",
      last_price: 10234.55,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 1346049,
      exchange_token: 5259,
      tradingsymbol: "NESTLEIND",
      name: "NESTLE INDIA LTD",
      last_price: 23456.75,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 3834113,
      exchange_token: 14977,
      tradingsymbol: "VEDL",
      name: "VEDANTA LTD",
      last_price: 345.65,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 2800641,
      exchange_token: 10940,
      tradingsymbol: "SUNTV",
      name: "SUN TV NETWORK LTD",
      last_price: 567.85,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
    {
      instrument_token: 3001089,
      exchange_token: 11723,
      tradingsymbol: "TITAN",
      name: "TITAN COMPANY LTD",
      last_price: 3456.75,
      tick_size: 0.05,
      lot_size: 1,
      instrument_type: "EQ",
      segment: "NSE",
      exchange: "NSE",
    },
  ]
}
