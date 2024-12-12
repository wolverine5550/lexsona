import { createClient } from '@/utils/supabase/client';
import { PodcastAnalyzer } from './podcast-analyzer';
import { ExpertiseLevel } from '@/types/author';
import { HostStyle } from '@/types/podcast';

export class ListenNotesClient {
  private apiKey: string;
  private rateLimitDelay = 2000; // 2 seconds between requests

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async search({
    q,
    type = 'podcast',
    language = 'English',
    len_min = 10,
    len_max = 60,
    offset = 0
  }: {
    q: string;
    type?: string;
    language?: string;
    len_min?: number;
    len_max?: number;
    offset?: number;
  }) {
    const response = await fetch(
      `https://listen-api.listennotes.com/api/v2/search?q=${q}&type=${type}&language=${language}&len_min=${len_min}&len_max=${len_max}&offset=${offset}`,
      {
        headers: {
          'X-ListenAPI-Key': this.apiKey
        }
      }
    );

    if (response.status === 429) {
      console.log('Rate limit hit, waiting before retry...');
      await this.wait(this.rateLimitDelay);
      return this.search({ q, type, language, len_min, len_max, offset });
    }

    if (!response.ok) {
      throw new Error(`ListenNotes API error: ${response.statusText}`);
    }

    const data = await response.json();
    await this.wait(this.rateLimitDelay); // Wait between requests
    return data;
  }

  // Add method to fetch podcasts by topics with rate limiting
  async fetchPodcastsByTopics(topics: string[], maxPerTopic = 3) {
    const results = [];
    for (const topic of topics) {
      try {
        console.log(`Fetching podcasts for topic: ${topic}`);
        const searchResult = await this.search({ q: topic });

        if (searchResult.results) {
          // Take only the top N results per topic
          const topResults = searchResult.results.slice(0, maxPerTopic);
          results.push(...topResults);
        }

        // Wait between topics
        await this.wait(this.rateLimitDelay);
      } catch (error) {
        console.error(`Error fetching podcasts for topic ${topic}:`, error);
      }
    }
    return results;
  }
}

// Helper function to determine podcast expertise level
function determinePodcastLevel(podcast: any): ExpertiseLevel {
  const description = (podcast.description || '').toLowerCase();
  const title = (podcast.title || '').toLowerCase();

  if (
    description.includes('advanced') ||
    description.includes('expert') ||
    title.includes('advanced') ||
    title.includes('expert')
  ) {
    return ExpertiseLevel.Expert;
  }

  if (
    description.includes('beginner') ||
    description.includes('introduction') ||
    title.includes('beginner') ||
    title.includes('introduction')
  ) {
    return ExpertiseLevel.Beginner;
  }

  return ExpertiseLevel.Intermediate;
}

// Helper function to determine podcast host style
function determineHostStyle(podcast: any): HostStyle {
  const description = (podcast.description || '').toLowerCase();

  if (description.includes('interview') || description.includes('featuring')) {
    return 'interview';
  }
  if (description.includes('teach') || description.includes('learn')) {
    return 'educational';
  }
  if (description.includes('debate') || description.includes('discuss')) {
    return 'debate';
  }
  if (description.includes('story') || description.includes('narrative')) {
    return 'storytelling';
  }

  return 'conversational';
}

export async function populatePodcastDatabase() {
  try {
    const supabase = createClient();

    // Check if we already have test podcasts
    const { data: existingPodcasts, error: countError } = await supabase
      .from('podcasts')
      .select('id')
      .like('id', 'test%');

    if (countError) {
      console.error('Error checking podcasts:', countError);
      throw countError;
    }

    // If we already have test podcasts, no need to do anything
    if (existingPodcasts && existingPodcasts.length > 0) {
      console.log('Test podcasts already exist:', existingPodcasts.length);
      return;
    }

    // In development, use test data instead of calling ListenNotes API
    if (process.env.NODE_ENV === 'development') {
      console.log('Using test podcast data in development mode...');

      // Delete any existing sample podcasts
      await supabase.from('podcasts').delete().like('id', 'pod%');

      // Insert test podcasts
      const testPodcasts = [
        {
          id: 'test1',
          title: 'Tech Innovators',
          description: 'Deep dives into technology innovation and startups',
          publisher: 'Tech Media',
          categories: [67, 127],
          total_episodes: 100,
          listen_score: 80,
          language: 'en',
          explicit_content: false,
          latest_pub_date_ms: Date.now(),
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test2',
          title: 'AI Revolution Weekly',
          description:
            'Latest developments in artificial intelligence and machine learning',
          publisher: 'Future Labs',
          categories: [125, 67],
          total_episodes: 75,
          listen_score: 85,
          language: 'en',
          explicit_content: false,
          latest_pub_date_ms: Date.now(),
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test3',
          title: 'Startup Success Stories',
          description:
            'Interviews with successful entrepreneurs and business leaders',
          publisher: 'Founder Media',
          categories: [93, 95],
          total_episodes: 50,
          listen_score: 75,
          language: 'en',
          explicit_content: false,
          latest_pub_date_ms: Date.now(),
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Insert test podcasts
      const { error: podcastError } = await supabase
        .from('podcasts')
        .upsert(testPodcasts);

      if (podcastError) {
        throw podcastError;
      }

      // Insert test podcast analysis
      const testAnalysis = testPodcasts.map((podcast) => ({
        podcast_id: podcast.id,
        host_style: podcast.id === 'test2' ? 'educational' : 'interview',
        audience_level: podcast.id === 'test2' ? 'expert' : 'intermediate',
        topics: podcast.categories.map((c) => String(c)),
        confidence: 0.8,
        analyzed_at: new Date().toISOString()
      }));

      const { error: analysisError } = await supabase
        .from('podcast_analysis')
        .upsert(testAnalysis);

      if (analysisError) {
        throw analysisError;
      }

      console.log('Successfully populated test podcasts and analysis');
      return;
    }

    // Production code (calling ListenNotes API) remains unchanged...
    const listenNotesApiKey = process.env.NEXT_PUBLIC_LISTEN_NOTES_API_KEY;
    if (!listenNotesApiKey) {
      throw new Error('ListenNotes API key is not configured');
    }

    const listenNotes = new ListenNotesClient(listenNotesApiKey);

    // Define topics to search for
    const topics = [
      'technology startups',
      'business innovation',
      'artificial intelligence',
      'entrepreneurship',
      'tech news'
    ];

    console.log('Fetching podcasts from ListenNotes...');

    // Fetch podcasts by topics with limit per topic
    const podcastsData = await listenNotes.fetchPodcastsByTopics(topics, 3);

    if (!podcastsData || podcastsData.length === 0) {
      throw new Error('No podcasts received from ListenNotes API');
    }

    console.log('Received podcasts from ListenNotes:', podcastsData.length);

    // Delete sample podcasts
    await supabase.from('podcasts').delete().like('id', 'pod%');

    // Transform and store podcasts
    const podcastsToInsert = podcastsData.map((p: any) => ({
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      publisher: p.publisher || '',
      categories: p.genre_ids || [],
      total_episodes: parseInt(p.total_episodes) || 0,
      listen_score: parseInt(p.listen_score) || 50,
      image: p.image || '',
      website: p.website || '',
      language: p.language || 'en',
      explicit_content: !!p.explicit_content,
      latest_pub_date_ms: parseInt(p.latest_pub_date_ms) || Date.now(),
      cached_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('Inserting podcasts into database...');

    // Insert podcasts in smaller batches
    for (let i = 0; i < podcastsToInsert.length; i += 5) {
      const batch = podcastsToInsert.slice(i, i + 5);
      const { error } = await supabase.from('podcasts').upsert(batch);
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
      console.log(
        `Inserted batch ${i / 5 + 1}/${Math.ceil(podcastsToInsert.length / 5)}`
      );

      // Create analysis for each podcast
      for (const podcast of batch) {
        try {
          // Generate analysis based on podcast content
          const expertiseLevel = determinePodcastLevel(podcast);
          const hostStyle = determineHostStyle(podcast);

          // Extract topics from categories and title
          const topicSet = new Set<string>();

          // Add topics from genre IDs (if they're valid numbers)
          if (Array.isArray(podcast.categories)) {
            podcast.categories.forEach((category) => {
              if (typeof category === 'number') {
                // Map common genre IDs to topics
                switch (category) {
                  case 67:
                    topicSet.add('technology');
                    break;
                  case 93:
                    topicSet.add('business');
                    break;
                  case 111:
                    topicSet.add('education');
                    break;
                  case 127:
                    topicSet.add('technology news');
                    break;
                  case 122:
                    topicSet.add('entrepreneurship');
                    break;
                  case 125:
                    topicSet.add('artificial intelligence');
                    break;
                  case 95:
                    topicSet.add('startup');
                    break;
                  case 98:
                    topicSet.add('investing');
                    break;
                  case 131:
                    topicSet.add('science');
                    break;
                  default:
                    break;
                }
              } else if (typeof category === 'string') {
                topicSet.add(category.toLowerCase());
              }
            });
          }

          // Add topics from title words (excluding common words)
          const commonWords = new Set([
            'the',
            'and',
            'or',
            'but',
            'for',
            'with',
            'about'
          ]);
          podcast.title
            .toLowerCase()
            .split(' ')
            .filter((word) => word.length > 4 && !commonWords.has(word))
            .forEach((word) => topicSet.add(word));

          const { error: analysisError } = await supabase
            .from('podcast_analysis')
            .upsert({
              podcast_id: podcast.id,
              host_style: hostStyle,
              audience_level: expertiseLevel,
              topics: Array.from(topicSet),
              confidence: 0.8,
              analyzed_at: new Date().toISOString()
            });

          if (analysisError) {
            console.error('Error storing podcast analysis:', analysisError);
          }
        } catch (error) {
          console.error('Error analyzing podcast:', podcast.id, error);
        }
      }

      // Add a delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      'Successfully populated and analyzed podcasts:',
      podcastsToInsert.length
    );
  } catch (error) {
    console.error('Error populating podcasts:', error);
    throw error;
  }
}
