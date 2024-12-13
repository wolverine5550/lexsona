import { createServerSupabaseClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching podcast with ID:', params.id);
    const supabase = createServerSupabaseClient();

    // First, let's check if the podcast exists
    const { count, error: countError } = await supabase
      .from('podcasts')
      .select('*', { count: 'exact', head: true })
      .eq('id', params.id);

    console.log('Count result:', {
      count,
      error: countError,
      queriedId: params.id
    });

    if (countError) {
      console.error('Error checking podcast existence:', countError);
      throw countError;
    }

    if (count === 0) {
      console.log('No podcast found with ID:', params.id);
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    // If we get here, the podcast exists, so let's fetch its details
    const { data: podcast, error } = await supabase
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
        image,
        website,
        language,
        explicit_content,
        latest_pub_date_ms,
        podcast_analysis (*)
      `
      )
      .eq('id', params.id)
      .single();

    console.log('Query result:', { podcast, error, queriedId: params.id });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    console.log('Found podcast:', podcast);

    // Transform the data to match PodcastDetails interface
    const transformedPodcast = {
      title: podcast.title || '',
      description: podcast.description || '',
      website: podcast.website || '',
      totalEpisodes: podcast.total_episodes || 0,
      language: podcast.language || 'en',
      publisher: podcast.publisher || '',
      categories: podcast.categories || [],
      listenScore: podcast.listen_score || 0,
      image: podcast.image || '',
      explicitContent: podcast.explicit_content || false,
      latestPubDate: podcast.latest_pub_date_ms || 0,
      analysis: podcast.podcast_analysis || null
    };

    return NextResponse.json(transformedPodcast);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast details' },
      { status: 500 }
    );
  }
}
