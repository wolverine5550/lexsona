import { createClient } from '@/utils/supabase/client';
import type { PodcastMatch } from '@/types/matching';
import { MatchMaker } from './match-maker';
import { PodcastAnalyzer } from './podcast-analyzer';
import { isPremiumUser, getMatchLimit } from '@/utils/subscription';

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

export async function getRecentMatches(userId: string): Promise<{
  matches: PodcastMatch[];
  isPremium: boolean;
  limit: number;
}> {
  const supabase = createClient();

  // Check subscription status
  const isPremium = await isPremiumUser(supabase, userId);
  const limit = getMatchLimit(isPremium);

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
    .limit(isPremium ? 100 : limit);

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

  return {
    matches: transformedMatches,
    isPremium,
    limit
  };
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
    // 1. Get potential podcasts that haven't been matched yet
    console.log('Fetching potential podcasts...');
    const { data: podcasts, error: podcastError } = await supabase
      .from('podcasts')
      .select(
        `
        id,
        title,
        description,
        publisher,
        categories,
        total_episodes,
        listen_score,
        image
      `
      )
      .limit(10)
      .not('id', 'in', (select: any) => {
        select.from('matches').select('podcast_id').eq('author_id', userId);
      });

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
    const matches = podcasts.map((podcast) => {
      try {
        console.log('Generating match for podcast:', podcast.id, podcast.title);
        const match = {
          author_id: userId,
          podcast_id: podcast.id,
          match_score: 0.85, // Fixed score for testing
          match_reason: ['Topic alignment', 'Audience size match'],
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_saved: false
        };
        console.log('Generated match:', match);
        return match;
      } catch (error) {
        console.error(
          `Error generating match for podcast ${podcast.id}:`,
          error
        );
        return null;
      }
    });

    // Filter out any failed matches
    const validMatches = matches.filter(
      (match): match is NonNullable<typeof match> => match !== null
    );

    if (validMatches.length === 0) {
      console.log('No valid matches were generated');
      return;
    }

    console.log('Generated valid matches:', validMatches.length);
    console.log('First match example:', validMatches[0]);

    // 3. Insert matches into database
    console.log('Inserting matches...');
    const { data: insertedData, error: insertError } = await supabase
      .from('matches')
      .upsert(validMatches)
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
