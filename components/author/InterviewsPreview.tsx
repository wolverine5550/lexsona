import { format } from 'date-fns';
import { Clock, Headphones } from 'lucide-react';
import { AuthorInterview } from '@/types/author';

interface InterviewsPreviewProps {
  interviews: AuthorInterview[];
}

const InterviewsPreview = ({ interviews }: InterviewsPreviewProps) => {
  if (interviews.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No interviews available</p>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <article
          key={interview.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
          aria-label={`Interview: ${interview.title} on ${interview.podcastName}`}
          role="article"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{interview.title}</h3>
              <p className="text-gray-600">
                {interview.podcastName} ·{' '}
                <span data-testid="interview-date">
                  {format(new Date(interview.date), 'MMM d, yyyy')}
                </span>
              </p>
            </div>
            <a
              href={interview.episodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              aria-label={`Listen to ${interview.title}`}
            >
              Listen
            </a>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{interview.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="w-4 h-4" />
              <span>
                <span data-testid="listener-count">
                  {interview.listenerCount.toLocaleString()}
                </span>
                {' listeners'}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default InterviewsPreview;
