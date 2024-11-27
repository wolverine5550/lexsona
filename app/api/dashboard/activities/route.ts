import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard/base';
import { auth } from '@/lib/auth';

/**
 * GET /api/dashboard/activities
 * Fetches activity feed for the authenticated user
 * Supports pagination and date-based grouping
 */
export async function GET(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';
    const days = parseInt(searchParams.get('days') ?? '7');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    // Fetch activities based on grouping preference
    const result = grouped
      ? await dashboardService.activities.getGroupedActivities(
          session.user.id,
          days
        )
      : await dashboardService.activities.getRecentActivities(
          session.user.id,
          limit
        );

    // Handle service errors
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Activities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
