import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/Dialog';
import { useEffect, useState } from 'react';
import { getPodcastDetails } from '@/services/listen-notes';
import { Loader2 } from 'lucide-react';

interface PodcastDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastId: string;
}

interface PodcastDetails {
  title: string;
  description: string;
  website: string;
  totalEpisodes: number;
  language: string;
  publisher: string;
  categories: number[];
  listenScore: number;
  image: string;
  explicitContent: boolean;
  latestPubDate: number;
  analysis: any | null;
}

export const PodcastDetailsModal = ({
  isOpen,
  onClose,
  podcastId
}: PodcastDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [podcastDetails, setPodcastDetails] = useState<PodcastDetails | null>(
    null
  );

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !podcastId) return;

      console.log('Fetching details for podcast:', podcastId);
      setIsLoading(true);
      try {
        const details = await getPodcastDetails(podcastId);
        console.log('Received podcast details:', details);
        if ('error' in details) {
          throw new Error(details.error);
        }
        setPodcastDetails(details);
      } catch (error) {
        console.error('Failed to fetch podcast details:', error);
        setPodcastDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, podcastId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Podcast Details</DialogTitle>
          <DialogDescription asChild>
            <div>Detailed information about the podcast</div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : podcastDetails ? (
            <div className="space-y-4">
              {podcastDetails.image && (
                <div className="flex justify-center">
                  <img
                    src={podcastDetails.image}
                    alt={podcastDetails.title}
                    className="w-32 h-32 rounded-lg"
                  />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-200">Title</h3>
                <p className="text-gray-400">{podcastDetails.title}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-200">Description</h3>
                <p className="text-gray-400">{podcastDetails.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-200">Publisher</h3>
                  <p className="text-gray-400">{podcastDetails.publisher}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-200">
                    Total Episodes
                  </h3>
                  <p className="text-gray-400">
                    {podcastDetails.totalEpisodes}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-200">Language</h3>
                  <p className="text-gray-400">{podcastDetails.language}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-200">Listen Score</h3>
                  <p className="text-gray-400">{podcastDetails.listenScore}</p>
                </div>

                {podcastDetails.website && (
                  <div>
                    <h3 className="font-semibold text-gray-200">Website</h3>
                    <a
                      href={podcastDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-gray-400">Failed to load podcast details</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
