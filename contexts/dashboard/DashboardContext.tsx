import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode
} from 'react';
import { dashboardService } from '@/services/dashboard/base';
import { dashboardReducer } from './dashboardReducer';
import { initialState, type DashboardState } from './dashboardTypes';
import type { Database } from '@/types/database';
import type { MatchWithPodcast } from '@/components/dashboard/MatchList';

// Context type with state and actions
export interface DashboardContextType {
  dispatch: (action: any) => void;
  state: {
    matches: { data: any[]; loading: boolean; error: string | null };
    notifications: { data: any[]; loading: boolean; error: string | null };
    interviews: { data: any[]; loading: boolean; error: string | null };
    activities: { data: any[]; loading: boolean; error: string | null };
    stats: { data: any; loading: boolean; error: string | null };
  };
  actions: {
    fetchMatches: () => Promise<void>;
    fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
    fetchInterviews: () => Promise<void>;
    fetchActivities: () => Promise<void>;
    fetchStats: () => Promise<void>;
    updateMatchStatus: (
      id: string,
      status: Database['public']['Enums']['match_status']
    ) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    updateInterview: (
      id: string,
      data: Partial<Database['public']['Tables']['interviews']['Update']>
    ) => Promise<void>;
  };
}

// Create context
export const DashboardContext = createContext<DashboardContextType | null>(
  null
);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Stats actions
  const fetchStats = useCallback(async () => {
    dispatch({ type: 'FETCH_STATS_START' });
    const result = await dashboardService.getStats(
      state.stats.data?.author_id ?? ''
    );

    if (result.error) {
      dispatch({ type: 'FETCH_STATS_ERROR', payload: result.error.message });
    } else {
      dispatch({ type: 'FETCH_STATS_SUCCESS', payload: result.data });
    }
  }, [state.stats.data?.author_id]);

  // Match actions
  const fetchMatches = useCallback(async () => {
    dispatch({ type: 'FETCH_MATCHES_START' });
    const result = await dashboardService.matches.getRecentMatches(
      state.stats.data?.author_id ?? ''
    );

    if (result.error) {
      dispatch({ type: 'FETCH_MATCHES_ERROR', payload: result.error.message });
    } else {
      dispatch({
        type: 'FETCH_MATCHES_SUCCESS',
        payload: result.data ?? []
      });
    }
  }, [state.stats.data?.author_id]);

  const updateMatchStatus = useCallback(
    async (id: string, status: Database['public']['Enums']['match_status']) => {
      const result = await dashboardService.matches.updateMatchStatus(
        id,
        status
      );
      if (!result.error) {
        dispatch({ type: 'UPDATE_MATCH_STATUS', payload: { id, status } });
      }
    },
    []
  );

  // Interview actions
  const fetchInterviews = useCallback(async () => {
    dispatch({ type: 'FETCH_INTERVIEWS_START' });
    const result = await dashboardService.interviews.getUpcomingInterviews(
      state.stats.data?.author_id ?? ''
    );

    if (result.error) {
      dispatch({
        type: 'FETCH_INTERVIEWS_ERROR',
        payload: result.error.message
      });
    } else {
      dispatch({
        type: 'FETCH_INTERVIEWS_SUCCESS',
        payload: result.data ?? []
      });
    }
  }, [state.stats.data?.author_id]);

  const scheduleInterview = useCallback(
    async (data: Database['public']['Tables']['interviews']['Insert']) => {
      const result = await dashboardService.interviews.scheduleInterview({
        ...data,
        author_id: state.stats.data?.author_id ?? ''
      });

      if (result.error) {
        // Handle error (could add error state to context if needed)
        console.error('Failed to schedule interview:', result.error);
      } else if (result.data) {
        dispatch({
          type: 'SCHEDULE_INTERVIEW',
          payload: result.data
        });
      }
    },
    [state.stats.data?.author_id]
  );

  const updateInterview = useCallback(
    async (
      id: string,
      data: Partial<Database['public']['Tables']['interviews']['Update']>
    ) => {
      const result = await dashboardService.interviews.updateInterview(id, {
        ...data,
        author_id: state.stats.data?.author_id
      });

      if (!result.error) {
        dispatch({
          type: 'UPDATE_INTERVIEW',
          payload: { id, data }
        });
      }
    },
    [state.stats.data?.author_id]
  );

  // Notification actions
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      dispatch({ type: 'FETCH_NOTIFICATIONS_START' });
      const result = await dashboardService.notifications.getNotifications(
        state.stats.data?.author_id ?? '',
        unreadOnly
      );

      if (result.error) {
        dispatch({
          type: 'FETCH_NOTIFICATIONS_ERROR',
          payload: result.error.message
        });
      } else {
        dispatch({
          type: 'FETCH_NOTIFICATIONS_SUCCESS',
          payload: result.data ?? []
        });
      }
    },
    [state.stats.data?.author_id]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const result = await dashboardService.notifications.markAsRead(id);

      if (!result.error) {
        dispatch({
          type: 'MARK_NOTIFICATION_READ',
          payload: id
        });

        // Update pending requests count in stats
        if (state.stats.data) {
          dispatch({
            type: 'FETCH_STATS_SUCCESS',
            payload: {
              ...state.stats.data,
              pending_requests: Math.max(
                0,
                state.stats.data.pending_requests - 1
              )
            }
          });
        }
      }
    },
    [state.stats.data]
  );

  // Activity actions
  const fetchActivities = useCallback(
    async (limit = 20) => {
      dispatch({ type: 'FETCH_ACTIVITIES_START' });
      const result = await dashboardService.activities.getRecentActivities(
        state.stats.data?.author_id ?? '',
        limit
      );

      if (result.error) {
        dispatch({
          type: 'FETCH_ACTIVITIES_ERROR',
          payload: result.error.message
        });
      } else {
        dispatch({
          type: 'FETCH_ACTIVITIES_SUCCESS',
          payload: result.data ?? []
        });
      }
    },
    [state.stats.data?.author_id]
  );

  const fetchGroupedActivities = useCallback(
    async (days = 7) => {
      dispatch({ type: 'FETCH_ACTIVITIES_START' });
      const result = await dashboardService.activities.getGroupedActivities(
        state.stats.data?.author_id ?? '',
        days
      );

      if (result.error) {
        dispatch({
          type: 'FETCH_ACTIVITIES_ERROR',
          payload: result.error.message
        });
      } else {
        dispatch({
          type: 'FETCH_GROUPED_ACTIVITIES_SUCCESS',
          payload: result.data ?? []
        });
      }
    },
    [state.stats.data?.author_id]
  );

  // Set up real-time subscriptions
  useEffect(() => {
    if (!state.stats.data?.author_id) return;

    // Subscribe to notifications
    const unsubscribeNotifications =
      dashboardService.notifications.subscribeToNotifications(
        state.stats.data.author_id,
        (
          notification: Database['public']['Tables']['notifications']['Row']
        ) => {
          dispatch({ type: 'NEW_NOTIFICATION', payload: notification });
        }
      );

    return () => {
      unsubscribeNotifications();
    };
  }, [state.stats.data?.author_id]);

  return (
    <DashboardContext.Provider
      value={{
        dispatch,
        state: {
          matches: {
            data: state.matches.data,
            loading: state.matches.loading,
            error: state.matches.error
          },
          notifications: {
            data: state.notifications.data,
            loading: state.notifications.loading,
            error: state.notifications.error
          },
          interviews: {
            data: state.interviews.data,
            loading: state.interviews.loading,
            error: state.interviews.error
          },
          activities: {
            data: state.activities.data,
            loading: state.activities.loading,
            error: state.activities.error
          },
          stats: {
            data: state.stats.data,
            loading: state.stats.loading,
            error: state.stats.error
          }
        },
        actions: {
          fetchMatches,
          fetchNotifications,
          fetchInterviews,
          fetchActivities,
          fetchStats,
          updateMatchStatus,
          markNotificationRead,
          updateInterview
        }
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook for using the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
