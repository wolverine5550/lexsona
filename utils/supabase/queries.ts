import { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache as cache } from 'next/cache';

/**
 * Gets the currently authenticated user.
 * This function is cached to prevent unnecessary database calls.
 *
 * @param supabase - The Supabase client instance
 * @returns The authenticated user object or null if not authenticated
 */
export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Gets the user's active subscription if one exists.
 * This function is cached to prevent unnecessary database calls.
 * Includes related price and product information.
 *
 * @param supabase - The Supabase client instance
 * @returns The subscription object with nested price and product data
 */
export const getSubscription = async (supabase: SupabaseClient) => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return subscription;
};

/**
 * Gets all active products and their prices.
 * This function is cached to prevent unnecessary database calls.
 * Products are ordered by their metadata index and price.
 *
 * @param supabase - The Supabase client instance
 * @returns Array of active products with their price information
 */
export const getProducts = cache(async (supabase: SupabaseClient) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, prices(*)') // Get all product fields and related price data
    .eq('active', true) // Only get active products
    .eq('prices.active', true) // Only get active prices
    .order('metadata->index') // Order by metadata index
    .order('unit_amount', { referencedTable: 'prices' }); // Then by price amount

  return products;
});

/**
 * Gets the user's profile details from the user_profiles table.
 * This function is cached to prevent unnecessary database calls.
 *
 * @param supabase - The Supabase client instance
 * @returns The user's profile details or null if not found
 */
export const getUserDetails = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile exists yet, create one
  if (!userProfile) {
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null
        }
      ])
      .select()
      .single();

    return newProfile;
  }

  return userProfile;
});

/**
 * Checks if a user has completed the onboarding process.
 * A user has completed onboarding when they have:
 * 1. A valid authenticated session
 * 2. An author profile in the author_profiles table
 * 3. At least one book in the books table
 *
 * @param supabase - The Supabase client instance
 * @returns boolean - true if onboarding is complete, false otherwise
 */
export async function hasCompletedOnboarding(supabase: SupabaseClient) {
  try {
    // Step 1: Verify user authentication
    // Get the current user from the auth session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) return false;

    // Step 2: Check for author profile
    // Query author_profiles table to see if this user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('author_profiles')
      .select('id, bio') // We only need basic fields to verify existence
      .eq('id', user.id) // Match the profile to the current user
      .single(); // We expect only one profile per user

    if (profileError || !profile) return false;

    // Step 3: Check for at least one book
    // Query books table to see if this author has any books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id') // We only need the ID to verify existence
      .eq('author_id', user.id) // Match books to the current user
      .limit(1); // We only need to know if at least one exists

    if (booksError || !books.length) return false;

    // If all checks pass, onboarding is complete
    return true;
  } catch (error) {
    // Log any unexpected errors and return false to be safe
    console.error('Error checking onboarding status:', error);
    return false;
  }
}
