'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

interface Props {
  limit?: number;
}

type MatchWithPodcast = Database['public']['Tables']['matches']['Row'] & {
  podcast_name?: string;
  category?: string;
  listeners?: number;
  frequency?: string;
};

/**
 * Match List Component
 * Displays podcast matches in a scrollable list with match percentage
 */
export function MatchList({ limit = 5 }: Props) {
  const { state, actions } = useDashboard();
  const { data, loading, error } = state.matches;
  const [sortedMatches, setSortedMatches] = useState(data);

  useEffect(() => {
    actions.fetchMatches();
  }, [actions]);

  useEffect(() => {
    // Sort by match score and apply limit
    const filtered = [...data].sort((a, b) => b.match_score - a.match_score);
    setSortedMatches(filtered.slice(0, limit));
  }, [data, limit]);

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white mb-8">Recent Matches</h1>

        {sortedMatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-400">No matches found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {match.podcast_name || 'Podcast Name'}
                    </h2>
                    <p className="text-zinc-400 mt-1">
                      {match.category || 'Literature & Writing'}
                    </p>

                    <p className="mt-4 text-zinc-300">
                      {match.description ||
                        'A weekly podcast featuring in-depth interviews with authors about their latest books and writing process.'}
                    </p>

                    <div className="mt-4 flex items-center gap-6 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>{match.listeners || '50K'} listeners</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{match.frequency || 'Weekly'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      {Math.round(match.match_score * 100)}% Match
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {}}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Send Pitch
                  </button>
                  <button
                    onClick={() => {}}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedMatches.length >= limit && (
          <div className="text-center mt-8">
            <button
              onClick={() => {}}
              className="text-blue-500 hover:text-blue-400 text-sm font-medium"
            >
              Upgrade to see more matches →
            </button>
          </div>
        )}
      </div>
    </DashboardLoadingState>
  );
}
