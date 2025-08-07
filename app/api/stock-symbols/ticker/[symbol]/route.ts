import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { symbol } = await params;

    if (!symbol) {
      return new NextResponse("Symbol is required", { status: 400 });
    }

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols/ticker/${encodeURIComponent(symbol)}`
    );

    if (!response.ok) {
      const error = await response.json();
      return new NextResponse(JSON.stringify(error), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[STOCK_SYMBOL_BY_TICKER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 