import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const portfolioId = searchParams.get('portfolioId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const limit = parseInt(searchParams.get('limit') || '100')
  const page = parseInt(searchParams.get('page') || '1')

  const mockData = {
    success: true,
    count: 2,
    total: 2,
    pagination: { page, limit, totalPages: 1 },
    data: [
      {
        _id: '1',
        portfolio: portfolioId || 'portfolio-1',
        date: new Date().toISOString(),
        dateOnly: new Date().toISOString().split('T')[0],
        portfolioValue: 100000,
        cashRemaining: 10000,
        compareIndexValue: 25000,
        compareIndexPriceSource: 'closing' as const,
        usedClosingPrices: true,
        dataVerified: true,
        dataQualityIssues: []
      },
      {
        _id: '2',
        portfolio: portfolioId || 'portfolio-1',
        date: new Date(Date.now() - 86400000).toISOString(),
        dateOnly: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        portfolioValue: 98000,
        cashRemaining: 12000,
        compareIndexValue: 24800,
        compareIndexPriceSource: 'closing' as const,
        usedClosingPrices: true,
        dataVerified: true,
        dataQualityIssues: []
      }
    ]
  }

  return NextResponse.json(mockData)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const newEntry = {
    _id: Date.now().toString(),
    ...body,
    date: body.date || new Date().toISOString(),
    dateOnly: body.dateOnly || new Date().toISOString().split('T')[0]
  }

  return NextResponse.json(newEntry, { status: 201 })
}