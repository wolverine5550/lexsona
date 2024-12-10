import { createClient } from '@/utils/supabase/client';
import type { PodcastMatch } from '@/types/matching';
import { MatchMaker } from './match-maker';
import { PodcastAnalyzer } from './podcast-analyzer';
import { isPremiumUser, getMatchLimit } from '@/utils/subscription';
import { startOfMonth, endOfMonth } from 'date-fns';

interface PodcastQueryResult {
  id: string;
  author_id: string;
  podcast_id: string;
  score: number;
  match_reasons: string[];
  status: string;
  podcasts: {
    title: string;
    description: string | null;
    publisher: string;
    categories: string[];
    total_episodes: number | null;
    listen_score: number | null;
  };
}

const BASIC_TIER_MONTHLY_LIMIT = 10;
const MATCHES_PER_DAY_BASIC = 3;

export async function getRecentMatches(userId: string) {
  const supabase = createClient();

  try {
    // Check subscription status
    const isPremium = await isPremiumUser(supabase, userId);
    const limit = await getMatchLimit(supabase, userId, isPremium);

    // Get count of all matches for this user
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);

    // Get matches with limit
    const { data: matches, error } = await supabase
      .from('matches')
      .select(
        `
        id,
        author_id,
        podcast_id,
        match_score,
        match_reason,
        status,
        created_at,
        podcasts (
          id,
          title,
          description,
          publisher,
          categories,
          total_episodes,
          listen_score,
          image
        )
      `
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform the data to match our PodcastMatch type
    const transformedMatches =
      matches?.map((match: any) => ({
        id: match.id,
        podcastId: match.podcast_id,
        overallScore: match.match_score,
        confidence: 0.8, // Default confidence score
        breakdown: {
          topicScore: 0.8,
          expertiseScore: 0.8,
          styleScore: 0.8,
          audienceScore: 0.8,
          formatScore: 0.8,
          lengthScore: 0.8,
          complexityScore: 0.8,
          qualityScore: 0.8,
          explanation: match.match_reason || []
        },
        suggestedTopics: Array.isArray(match.podcasts?.categories)
          ? match.podcasts.categories
          : [],
        podcast: {
          title: match.podcasts?.title || '',
          description: match.podcasts?.description || '',
          category: Array.isArray(match.podcasts?.categories)
            ? match.podcasts.categories[0]
            : 'Uncategorized',
          listeners: match.podcasts?.listen_score || 0,
          rating: match.podcasts?.listen_score
            ? match.podcasts.listen_score / 20
            : 0,
          frequency: match.podcasts?.total_episodes > 100 ? 'weekly' : 'monthly'
        }
      })) || [];

    // Calculate remaining matches
    const remainingMatches = Math.max(0, limit - (totalMatches || 0));

    return {
      matches: transformedMatches,
      isPremium,
      limit: remainingMatches
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function checkExistingMatches() {
  const supabase = createClient();

  // First, check if the table exists
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['matches', 'podcast_matches']);

  console.log('Available tables:', tables);

  if (tableError) {
    console.error('Error checking tables:', tableError);
    return { data: null, error: tableError };
  }

  // Then try to get a match
  const { data, error } = await supabase.from('matches').select('*').limit(1);

  console.log('Sample match data:', data);
  if (error) {
    console.error('Error checking matches:', error);
  }
  return { data, error };
}

export async function generateMatchesForAuthor(userId: string): Promise<void> {
  const supabase = createClient();
  console.log('Starting generateMatchesForAuthor for user:', userId);

  try {
    // Check subscription status and limits
    const isPremium = await isPremiumUser(supabase, userId);
    let availableMatches = 10; // Default to max for premium users

    if (!isPremium) {
      // Check monthly limit
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      const { count: monthlyMatchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: dailyMatchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Calculate available matches
      const remainingMonthly =
        BASIC_TIER_MONTHLY_LIMIT - (monthlyMatchCount || 0);
      const remainingDaily = MATCHES_PER_DAY_BASIC - (dailyMatchCount || 0);
      availableMatches = Math.min(remainingMonthly, remainingDaily);

      if (availableMatches <= 0) {
        console.log('Match limit reached for basic tier user');
        return;
      }
    }

    // First, check existing matches for this user
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('podcast_id')
      .eq('author_id', userId);

    console.log('Existing matches:', existingMatches);

    // Get the IDs of already matched podcasts
    const matchedPodcastIds = existingMatches?.map((m) => m.podcast_id) || [];
    console.log('Already matched podcast IDs:', matchedPodcastIds);

    // 1. Get potential podcasts that haven't been matched yet
    console.log('Fetching potential podcasts...');
    const { data: podcasts, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .not('id', 'in', matchedPodcastIds)
      .limit(isPremium ? 10 : Math.min(3, availableMatches));

    console.log('Podcasts query result:', { podcasts, error: podcastError });

    if (podcastError) {
      console.error('Error fetching podcasts:', podcastError);
      throw podcastError;
    }
    if (!podcasts?.length) {
      console.log('No podcasts found in the database');
      return;
    }

    console.log('Found podcasts:', podcasts.length);

    // 2. Generate matches
    console.log('Generating matches...');
    const matches = podcasts.map((podcast) => ({
      author_id: userId,
      podcast_id: podcast.id,
      match_score: 0.85, // Fixed score for testing
      match_reason: ['Topic alignment', 'Audience size match'],
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_saved: false
    }));

    if (matches.length === 0) {
      console.log('No matches were generated');
      return;
    }

    console.log('Generated matches:', matches.length);
    console.log('First match example:', matches[0]);

    // 3. Insert matches into database
    console.log('Inserting matches...');
    const { data: insertedData, error: insertError } = await supabase
      .from('matches')
      .upsert(matches)
      .select();

    if (insertError) {
      console.error('Error inserting matches:', insertError);
      throw insertError;
    }

    console.log('Successfully inserted matches:', insertedData);
  } catch (error) {
    console.error('Error in generateMatchesForAuthor:', error);
    throw error;
  }
}
