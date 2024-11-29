'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

interface Props {
  limit?: number;
  filter?: 'all' | 'new' | 'contacted' | 'declined';
  sortBy?: 'score' | 'date';
}

type MatchStatus = Database['public']['Enums']['match_status'];

// Change from interface extends to type intersection
export type MatchWithPodcast =
  Database['public']['Tables']['matches']['Row'] & {
    podcast_name?: string;
  };

/**
 * Match List Component
 * Displays podcast matches with filtering and sorting options
 */
export function MatchList({
  limit = 10,
  filter = 'all',
  sortBy = 'score'
}: Props) {
  const { state, actions } = useDashboard();
  const { data, loading, error } = state.matches;
  const [sortedMatches, setSortedMatches] = useState(data);

  useEffect(() => {
    actions.fetchMatches();
  }, [actions]);

  useEffect(() => {
    let filtered = [...data];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter((match) => match.status === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return b.match_score - a.match_score;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    // Apply limit
    setSortedMatches(filtered.slice(0, limit));
  }, [data, filter, sortBy, limit]);

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        <MatchFilters
          currentFilter={filter}
          currentSort={sortBy}
          matchCount={data.length}
          onFilterChange={(filter) => {}}
          onSortChange={(sort) => {}}
        />
        <MatchGrid
          matches={sortedMatches}
          onUpdateStatus={actions.updateMatchStatus}
        />
      </div>
    </DashboardLoadingState>
  );
}

interface MatchFiltersProps {
  currentFilter: string;
  currentSort: string;
  matchCount: number;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}

function MatchFilters({
  currentFilter,
  currentSort,
  matchCount,
  onFilterChange,
  onSortChange
}: MatchFiltersProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <select
          className="px-3 py-1 rounded border border-gray-200"
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="all">All Matches</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="declined">Declined</option>
        </select>
        <select
          className="px-3 py-1 rounded border border-gray-200"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="score">Match Score</option>
          <option value="date">Date Added</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">
        {matchCount} match{matchCount !== 1 ? 'es' : ''} found
      </p>
    </div>
  );
}

interface MatchGridProps {
  matches: MatchWithPodcast[]; // Update type here
  onUpdateStatus: (id: string, status: MatchStatus) => Promise<void>;
}

function MatchGrid({ matches, onUpdateStatus }: MatchGridProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No matches found</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
}

interface MatchCardProps {
  match: MatchWithPodcast; // Update type here
  onUpdateStatus: (id: string, status: MatchStatus) => Promise<void>;
}

function MatchCard({ match, onUpdateStatus }: MatchCardProps) {
  const handleStatusChange = async (status: MatchStatus) => {
    await onUpdateStatus(match.id, status);
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">
          {match.podcast_name ?? `Podcast #${match.podcast_id}`}
        </h3>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {Math.round(match.match_score * 100)}% Match
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {match.match_reason?.join(', ') || 'No match reason provided'}
      </p>
      <div className="flex justify-between items-center">
        <select
          aria-label="Match status"
          className="px-2 py-1 text-sm rounded border border-gray-200"
          value={match.status}
          onChange={(e) => handleStatusChange(e.target.value as MatchStatus)}
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="declined">Declined</option>
        </select>
        <time className="text-xs text-gray-400">
          {formatDate(match.created_at)}
        </time>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
