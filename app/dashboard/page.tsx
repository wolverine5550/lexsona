import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return <DashboardContent user={user} />;
}
