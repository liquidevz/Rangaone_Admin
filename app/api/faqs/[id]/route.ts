import { NextRequest, NextResponse } from 'next/server';

interface UpdateFAQRequest {
  question?: string;
  answer?: string | string[] | object;
  category?: string;
  tags?: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string | string[] | object;
  tags: string[];
  category: string;
  relatedFAQs: string[];
  lastUpdatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock FAQ storage (in real app, this would be database)
const mockFAQs: FAQ[] = [];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: UpdateFAQRequest = await request.json();
    
    // Find existing FAQ (mock - in real app would query database)
    const existingFAQ = mockFAQs.find(faq => faq.id === id);
    if (!existingFAQ) {
      return NextResponse.json(
        { error: 'FAQ not found', message: `FAQ with id ${id} not found` },
        { status: 404 }
      );
    }

    // Update only provided fields
    const updatedFAQ: FAQ = {
      ...existingFAQ,
      ...body,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: 'admin'
    };

    // Update in mock storage
    const index = mockFAQs.findIndex(faq => faq.id === id);
    if (index !== -1) {
      mockFAQs[index] = updatedFAQ;
    }

    return NextResponse.json(updatedFAQ, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Authentication token required', error: 'Unauthorized access' },
      { status: 401 }
    );
  }
}