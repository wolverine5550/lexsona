import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard/base';
import { auth } from '@/lib/auth';

/**
 * GET /api/dashboard/notifications
 * Fetches notifications for the authenticated user
 * Supports filtering for unread notifications
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
    const unreadOnly = searchParams.get('unread') === 'true';

    // Fetch notifications
    const result = await dashboardService.notifications.getNotifications(
      session.user.id,
      unreadOnly
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
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/notifications/[id]
 * Marks a notification as read
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

    // Mark notification as read
    const result = await dashboardService.notifications.markAsRead(params.id);

    // Handle service errors
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/notifications/read-all
 * Marks all notifications as read for the user
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification IDs from request body
    const { notificationIds } = await request.json();
    if (!notificationIds?.length) {
      return NextResponse.json(
        { error: 'No notifications specified' },
        { status: 400 }
      );
    }

    // Mark all specified notifications as read
    const promises = notificationIds.map((id: string) =>
      dashboardService.notifications.markAsRead(id)
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk notification update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
