import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json(
        { error: 'Error fetching subscription' },
        { status: 500 }
      );
    }

    // Get price details to determine tier
    const { data: prices, error: priceError } = await supabase
      .from('prices')
      .select('*');

    if (priceError) {
      console.error('Error fetching prices:', priceError);
      return NextResponse.json(
        { error: 'Error fetching prices' },
        { status: 500 }
      );
    }

    // Determine subscription tier
    let tier = 'free';
    if (
      subscription?.status === 'active' ||
      subscription?.status === 'trialing'
    ) {
      if (subscription.price_id === process.env.STRIPE_BASIC_PRICE_ID) {
        tier = 'basic';
      } else if (subscription.price_id === process.env.STRIPE_PRO_PRICE_ID) {
        tier = 'pro';
      }
    }

    return NextResponse.json({
      subscription: subscription || null,
      tier,
      isActive:
        subscription?.status === 'active' || subscription?.status === 'trialing'
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Error checking subscription status' },
      { status: 500 }
    );
  }
}
