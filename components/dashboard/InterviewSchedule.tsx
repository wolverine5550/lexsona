import { useEffect } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

type InterviewFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';
type ViewMode = 'list' | 'calendar';

interface InterviewScheduleProps {
  filter?: InterviewFilter;
  view?: ViewMode;
}

export function InterviewSchedule({
  filter = 'all',
  view = 'list'
}: InterviewScheduleProps) {
  const { state, actions } = useDashboard();
  const { data, loading, error } = state.interviews;

  useEffect(() => {
    actions.fetchInterviews();
  }, [actions]);

  const filteredInterviews = data.filter((interview) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming')
      return interview.status === 'scheduled' || interview.status === 'pending';
    return interview.status === filter;
  });

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <select className="px-3 py-1 rounded border border-gray-200">
              <option value="all">All Interviews</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="px-3 py-1 rounded border border-gray-200">
              <option value="list">List View</option>
              <option value="calendar">Calendar View</option>
            </select>
          </div>
          <p className="text-sm text-gray-500">
            {filteredInterviews.length} interview
            {filteredInterviews.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {filteredInterviews.length > 0 ? (
          <ul className="space-y-4">
            {filteredInterviews.map((interview) => (
              <li
                key={interview.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {interview.podcast_name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(
                      interview.scheduled_date,
                      interview.scheduled_time
                    )}
                  </span>
                </div>
                {interview.notes && (
                  <p className="text-sm text-gray-500 mb-2">
                    {interview.notes}
                  </p>
                )}
                {interview.meeting_link && (
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Join Meeting
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No interviews scheduled
          </div>
        )}
      </div>
    </DashboardLoadingState>
  );
}

function formatDateTime(date: string, time: string): string {
  const dateObj = new Date(`${date}T${time}`);
  return dateObj.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
