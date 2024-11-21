export type ExpertiseLevel = 'beginner' | 'intermediate' | 'expert';
export type CommunicationStyle =
  | 'casual'
  | 'professional'
  | 'academic'
  | 'storyteller';

export interface AuthorProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  expertise: ExpertiseLevel;
  communicationStyle: CommunicationStyle;
  books: BookInfo[];
  topics: string[];
  keyPoints: string[];
  lastAnalyzed?: Date;
}

export interface BookInfo {
  id: string;
  title: string;
  description: string;
  genre: string[];
  targetAudience: string[];
  publishDate: Date;
  keywords: string[];
}

export interface AuthorAnalysis {
  topics: string[];
  expertiseLevel: ExpertiseLevel;
  communicationStyle: CommunicationStyle;
  keyPoints: string[];
  confidence: number;
}
