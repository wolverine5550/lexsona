/**
 * Types for managing favorite podcasts and custom organization
 */

/**
 * Represents a collection of podcasts (like a playlist)
 * Examples: "High Priority", "Tech Podcasts", "Follow up later"
 */
export interface PodcastCollection {
  id: string;
  authorId: string;
  name: string;
  description?: string;
  isDefault: boolean; // Default collections like "Favorites", "Watch Later"
  color?: string; // For UI customization
  icon?: string; // Lucide icon name
  podcastCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Custom tag for organizing podcasts
 * Examples: "Responsive Host", "Large Audience", "Quick Reply"
 */
export interface PodcastTag {
  id: string;
  authorId: string;
  name: string;
  color?: string;
  useCount: number;
  createdAt: Date;
}

/**
 * Represents a podcast's membership in a collection
 */
export interface CollectionItem {
  collectionId: string;
  matchId: string;
  addedAt: Date;
  notes?: string;
  sortOrder?: number;
}

/**
 * Query parameters for fetching collections
 */
export interface CollectionQuery {
  authorId: string;
  includeEmpty?: boolean;
  searchTerm?: string;
}
