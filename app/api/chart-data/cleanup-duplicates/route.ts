import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Mock cleanup operation
    const deletedCount = Math.floor(Math.random() * 5); // Random number for demo
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deletedCount,
      details: `Removed ${deletedCount} duplicate price logs`
    });
  } catch (error) {
    console.error('Error in POST /api/chart-data/cleanup-duplicates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup duplicates' },
      { status: 500 }
    );
  }
}