import { PodcastMatch } from '@/types/matching';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  UserIcon,
  StarIcon,
  SparklesIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/Dialog';
import { PodcastDetailsModal } from '../podcast/PodcastDetailsModal';

interface RecentMatchesProps {
  matches: PodcastMatch[];
  isPremium: boolean;
  limit: number;
}

/**
 * RecentMatches Component
 * Displays podcast matches in two different layouts:
 * Day 1: Shows "Your Initial Matches" with first 3 matches
 * Day 2+: Shows "Today's Match" with latest match, and history below
 */
export function RecentMatches({
  matches,
  isPremium,
  limit = 3 // Default is 3
}: RecentMatchesProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort matches by most recent first and ensure uniqueness
  const sortedMatches = matches.filter(
    (match, index, self) => index === self.findIndex((m) => m.id === match.id)
  );

  // Determine if this is the user's first day (has 3 or fewer matches)
  const isFirstDay = sortedMatches.length <= 3;

  // Split matches into today's and history
  const todayMatches = matches.slice(0, limit);
  const historyMatches = matches.slice(limit);

  // Add logging after variables are defined
  console.log('Matches debug:', {
    totalMatches: matches.length,
    limit,
    isFirstDay: isFirstDay,
    todayMatches: todayMatches.length,
    historyMatches: historyMatches.length,
    rawMatches: matches
  });

  // Number of matches to show in collapsed history view
  const COLLAPSED_VIEW_LIMIT = 3;

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier: 'premium' })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error upgrading:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const MatchCard = ({ match }: { match: PodcastMatch }) => {
    // Add state for modal
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    return (
      <div className="rounded-lg bg-card p-6 shadow-sm">
        {/* Existing match title and description */}
        <h3 className="text-2xl font-bold text-white">{match.podcast.title}</h3>
        <p className="mt-2 text-gray-400">{match.podcast.description}</p>

        {/* Stats row - keep existing */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">
              {match.podcast.listeners} listeners
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">
              {match.podcast.rating}
            </span>
          </div>
        </div>

        {/* Buttons - Reordered */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="flex-1 rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
          >
            View Details
          </button>
          <button className="flex-1 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
            Send Pitch
          </button>
        </div>

        {/* Add Modal */}
        <PodcastDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          podcastId={match.podcastId}
        />
      </div>
    );
  };

  console.log('All matches:', matches);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold text-white">Your Matches</h2>
      </div>

      {/* Main Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="text-xl font-semibold text-white">
            {isFirstDay ? 'Your Initial Matches' : "Today's Match"}
          </h3>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {todayMatches.map((match) => {
            const [isDetailsOpen, setIsDetailsOpen] = useState(false);

            console.log('Today Match:', {
              matchId: match.id,
              podcastId: match.podcastId,
              fullMatch: match,
              podcast: match.podcast
            });

            return (
              <div
                key={`today-${match.id}`}
                className="rounded-xl border-2 border-purple-500 bg-zinc-900/50 p-6 relative"
              >
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white">
                    {match.podcast.title}
                  </h3>
                  <p className="text-zinc-400">{match.podcast.category}</p>
                  <p className="text-zinc-300">{match.podcast.description}</p>

                  <div className="flex gap-4 text-zinc-400">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-5 h-5" />
                      <span>{match.podcast.listeners} listeners</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-5 h-5" />
                      <span>{match.podcast.rating}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={() => setIsDetailsOpen(true)}
                    >
                      View Details
                    </Button>
                    <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                      Send Pitch
                    </Button>
                  </div>

                  {/* Add modal after the buttons */}
                  <PodcastDetailsModal
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    podcastId={match.podcastId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match History Section - Only show for day 2+ */}
      {!isFirstDay && historyMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-semibold text-white">
                Previous Matches
              </h3>
            </div>
            {historyMatches.length > COLLAPSED_VIEW_LIMIT && (
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800"
              >
                {isExpanded ? (
                  <>
                    Show Less
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show More
                    <ChevronDownIcon className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(isExpanded
              ? historyMatches
              : historyMatches.slice(0, COLLAPSED_VIEW_LIMIT)
            ).map((match) => {
              const [isDetailsOpen, setIsDetailsOpen] = useState(false);

              console.log('History Match:', {
                matchId: match.id,
                fullMatch: match,
                podcast: match.podcast
              });

              return (
                <div
                  key={`history-${match.id}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">
                      {match.podcast.title}
                    </h3>
                    <p className="text-zinc-400">{match.podcast.category}</p>
                    <p className="text-zinc-300">{match.podcast.description}</p>

                    <div className="flex gap-4 text-zinc-400">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-5 h-5" />
                        <span>{match.podcast.listeners} listeners</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-5 h-5" />
                        <span>{match.podcast.rating}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                        Send Pitch
                      </Button>
                      <Button
                        className="flex-1 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800"
                        onClick={() => setIsDetailsOpen(true)}
                      >
                        View Details
                      </Button>
                    </div>

                    {/* Add modal after the buttons */}
                    <PodcastDetailsModal
                      isOpen={isDetailsOpen}
                      onClose={() => setIsDetailsOpen(false)}
                      podcastId={match.podcastId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium Upgrade Card */}
      {!isPremium && (
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-purple-500/5 p-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Unlock Unlimited Matches
            </h3>
            <p className="text-zinc-300 max-w-md mx-auto">
              Upgrade to Lexsona Premium to get unlimited matches and advanced
              features.
            </p>
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
