/**
 * Helper functions to check subscription status
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

/**
 * Check if a user has an active premium subscription
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns boolean indicating if user has active premium subscription
 */
export const isPremiumUser = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> => {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single();

  // User is premium if they have an active or trialing subscription
  return (
    subscription?.status === 'active' || subscription?.status === 'trialing'
  );
};

/**
 * Get the number of matches a user can view based on their subscription status
 * @param isPremium - Whether user has premium subscription
 * @returns number of matches user can view
 */
export const getMatchLimit = (isPremium: boolean): number => {
  return isPremium ? Infinity : 3;
};
