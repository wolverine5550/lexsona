import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { tier } = await req.json();

    // Create Supabase client
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        options: {
          db: { schema: 'public' }
        }
      }
    );

    // Get user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get price ID based on tier
    const PRICE_IDS = {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID
    };

    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
    console.log('Environment variables:', PRICE_IDS);
    console.log('Selected tier:', tier);
    console.log('Price ID:', priceId);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier selected or price ID not configured' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id);

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { error: 'Error fetching customer data' },
        { status: 500 }
      );
    }

    let stripeCustomerId = customers?.[0]?.stripe_customer_id;

    // If customer doesn't exist in Stripe, create them
    if (!stripeCustomerId) {
      console.log('No existing Stripe customer found for user:', user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      try {
        const stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: userData?.full_name || undefined,
          metadata: {
            supabaseUUID: user.id
          }
        });

        stripeCustomerId = stripeCustomer.id;
        console.log('Created Stripe customer:', stripeCustomerId);

        // Save Stripe customer ID to database using service role
        const { error: insertError } = await supabase.from('customers').upsert(
          {
            id: user.id,
            stripe_customer_id: stripeCustomerId
          },
          {
            onConflict: 'id'
          }
        );

        if (insertError) {
          console.error('Error saving customer ID:', insertError);
          return NextResponse.json(
            { error: 'Error creating customer' },
            { status: 500 }
          );
        }

        console.log('Saved customer ID to database');
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        return NextResponse.json(
          { error: 'Error creating Stripe customer' },
          { status: 500 }
        );
      }
    } else {
      console.log('Using existing Stripe customer:', stripeCustomerId);
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL;

    // Create Stripe Checkout Session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard`,
        subscription_data: {
          metadata: {
            supabaseUUID: user.id,
            tier: tier
          }
        }
      });

      return NextResponse.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json(
        { error: 'Error creating checkout session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
