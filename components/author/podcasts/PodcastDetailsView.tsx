import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Headphones,
  Globe,
  Twitter,
  Linkedin,
  Instagram,
  ArrowLeft,
  MessageCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import {
  PodcastShow,
  PodcastEpisode,
  PodcastInteraction,
  PodcastStatus
} from '@/types/podcast';

interface PodcastDetailsViewProps {
  interaction: PodcastInteraction & {
    show: PodcastShow;
    episode: PodcastEpisode;
  };
  onBack: () => void;
  onStatusChange: (newStatus: PodcastStatus) => void;
  onNotesChange: (notes: string) => void;
}

/**
 * Displays detailed information about a podcast interaction
 * Including show details, episode info, and author's notes
 */
const PodcastDetailsView = ({
  interaction,
  onBack,
  onStatusChange,
  onNotesChange
}: PodcastDetailsViewProps) => {
  // Track whether notes are being edited
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  // Local state for notes to enable editing
  const [notesText, setNotesText] = useState(interaction.notes || '');

  /**
   * Handles saving notes and exiting edit mode
   */
  const handleSaveNotes = () => {
    onNotesChange(notesText);
    setIsEditingNotes(false);
  };

  /**
   * Formats social media links with proper icons
   */
  const renderSocialLinks = () => {
    const { socialLinks } = interaction.show;
    return (
      <div className="flex gap-3">
        {socialLinks.twitter && (
          <a
            href={socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-blue-500"
            aria-label="Twitter profile"
          >
            <Twitter className="w-5 h-5" />
          </a>
        )}
        {/* Similar blocks for LinkedIn and Instagram */}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold">Podcast Details</h2>
      </div>

      {/* Show Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-6">
          {/* Podcast Cover Image */}
          <Image
            src={interaction.show.coverImage}
            alt={interaction.show.name}
            width={120}
            height={120}
            className="rounded-lg"
          />

          {/* Show Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{interaction.show.name}</h3>
              <p className="text-gray-600">
                Hosted by {interaction.show.hostName}
              </p>
            </div>

            {/* Category Tags */}
            <div className="flex gap-2">
              {interaction.show.category.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Show Stats */}
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Headphones className="w-4 h-4" />
                <span>
                  {interaction.show.averageListeners.toLocaleString()} avg.
                  listeners
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <a
                  href={interaction.show.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  Website
                </a>
              </div>
              {renderSocialLinks()}
            </div>
          </div>
        </div>

        {/* Show Description */}
        <p className="mt-4 text-gray-700">{interaction.show.description}</p>
      </div>

      {/* Episode Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Episode Details</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">{interaction.episode.title}</h4>
            <p className="text-gray-600">{interaction.episode.description}</p>
          </div>

          {/* Episode Metadata */}
          <div className="flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(
                  new Date(interaction.episode.publishDate),
                  'MMM d, yyyy'
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{interaction.episode.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="w-4 h-4" />
              <span>
                {interaction.episode.listenerCount.toLocaleString()} listeners
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-4">
            <a
              href={interaction.episode.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Listen to Episode</span>
            </a>
            {interaction.episode.transcriptUrl && (
              <a
                href={interaction.episode.transcriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <FileText className="w-4 h-4" />
                <span>View Transcript</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Status</h3>
          <select
            value={interaction.status}
            onChange={(e) => onStatusChange(e.target.value as PodcastStatus)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="SAVED">Saved</option>
            <option value="MATCHED">Matched</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RECORDED">Recorded</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Notes
            </h4>
            <button
              onClick={() => setIsEditingNotes(!isEditingNotes)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isEditingNotes ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 min-h-[100px]"
                placeholder="Add your notes about this podcast..."
              />
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Notes
              </button>
            </div>
          ) : (
            <p className="text-gray-700">
              {interaction.notes || 'No notes added yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PodcastDetailsView;
