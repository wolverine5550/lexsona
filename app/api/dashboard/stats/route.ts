import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard/base';
import { auth } from '@/lib/auth';

/**
 * GET /api/dashboard/stats
 * Fetches dashboard statistics for the authenticated user
 * Includes match counts, interview stats, and profile views
 */
export async function GET() {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch dashboard stats
    const result = await dashboardService.getStats(session.user.id);

    // Handle service errors
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    // Handle unexpected errors
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
