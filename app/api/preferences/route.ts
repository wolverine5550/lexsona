import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import type { UserPreferences } from '@/types/preferences';

/**
 * POST /api/preferences
 * Saves or updates user preferences
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const preferences = await request.json();

    // Validate request data
    if (
      !preferences.topics ||
      !preferences.preferredLength ||
      !preferences.stylePreferences
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update or insert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        topics: preferences.topics,
        preferred_length: preferences.preferredLength,
        style_preferences: preferences.stylePreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving preferences:', error);
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preferences
 * Retrieves user preferences
 */
export async function GET() {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select()
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error('Error in preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
