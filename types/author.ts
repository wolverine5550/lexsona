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

export type Author = {
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
};
