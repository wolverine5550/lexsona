'use client';

import React from 'react';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Podcast } from '@/types/podcast';
import {
  Bookmark,
  BookmarkCheck,
  EyeOff,
  MoreVertical,
  Star,
  StarOff
} from 'lucide-react';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useSession } from '@/hooks/useSession';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface SavePodcastButtonProps {
  podcast: Podcast;
  initialStatus?: 'saved' | 'favorite' | 'hidden' | 'archived' | null;
  onStatusChange?: (newStatus: string | null) => void;
  className?: string;
}

/**
 * Button component for saving/hiding podcasts
 * Includes dropdown menu for additional actions
 */
export default function SavePodcastButton({
  podcast,
  initialStatus = null,
  onStatusChange,
  className = ''
}: SavePodcastButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useSession();

  /**
   * Updates the podcast status in the database
   * @param newStatus - The new status to set ('saved', 'favorite', 'hidden', etc.)
   */
  const updatePodcastStatus = async (newStatus: string | null) => {
    if (!session?.user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to manage podcasts',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      if (newStatus) {
        // Save/update podcast status
        const { error: podcastError } = await supabase.from('podcasts').upsert({
          id: podcast.id,
          title: podcast.title,
          publisher: podcast.publisher,
          image: podcast.image,
          description: podcast.description,
          website: podcast.website,
          language: podcast.language,
          categories: podcast.categories,
          total_episodes: podcast.total_episodes,
          listen_score: podcast.listen_score,
          explicit_content: podcast.explicit_content,
          latest_episode_id: podcast.latest_episode_id,
          latest_pub_date_ms: podcast.latest_pub_date_ms,
          cached_at: new Date().toISOString()
        });

        if (podcastError) throw podcastError;

        // Update saved_podcasts entry
        const { error: saveError } = await supabase
          .from('saved_podcasts')
          .upsert({
            user_id: session.user.id,
            podcast_id: podcast.id,
            status: newStatus,
            created_at: new Date().toISOString()
          });

        if (saveError) throw saveError;

        toast({
          title: getStatusMessage(newStatus).title,
          description: getStatusMessage(newStatus).description
        });
      } else {
        // Remove from saved_podcasts
        const { error: deleteError } = await supabase
          .from('saved_podcasts')
          .delete()
          .match({ user_id: session.user.id, podcast_id: podcast.id });

        if (deleteError) throw deleteError;

        toast({
          title: 'Podcast removed',
          description: 'Removed from your saved podcasts'
        });
      }

      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating podcast status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update podcast. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get appropriate message for status change
   */
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'favorite':
        return {
          title: 'Added to favorites',
          description: 'Podcast added to your favorites'
        };
      case 'hidden':
        return {
          title: 'Podcast hidden',
          description: 'This podcast will no longer appear in your results'
        };
      default:
        return {
          title: 'Podcast saved',
          description: 'Added to your saved podcasts'
        };
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isLoading}
          className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          aria-label="Manage podcast"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] rounded-md border border-zinc-800 bg-zinc-900 p-1"
          sideOffset={5}
        >
          {/* Save/Unsave Option */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-zinc-400 outline-none transition-colors hover:bg-zinc-800 hover:text-white"
            onClick={() => updatePodcastStatus(status ? null : 'saved')}
          >
            {status === 'saved' ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                <span>Unsave</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </DropdownMenu.Item>

          {/* Favorite/Unfavorite Option */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-zinc-400 outline-none transition-colors hover:bg-zinc-800 hover:text-white"
            onClick={() =>
              updatePodcastStatus(status === 'favorite' ? null : 'favorite')
            }
          >
            {status === 'favorite' ? (
              <>
                <StarOff className="h-4 w-4" />
                <span>Remove from favorites</span>
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                <span>Add to favorites</span>
              </>
            )}
          </DropdownMenu.Item>

          {/* Hide/Unhide Option */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-zinc-400 outline-none transition-colors hover:bg-zinc-800 hover:text-white"
            onClick={() =>
              updatePodcastStatus(status === 'hidden' ? null : 'hidden')
            }
          >
            <EyeOff className="h-4 w-4" />
            <span>{status === 'hidden' ? 'Unhide' : 'Hide'}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
