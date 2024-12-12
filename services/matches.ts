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

  try {
    // 1. Check subscription limits
    const isPremium = await isPremiumUser(supabase, userId);
    const availableMatches = isPremium
      ? 10
      : Math.min(3, MATCHES_PER_DAY_BASIC);

    // 2. Get existing matches to avoid duplicates
    const existingMatches = await supabase
      .from('matches')
      .select('podcast_id')
      .eq('author_id', userId);

    const matchedPodcastIds = existingMatches?.map((m) => m.podcast_id) || [];

    // 3. Get potential new podcasts
    const { data: podcasts } = await supabase
      .from('podcasts')
      .select('*')
      .not('id', 'in', matchedPodcastIds)
      .limit(availableMatches);

    // 4. Generate matches using MatchMaker
    const matches = await Promise.all(
      podcasts.map(async (podcast) => {
        const match = await MatchMaker.generateMatch(userId, podcast.id);
        return {
          author_id: userId,
          podcast_id: podcast.id,
          match_score: match.overallScore,
          match_reason: match.breakdown.explanation,
          status: 'new',
          created_at: new Date().toISOString()
        };
      })
    );

    // 5. Store matches in database
    await supabase.from('matches').upsert(matches);
  } catch (error) {
    console.error('Error generating matches:', error);
    throw error;
  }
}
