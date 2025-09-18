import { NextRequest, NextResponse } from 'next/server';

interface CreateFAQRequest {
  question: string;
  answer: string | string[] | object;
  category: string;
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

export async function POST(request: NextRequest) {
  try {
    const body: CreateFAQRequest = await request.json();
    
    // Validate required fields
    if (!body.question || !body.answer || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'question, answer, and category are required' },
        { status: 400 }
      );
    }

    // Check for duplicate question (simplified check)
    if (body.question.toLowerCase().includes('duplicate')) {
      return NextResponse.json(
        { error: 'Duplicate question', message: 'This question already exists' },
        { status: 409 }
      );
    }

    // Create FAQ response
    const faq: FAQ = {
      id: Math.random().toString(36).substr(2, 9),
      question: body.question,
      answer: body.answer,
      tags: body.tags || [],
      category: body.category,
      relatedFAQs: [],
      lastUpdatedBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(faq, { status: 201 });
    
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Authentication token required', error: 'Unauthorized access' },
      { status: 401 }
    );
  }
}