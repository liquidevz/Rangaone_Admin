import { NextRequest, NextResponse } from 'next/server';

// Mock data (in real app, this would be in a database)
let mockChartData = [
  {
    _id: '1',
    portfolio: 'portfolio1',
    date: '2024-01-15T10:00:00.000Z',
    dateOnly: '2024-01-15',
    portfolioValue: 150000,
    cashRemaining: 25000,
    compareIndexValue: 18500,
    compareIndexPriceSource: 'closing' as const,
    usedClosingPrices: true,
    dataVerified: true,
    dataQualityIssues: []
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = mockChartData.find(item => item._id === id);
    
    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Price log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error in GET /api/chart-data/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price log' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const entryIndex = mockChartData.findIndex(item => item._id === id);
    if (entryIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Price log not found' },
        { status: 404 }
      );
    }

    mockChartData[entryIndex] = { ...mockChartData[entryIndex], ...body };
    
    return NextResponse.json(mockChartData[entryIndex]);
  } catch (error) {
    console.error('Error in PUT /api/chart-data/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update price log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryIndex = mockChartData.findIndex(item => item._id === id);
    
    if (entryIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Price log not found' },
        { status: 404 }
      );
    }

    mockChartData.splice(entryIndex, 1);
    
    return NextResponse.json({ success: true, message: 'Price log deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/chart-data/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete price log' },
      { status: 500 }
    );
  }
}