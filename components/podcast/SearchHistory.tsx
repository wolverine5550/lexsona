'use client';

import { useSearchHistory } from '@/hooks/useSearchHistory';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Search, Trash2 } from 'lucide-react';

interface SearchHistoryProps {
  onSearchSelect: (query: string, filters: any) => void;
  className?: string;
}

/**
 * Component to display and manage search history
 * Shows recent searches and allows rerunning them
 */
export default function SearchHistory({
  onSearchSelect,
  className = ''
}: SearchHistoryProps) {
  const { searchHistory, isLoading, clearHistory } = useSearchHistory();

  /**
   * Format the timestamp into a relative time string
   */
  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!searchHistory.length) {
    return (
      <div className="text-center text-sm text-zinc-500">
        No recent searches
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Recent Searches</h3>
        <button
          onClick={clearHistory}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2">
        {searchHistory.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-700"
          >
            <div className="flex-1">
              {/* Search Query */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-white">{entry.query}</span>
              </div>

              {/* Search Details */}
              <div className="mt-1 flex items-center space-x-4 text-xs text-zinc-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(entry.created_at)}</span>
                </div>
                <span>•</span>
                <span>{entry.results_count} results</span>
                {entry.filters && Object.keys(entry.filters).length > 0 && (
                  <>
                    <span>•</span>
                    <span>{Object.keys(entry.filters).length} filters</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ml-4 flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onSearchSelect(entry.query, entry.filters)}
                className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Search Again
              </button>
              <button
                onClick={() => clearHistory()}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
