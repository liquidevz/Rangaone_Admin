// lib\auth.ts  
// Base URL for API from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://stocks-backend-cmjxc.ondigitalocean.app"

// Function to get the admin access token
export const getAdminAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    // Server-side - try to get from environment variable if available
    if (process.env.ADMIN_ACCESS_TOKEN) {
      return process.env.ADMIN_ACCESS_TOKEN
    }
    return null
  }

  try {
    // Get the token directly from the correct localStorage key
    const token = localStorage.getItem("adminAccessToken")

    if (!token) {
      console.log("No admin access token found in localStorage")
      return null
    }

    return token
  } catch (error) {
    console.error("Error retrieving admin access token:", error)
    return null
  }
}

// Function to get the admin refresh token
export const getAdminRefreshToken = (): string | null => {
  if (typeof window === "undefined") {
    // Server-side - try to get from environment variable if available
    if (process.env.ADMIN_REFRESH_TOKEN) {
      return process.env.ADMIN_REFRESH_TOKEN
    }
    return null
  }
  return localStorage.getItem("adminRefreshToken")
}

// Function to check if the user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") {
    // Server-side - check environment variable
    return !!process.env.ADMIN_ACCESS_TOKEN
  }
  return !!localStorage.getItem("adminAccessToken")
}

// Function to logout
export const logout = async (): Promise<void> => {
  try {
    const accessToken = getAdminAccessToken()
    if (accessToken) {
      // Call the logout API
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch((error) => {
        console.error("Error during logout API call:", error)
        // Continue with local logout even if API call fails
      })
    }
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    // Always clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminAccessToken")
      localStorage.removeItem("adminRefreshToken")
    }
  }
}

// Function to refresh the token
export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getAdminRefreshToken()
    if (!refreshToken) {
      console.log("No refresh token found")
      return false
    }

    console.log("Attempting to refresh token...")

    // According to the API docs, we should send the refresh token in the body, not as an Authorization header
    const response = await fetch(`${API_BASE_URL}/admin/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    // Handle 403 Forbidden specifically
    if (response.status === 403) {
      console.error("Token refresh failed with status: 403 - Permission denied or invalid token")
      // Clear tokens on 403 error as the refresh token is likely invalid or revoked
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminAccessToken")
        localStorage.removeItem("adminRefreshToken")
      }
      return false
    }

    if (!response.ok) {
      console.error("Token refresh failed with status:", response.status)

      // If it's a 401, clear tokens and return false
      if (response.status === 401) {
        console.log("Refresh token is invalid or expired, clearing tokens")
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminAccessToken")
          localStorage.removeItem("adminRefreshToken")
        }
        return false
      }

      // For other errors, try to get more information
      try {
        const errorData = await response.json()
        console.error("Token refresh error details:", errorData)
      } catch (e) {
        console.error("Could not parse error response")
      }

      return false
    }

    const data = await response.json()
    console.log("Token refresh successful")

    localStorage.setItem("adminAccessToken", data.accessToken)
    // If the API returns a new refresh token, update it
    if (data.refreshToken) {
      localStorage.setItem("adminRefreshToken", data.refreshToken)
    }
    return true
  } catch (error) {
    console.error("Error refreshing token:", error)
    return false
  }
}

// Function to change admin password
export const changePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const accessToken = getAdminAccessToken()
    if (!accessToken) {
      return { success: false, message: "Not authenticated" }
    }

    const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, message: data.message || "Failed to change password" }
    }

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "An error occurred while changing password" }
  }
}

// Function to make authenticated API requests
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let accessToken = getAdminAccessToken()

  // Set up headers with or without the access token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Add any existing headers from options
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  } else {
    console.log("No access token available for request to:", url)
  }

  // Log the request for debugging (without sensitive headers)
  console.log(`API Request: ${options.method || "GET"} ${url}`)

  try {
    // Make the request with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Log the response status for debugging
    console.log(`API Response: ${response.status} for ${options.method || "GET"} ${url}`)

    // If the response is 401 (Unauthorized) or 403 (Forbidden), try to refresh the token
    if (response.status === 401 || response.status === 403) {
      console.log(`Received ${response.status}, attempting to refresh token...`)

      // For development/testing, continue with the response if mock data is enabled
      if (process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" || process.env.NODE_ENV === "development") {
        console.log("Continuing with response for mock data")
        return response
      }

      const refreshed = await refreshToken()
      if (!refreshed) {
        // Clear tokens and throw error
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminAccessToken")
          localStorage.removeItem("adminRefreshToken")
        }
        throw new Error("Session expired. Please login again.")
      }

      // Get the new access token and retry the request
      accessToken = getAdminAccessToken()
      if (!accessToken) {
        throw new Error("Failed to refresh authentication. Please login again.")
      }

      headers["Authorization"] = `Bearer ${accessToken}`
      const retryResponse = await fetch(url, { ...options, headers })

      // If still unauthorized after refresh, redirect to login
      if (retryResponse.status === 401 || retryResponse.status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminAccessToken")
          localStorage.removeItem("adminRefreshToken")
          window.location.href = "/login"
        }
        throw new Error("Session expired. Please login again.")
      }

      return retryResponse
    }

    return response
  } catch (error) {
    // Improve error logging
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(`Request timeout for ${url}`)
        throw new Error(`Request timeout: The server took too long to respond`)
      } else {
        console.error(`Fetch error for ${url}:`, error)
        throw error
      }
    }

    throw error
  }
}

// Function to login admin
export const loginAdmin = async (
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log("Attempting login for:", email)

    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Login failed with status:", response.status)
      return { success: false, message: data.message || "Login failed" }
    }

    console.log("Login successful, storing tokens...")

    // Store tokens in localStorage
    localStorage.setItem("adminAccessToken", data.accessToken)
    localStorage.setItem("adminRefreshToken", data.refreshToken)

    // Verify tokens were stored
    const storedAccessToken = localStorage.getItem("adminAccessToken")
    const storedRefreshToken = localStorage.getItem("adminRefreshToken")

    console.log("Tokens stored successfully:", {
      accessToken: !!storedAccessToken,
      refreshToken: !!storedRefreshToken,
    })

    return { success: true, message: "Login successful", data }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An error occurred during login" }
  }
}
