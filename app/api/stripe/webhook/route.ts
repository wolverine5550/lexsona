import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function processSubscriptionEvent(event: {
  type: string;
  customerId: string;
  subscriptionId: string;
  status: string;
  priceId: string;
}) {
  console.log('Processing subscription event:', event);

  try {
    // Create Supabase client with service role
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        options: {
          db: { schema: 'public' }
        }
      }
    );

    // Get customer record
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', event.customerId);

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw customerError;
    }

    if (!customers || customers.length === 0) {
      console.error(
        'No customer found for Stripe customer ID:',
        event.customerId
      );
      throw new Error('Customer not found');
    }

    const userId = customers[0].id;

    // Update subscription status
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          id: event.subscriptionId,
          user_id: userId,
          status: event.status,
          price_id: event.priceId,
          quantity: 1,
          cancel_at_period_end: false,
          created: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          ended_at: null,
          cancel_at: null,
          canceled_at: null,
          trial_start: null,
          trial_end: null
        },
        {
          onConflict: 'id'
        }
      );

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Successfully processed subscription event');
  } catch (error) {
    console.error('Error processing subscription event:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log('Processing webhook event:', {
      type: event.type,
      id: event.id
    });

    // Handle subscription-related events
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription;
      await processSubscriptionEvent({
        type: event.type,
        customerId: subscription.customer as string,
        subscriptionId: subscription.id,
        status: subscription.status,
        priceId: (subscription.items.data[0].price as Stripe.Price).id
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
