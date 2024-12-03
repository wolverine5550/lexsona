import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  console.log('Dashboard server check:', {
    hasUser: !!user,
    userId: user?.id,
    error
  });

  if (!user) {
    console.log('No user in dashboard, redirecting to signin');
    redirect('/signin');
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-zinc-950 p-4">
        <div className="mx-auto max-w-7xl pt-20">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user.email}
          </h1>
          <div className="mt-4 grid gap-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <pre className="overflow-auto text-sm text-zinc-300">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
