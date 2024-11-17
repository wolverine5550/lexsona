'use client';

import { useState, useEffect } from 'react';
import { Podcast } from '@/types/podcast';
import Image from 'next/image';
import SavePodcastButton from './SavePodcastButton';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/hooks/useSession';
import { Star } from 'lucide-react';

interface PodcastListProps {
  podcasts: Podcast[];
  isLoading?: boolean;
  onPodcastSelect?: (podcast: Podcast) => void;
}

type PodcastStatus = 'saved' | 'favorite' | 'hidden' | 'archived' | null;

interface SavedPodcastRecord {
  podcast_id: string;
  status: PodcastStatus;
}

/**
 * Component to display a list of podcasts with their details
 * Shows podcast image, title, publisher, and basic stats
 * Filters out hidden podcasts
 */
function PodcastList({
  podcasts,
  isLoading,
  onPodcastSelect
}: PodcastListProps) {
  const { session } = useSession();
  const [podcastStatuses, setPodcastStatuses] = useState<
    Record<string, PodcastStatus>
  >({});
  const [visiblePodcasts, setVisiblePodcasts] = useState<Podcast[]>(podcasts);

  /**
   * Load saved/hidden status for all podcasts
   */
  useEffect(() => {
    const loadPodcastStatuses = async () => {
      if (!session?.user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_podcasts')
        .select('podcast_id, status')
        .eq('user_id', session.user.id);

      if (!error && data) {
        // Type assertion to ensure data is array of SavedPodcastRecord
        const records = data as SavedPodcastRecord[];

        // Create status map with proper typing
        const statuses = records.reduce<Record<string, PodcastStatus>>(
          (acc, item) => ({
            ...acc,
            [item.podcast_id]: item.status
          }),
          {}
        );

        setPodcastStatuses(statuses);

        // Filter out hidden podcasts
        const visible = podcasts.filter(
          (podcast) => statuses[podcast.id] !== 'hidden'
        );
        setVisiblePodcasts(visible);
      }
    };

    loadPodcastStatuses();
  }, [podcasts, session?.user]);

  /**
   * Handle status changes from SavePodcastButton
   */
  const handleStatusChange = (podcastId: string, newStatus: PodcastStatus) => {
    setPodcastStatuses((prev) => ({
      ...prev,
      [podcastId]: newStatus
    }));

    // If podcast is hidden, remove it from visible list
    if (newStatus === 'hidden') {
      setVisiblePodcasts((prev) => prev.filter((p) => p.id !== podcastId));
    }
  };

  /**
   * Formats the listen score into a readable string
   */
  const formatListenScore = (score: number) => {
    if (score >= 90) return 'Very Popular';
    if (score >= 70) return 'Popular';
    if (score >= 50) return 'Growing';
    return 'New';
  };

  /**
   * Truncates text to a specified length with ellipsis
   */
  const truncateText = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-md bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-4 w-1/2 rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visiblePodcasts.map((podcast) => (
        <div
          key={podcast.id}
          className={`group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50 ${
            podcastStatuses[podcast.id] === 'favorite'
              ? 'border-yellow-500/50'
              : ''
          }`}
          onClick={() => onPodcastSelect?.(podcast)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start space-x-4">
            {/* Podcast Image */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={podcast.image}
                alt={podcast.title}
                fill
                className="object-cover"
              />
              {/* Enhanced favorite indicator with hover effect */}
              {podcastStatuses[podcast.id] === 'favorite' && (
                <div className="absolute right-1 top-1 rounded-full bg-yellow-500/90 p-1 transition-all duration-200 hover:scale-110 hover:bg-yellow-400 hover:shadow-lg">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Podcast Details */}
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-medium text-white group-hover:text-zinc-200">
                {podcast.title}
              </h3>
              <p className="text-sm text-zinc-400">{podcast.publisher}</p>
              <p className="text-sm text-zinc-500">
                {truncateText(podcast.description, 150)}
              </p>

              {/* Podcast Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-zinc-500">
                  <span>{podcast.total_episodes} episodes</span>
                  <span>•</span>
                  <span>{formatListenScore(podcast.listen_score)}</span>
                  <span>•</span>
                  <span>{podcast.language}</span>
                  {podcast.explicit_content && (
                    <>
                      <span>•</span>
                      <span className="text-red-500">Explicit</span>
                    </>
                  )}
                </div>
                <SavePodcastButton
                  podcast={podcast}
                  initialStatus={podcastStatuses[podcast.id] as PodcastStatus}
                  onStatusChange={(newStatus) =>
                    handleStatusChange(podcast.id, newStatus as PodcastStatus)
                  }
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {podcast.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PodcastList;
