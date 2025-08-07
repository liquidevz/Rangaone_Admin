import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse("Stock symbol ID is required", { status: 400 });
    }

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols/${encodeURIComponent(id)}`
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
    console.error("[STOCK_SYMBOL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse("Stock symbol ID is required", { status: 400 });
    }

    const body = await req.json();

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols/${encodeURIComponent(id)}`,
      {
        method: "PUT",
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
    console.error("[STOCK_SYMBOL_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse("Stock symbol ID is required", { status: 400 });
    }

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/stock-symbols/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return new NextResponse(JSON.stringify(error), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For DELETE requests, we might get an empty response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      return new NextResponse(null, { status: 204 });
    }
  } catch (error) {
    console.error("[STOCK_SYMBOL_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 