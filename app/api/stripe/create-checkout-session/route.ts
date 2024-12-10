import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/utils/stripe';
import { createOrRetrieveCustomer } from '@/utils/supabase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const customer = await createOrRetrieveCustomer({
      uuid: user.id,
      email: user.email!
    });

    const { data: price } = await supabase
      .from('prices')
      .select('id, unit_amount')
      .eq('metadata->tier', 'premium')
      .eq('active', true)
      .single();

    if (!price) {
      return new NextResponse('Price not found', { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ],
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
