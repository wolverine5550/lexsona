import { Headphones, Clock } from 'lucide-react';
import { AuthorInterview } from '@/types/author';

interface InterviewsPreviewProps {
  interviews: AuthorInterview[];
}

const InterviewsPreview = ({ interviews }: InterviewsPreviewProps) => {
  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <div
          key={interview.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{interview.title}</h3>
              <p className="text-gray-600">
                {interview.podcastName} ·{' '}
                {new Date(interview.date).toLocaleDateString()}
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
              <span>{interview.listenerCount.toLocaleString()} listeners</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterviewsPreview;
