import { createClient } from '@/utils/supabase/client';
import type { PodcastMatch } from '@/types/matching';
import { MatchMaker } from './match-maker';
import { PodcastAnalyzer } from './podcast-analyzer';

export async function getRecentMatches(): Promise<PodcastMatch[]> {
  const supabase = createClient();

  const { data: matches, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      podcast:podcasts(
        title,
        category,
        description,
        listeners,
        rating,
        frequency
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;

  // Transform the data to match our PodcastMatch type
  return (
    matches?.map((match) => ({
      ...match,
      overallScore: match.match_score // Map match_score to overallScore
    })) || []
  );
}

export async function generateMatchesForAuthor(userId: string): Promise<void> {
  const supabase = createClient();

  // 1. Get potential podcasts
  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('*')
    .limit(10);

  if (!podcasts?.length) {
    console.log('No podcasts found to match');
    return;
  }

  // 2. Generate matches
  const matches = await Promise.all(
    podcasts.map(async (podcast) => {
      const match = await MatchMaker.generateMatch(userId, podcast.id);

      // Map to match our schema
      return {
        author_id: userId,
        podcast_id: podcast.id,
        match_score: match.overallScore, // Use match_score to match DB schema
        match_reason: match.breakdown.explanation,
        status: 'new',
        created_at: new Date().toISOString()
      };
    })
  );

  // 3. Insert matches
  const { error } = await supabase.from('matches').upsert(matches, {
    onConflict: 'author_id,podcast_id'
  });

  if (error) {
    console.error('Error inserting matches:', error);
    throw error;
  }
}
