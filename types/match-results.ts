/**
 * Represents a potential episode topic or angle
 */
export interface EpisodeIdea {
  title: string;
  description: string;
  keyPoints: string[];
  relevanceScore: number;
  targetAudience: string[];
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

  // Core match details
  compatibility: {
    topicAlignment: number;
    expertiseMatch: number;
    styleCompatibility: number;
    audienceMatch: number;
    formatSuitability: number;
  };

  // Detailed explanations
  explanations: {
    strengths: string[];
    considerations: string[];
    recommendations: string[];
  };

  // Specific talking points
  suggestedTopics: TopicExplanation[];

  // Episode ideas
  potentialEpisodes: EpisodeIdea[];

  // Metadata
  generatedAt: Date;
  validUntil: Date;
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
}
