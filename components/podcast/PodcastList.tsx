'use client';

import { Podcast } from '@/types/podcast';
import Image from 'next/image';

interface PodcastListProps {
  podcasts: Podcast[];
  isLoading?: boolean;
  onPodcastSelect?: (podcast: Podcast) => void;
}

/**
 * Component to display a list of podcasts with their details
 * Shows podcast image, title, publisher, and basic stats
 */
function PodcastList({
  podcasts,
  isLoading,
  onPodcastSelect
}: PodcastListProps) {
  /**
   * Formats the listen score into a readable string
   * @param score - Listen Notes popularity score (0-100)
   */
  const formatListenScore = (score: number) => {
    if (score >= 90) return 'Very Popular';
    if (score >= 70) return 'Popular';
    if (score >= 50) return 'Growing';
    return 'New';
  };

  /**
   * Truncates text to a specified length with ellipsis
   * @param text - Text to truncate
   * @param length - Maximum length before truncation
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
      {podcasts.map((podcast) => (
        <div
          key={podcast.id}
          className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
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
