// lib\api-portfolio-tips.ts 
import type { CreatePortfolioTipRequest, PortfolioTip } from "@/lib/api";
import { API_BASE_URL, getAdminAccessToken } from "@/lib/auth";

// Function to create a portfolio tip
export const createPortfolioTip = async (
  portfolioId: string,
  tipData: CreatePortfolioTipRequest
): Promise<PortfolioTip> => {
  try {
    if (!portfolioId || portfolioId === "undefined") {
      throw new Error("Invalid portfolio ID");
    }

    // Get the admin access token
    const adminToken = getAdminAccessToken();
    if (!adminToken) {
      throw new Error("Admin authentication required. Please log in again.");
    }

    console.log(`Creating tip for portfolio ${portfolioId}:`, tipData);

    // Use our own API route instead of the external API directly
    const url = `${API_BASE_URL}/api/tips/portfolios/${portfolioId}/tips`;
    console.log(`Using API endpoint: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`, // Include token in client request too
      },
      body: JSON.stringify({
        ...tipData,
        status: "Active", // Ensure status is set to active
      }),
    });

    console.log(`Tip creation API response status: ${response.status}`);

    if (!response.ok) {
      // Check for authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed. Please log in again.");
      }

      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        console.error("Error response data:", errorData);

        // Extract the most useful error message
        const errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details ||
          `Failed to create portfolio tip: Server returned ${response.status}`;

        throw new Error(errorMessage);
      } catch (jsonError) {
        console.error("Failed to parse error response:", jsonError);
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
    throw error;
  }
};
