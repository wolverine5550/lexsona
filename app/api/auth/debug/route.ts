import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  return NextResponse.json({
    hasSession: !!session,
    user: session?.user,
    error,
    timestamp: new Date().toISOString()
  });
}
