import { PodcastMatch } from '@/types/matching';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  UserIcon,
  StarIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getStripe } from '@/utils/stripe/client';
import { useState } from 'react';

interface RecentMatchesProps {
  matches: PodcastMatch[];
  isPremium: boolean;
  limit: number;
}

// Add type for subscription tiers
type SubscriptionTier = 'basic' | 'pro';

export function RecentMatches({
  matches,
  isPremium,
  limit
}: RecentMatchesProps) {
  // Track loading state for upgrade button
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Handle upgrade to specific tier
  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      setIsUpgrading(true);

      // Create checkout session with tier
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to checkout URL
      window.location.href = url;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      // TODO: Add error toast notification here
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Recent Matches</h2>
        {isPremium && (
          <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            <SparklesIcon className="w-5 h-5" />
            <span className="font-medium">Premium</span>
          </div>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="text-muted-foreground text-lg">No matches found</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6">
            {matches.map((match) => (
              <Card key={match.podcastId} className="p-6">
                <div className="flex justify-between items-start">
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
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-5 h-5" />
                        <span>{match.podcast.frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      {Math.round(match.overallScore * 100)}% Match
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button className="flex-1" variant="default">
                    Send Pitch
                  </Button>
                  <Button className="flex-1" variant="outline">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {!isPremium && matches.length >= limit && (
            <div className="space-y-6">
              {/* Basic Tier */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="text-center space-y-4">
                  <SparklesIcon className="w-12 h-12 text-blue-600 mx-auto" />
                  <h3 className="text-2xl font-bold text-blue-900">
                    Lexsona Basic
                  </h3>
                  <p className="text-blue-700 max-w-md mx-auto">
                    Get up to 10 matches per month and basic email templates.
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleUpgrade('basic')}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Processing...' : 'Upgrade to Basic'}
                  </Button>
                </div>
              </Card>

              {/* Pro Tier */}
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <div className="text-center space-y-4">
                  <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto" />
                  <h3 className="text-2xl font-bold text-purple-900">
                    Lexsona Pro
                  </h3>
                  <p className="text-purple-700 max-w-md mx-auto">
                    Unlimited matches and premium email templates.
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleUpgrade('pro')}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Processing...' : 'Upgrade to Pro'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
