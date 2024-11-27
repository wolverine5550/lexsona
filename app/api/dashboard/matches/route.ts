import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard/base';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database';

/**
 * GET /api/dashboard/matches
 * Fetches recent podcast matches for the authenticated user
 * Supports filtering by status and pagination
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
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const status = searchParams.get('status') as
      | Database['public']['Enums']['match_status']
      | null;

    // Fetch matches with filters
    const result = await dashboardService.matches.getRecentMatches(
      session.user.id,
      limit,
      status ?? undefined
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
    console.error('Matches fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/matches
 * Updates the status of a match
 * Used for marking matches as viewed, contacted, or declined
 */
export async function PATCH(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { matchId, status } = body;

    if (!matchId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update match status
    const result = await dashboardService.matches.updateMatchStatus(
      matchId,
      status
    );

    // Handle service errors
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Match update error:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}
