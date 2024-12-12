export type SocialLinks = {
  twitter?: string;
  linkedin?: string;
  website?: string;
  instagram?: string;
};

export type AuthorWork = {
  id: string;
  title: string;
  coverImage: string;
  publishDate: string;
  publisher: string;
  genre: string[];
  description: string;
};

export type AuthorInterview = {
  id: string;
  title: string;
  podcastName: string;
  date: string;
  duration: string;
  listenerCount: number;
  episodeUrl: string;
};

export interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  socialLinks: SocialLinks;
  works: AuthorWork[];
  interviews: AuthorInterview[];
  followers: number;
  following: number;
  totalListens: number;
}

export enum ExpertiseLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Expert = 'expert'
}

export interface AuthorAnalysis {
  authorId: string;
  topics: string[];
  expertiseLevel: ExpertiseLevel;
  communicationStyle: CommunicationStyle;
  keyPoints: string[];
  preferredFormats: string[];
  targetAudience: string[];
  contentBoundaries: string[];
  confidence: number;
}

export interface AuthorProfile {
  id: string;
  name: string;
  bio: string;
  books: AuthorBook[];
}

export interface AuthorBook {
  title: string;
  description: string;
  genre: string[];
  targetAudience: string[];
}

export enum CommunicationStyle {
  Casual = 'casual',
  Professional = 'professional',
  Academic = 'academic',
  Storyteller = 'storyteller'
}

/**
 * Author onboarding data interface
 */
export interface AuthorOnboardingData {
  name: string;
  bio: string;
  books: AuthorBook[];
  socialLinks?: SocialLinks;
  location?: string;
  expertiseLevel?: ExpertiseLevel;
  communicationStyle?: CommunicationStyle;
}

/**
 * Podcast preferences interface for matching
 */
export interface PodcastPreferences {
  example_shows: string[];
  interview_topics: string[];
  target_audience: string[];
  preferred_formats: string[];
  content_boundaries: string[];
  min_listeners?: number;
  max_duration?: number;
  availability?: {
    weekdays?: string[];
    timeSlots?: string[];
  };
}
