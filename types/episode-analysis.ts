export interface EpisodeAnalysis {
  id: string;
  topics: string[];
  keyPoints: string[];
  guestExperts?: string[];
  contentType: string[];
  confidence: number;
  error?: {
    message: string;
    code?: string;
  };
}

export interface EpisodeData {
  id: string;
  title: string;
  description: string;
  transcript?: string;
  published_at: string;
  episode_number: number;
}
