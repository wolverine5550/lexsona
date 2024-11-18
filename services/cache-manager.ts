import { createClient } from '@/utils/supabase/client';
import type {
  OpenAICacheKey,
  OpenAICacheEntry,
  AnalysisCacheKey,
  AnalysisCacheEntry,
  CacheConfig,
  CacheStats
} from '@/types/cache';
import {
  DEFAULT_CACHE_CONFIG,
  CacheError,
  createOpenAICacheKey,
  createAnalysisCacheKey
} from '@/types/cache';

/**
 * Service for managing caches for OpenAI responses and analysis results
 */
export class CacheManager {
  private static config: CacheConfig = DEFAULT_CACHE_CONFIG;
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    oldestEntry: Date.now(),
    newestEntry: Date.now(),
    evictionCount: 0
  };

  /**
   * Initialize cache with custom configuration
   */
  static initialize(config: Partial<CacheConfig> = {}): void {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanupInterval();
  }

  /**
   * Cache an OpenAI response
   */
  static async cacheOpenAIResponse(
    key: OpenAICacheKey,
    response: string,
    ttl?: number
  ): Promise<void> {
    const supabase = createClient();
    const cacheKey = createOpenAICacheKey(key);

    try {
      const entry: OpenAICacheEntry = {
        response,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl || this.config.defaultTTL!),
        usageCount: 1
      };

      const { error } = await supabase.from('openai_cache').upsert({
        key: cacheKey,
        entry: entry
      });

      if (error) throw error;

      this.stats.newestEntry = Date.now();
      this.stats.size++;
    } catch (error) {
      throw new CacheError(
        'Failed to cache OpenAI response',
        'STORAGE_ERROR',
        error
      );
    }
  }

  /**
   * Retrieve a cached OpenAI response
   */
  static async getOpenAIResponse(key: OpenAICacheKey): Promise<string | null> {
    const supabase = createClient();
    const cacheKey = createOpenAICacheKey(key);

    try {
      const { data, error } = await supabase
        .from('openai_cache')
        .select('entry')
        .eq('key', cacheKey)
        .single();

      if (error) throw error;

      if (!data) {
        this.stats.misses++;
        return null;
      }

      const entry: OpenAICacheEntry = data.entry;

      // Check if entry is expired
      if (entry.expiresAt < Date.now()) {
        await this.invalidateOpenAICache(key);
        this.stats.misses++;
        return null;
      }

      // Update usage count
      await supabase
        .from('openai_cache')
        .update({
          'entry.usageCount': entry.usageCount + 1
        })
        .eq('key', cacheKey);

      this.stats.hits++;
      return entry.response;
    } catch (error) {
      throw new CacheError(
        'Failed to retrieve OpenAI response',
        'RETRIEVAL_ERROR',
        error
      );
    }
  }

  /**
   * Cache analysis results
   */
  static async cacheAnalysisResults(
    key: AnalysisCacheKey,
    results: any,
    confidence: number,
    ttl?: number
  ): Promise<void> {
    const supabase = createClient();
    const cacheKey = createAnalysisCacheKey(key);

    try {
      const entry: AnalysisCacheEntry = {
        results,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl || this.config.defaultTTL!),
        confidence
      };

      const { error } = await supabase.from('analysis_cache').upsert({
        key: cacheKey,
        entry: entry
      });

      if (error) throw error;

      this.stats.newestEntry = Date.now();
      this.stats.size++;
    } catch (error) {
      throw new CacheError(
        'Failed to cache analysis results',
        'STORAGE_ERROR',
        error
      );
    }
  }

  /**
   * Retrieve cached analysis results
   */
  static async getAnalysisResults(key: AnalysisCacheKey): Promise<any | null> {
    const supabase = createClient();
    const cacheKey = createAnalysisCacheKey(key);

    try {
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('entry')
        .eq('key', cacheKey)
        .single();

      if (error) throw error;

      if (!data) {
        this.stats.misses++;
        return null;
      }

      const entry: AnalysisCacheEntry = data.entry;

      // Check if entry is expired
      if (entry.expiresAt < Date.now()) {
        await this.invalidateAnalysisCache(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.results;
    } catch (error) {
      throw new CacheError(
        'Failed to retrieve analysis results',
        'RETRIEVAL_ERROR',
        error
      );
    }
  }

  /**
   * Invalidate OpenAI cache entry
   */
  static async invalidateOpenAICache(key: OpenAICacheKey): Promise<void> {
    const supabase = createClient();
    const cacheKey = createOpenAICacheKey(key);

    try {
      const { error } = await supabase
        .from('openai_cache')
        .delete()
        .eq('key', cacheKey);

      if (error) throw error;

      this.stats.size--;
      this.stats.evictionCount++;
    } catch (error) {
      throw new CacheError(
        'Failed to invalidate OpenAI cache',
        'INVALIDATION_ERROR',
        error
      );
    }
  }

  /**
   * Invalidate analysis cache entry
   */
  static async invalidateAnalysisCache(key: AnalysisCacheKey): Promise<void> {
    const supabase = createClient();
    const cacheKey = createAnalysisCacheKey(key);

    try {
      const { error } = await supabase
        .from('analysis_cache')
        .delete()
        .eq('key', cacheKey);

      if (error) throw error;

      this.stats.size--;
      this.stats.evictionCount++;
    } catch (error) {
      throw new CacheError(
        'Failed to invalidate analysis cache',
        'INVALIDATION_ERROR',
        error
      );
    }
  }

  /**
   * Start periodic cache cleanup
   */
  private static startCleanupInterval(): void {
    setInterval(async () => {
      await this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired cache entries
   */
  private static async cleanupExpiredEntries(): Promise<void> {
    const supabase = createClient();
    const now = Date.now();

    try {
      // Clean up OpenAI cache
      const { error: openAIError } = await supabase
        .from('openai_cache')
        .delete()
        .lt('entry->>expiresAt', now);

      if (openAIError) throw openAIError;

      // Clean up analysis cache
      const { error: analysisError } = await supabase
        .from('analysis_cache')
        .delete()
        .lt('entry->>expiresAt', now);

      if (analysisError) throw analysisError;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    return { ...this.stats };
  }
}
