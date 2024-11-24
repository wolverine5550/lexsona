import { createClient } from '@/utils/supabase/client';
import type {
  PodcastCollection,
  PodcastTag,
  CollectionItem,
  CollectionQuery
} from '@/types/favorites';

/**
 * Service for managing podcast collections, tags, and organization
 */
export class FavoritesService {
  /**
   * Create a new collection
   * @param authorId - ID of the author creating the collection
   * @param name - Name of the collection
   * @param description - Optional description
   * @param isDefault - Whether this is a default collection
   */
  static async createCollection(
    authorId: string,
    name: string,
    description?: string,
    isDefault: boolean = false
  ): Promise<PodcastCollection> {
    const supabase = createClient();

    const newCollection = {
      author_id: authorId,
      name,
      description,
      is_default: isDefault,
      podcast_count: 0
    };

    const { data, error } = await supabase
      .from('podcast_collections')
      .insert(newCollection)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error(`Collection "${name}" already exists`);
      }
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    return data as PodcastCollection;
  }

  /**
   * Add a podcast match to a collection
   * @param collectionId - ID of the collection
   * @param matchId - ID of the saved match to add
   * @param notes - Optional notes about why it's in this collection
   */
  static async addToCollection(
    collectionId: string,
    matchId: string,
    notes?: string
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('collection_items').insert({
      collection_id: collectionId,
      match_id: matchId,
      notes,
      sort_order: 0 // Will be updated by reordering function if needed
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Podcast is already in this collection');
      }
      throw new Error(`Failed to add to collection: ${error.message}`);
    }
  }

  /**
   * Create a new tag
   * @param authorId - ID of the author creating the tag
   * @param name - Name of the tag
   * @param color - Optional color for UI display
   */
  static async createTag(
    authorId: string,
    name: string,
    color?: string
  ): Promise<PodcastTag> {
    const supabase = createClient();

    const newTag = {
      author_id: authorId,
      name,
      color,
      use_count: 0
    };

    const { data, error } = await supabase
      .from('podcast_tags')
      .insert(newTag)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Tag "${name}" already exists`);
      }
      throw new Error(`Failed to create tag: ${error.message}`);
    }

    return data as PodcastTag;
  }

  /**
   * Add a tag to a saved match
   * @param tagId - ID of the tag
   * @param matchId - ID of the saved match
   */
  static async tagMatch(tagId: string, matchId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('match_tags').insert({
      tag_id: tagId,
      match_id: matchId
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This tag is already applied');
      }
      throw new Error(`Failed to add tag: ${error.message}`);
    }
  }

  /**
   * Get all collections for an author
   * @param query - Query parameters for filtering collections
   */
  static async getCollections(
    query: CollectionQuery
  ): Promise<PodcastCollection[]> {
    const supabase = createClient();

    let collectionsQuery = supabase
      .from('podcast_collections')
      .select('*')
      .eq('author_id', query.authorId);

    if (!query.includeEmpty) {
      collectionsQuery = collectionsQuery.gt('podcast_count', 0);
    }

    if (query.searchTerm) {
      collectionsQuery = collectionsQuery.ilike(
        'name',
        `%${query.searchTerm}%`
      );
    }

    const { data, error } = await collectionsQuery.order('created_at', {
      ascending: false
    });

    if (error) {
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    return data as PodcastCollection[];
  }

  /**
   * Get all tags for an author
   * @param authorId - ID of the author
   * @param activeOnly - Only return tags that are in use
   */
  static async getTags(
    authorId: string,
    activeOnly: boolean = false
  ): Promise<PodcastTag[]> {
    const supabase = createClient();

    let tagsQuery = supabase
      .from('podcast_tags')
      .select('*')
      .eq('author_id', authorId);

    if (activeOnly) {
      tagsQuery = tagsQuery.gt('use_count', 0);
    }

    const { data, error } = await tagsQuery.order('use_count', {
      ascending: false
    });

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    return data as PodcastTag[];
  }

  /**
   * Remove a match from a collection
   * @param collectionId - ID of the collection
   * @param matchId - ID of the match to remove
   */
  static async removeFromCollection(
    collectionId: string,
    matchId: string
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .match({ collection_id: collectionId, match_id: matchId });

    if (error) {
      throw new Error(`Failed to remove from collection: ${error.message}`);
    }
  }

  /**
   * Remove a tag from a match
   * @param tagId - ID of the tag
   * @param matchId - ID of the match
   */
  static async removeTag(tagId: string, matchId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('match_tags')
      .delete()
      .match({ tag_id: tagId, match_id: matchId });

    if (error) {
      throw new Error(`Failed to remove tag: ${error.message}`);
    }
  }
}
