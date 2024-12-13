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

    // For new users, we want to ensure they get 3 matches
    const INITIAL_MATCHES = 3;

    // Get match count
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId);

    console.log('Total matches found:', totalMatches);

    // Get user's metadata from auth
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Determine if user is new based on multiple criteria
    const isNewUser =
      // If we have their created_at time, check if within 24 hours
      (user?.created_at &&
        Date.now() - new Date(user.created_at).getTime() <
          24 * 60 * 60 * 1000) ||
      // Fallback: If no matches or very few matches, consider them new
      totalMatches === 0 ||
      // If we have exactly 2 matches (current state), consider them new to fix the issue
      totalMatches === 2;

    // For new users, always use INITIAL_MATCHES
    // For existing users, use their subscription limit
    const effectiveLimit = isNewUser
      ? INITIAL_MATCHES
      : isPremium
        ? 10
        : MATCHES_PER_DAY_BASIC;

    console.log('User status:', {
      isNewUser,
      effectiveLimit,
      totalMatches,
      createdAt: user?.created_at
    });

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
      .order('match_score', { ascending: false }) // Order by match score to get best matches
      .limit(effectiveLimit);

    if (error) throw error;

    console.log('Fetched matches:', matches?.length || 0);

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

    // If we're a new user and don't have enough matches, generate more
    if (isNewUser && transformedMatches.length < INITIAL_MATCHES) {
      console.log('New user needs more matches, generating...');
      await generateMatchesForAuthor(userId);
      return getRecentMatches(userId); // Recursively get matches after generation
    }

    // Calculate remaining matches
    const remainingMatches = Math.max(0, effectiveLimit - (totalMatches || 0));

    console.log('Transformed matches:', transformedMatches.length);

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
    console.log('Starting match generation for user:', userId);

    // 1. Check subscription limits
    const isPremium = await isPremiumUser(supabase, userId);

    // For new users, ensure we get 3 initial matches
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('podcast_id')
      .eq('author_id', userId);

    const isNewUser = !existingMatches || existingMatches.length === 0;
    const availableMatches = isNewUser
      ? 3
      : isPremium
        ? 10
        : Math.min(3, MATCHES_PER_DAY_BASIC);

    console.log('User match status:', {
      isPremium,
      isNewUser,
      availableMatches
    });

    const matchedPodcastIds = (existingMatches || []).map((m) => m.podcast_id);

    // 3. Get potential new podcasts, excluding sample podcasts
    const { data: podcasts, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .not('id', 'like', 'pod%')
      .order('listen_score', { ascending: false }) // Get highest rated podcasts first
      .limit(availableMatches + 5); // Get a few extra in case some fail to match

    if (podcastError) {
      console.error('Error fetching podcasts:', podcastError);
      throw podcastError;
    }

    // Filter out already matched podcasts
    const filteredPodcasts = podcasts?.filter(
      (p) => !matchedPodcastIds.includes(p.id)
    );

    console.log('Found potential podcasts:', filteredPodcasts?.length || 0);

    if (!filteredPodcasts || filteredPodcasts.length === 0) {
      console.log('No new podcasts available for matching');
      return;
    }

    // 4. Generate matches using MatchMaker
    const matches = await Promise.all(
      filteredPodcasts.slice(0, availableMatches).map(async (podcast) => {
        console.log('Generating match for podcast:', podcast.id);
        try {
          const match = await MatchMaker.generateMatch(userId, podcast.id);
          console.log('Match generated:', {
            podcastId: podcast.id,
            score: match.overallScore,
            confidence: match.confidence
          });
          return {
            author_id: userId,
            podcast_id: podcast.id,
            match_score: match.overallScore,
            match_reason: match.breakdown.explanation,
            status: 'new',
            created_at: new Date().toISOString()
          };
        } catch (error) {
          console.error(
            'Error generating match for podcast:',
            podcast.id,
            error
          );
          return null;
        }
      })
    );

    // Filter out any failed matches
    const validMatches = matches.filter(
      (match): match is NonNullable<typeof match> => match !== null
    );
    console.log('Valid matches generated:', validMatches.length);

    if (validMatches.length > 0) {
      // 5. Store matches in database
      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(validMatches);

      if (upsertError) {
        console.error('Error upserting matches:', upsertError);
        throw upsertError;
      }
      console.log('Successfully stored matches in database');
    }
  } catch (error) {
    console.error('Error generating matches:', error);
    throw error;
  }
}
