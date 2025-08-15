import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const mockEntry = {
    _id: params.id,
    portfolio: 'portfolio-1',
    date: new Date().toISOString(),
    dateOnly: new Date().toISOString().split('T')[0],
    portfolioValue: 100000,
    cashRemaining: 10000,
    compareIndexValue: 25000,
    compareIndexPriceSource: 'closing' as const,
    usedClosingPrices: true,
    dataVerified: true,
    dataQualityIssues: []
  }

  return NextResponse.json(mockEntry)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  
  const updatedEntry = {
    _id: params.id,
    ...body,
    date: body.date || new Date().toISOString(),
    dateOnly: body.dateOnly || new Date().toISOString().split('T')[0]
  }

  return NextResponse.json(updatedEntry)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: 'Price log deleted successfully' })
}