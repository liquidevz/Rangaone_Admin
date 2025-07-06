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
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols?page=${page}&limit=${limit}`
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
    console.error("[STOCK_SYMBOLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
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
    console.error("[STOCK_SYMBOLS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 