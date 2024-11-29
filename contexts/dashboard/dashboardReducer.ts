import type { DashboardState, DashboardAction } from './dashboardTypes';
import type { Database } from '@/types/database';

/**
 * Dashboard state reducer
 * Handles all state updates for the dashboard features
 *
 * @param state - Current dashboard state
 * @param action - Action to perform
 * @returns Updated dashboard state
 */
export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    // Stats reducers
    case 'FETCH_STATS_START':
      return {
        ...state,
        stats: {
          ...state.stats,
          loading: true,
          error: null
        }
      };

    case 'FETCH_STATS_SUCCESS':
      return {
        ...state,
        stats: {
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_STATS_ERROR':
      return {
        ...state,
        stats: {
          ...state.stats,
          loading: false,
          error: action.payload
        }
      };

    // Matches reducers
    case 'FETCH_MATCHES_START':
      return {
        ...state,
        matches: {
          ...state.matches,
          loading: true,
          error: null
        }
      };

    case 'FETCH_MATCHES_SUCCESS':
      return {
        ...state,
        matches: {
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_MATCHES_ERROR':
      return {
        ...state,
        matches: {
          ...state.matches,
          loading: false,
          error: action.payload
        }
      };

    case 'UPDATE_MATCH_STATUS':
      return {
        ...state,
        matches: {
          ...state.matches,
          data: state.matches.data.map((match) =>
            match.id === action.payload.id
              ? {
                  ...match,
                  status: action.payload
                    .status as Database['public']['Enums']['match_status']
                }
              : match
          )
        }
      };

    // Interview reducers
    case 'FETCH_INTERVIEWS_START':
      return {
        ...state,
        interviews: {
          ...state.interviews,
          loading: true,
          error: null
        }
      };

    case 'FETCH_INTERVIEWS_SUCCESS':
      return {
        ...state,
        interviews: {
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_INTERVIEWS_ERROR':
      return {
        ...state,
        interviews: {
          ...state.interviews,
          loading: false,
          error: action.payload
        }
      };

    case 'SCHEDULE_INTERVIEW':
      return {
        ...state,
        interviews: {
          ...state.interviews,
          data: [...state.interviews.data, action.payload]
        }
      };

    case 'UPDATE_INTERVIEW':
      return {
        ...state,
        interviews: {
          ...state.interviews,
          data: state.interviews.data.map((interview) =>
            interview.id === action.payload.id
              ? { ...interview, ...action.payload.data }
              : interview
          )
        }
      };

    // Notification reducers
    case 'FETCH_NOTIFICATIONS_START':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          loading: true,
          error: null
        }
      };

    case 'FETCH_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: {
          data: action.payload,
          unreadCount: action.payload.filter((n) => !n.read).length,
          loading: false,
          error: null
        }
      };

    case 'FETCH_NOTIFICATIONS_ERROR':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          loading: false,
          error: action.payload
        }
      };

    case 'MARK_NOTIFICATION_READ': {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.data.findIndex(
        (n) => n.id === notificationId
      );

      // If notification not found, return state unchanged
      if (notificationIndex === -1) {
        return state;
      }

      const updatedNotifications = [...state.notifications.data];
      updatedNotifications[notificationIndex] = {
        ...updatedNotifications[notificationIndex],
        read: true
      };

      // Calculate new unread count
      const unreadCount = updatedNotifications.filter((n) => !n.read).length;

      return {
        ...state,
        notifications: {
          ...state.notifications,
          data: updatedNotifications,
          unreadCount
        }
      };
    }

    case 'NEW_NOTIFICATION':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          data: [action.payload, ...state.notifications.data],
          unreadCount: state.notifications.unreadCount + 1
        }
      };

    // Activity reducers
    case 'FETCH_ACTIVITIES_START':
      return {
        ...state,
        activities: {
          ...state.activities,
          loading: true,
          error: null
        }
      };

    case 'FETCH_ACTIVITIES_SUCCESS':
      return {
        ...state,
        activities: {
          ...state.activities,
          data: action.payload,
          loading: false,
          error: null
        }
      };

    case 'FETCH_ACTIVITIES_ERROR':
      return {
        ...state,
        activities: {
          ...state.activities,
          loading: false,
          error: action.payload
        }
      };

    case 'FETCH_GROUPED_ACTIVITIES_SUCCESS':
      return {
        ...state,
        activities: {
          ...state.activities,
          groupedData: action.payload,
          loading: false,
          error: null
        }
      };

    default:
      return state;
  }
}
