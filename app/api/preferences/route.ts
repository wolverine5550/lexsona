import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('podcast_preferences')
      .select('*')
      .eq('author_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return new NextResponse('Error fetching preferences', { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in preferences route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const preferences = await request.json();

    const { error } = await supabase.from('podcast_preferences').upsert({
      author_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error saving preferences:', error);
      return new NextResponse('Error saving preferences', { status: 500 });
    }

    return new NextResponse('Preferences updated successfully', {
      status: 200
    });
  } catch (error) {
    console.error('Error in preferences route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
