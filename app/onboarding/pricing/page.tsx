import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Pricing from '@/components/ui/Pricing/Pricing';
import { getSubscription, getProducts } from '@/utils/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get subscription and products
  const [subscription, products] = await Promise.all([
    getSubscription(supabase),
    getProducts(supabase)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Choose Your Plan</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Select a plan that best fits your needs. You can always change this
          later.
        </p>
      </div>
      <Pricing
        user={user}
        products={products ?? []}
        subscription={subscription}
        isOnboarding={true}
      />
    </div>
  );
}
