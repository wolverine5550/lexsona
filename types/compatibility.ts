/**
 * Configuration for batch processing of matches
 */
export interface BatchProcessConfig {
  maxConcurrent: number; // Maximum number of concurrent matches to process
  minMatchScore: number; // Minimum score to consider a match viable
  minConfidence: number; // Minimum confidence level required
  maxResults: number; // Maximum number of matches to return
}

/**
 * Results from a batch processing operation
 */
export interface BatchProcessResult {
  authorId: string;
  matches: {
    podcastId: string;
    score: number;
    confidence: number;
    rank: number;
    explanation: string[];
  }[];
  processedCount: number;
  totalCandidates: number;
  processingTime: number; // in milliseconds
}

/**
 * Filter criteria for podcast matches
 */
export interface MatchFilter {
  minScore?: number;
  minConfidence?: number;
  topics?: string[];
  audienceLevel?: string[];
  maxResults?: number;
  excludePodcastIds?: string[];
}

/**
 * Status of batch processing
 */
export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 1
  processedCount: number;
  totalCount: number;
  error?: string;
}
