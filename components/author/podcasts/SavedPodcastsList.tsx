import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Calendar, Clock, Headphones, ChevronRight } from 'lucide-react';
import {
  PodcastShow,
  PodcastEpisode,
  PodcastInteraction,
  PodcastStatus
} from '@/types/podcast';

interface SavedPodcastsListProps {
  interactions: (PodcastInteraction & {
    show: PodcastShow;
    episode: PodcastEpisode;
  })[];
  onSelectPodcast: (interaction: PodcastInteraction) => void;
}

/**
 * Displays a list of podcasts that the author has saved
 * Includes filtering, sorting, and basic podcast information
 */
const SavedPodcastsList = ({
  interactions,
  onSelectPodcast
}: SavedPodcastsListProps) => {
  // State for filtering and sorting
  const [sortBy, setSortBy] = useState<'date' | 'listeners'>('date');
  const [filterStatus, setFilterStatus] = useState<PodcastStatus | 'ALL'>(
    'ALL'
  );

  /**
   * Filters and sorts interactions based on current criteria
   */
  const filteredInteractions = useMemo(() => {
    let result = [...interactions];

    // Apply status filter
    if (filterStatus !== 'ALL') {
      result = result.filter(
        (interaction) => interaction.status === filterStatus
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime()
        );
      }
      return b.episode.listenerCount - a.episode.listenerCount;
    });

    return result;
  }, [interactions, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as PodcastStatus | 'ALL')
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Status</option>
            <option value="SAVED">Saved</option>
            <option value="MATCHED">Matched</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RECORDED">Recorded</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'listeners')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="date">Sort by Date</option>
            <option value="listeners">Sort by Listeners</option>
          </select>
        </div>
      </div>

      {/* Podcasts List */}
      <div className="space-y-4">
        {filteredInteractions.map((interaction) => (
          <div
            key={interaction.id}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            onClick={() => onSelectPodcast(interaction)}
          >
            <div className="flex items-start gap-4">
              {/* Podcast Cover Image */}
              <Image
                src={interaction.show.coverImage}
                alt={interaction.show.name}
                width={80}
                height={80}
                className="rounded-md"
              />

              {/* Podcast Information */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {interaction.show.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {interaction.episode.title}
                </p>

                {/* Metadata */}
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(interaction.savedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{interaction.episode.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Headphones className="w-4 h-4" />
                    <span>
                      {interaction.episode.listenerCount.toLocaleString()}{' '}
                      listeners
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600">
                  {interaction.status}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPodcastsList;
