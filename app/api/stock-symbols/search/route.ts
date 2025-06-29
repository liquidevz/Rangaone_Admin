import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract search params from URL
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        data: [] 
      });
    }

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols/search?keyword=${encodeURIComponent(keyword)}`
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
    console.error("[STOCK_SYMBOLS_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 