import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ban,
  ChevronRight,
  Headphones,
  Filter
} from 'lucide-react';
import { PodcastMatchWithDetails, MatchOutcome } from '@/types/podcast';

interface MatchHistoryProps {
  matches: PodcastMatchWithDetails[];
  onSelectMatch: (match: PodcastMatchWithDetails) => void;
}

/**
 * Maps match outcomes to their display properties
 */
const OUTCOME_DISPLAY = {
  PENDING: {
    icon: Clock,
    label: 'Pending Response',
    className: 'bg-yellow-50 text-yellow-700'
  },
  ACCEPTED: {
    icon: CheckCircle,
    label: 'Accepted',
    className: 'bg-green-50 text-green-700'
  },
  DECLINED: {
    icon: XCircle,
    label: 'Declined',
    className: 'bg-red-50 text-red-700'
  },
  NO_RESPONSE: {
    icon: AlertCircle,
    label: 'No Response',
    className: 'bg-gray-50 text-gray-700'
  },
  CANCELLED: {
    icon: Ban,
    label: 'Cancelled',
    className: 'bg-orange-50 text-orange-700'
  },
  COMPLETED: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'bg-blue-50 text-blue-700'
  }
};

/**
 * Displays a historical list of podcast matches and their outcomes
 * Includes filtering and sorting capabilities
 */
const MatchHistory = ({ matches, onSelectMatch }: MatchHistoryProps) => {
  // Filter and sort state
  const [outcomeFilter, setOutcomeFilter] = useState<MatchOutcome | 'ALL'>(
    'ALL'
  );
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filters and sorts matches based on current criteria
   */
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Apply outcome filter
    if (outcomeFilter !== 'ALL') {
      result = result.filter((match) => match.outcome === outcomeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (match) =>
          match.podcast.name.toLowerCase().includes(query) ||
          match.podcast.hostName.toLowerCase().includes(query) ||
          match.podcast.category.some((cat) =>
            cat.toLowerCase().includes(query)
          )
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.initialContactDate).getTime() -
          new Date(a.initialContactDate).getTime()
        );
      }
      return b.matchConfidence - a.matchConfidence;
    });

    return result;
  }, [matches, outcomeFilter, sortBy, searchQuery]);

  /**
   * Renders the outcome badge with appropriate icon and styling
   */
  const renderOutcomeBadge = (outcome: MatchOutcome) => {
    const { icon: Icon, label, className } = OUTCOME_DISPLAY[outcome];
    return (
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex gap-4">
          <select
            value={outcomeFilter}
            onChange={(e) =>
              setOutcomeFilter(e.target.value as MatchOutcome | 'ALL')
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Outcomes</option>
            {Object.keys(OUTCOME_DISPLAY).map((outcome) => (
              <option key={outcome} value={outcome}>
                {OUTCOME_DISPLAY[outcome as MatchOutcome].label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'confidence')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="date">Sort by Date</option>
            <option value="confidence">Sort by Match Confidence</option>
          </select>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search podcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-4 py-2"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              {/* Podcast Image */}
              <Image
                src={match.podcast.coverImage}
                alt={match.podcast.name}
                width={80}
                height={80}
                className="rounded-md"
              />

              {/* Match Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {match.podcast.name}
                    </h3>
                    <p className="text-gray-600">
                      Hosted by {match.podcast.hostName}
                    </p>
                  </div>
                  {renderOutcomeBadge(match.outcome)}
                </div>

                {/* Match Metadata */}
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(
                        new Date(match.initialContactDate),
                        'MMM d, yyyy'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{match.followUpCount} follow-ups sent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Headphones className="w-4 h-4" />
                    <span>
                      {match.podcast.averageListeners.toLocaleString()} avg.
                      listeners
                    </span>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="flex gap-2 mt-2">
                  {match.matchReasons.map((reason, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchHistory;
