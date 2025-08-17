// lib\api-users.ts 
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth"

// User Types based on the actual API response
export interface User {
  _id: string
  username: string
  email: string
  provider: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  fullName?: string
  dateofBirth?: string
  phone?: string
  pnadetails?: string
  profileComplete?: boolean
  pandetails?: string
  adharcard?: string
  address?: string
  forceComplete?: boolean
  missingFields?: string[]
  role?: string
  status?: string
  lastLogin?: string
  isBanned?: boolean
  banInfo?: boolean
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: string
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  role?: string
  emailVerified?: boolean
}

// User API Functions
export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log("Fetching users from API...", `${API_BASE_URL}/admin/users`)

    // According to the docs, the endpoint is /admin/users
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`)
    console.log("Users API response status:", response.status)

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("text/html")) {
      console.warn("Server returned HTML instead of JSON.")
      throw new Error("The server returned an HTML response instead of JSON. Please check API configuration.")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch users" }))
      throw new Error(error.message || `Failed to fetch users: ${response.status}`)
    }

    const data = await response.json()

    // If the response is empty or not an array, throw an error
    if (!data || !Array.isArray(data)) {
      throw new Error("API returned empty or invalid data")
    }

    // Transform the data to match our User interface
    return data.map((user: any) => ({
      ...user,
      id: user._id, // Add id field for compatibility
      status: user.emailVerified ? "active" : "inactive", // Derive status from emailVerified
      name: user.username || user.email.split("@")[0], // Use username or derive from email
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export const fetchUserById = async (id: string): Promise<User> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`)

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of JSON for user details")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch user" }))
      throw new Error(error.message || `Failed to fetch user: ${response.status}`)
    }

    const user = await response.json()

    // Transform the data to match our User interface
    return {
      ...user,
      id: user._id, // Add id field for compatibility
      status: user.emailVerified ? "active" : "inactive", // Derive status from emailVerified
      name: user.username || user.email.split("@")[0], // Use username or derive from email
    }
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error)
    throw error
  }
}

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      body: JSON.stringify(userData),
    })

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of JSON")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create user" }))
      throw new Error(error.message || `Failed to create user: ${response.status}`)
    }

    const user = await response.json()

    // Transform the data to match our User interface
    return {
      ...user,
      id: user._id, // Add id field for compatibility
      status: user.emailVerified ? "active" : "inactive", // Derive status from emailVerified
      name: user.username || user.email.split("@")[0], // Use username or derive from email
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const updateUser = async (id: string, userData: UpdateUserRequest): Promise<User> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    console.log("Updating user:", id, userData)
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
    console.log("Update user response status:", response.status)

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of JSON")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update user" }))
      throw new Error(error.message || `Failed to update user: ${response.status}`)
    }

    const user = await response.json()

    // Transform the data to match our User interface
    return {
      ...user,
      id: user._id, // Add id field for compatibility
      status: user.emailVerified ? "active" : "inactive", // Derive status from emailVerified
      name: user.username || user.email.split("@")[0], // Use username or derive from email
    }
  } catch (error) {
    console.error(`Error updating user with id ${id}:`, error)
    throw error
  }
}

export const deleteUser = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    // According to the docs, the endpoint is /admin/users/{id}
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
    })

    // Check if the response is HTML instead of JSON
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned an HTML response instead of JSON. The user might not exist.")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete user" }))
      throw new Error(error.message || `Failed to delete user: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error deleting user with id ${id}:`, error)
    throw error
  }
}

export const banUser = async (id: string, reason?: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    console.log("Banning user:", id, reason)
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "Banned by admin" }),
    })
    console.log("Ban user response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to ban user: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error banning user with id ${id}:`, error)
    throw error
  }
}

export const unbanUser = async (id: string): Promise<void> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/unban`, {
      method: "POST",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Failed to unban user: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error unbanning user with id ${id}:`, error)
    throw error
  }
}

export const updateUserPAN = async (id: string, pandetails: string, reason?: string): Promise<User> => {
  try {
    if (!id || id === "undefined") {
      throw new Error("Invalid user ID")
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${id}/pan`, {
      method: "PUT",
      body: JSON.stringify({ pandetails, reason: reason || "Admin update" }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update PAN" }))
      throw new Error(error.message || `Failed to update PAN: ${response.status}`)
    }

    const result = await response.json()
    return result.user
  } catch (error) {
    console.error(`Error updating PAN for user ${id}:`, error)
    throw error
  }
}

export const deleteUserLogs = async (): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/logs`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete logs" }))
      throw new Error(error.message || `Failed to delete logs: ${response.status}`)
    }
  } catch (error) {
    console.error("Error deleting user logs:", error)
    throw error
  }
}

export const deleteServerLogs = async (): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/admin/files/logs`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete server logs" }))
      throw new Error(error.message || `Failed to delete server logs: ${response.status}`)
    }
  } catch (error) {
    console.error("Error deleting server logs:", error)
    throw error
  }
}
