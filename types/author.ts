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
  topics: string[];
  expertiseLevel: ExpertiseLevel;
  communicationStyle: string;
  keyPoints: string[];
  confidence: number;
}

export interface AuthorProfile {
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
