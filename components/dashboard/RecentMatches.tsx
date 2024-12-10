import { PodcastMatch } from '@/types/matching';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  UserIcon,
  StarIcon,
  ClockIcon,
  SparklesIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface RecentMatchesProps {
  matches: PodcastMatch[];
  isPremium: boolean;
  limit: number;
}

export function RecentMatches({
  matches,
  isPremium,
  limit
}: RecentMatchesProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Since we don't have created_at, we'll use the array order as the chronological order
  const sortedMatches = [...matches];

  // Get today's match (most recent)
  const todayMatch = sortedMatches[0];

  // Get initial matches (first 3)
  const initialMatches = sortedMatches.slice(0, 3);

  // Get history matches (excluding today's match)
  const historyMatches = sortedMatches.slice(1);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your Matches</h2>
        {!isPremium && (
          <div className="flex items-center gap-2 text-sm">
            <ClockIcon className="w-4 h-4 text-purple-500" />
            <span>{limit} matches remaining</span>
          </div>
        )}
      </div>

      {/* Today's Match Section */}
      {todayMatch && (
        <div className="relative">
          <Card className="p-6 border-2 border-purple-500">
            <div className="absolute -top-3 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Today's Match
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">
                {todayMatch.podcast.title}
              </h3>
              <p className="text-muted-foreground">
                {todayMatch.podcast.category}
              </p>
              <p className="text-lg">{todayMatch.podcast.description}</p>

              <div className="flex gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <UserIcon className="w-5 h-5" />
                  <span>{todayMatch.podcast.listeners} listeners</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5" />
                  <span>{todayMatch.podcast.rating}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <Button className="flex-1">Send Pitch</Button>
                <Button className="flex-1" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Initial Matches Section */}
      {initialMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            <h3 className="text-xl font-semibold">Your First Matches</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {initialMatches.map((match) => (
              <Card key={match.podcastId} className="p-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold">
                    {match.podcast.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {match.podcast.category}
                  </p>
                  <p className="text-lg">{match.podcast.description}</p>

                  <div className="flex gap-4 text-muted-foreground">
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
                    <Button className="flex-1">Send Pitch</Button>
                    <Button className="flex-1" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Match History Section */}
      {historyMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-semibold">Match History</h3>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="text-sm"
            >
              {isHistoryExpanded ? (
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
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(isHistoryExpanded
              ? historyMatches
              : historyMatches.slice(0, 3)
            ).map((match) => (
              <Card key={match.podcastId} className="p-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold">
                    {match.podcast.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {match.podcast.category}
                  </p>
                  <p className="text-lg">{match.podcast.description}</p>

                  <div className="flex gap-4 text-muted-foreground">
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
                    <Button className="flex-1">Send Pitch</Button>
                    <Button className="flex-1" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Premium Upgrade Card */}
      {!isPremium && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center space-y-4">
            <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto" />
            <h3 className="text-2xl font-bold text-purple-900">
              Unlock Unlimited Matches
            </h3>
            <p className="text-purple-700 max-w-md mx-auto">
              Upgrade to Lexsona Premium to get unlimited matches and advanced
              features.
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? 'Processing...' : 'Upgrade to Premium'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
