/**
 * Types for podcast content analysis
 */

/**
 * Key features extracted from a podcast
 */
export interface PodcastFeatures {
  id: string;
  mainTopics: string[];
  contentStyle: {
    isInterview: boolean;
    isNarrative: boolean;
    isEducational: boolean;
    isDebate: boolean;
  };
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
  averageEpisodeLength: number;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  productionQuality: number; // 0-100
  hostingStyle: string[];
  languageComplexity: number; // 0-100
}

/**
 * Analysis results for a podcast episode
 */
export interface EpisodeAnalysis {
  id: string;
  podcastId: string;
  episodeNumber: number;
  topics: string[];
  keyPoints: string[];
  guestExperts?: string[];
  contentType: string[];
  timestamp: string;
}

/**
 * Complete podcast analysis results
 */
export interface PodcastAnalysis {
  podcastId: string;
  features: PodcastFeatures;
  recentEpisodes: EpisodeAnalysis[];
  lastAnalyzed: string;
  analysisVersion: string;
  confidence: number; // 0-100
}

/**
 * Error types for analysis operations
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: 'EXTRACTION_ERROR' | 'PROCESSING_ERROR' | 'STORAGE_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}
