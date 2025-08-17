// lib/api-notifications.ts
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export interface NotificationRequest {
  portfolioId: string;
  subject: string;
  message: string;
}

export interface NotificationResponse {
  success: boolean;
  mailedTo: number;
  emailsSent: string[];
}

export const sendNotification = async (data: NotificationRequest): Promise<NotificationResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/notify`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to send notification" }));
    throw new Error(error.error || `Failed to send notification: ${response.status}`);
  }

  return response.json();
};