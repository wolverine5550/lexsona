import CustomerPortalForm from '@/components/ui/AccountForms/CustomerPortalForm';
import EmailForm from '@/components/ui/AccountForms/EmailForm';
import NameForm from '@/components/ui/AccountForms/NameForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  getUserDetails,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';

export default async function Account() {
  const supabase = createClient();
  const [user, userDetails, subscription] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  if (!user) {
    return redirect('/signin');
  }

  return (
    <section className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-zinc-100">
              Account Settings
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              Manage your account settings and subscription preferences
            </p>
          </div>

          <div className="space-y-8">
            <CustomerPortalForm subscription={subscription} />
            <NameForm userName={userDetails?.full_name ?? ''} />
            <EmailForm userEmail={user.email} />
          </div>
        </div>
      </div>
    </section>
  );
}
