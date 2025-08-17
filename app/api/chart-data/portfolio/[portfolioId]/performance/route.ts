import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  try {
    const { portfolioId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Mock performance data based on API specification
    const mockPerformance = {
      success: true,
      portfolioId,
      totalReturn: 12.5,
      currentValue: 112500,
      benchmarkReturn: 8.3,
      startValue: 100000,
      startDate: startDate || '2024-01-01',
      endDate: endDate || new Date().toISOString().split('T')[0],
      volatility: 15.2,
      sharpeRatio: 0.85,
      maxDrawdown: -8.5,
      alpha: 4.2,
      beta: 1.1
    };

    return NextResponse.json(mockPerformance);
  } catch (error) {
    console.error('Error in GET /api/chart-data/portfolio/[portfolioId]/performance:', error);
    return NextResponse.json(
      { success: false, error: 'Portfolio not found' },
      { status: 404 }
    );
  }
}