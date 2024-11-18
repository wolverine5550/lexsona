/**
 * Types for caching system
 */

/**
 * Cache key structure for OpenAI responses
 */
export interface OpenAICacheKey {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Cache entry for OpenAI responses
 */
export interface OpenAICacheEntry {
  response: string;
  timestamp: number;
  expiresAt: number;
  usageCount: number;
}

/**
 * Cache key structure for analysis results
 */
export interface AnalysisCacheKey {
  podcastId: string;
  analysisType: 'features' | 'episode';
  version: string;
}

/**
 * Cache entry for analysis results
 */
export interface AnalysisCacheEntry {
  results: any; // Will be PodcastFeatures or EpisodeAnalysis
  timestamp: number;
  expiresAt: number;
  confidence: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  maxEntries?: number; // Maximum number of entries to store
  defaultTTL?: number; // Default time-to-live in milliseconds
  maxAge?: number; // Maximum age of entries in milliseconds
  cleanupInterval?: number; // Interval for cleanup in milliseconds
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry: number;
  newestEntry: number;
  evictionCount: number;
}

/**
 * Error types for caching operations
 */
export class CacheError extends Error {
  constructor(
    message: string,
    public code: 'STORAGE_ERROR' | 'RETRIEVAL_ERROR' | 'INVALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  cleanupInterval: 60 * 60 * 1000 // 1 hour
};

/**
 * Cache key generation utilities
 */
export const createOpenAICacheKey = (key: OpenAICacheKey): string => {
  return JSON.stringify({
    prompt: key.prompt,
    model: key.model,
    temperature: key.temperature || 0.7,
    maxTokens: key.maxTokens || 500
  });
};

export const createAnalysisCacheKey = (key: AnalysisCacheKey): string => {
  return `${key.analysisType}:${key.podcastId}:${key.version}`;
};
