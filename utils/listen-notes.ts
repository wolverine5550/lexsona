import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  PodcastSearchParams,
  PodcastSearchResponse,
  Podcast
} from '@/types/podcast';

const LISTEN_NOTES_API_KEY = process.env.NEXT_PUBLIC_LISTEN_NOTES_API_KEY;
const BASE_URL = 'https://listen-api.listennotes.com/api/v2';

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 10, // Number of requests
  perSeconds: 60, // Time window in seconds
  timeout: 1000 // Timeout between requests in ms
};

/**
 * Type definition for Listen Notes API error response
 */
interface ListenNotesErrorResponse {
  message: string;
  status_code?: number;
  [key: string]: any;
}

/**
 * Rate limiter to track API requests
 */
class RateLimiter {
  private requests: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the time window
    this.requests = this.requests.filter(
      (time) => now - time < RATE_LIMIT.perSeconds * 1000
    );
    return this.requests.length < RATE_LIMIT.requests;
  }

  addRequest() {
    this.requests.push(Date.now());
  }

  async waitForNextSlot(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, RATE_LIMIT.timeout);
    });
  }
}

const rateLimiter = new RateLimiter();

/**
 * Listen Notes API client with rate limiting
 */
export const listenNotesClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-ListenAPI-Key': LISTEN_NOTES_API_KEY
  }
});

/**
 * Error handler for Listen Notes API responses
 */
listenNotesClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ListenNotesErrorResponse>) => {
    if (error.response) {
      // Handle rate limiting
      if (error.response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      // Handle authentication errors
      if (error.response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      }
      // Handle service errors
      if (error.response.status >= 500) {
        throw new Error('Listen Notes service is currently unavailable.');
      }
      // Handle other API errors
      throw new Error(error.response.data?.message || 'Listen Notes API error');
    }
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
);

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  staleWhileRevalidate: true // Use stale data while fetching fresh
};

/**
 * Search for podcasts using the Listen Notes API
 * Includes caching, rate limiting and error handling
 */
export async function searchPodcasts(
  params: PodcastSearchParams,
  supabase: any
): Promise<PodcastSearchResponse> {
  try {
    // Check cache first
    const { data: cachedResults, error: cacheError } = await supabase
      .from('podcasts')
      .select('*')
      .textSearch('title', params.query)
      .order('latest_pub_date_ms', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + 9);

    // If we have fresh cached results, return them
    if (cachedResults?.length && !cacheError) {
      const cacheAge =
        Date.now() - new Date(cachedResults[0].cached_at).getTime();
      if (cacheAge < CACHE_CONFIG.maxAge) {
        return {
          count: cachedResults.length,
          total: cachedResults.length,
          results: cachedResults,
          next_offset: (params.offset || 0) + cachedResults.length
        };
      }

      // If stale cache enabled, use stale data while fetching fresh
      if (CACHE_CONFIG.staleWhileRevalidate) {
        // Fetch fresh data in background
        searchPodcasts(params, supabase).catch(console.error);

        // Return stale data immediately
        return {
          count: cachedResults.length,
          total: cachedResults.length,
          results: cachedResults,
          next_offset: (params.offset || 0) + cachedResults.length
        };
      }
    }

    // If no cache or cache expired, fetch from API
    // Check rate limit
    while (!rateLimiter.canMakeRequest()) {
      await rateLimiter.waitForNextSlot();
    }

    // Track this request
    rateLimiter.addRequest();

    // Make the API request
    const response = await listenNotesClient.get<PodcastSearchResponse>(
      '/search',
      {
        params: {
          q: params.query,
          type: 'podcast',
          offset: params.offset || 0,
          len_min: params.len_min || 10,
          language: params.language || 'English',
          safe_mode: params.safe_mode || 1,
          sort_by_date: params.sort_by_date || 0,
          only_in: params.only_in || 'title,description',
          ...params
        },
        timeout: 10000
      }
    );

    // Cache the results
    await cachePodcastResults(supabase, response.data.results);

    return response.data;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Podcast search failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get detailed information about a specific podcast
 * @param podcastId - Listen Notes podcast ID
 * @returns Detailed podcast information
 */
export async function getPodcastById(podcastId: string): Promise<Podcast> {
  // Check rate limit
  while (!rateLimiter.canMakeRequest()) {
    await rateLimiter.waitForNextSlot();
  }

  try {
    // Track this request
    rateLimiter.addRequest();

    // Make the API request
    const response = await listenNotesClient.get<Podcast>(
      `/podcasts/${podcastId}`,
      { timeout: 5000 } // 5 second timeout
    );

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch podcast: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cache podcast results in Supabase
 * Handles upserts and cache invalidation
 */
export async function cachePodcastResults(supabase: any, podcasts: Podcast[]) {
  try {
    // Prepare podcast data for insertion
    const podcastData = podcasts.map((podcast) => ({
      id: podcast.id,
      title: podcast.title,
      publisher: podcast.publisher,
      image: podcast.image,
      description: podcast.description,
      website: podcast.website,
      language: podcast.language,
      categories: podcast.categories,
      total_episodes: podcast.total_episodes,
      listen_score: podcast.listen_score,
      explicit_content: podcast.explicit_content,
      latest_episode_id: podcast.latest_episode_id,
      latest_pub_date_ms: podcast.latest_pub_date_ms,
      cached_at: new Date().toISOString()
    }));

    // Upsert podcasts to cache
    const { error } = await supabase.from('podcasts').upsert(podcastData, {
      onConflict: 'id',
      ignoreDuplicates: false // Update existing entries
    });

    if (error) throw error;

    // Cleanup old cache entries
    const oldCacheDate = new Date(
      Date.now() - CACHE_CONFIG.maxAge
    ).toISOString();
    await supabase.from('podcasts').delete().lt('cached_at', oldCacheDate);
  } catch (error) {
    console.error('Failed to cache podcast results:', error);
    // Don't throw - caching errors shouldn't break the main flow
  }
}

/**
 * Search for podcasts by genre
 * @param genreId - Listen Notes genre ID
 * @param params - Additional search parameters
 */
export async function searchPodcastsByGenre(
  genreId: number,
  params: Partial<PodcastSearchParams>,
  supabase: any
): Promise<PodcastSearchResponse> {
  try {
    const searchParams: PodcastSearchParams = {
      query: '', // Required field
      genre_ids: genreId.toString(),
      type: 'podcast',
      offset: params.offset || 0,
      len_min: params.len_min || 10,
      safe_mode: 1,
      sort_by_date: 0,
      ...params
    };

    return await searchPodcasts(searchParams, supabase);
  } catch (error) {
    throw new Error(
      `Genre search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Search for podcasts by keyword match in title and description
 * @param keywords - Array of keywords to match
 * @param params - Additional search parameters
 */
export async function searchPodcastsByKeywords(
  keywords: string[],
  params: Partial<PodcastSearchParams>,
  supabase: any
): Promise<PodcastSearchResponse> {
  try {
    const searchParams: PodcastSearchParams = {
      query: keywords.join(' '),
      type: 'podcast',
      only_in: 'title,description',
      offset: params.offset || 0,
      sort_by_date: 0,
      safe_mode: 1,
      ...params
    };

    return await searchPodcasts(searchParams, supabase);
  } catch (error) {
    throw new Error(
      `Keyword search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get best matching podcasts for a book
 * @param bookTitle - Title of the book
 * @param genres - Book genres
 * @param keywords - Book keywords
 */
export async function findMatchingPodcasts(
  bookTitle: string,
  genres: string[],
  keywords: string[],
  supabase: any
): Promise<PodcastSearchResponse> {
  try {
    // Combine book info into search query
    const searchQuery = `${bookTitle} ${genres.join(' ')} ${keywords.join(' ')}`;

    const searchParams: PodcastSearchParams = {
      query: searchQuery,
      type: 'podcast',
      language: 'English',
      len_min: 20, // Minimum episode length for quality content
      safe_mode: 1,
      sort_by_date: 0, // Sort by relevance
      only_in: 'title,description'
    };

    return await searchPodcasts(searchParams, supabase);
  } catch (error) {
    throw new Error(
      `Match search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
