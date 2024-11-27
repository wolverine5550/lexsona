import type { Database } from '@/types/database';

// State types
export interface DashboardState {
  // Stats
  stats: {
    data: Database['public']['Views']['author_stats']['Row'] | null;
    loading: boolean;
    error: string | null;
  };

  // Matches
  matches: {
    data: Database['public']['Tables']['matches']['Row'][];
    loading: boolean;
    error: string | null;
  };

  // Interviews
  interviews: {
    data: Database['public']['Tables']['interviews']['Row'][];
    loading: boolean;
    error: string | null;
  };

  // Notifications
  notifications: {
    data: Database['public']['Tables']['notifications']['Row'][];
    unreadCount: number;
    loading: boolean;
    error: string | null;
  };

  // Activities
  activities: {
    data: Database['public']['Tables']['activities']['Row'][];
    groupedData: {
      date: string;
      activities: Database['public']['Tables']['activities']['Row'][];
    }[];
    loading: boolean;
    error: string | null;
  };
}

// Action types
export type DashboardAction =
  // Stats actions
  | { type: 'FETCH_STATS_START' }
  | { type: 'FETCH_STATS_SUCCESS'; payload: DashboardState['stats']['data'] }
  | { type: 'FETCH_STATS_ERROR'; payload: string }

  // Match actions
  | { type: 'FETCH_MATCHES_START' }
  | {
      type: 'FETCH_MATCHES_SUCCESS';
      payload: DashboardState['matches']['data'];
    }
  | { type: 'FETCH_MATCHES_ERROR'; payload: string }
  | {
      type: 'UPDATE_MATCH_STATUS';
      payload: {
        id: string;
        status: Database['public']['Enums']['match_status'];
      };
    }

  // Interview actions
  | { type: 'FETCH_INTERVIEWS_START' }
  | {
      type: 'FETCH_INTERVIEWS_SUCCESS';
      payload: DashboardState['interviews']['data'];
    }
  | { type: 'FETCH_INTERVIEWS_ERROR'; payload: string }
  | {
      type: 'SCHEDULE_INTERVIEW';
      payload: DashboardState['interviews']['data'][0];
    }
  | {
      type: 'UPDATE_INTERVIEW';
      payload: {
        id: string;
        data: Partial<DashboardState['interviews']['data'][0]>;
      };
    }

  // Notification actions
  | { type: 'FETCH_NOTIFICATIONS_START' }
  | {
      type: 'FETCH_NOTIFICATIONS_SUCCESS';
      payload: DashboardState['notifications']['data'];
    }
  | { type: 'FETCH_NOTIFICATIONS_ERROR'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | {
      type: 'NEW_NOTIFICATION';
      payload: DashboardState['notifications']['data'][0];
    }

  // Activity actions
  | { type: 'FETCH_ACTIVITIES_START' }
  | {
      type: 'FETCH_ACTIVITIES_SUCCESS';
      payload: DashboardState['activities']['data'];
    }
  | { type: 'FETCH_ACTIVITIES_ERROR'; payload: string }
  | {
      type: 'FETCH_GROUPED_ACTIVITIES_SUCCESS';
      payload: DashboardState['activities']['groupedData'];
    };

// Initial state
export const initialState: DashboardState = {
  stats: {
    data: null,
    loading: false,
    error: null
  },
  matches: {
    data: [],
    loading: false,
    error: null
  },
  interviews: {
    data: [],
    loading: false,
    error: null
  },
  notifications: {
    data: [],
    unreadCount: 0,
    loading: false,
    error: null
  },
  activities: {
    data: [],
    groupedData: [],
    loading: false,
    error: null
  }
};
