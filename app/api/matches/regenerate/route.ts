import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateMatchesForAuthor } from '@/services/matches';

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is premium
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .eq('user_id', user.id)
      .single();

    const isPremium =
      subscription?.status === 'active' &&
      subscription?.prices?.products?.name === 'Pro';

    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    // Generate new matches
    await generateMatchesForAuthor(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error regenerating matches:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate matches' },
      { status: 500 }
    );
  }
}
