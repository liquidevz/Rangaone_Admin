import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration
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
  },
  {
    _id: '2',
    portfolio: 'portfolio1',
    date: '2024-01-16T10:00:00.000Z',
    dateOnly: '2024-01-16',
    portfolioValue: 152000,
    cashRemaining: 23000,
    compareIndexValue: 18600,
    compareIndexPriceSource: 'closing' as const,
    usedClosingPrices: true,
    dataVerified: true,
    dataQualityIssues: []
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    let filteredData = [...mockChartData];

    // Filter by portfolio
    if (portfolioId) {
      filteredData = filteredData.filter(item => item.portfolio === portfolioId);
    }

    // Filter by date range
    if (startDate) {
      filteredData = filteredData.filter(item => new Date(item.dateOnly) >= new Date(startDate));
    }
    if (endDate) {
      filteredData = filteredData.filter(item => new Date(item.dateOnly) <= new Date(endDate));
    }

    // Pagination
    const total = filteredData.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      count: paginatedData.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: paginatedData
    });
  } catch (error) {
    console.error('Error in GET /api/chart-data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newEntry = {
      _id: Date.now().toString(),
      ...body,
      date: body.date || new Date().toISOString(),
      dateOnly: body.dateOnly || new Date().toISOString().split('T')[0],
      compareIndexPriceSource: body.compareIndexPriceSource || 'closing',
      usedClosingPrices: body.usedClosingPrices ?? true,
      dataVerified: body.dataVerified ?? true,
      dataQualityIssues: body.dataQualityIssues || []
    };

    mockChartData.push(newEntry);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chart-data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chart data' },
      { status: 400 }
    );
  }
}