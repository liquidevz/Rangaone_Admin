// app\api\bundles\route.ts  
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { fetchWithAuth, API_BASE_URL } from "@/lib/auth";

export async function GET() {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Forward the request to the backend API
    const response = await fetchWithAuth(`${API_BASE_URL}/api/bundles`);

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
    console.error("[BUNDLES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the request body
    const body = await req.json();

    // Forward the request to the backend API
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/bundles`,
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
    console.error("[BUNDLES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 