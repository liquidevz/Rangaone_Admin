import { KiteConnect } from "kiteconnect";
import { cookies } from "next/headers";

// Function to get the Zerodha API key from environment variables
const getZerodhaApiKey = (): string | undefined => {
  return process.env.NEXT_PUBLIC_ZERODHA_API_KEY;
};

// Function to get the Zerodha API secret from environment variables
const getZerodhaApiSecret = (): string | undefined => {
  return process.env.ZERODHA_API_SECRET;
};

// Function to get the Zerodha access token from cookies
const getZerodhaAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get("zerodha_access_token")?.value;
};

// Function to check if we have a Zerodha access token
export const hasZerodhaAccessToken = (): boolean => {
  return !!getZerodhaAccessToken();
};

// Function to get a configured KiteConnect instance with access token (server-side only)
export function getKiteInstance(apiKey: string) {
  if (!apiKey) {
    throw new Error("Zerodha API key not found");
  }

  const kc = new KiteConnect({ api_key: apiKey });
  return kc;
}

// Function to get the Zerodha client
export const getZerodhaClient = () => {
  const apiKey = getZerodhaApiKey();
  const accessToken = getZerodhaAccessToken();

  if (!apiKey) {
    throw new Error("Zerodha API key not found");
  }

  if (!accessToken) {
    throw new Error("Zerodha access token not found");
  }

  const kc = new KiteConnect({ api_key: apiKey });
  kc.setAccessToken(accessToken);

  return kc;
};

// Function to set the access token in cookies
export function setAccessToken(accessToken: string) {
  if (!accessToken) {
    throw new Error("Zerodha access token not found");
  }
  // Set the access token in cookies
  cookies().set("zerodha_access_token", accessToken);
}

// Function to fetch instruments
export async function getInstruments() {
  const apiKey = getZerodhaApiKey();
  const apiSecret = getZerodhaApiSecret();
  const accessToken = getZerodhaAccessToken();

  if (!apiKey || !apiSecret || !accessToken) {
    throw new Error("Zerodha API credentials not found");
  }

  const kc = new KiteConnect({ api_key: apiKey });
  kc.setAccessToken(accessToken);

  try {
    const instruments = await kc.getInstruments();
    return instruments;
  } catch (error: any) {
    console.error("Error fetching instruments:", error);
    throw new Error(error.message || "Failed to fetch instruments");
  }
}
