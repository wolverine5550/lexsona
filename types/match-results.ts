import type { PodcastMatch } from './matching';

/**
 * Represents a potential episode topic or angle
 */
export interface EpisodeIdea {
  title: string;
  description: string;
  topics: string[];
  estimatedDuration: number;
  targetAudience: string[];
  potentialImpact: string;
}

/**
 * Detailed breakdown of why certain topics were suggested
 */
export interface TopicExplanation {
  topic: string;
  relevance: number;
  authorExpertise: number;
  audienceInterest: number;
  explanation: string;
}

/**
 * Comprehensive match result with detailed analysis
 */
export interface DetailedMatchResult {
  matchId: string;
  authorId: string;
  podcastId: string;
  overallScore: number;
  confidence: number;
  authorDetails: AuthorDetails;
  podcastDetails: PodcastDetails;
  compatibilityAnalysis: CompatibilityAnalysis;
  topicExplanations?: TopicExplanation[];
  episodeIdeas?: EpisodeIdea[];
  metadata?: MatchResultMetadata;
  generatedAt?: Date;
  validUntil?: Date;
}

/**
 * Status and metadata about the match result
 */
export interface MatchResultMetadata {
  lastUpdated: Date;
  processingTime: number;
  dataFreshness: 'fresh' | 'recent' | 'stale';
  confidenceFactors: {
    dataQuality: number;
    analysisDepth: number;
    predictionAccuracy: number;
  };
  version: string;
}

/**
 * Author details
 */
export interface AuthorDetails {
  id: string;
  name: string;
  bio: string;
  expertise: string[];
  topics: string[];
  publications: string[];
}

/**
 * Podcast details
 */
export interface PodcastDetails {
  id: string;
  title: string;
  description: string;
  categories: string[];
  language: string;
  averageEpisodeLength: number;
  totalEpisodes: number;
}

/**
 * Compatibility analysis
 */
export interface CompatibilityAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  potentialImpact: string;
}
