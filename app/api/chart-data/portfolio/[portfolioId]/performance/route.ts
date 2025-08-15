import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { portfolioId: string } }) {
  const mockPerformance = {
    success: true,
    portfolioId: params.portfolioId,
    totalReturn: 12.5,
    currentValue: 112500,
    benchmarkReturn: 8.3,
    startValue: 100000,
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    volatility: 15.2,
    sharpeRatio: 0.85,
    maxDrawdown: -8.5,
    alpha: 4.2,
    beta: 1.1
  }

  return NextResponse.json(mockPerformance)
}