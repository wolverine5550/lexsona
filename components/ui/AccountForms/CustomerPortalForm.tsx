'use client';

import Button from '@/components/ui/Button/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { createStripePortal } from '@/utils/stripe/server';
import Link from 'next/link';
import Card from '@/components/ui/Card/Card';
import { Tables } from '@/types/types_db';

type Subscription = Tables<'subscriptions'>;
type Price = Tables<'prices'>;
type Product = Tables<'products'>;

type SubscriptionWithPriceAndProduct = Subscription & {
  prices:
    | (Price & {
        products: Product | null;
      })
    | null;
};

interface Props {
  subscription: SubscriptionWithPriceAndProduct | null;
}

export default function CustomerPortalForm({ subscription }: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.prices?.currency!,
      minimumFractionDigits: 0
    }).format((subscription?.prices?.unit_amount || 0) / 100);

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    const path = currentPath ?? '/';
    const redirectUrl = await createStripePortal(path);
    setIsSubmitting(false);
    return router.push(redirectUrl);
  };

  return (
    <Card
      title="Your Plan"
      description={
        subscription
          ? `You are currently on the ${subscription?.prices?.products?.name} plan.`
          : 'You are not currently subscribed to any plan.'
      }
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-400">
            Manage your subscription on Stripe
          </p>
          <Button
            variant="slim"
            onClick={handleStripePortalRequest}
            loading={isSubmitting}
            className="mt-4 w-full sm:mt-0 sm:w-auto"
          >
            Open customer portal
          </Button>
        </div>
      }
    >
      <div className="mt-6">
        {subscription ? (
          <p className="text-2xl font-semibold text-zinc-100">
            {subscriptionPrice}/{subscription?.prices?.interval}
          </p>
        ) : (
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Choose your plan
          </Link>
        )}
      </div>
    </Card>
  );
}
