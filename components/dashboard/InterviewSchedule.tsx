import { useEffect, useState } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

interface Props {
  view?: 'calendar' | 'list';
  filter?: 'all' | 'upcoming' | 'completed' | 'cancelled';
}

type InterviewStatus = Database['public']['Enums']['interview_status'];

// Change from interface extends to type intersection
export type InterviewWithPodcast =
  Database['public']['Tables']['interviews']['Row'] & {
    podcast_name?: string;
  };

/**
 * Interview Schedule Component
 * Displays and manages podcast interview schedules
 */
export function InterviewSchedule({
  view = 'list',
  filter = 'upcoming'
}: Props) {
  const { state, fetchInterviews, updateInterview, scheduleInterview } =
    useDashboard();
  const { data, loading, error } = state.interviews;
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = data.filter((interview) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming')
      return ['scheduled', 'pending'].includes(interview.status);
    return interview.status === filter;
  });

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <InterviewFilters
            currentFilter={filter}
            currentView={view}
            interviewCount={filteredInterviews.length}
          />
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Schedule Interview
          </button>
        </div>

        {showScheduleForm && (
          <ScheduleForm
            onSchedule={scheduleInterview}
            onClose={() => setShowScheduleForm(false)}
          />
        )}

        {view === 'calendar' ? (
          <InterviewCalendar
            interviews={filteredInterviews}
            onUpdateInterview={updateInterview}
          />
        ) : (
          <InterviewList
            interviews={filteredInterviews}
            onUpdateInterview={updateInterview}
          />
        )}
      </div>
    </DashboardLoadingState>
  );
}

interface InterviewFiltersProps {
  currentFilter: string;
  currentView: string;
  interviewCount: number;
}

function InterviewFilters({
  currentFilter,
  currentView,
  interviewCount
}: InterviewFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        <select
          className="px-3 py-1 rounded border border-gray-200"
          value={currentFilter}
        >
          <option value="all">All Interviews</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="px-3 py-1 rounded border border-gray-200"
          value={currentView}
        >
          <option value="list">List View</option>
          <option value="calendar">Calendar View</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">
        {interviewCount} interview{interviewCount !== 1 ? 's' : ''} scheduled
      </p>
    </div>
  );
}

interface InterviewListProps {
  interviews: InterviewWithPodcast[]; // Update type here
  onUpdateInterview: (
    id: string,
    data: Partial<Database['public']['Tables']['interviews']['Update']>
  ) => Promise<void>;
}

function InterviewList({ interviews, onUpdateInterview }: InterviewListProps) {
  if (interviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No interviews scheduled
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {interviews.map((interview) => (
        <InterviewItem
          key={interview.id}
          interview={interview}
          onUpdate={onUpdateInterview}
        />
      ))}
    </ul>
  );
}

interface InterviewItemProps {
  interview: InterviewWithPodcast; // Update type here
  onUpdate: (
    id: string,
    data: Partial<Database['public']['Tables']['interviews']['Update']>
  ) => Promise<void>;
}

function InterviewItem({ interview, onUpdate }: InterviewItemProps) {
  const handleStatusChange = async (status: InterviewStatus) => {
    await onUpdate(interview.id, { status });
  };

  return (
    <li className="py-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {interview.podcast_name ?? `Podcast #${interview.podcast_id}`}
            </h3>
            <select
              value={interview.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as InterviewStatus)
              }
              className="px-2 py-1 text-sm rounded border border-gray-200"
            >
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            <time>
              {formatDateTime(
                interview.scheduled_date,
                interview.scheduled_time
              )}
            </time>
            <span className="mx-2">•</span>
            <span>{interview.duration} minutes</span>
            {interview.meeting_link && (
              <>
                <span className="mx-2">•</span>
                <a
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Join Meeting
                </a>
              </>
            )}
          </div>
          {interview.notes && (
            <p className="mt-2 text-sm text-gray-500">{interview.notes}</p>
          )}
        </div>
      </div>
    </li>
  );
}

interface ScheduleFormProps {
  onSchedule: (
    data: Database['public']['Tables']['interviews']['Insert']
  ) => Promise<void>;
  onClose: () => void;
}

function ScheduleForm({ onSchedule, onClose }: ScheduleFormProps) {
  const { state } = useDashboard();
  const authorId = state.stats.data?.author_id ?? '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await onSchedule({
      author_id: authorId,
      podcast_id: formData.get('podcast_id') as string,
      scheduled_date: formData.get('date') as string,
      scheduled_time: formData.get('time') as string,
      duration: Number(formData.get('duration')),
      status: 'scheduled',
      notes: formData.get('notes') as string,
      meeting_link: formData.get('meeting_link') as string
    });

    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-gray-50 rounded-lg"
    >
      <h3 className="text-lg font-medium">Schedule New Interview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Podcast
          </label>
          <select
            name="podcast_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Select a podcast</option>
            {/* Populate with available podcasts */}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            name="duration"
            min="15"
            step="15"
            defaultValue="60"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            name="date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            type="time"
            name="time"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Meeting Link
        </label>
        <input
          type="url"
          name="meeting_link"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="https://meet.example.com/..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Any additional notes..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Schedule
        </button>
      </div>
    </form>
  );
}

// Calendar view component (simplified version)
interface InterviewCalendarProps {
  interviews: Database['public']['Tables']['interviews']['Row'][];
  onUpdateInterview: (
    id: string,
    data: Partial<Database['public']['Tables']['interviews']['Update']>
  ) => Promise<void>;
}

function InterviewCalendar({
  interviews,
  onUpdateInterview
}: InterviewCalendarProps) {
  // Group interviews by date
  const groupedInterviews = interviews.reduce(
    (acc, interview) => {
      const date = interview.scheduled_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(interview);
      return acc;
    },
    {} as Record<string, typeof interviews>
  );

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Calendar implementation */}
      <div className="col-span-7 text-center py-8 text-gray-500">
        Calendar view coming soon...
      </div>
    </div>
  );
}

// Helper function
function formatDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
