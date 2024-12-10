/**
 * Helper functions to check subscription status
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { startOfDay } from 'date-fns';

export type SubscriptionTier = 'free' | 'premium';

const INITIAL_FREE_MATCHES = 3;
const DAILY_FREE_MATCHES = 1;

/**
 * Check if a user has an active premium subscription
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns boolean indicating if user has active premium subscription
 */
export async function isPremiumUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('price_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) return false;

    const { data: price } = await supabase
      .from('prices')
      .select('metadata')
      .eq('id', subscription.price_id)
      .single();

    return price?.metadata?.tier === 'premium';
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Get the number of matches a user can view based on their subscription status
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @param isPremium - Whether user has premium subscription
 * @returns number of matches user can view
 */
export async function getMatchLimit(
  supabase: SupabaseClient,
  userId: string,
  isPremium: boolean
): Promise<number> {
  if (isPremium) return Infinity;

  try {
    // Get user's registration date
    const { data: user } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    const registrationDate = new Date(user?.created_at || Date.now());
    const today = startOfDay(new Date());

    // Calculate days since registration
    const daysSinceRegistration = Math.floor(
      (today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Initial matches plus one per day since registration
    return INITIAL_FREE_MATCHES + daysSinceRegistration * DAILY_FREE_MATCHES;
  } catch (error) {
    console.error('Error calculating match limit:', error);
    return INITIAL_FREE_MATCHES;
  }
}

export async function getTierName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('price_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) return 'Free';

    const { data: price } = await supabase
      .from('prices')
      .select('metadata')
      .eq('id', subscription.price_id)
      .single();

    return price?.metadata?.tier === 'premium' ? 'Lexsona Premium' : 'Free';
  } catch (error) {
    console.error('Error getting tier name:', error);
    return 'Free';
  }
}
