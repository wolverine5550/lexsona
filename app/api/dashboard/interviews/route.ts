import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard/base';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database';

/**
 * GET /api/dashboard/interviews
 * Fetches upcoming interviews for the authenticated user
 * Supports filtering by status
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
    const status = searchParams.get('status') as
      | Database['public']['Enums']['interview_status']
      | null;

    // Fetch upcoming interviews
    const result = await dashboardService.interviews.getUpcomingInterviews(
      session.user.id,
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
    console.error('Interviews fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/interviews
 * Schedules a new interview
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { podcastId, scheduledDate, scheduledTime, duration } = body;

    // Validate required fields
    if (!podcastId || !scheduledDate || !scheduledTime || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Schedule interview
    const result = await dashboardService.interviews.scheduleInterview({
      author_id: session.user.id,
      podcast_id: podcastId,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      duration: duration,
      status: 'scheduled'
    });

    // Handle service errors
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Interview scheduling error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/interviews/[id]
 * Updates an existing interview
 * Used for rescheduling or updating status
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { status, scheduledDate, scheduledTime, duration, notes } = body;

    // Validate at least one field to update
    if (!status && !scheduledDate && !scheduledTime && !duration && !notes) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update interview
    const result = await dashboardService.interviews.updateInterview(
      params.id,
      {
        status,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration,
        notes,
        author_id: session.user.id // Required for activity creation
      }
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
    console.error('Interview update error:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}
