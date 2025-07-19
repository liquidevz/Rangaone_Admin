import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import { validateTipData } from "@/lib/api-tips";

// Validation schema for creating a tip
const createTipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  stockId: z.string().min(1, "Stock symbol is required"),
  category: z.enum(["basic", "premium", "social_media"]),
  content: z.array(
    z.object({
      key: z.string(),
      value: z.string().min(1, "Content value is required")
    })
  ).min(1, "At least one content item is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Active", "Closed"]).optional(),
  action: z.string().optional(),
  buyRange: z.string().optional(),
  targetPrice: z.string().optional(),
  targetPercentage: z.string().optional(),
  addMoreAt: z.string().optional(),
  tipUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  exitPrice: z.string().optional(),
  exitStatus: z.string().optional(),
  exitStatusPercentage: z.string().optional(),
  horizon: z.string().optional(),
  analysistConfidence: z.number().optional(),
  analysistConfidence: z.number().optional(),
  downloadLinks: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      url: z.string().url("Must be a valid URL"),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    // Pre-process the body to handle content field
    let processedBody = { ...body };
    
    // Handle content field - ensure it's an array of objects
    if (typeof processedBody.content === 'string') {
      processedBody.content = [{ key: "main", value: processedBody.content }];
      console.log('Converted string content to array format');
    }
    
    const validationResult = createTipSchema.safeParse(processedBody);

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
      return NextResponse.json(
        { message: "Invalid input", errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    let tipData = validationResult.data;

    // Convert string content to array format if needed
    if (typeof tipData.content === 'string') {
      tipData = {
        ...tipData,
        content: [{ key: "main", value: tipData.content }]
      };
      console.log('Converted string content to array format:', tipData.content);
    }

    // Additional validation using the helper function
    const errors = validateTipData(tipData);
    if (errors.length > 0) {
      console.error('Additional validation errors:', errors);
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Set default values
    const processedTipData = {
      ...tipData,
      status: tipData.status || "Active",
      horizon: tipData.horizon || "Long Term",
      // Handle both spellings of the confidence field
      analysistConfidence: tipData.analysistConfidence || tipData.analysistConfidence || 5,
      analysistConfidence: tipData.analysistConfidence || tipData.analysistConfidence || 5,
      downloadLinks: tipData.downloadLinks?.filter(link => link.name?.trim() && link.url?.trim()) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Processed tip data:', JSON.stringify(processedTipData, null, 2));

    // TODO: Save to database
    // For now, just return the processed data
    return NextResponse.json(processedTipData, { status: 201 });
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // TODO: Fetch tips from database
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 