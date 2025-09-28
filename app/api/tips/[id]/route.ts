import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { message: "Tip ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching tip with ID: ${id}`);

    // TODO: In a real implementation, fetch the tip from your database
    // For now, return a mock response for testing
    return NextResponse.json({
      _id: id,
      title: "Sample Tip",
      stockId: "AAPL",
      category: "premium",
      content: [
        {
          key: "main",
          value: "This is a sample tip content."
        }
      ],
      description: "Sample tip description",
      status: "Active",
      action: "Buy",
      buyRange: "100-150",
      targetPrice: "180",
      targetPercentage: "20%",
      addMoreAt: "95",
      analysistConfidence: 85,
      tipUrl: "https://example.com/analysis/stock-xyz",
      exitPrice: "200",
      exitStatus: "Target Achieved",
      exitStatusPercentage: "25%",
      horizon: "Long Term",
      downloadLinks: [
        {
          name: "Research PDF",
          url: "https://example.com/research.pdf"
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching tip with ID ${(await params).id}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { message: "Tip ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log(`Updating tip with ID: ${id}`, body);

    // Handle content field if it's a string
    if (typeof body.content === 'string') {
      body.content = [{ key: "main", value: body.content }];
    }

    // Normalize horizon field
    if (body.horizon) {
      body.horizon = body.horizon.trim();
    }

    // TODO: In a real implementation, update the tip in your database
    // For now, return the updated data for testing
    return NextResponse.json({
      _id: id,
      ...body,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating tip with ID ${(await params).id}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { message: "Tip ID is required" },
        { status: 400 }
      );
    }

    console.log(`Deleting tip with ID: ${id}`);

    // TODO: In a real implementation, delete the tip from your database
    // For now, return a success message for testing
    return NextResponse.json({
      message: `Tip with ID ${id} deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting tip with ID ${(await params).id}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}