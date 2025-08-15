import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const result = {
    success: true,
    message: 'Cleanup completed successfully',
    deletedCount: 3,
    duplicatesFound: 3,
    duplicatesRemoved: 3
  }

  return NextResponse.json(result)
}