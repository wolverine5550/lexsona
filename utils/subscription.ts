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
 */
export async function isPremiumUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    // For now, return false as subscriptions are not set up
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Get the number of matches a user can view based on their subscription status
 */
export async function getMatchLimit(
  supabase: SupabaseClient,
  userId: string,
  isPremium: boolean
): Promise<number> {
  if (isPremium) return Infinity;

  try {
    // Get user's registration date from auth metadata
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return INITIAL_FREE_MATCHES;

    const registrationDate = new Date(user.created_at);
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

/**
 * Get the user's subscription tier name
 */
export async function getTierName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // For now, return Free as subscriptions are not set up
    return 'Free';
  } catch (error) {
    console.error('Error getting tier name:', error);
    return 'Free';
  }
}
