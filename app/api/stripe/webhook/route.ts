import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';
import { toDateTime } from '@/utils/stripe/helpers';

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error('Missing Stripe webhook secret or signature');
      return new NextResponse('Webhook Error', { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error: any) {
    console.error(`❌ Error message: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = createClient();

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!customer) {
            console.error('No customer found with Stripe ID:', customerId);
            return new NextResponse('Customer not found', { status: 404 });
          }

          const subscriptionData = {
            id: subscription.id,
            user_id: customer.id,
            metadata: subscription.metadata,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at
              ? toDateTime(subscription.cancel_at).toISOString()
              : null,
            canceled_at: subscription.canceled_at
              ? toDateTime(subscription.canceled_at).toISOString()
              : null,
            current_period_start: toDateTime(
              subscription.current_period_start
            ).toISOString(),
            current_period_end: toDateTime(
              subscription.current_period_end
            ).toISOString(),
            created: toDateTime(subscription.created).toISOString(),
            ended_at: subscription.ended_at
              ? toDateTime(subscription.ended_at).toISOString()
              : null,
            trial_start: subscription.trial_start
              ? toDateTime(subscription.trial_start).toISOString()
              : null,
            trial_end: subscription.trial_end
              ? toDateTime(subscription.trial_end).toISOString()
              : null
          };

          const { error } = await supabase
            .from('subscriptions')
            .upsert(subscriptionData);

          if (error) {
            console.error('Error updating subscription:', error);
            return new NextResponse('Error updating subscription', {
              status: 500
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new NextResponse('Webhook handler failed', { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
