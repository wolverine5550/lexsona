'use client';

import Button from '@/components/ui/Button';
import LogoCloud from '@/components/ui/LogoCloud';
import type { Database } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { CheckIcon } from '@heroicons/react/24/outline';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface Product {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, any>;
}

interface Price {
  id: string;
  product_id: string;
  active?: boolean;
  description?: string;
  unit_amount?: number;
  currency?: string;
  type?: string;
  interval?: string;
  interval_count?: number;
  trial_period_days?: number | null;
  metadata?: Record<string, any>;
}

interface ProductWithPrices extends Product {
  prices: Price[];
}

interface PriceWithProduct extends Price {
  products: Product | null;
}

interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
  isOnboarding?: boolean;
}

type BillingInterval = 'lifetime' | 'year' | 'month';

export default function Pricing({
  user,
  products,
  subscription,
  isOnboarding = false
}: Props) {
  const intervals = Array.from(
    new Set(
      products.flatMap((product) =>
        product?.prices?.map((price) => price?.interval)
      )
    )
  );
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();
  const { markStepComplete } = useOnboarding();

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/signin/signup');
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      currentPath ?? '/'
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath ?? '/',
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };

  const handleFreePlan = async () => {
    if (isOnboarding) {
      await markStepComplete(3);
      router.push('/dashboard');
    }
  };

  if (!products.length) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
        <LogoCloud />
      </section>
    );
  }

  return (
    <section className="bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            Pricing Plans
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            Start with our free plan and upgrade when you need more features
          </p>
          <div className="relative self-center mt-6 bg-zinc-900 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
            {intervals.includes('month') && (
              <button
                onClick={() => setBillingInterval('month')}
                type="button"
                className={`${
                  billingInterval === 'month'
                    ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                    : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
              >
                Monthly billing
              </button>
            )}
            {intervals.includes('year') && (
              <button
                onClick={() => setBillingInterval('year')}
                type="button"
                className={`${
                  billingInterval === 'year'
                    ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                    : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
              >
                Yearly billing
              </button>
            )}
          </div>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {/* Free Plan */}
          <div className="divide-y divide-zinc-600 rounded-lg shadow-sm border border-zinc-800 bg-zinc-900">
            <div className="p-6">
              <h2 className="text-2xl font-semibold leading-6 text-white">
                Free
              </h2>
              <p className="mt-4 text-zinc-300">
                Get started with basic features
              </p>
              <p className="mt-8">
                <span className="text-5xl font-extrabold white">$0</span>
                <span className="text-base font-medium text-zinc-100">
                  /month
                </span>
              </p>
              <Button
                variant="slim"
                type="button"
                disabled={subscription !== null}
                onClick={handleFreePlan}
                className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
              >
                {subscription ? 'Current Plan' : 'Get Started'}
              </Button>
            </div>
            <div className="px-6 pt-6 pb-8">
              <h3 className="text-sm font-medium text-white">
                What's included:
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex space-x-3">
                  <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="text-sm text-zinc-300">1 match per day</span>
                </li>
                <li className="flex space-x-3">
                  <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="text-sm text-zinc-300">Basic analytics</span>
                </li>
                <li className="flex space-x-3">
                  <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="text-sm text-zinc-300">
                    Standard support
                  </span>
                </li>
              </ul>
            </div>
          </div>
          {/* Paid Plans */}
          {products.map((product) => {
            const price = product?.prices?.find(
              (price) => price.interval === billingInterval
            );
            if (!price) return null;
            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency!,
              minimumFractionDigits: 0
            }).format((price?.unit_amount || 0) / 100);
            return (
              <div
                key={product.id}
                className={cn('divide-y divide-zinc-600 rounded-lg shadow-sm', {
                  'border border-pink-500': subscription
                    ? product.name === subscription?.prices?.products?.name
                    : product.name === 'Freelancer'
                })}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold leading-6 text-white">
                    {product.name}
                  </h2>
                  <p className="mt-4 text-zinc-300">{product.description}</p>
                  <p className="mt-8">
                    <span className="text-5xl font-extrabold white">
                      {priceString}
                    </span>
                    <span className="text-base font-medium text-zinc-100">
                      /{billingInterval}
                    </span>
                  </p>
                  <Button
                    variant="slim"
                    type="button"
                    disabled={!price || subscription?.price_id === price.id}
                    loading={priceIdLoading === price.id}
                    onClick={() => handleStripeCheckout(price)}
                    className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
                  >
                    {subscription?.price_id === price.id
                      ? 'Current Plan'
                      : 'Subscribe'}
                  </Button>
                </div>
                <div className="px-6 pt-6 pb-8">
                  <h3 className="text-sm font-medium text-white">
                    What's included:
                  </h3>
                  <ul className="mt-4 space-y-3">
                    <li className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="text-sm text-zinc-300">
                        {product.name === 'Pro' ? 'Unlimited' : '5'} matches per
                        day
                      </span>
                    </li>
                    <li className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="text-sm text-zinc-300">
                        Advanced analytics
                      </span>
                    </li>
                    <li className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="text-sm text-zinc-300">
                        Priority support
                      </span>
                    </li>
                    {product.name === 'Pro' && (
                      <li className="flex space-x-3">
                        <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500" />
                        <span className="text-sm text-zinc-300">
                          Custom pitch templates
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
