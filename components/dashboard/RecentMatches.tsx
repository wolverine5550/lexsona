import { PodcastMatch } from '@/types/matching';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UserIcon, StarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface RecentMatchesProps {
  matches: PodcastMatch[];
}

export function RecentMatches({ matches }: RecentMatchesProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Recent Matches</h2>

      {matches.length === 0 ? (
        <p className="text-muted-foreground text-lg">No matches found</p>
      ) : (
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
      )}
    </div>
  );
}
