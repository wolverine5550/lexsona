import { describe, it, expect } from 'vitest';
import { dashboardReducer } from '@/contexts/dashboard/dashboardReducer';
import { initialState } from '@/contexts/dashboard/dashboardTypes';
import type { Database } from '@/types/database';

describe('dashboardReducer', () => {
  // Stats reducer tests
  describe('stats actions', () => {
    it('should handle FETCH_STATS_START', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_STATS_START'
      });

      expect(nextState.stats.loading).toBe(true);
      expect(nextState.stats.error).toBeNull();
      // Should not modify other state
      expect(nextState.matches).toEqual(initialState.matches);
    });

    it('should handle FETCH_STATS_SUCCESS', () => {
      const mockStats = {
        author_id: 'test-author',
        total_matches: 5,
        pending_requests: 2,
        upcoming_interviews: 1,
        profile_views: 10,
        updated_at: new Date().toISOString()
      };

      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_STATS_SUCCESS',
        payload: mockStats
      });

      expect(nextState.stats.loading).toBe(false);
      expect(nextState.stats.error).toBeNull();
      expect(nextState.stats.data).toEqual(mockStats);
    });

    it('should handle FETCH_STATS_ERROR', () => {
      const error = 'Failed to fetch stats';
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_STATS_ERROR',
        payload: error
      });

      expect(nextState.stats.loading).toBe(false);
      expect(nextState.stats.error).toBe(error);
      expect(nextState.stats.data).toBeNull();
    });
  });

  // Matches reducer tests
  describe('matches actions', () => {
    const mockMatch = {
      id: 'match-1',
      author_id: 'author-1',
      podcast_id: 'pod-1',
      match_score: 0.9,
      match_reason: ['topic match'],
      status: 'new' as Database['public']['Enums']['match_status'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    it('should handle FETCH_MATCHES_START', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_MATCHES_START'
      });

      expect(nextState.matches.loading).toBe(true);
      expect(nextState.matches.error).toBeNull();
    });

    it('should handle FETCH_MATCHES_SUCCESS', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_MATCHES_SUCCESS',
        payload: [mockMatch]
      });

      expect(nextState.matches.loading).toBe(false);
      expect(nextState.matches.error).toBeNull();
      expect(nextState.matches.data).toEqual([mockMatch]);
    });

    it('should handle UPDATE_MATCH_STATUS', () => {
      // First add a match to the state
      const stateWithMatch = dashboardReducer(initialState, {
        type: 'FETCH_MATCHES_SUCCESS',
        payload: [mockMatch]
      });

      // Then update its status
      const nextState = dashboardReducer(stateWithMatch, {
        type: 'UPDATE_MATCH_STATUS',
        payload: {
          id: mockMatch.id,
          status: 'viewed' as Database['public']['Enums']['match_status']
        }
      });

      expect(nextState.matches.data[0].status).toBe('viewed');
      // Other match properties should remain unchanged
      expect(nextState.matches.data[0].match_score).toBe(mockMatch.match_score);
    });
  });

  // Interview reducer tests
  describe('interview actions', () => {
    const mockInterview = {
      id: 'interview-1',
      author_id: 'author-1',
      podcast_id: 'pod-1',
      scheduled_date: '2024-01-01',
      scheduled_time: '10:00:00',
      duration: 60,
      status: 'scheduled' as Database['public']['Enums']['interview_status'],
      notes: 'Test notes',
      meeting_link: 'https://meet.test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    it('should handle FETCH_INTERVIEWS_START', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_INTERVIEWS_START'
      });

      expect(nextState.interviews.loading).toBe(true);
      expect(nextState.interviews.error).toBeNull();
      // Should not affect other state slices
      expect(nextState.matches).toEqual(initialState.matches);
    });

    it('should handle FETCH_INTERVIEWS_SUCCESS', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_INTERVIEWS_SUCCESS',
        payload: [mockInterview]
      });

      expect(nextState.interviews.loading).toBe(false);
      expect(nextState.interviews.error).toBeNull();
      expect(nextState.interviews.data).toEqual([mockInterview]);
    });

    it('should handle FETCH_INTERVIEWS_ERROR', () => {
      const error = 'Failed to fetch interviews';
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_INTERVIEWS_ERROR',
        payload: error
      });

      expect(nextState.interviews.loading).toBe(false);
      expect(nextState.interviews.error).toBe(error);
      expect(nextState.interviews.data).toEqual([]);
    });

    it('should handle SCHEDULE_INTERVIEW', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'SCHEDULE_INTERVIEW',
        payload: mockInterview
      });

      expect(nextState.interviews.data).toHaveLength(1);
      expect(nextState.interviews.data[0]).toEqual(mockInterview);
      // Should not affect loading or error states
      expect(nextState.interviews.loading).toBe(false);
      expect(nextState.interviews.error).toBeNull();
    });

    it('should handle UPDATE_INTERVIEW', () => {
      // First add an interview to the state
      const stateWithInterview = dashboardReducer(initialState, {
        type: 'FETCH_INTERVIEWS_SUCCESS',
        payload: [mockInterview]
      });

      // Then update it
      const updates = {
        status: 'completed' as Database['public']['Enums']['interview_status'],
        notes: 'Updated notes'
      };

      const nextState = dashboardReducer(stateWithInterview, {
        type: 'UPDATE_INTERVIEW',
        payload: {
          id: mockInterview.id,
          data: updates
        }
      });

      expect(nextState.interviews.data[0].status).toBe('completed');
      expect(nextState.interviews.data[0].notes).toBe('Updated notes');
      // Other properties should remain unchanged
      expect(nextState.interviews.data[0].scheduled_date).toBe(
        mockInterview.scheduled_date
      );
      expect(nextState.interviews.data[0].duration).toBe(
        mockInterview.duration
      );
    });

    it('should not modify state for unknown interview id', () => {
      const stateWithInterview = dashboardReducer(initialState, {
        type: 'FETCH_INTERVIEWS_SUCCESS',
        payload: [mockInterview]
      });

      const nextState = dashboardReducer(stateWithInterview, {
        type: 'UPDATE_INTERVIEW',
        payload: {
          id: 'non-existent-id',
          data: {
            status:
              'completed' as Database['public']['Enums']['interview_status']
          }
        }
      });

      // State should remain unchanged
      expect(nextState).toEqual(stateWithInterview);
    });
  });

  // Notification reducer tests
  describe('notification actions', () => {
    const mockNotification = {
      id: 'notif-1',
      author_id: 'author-1',
      type: 'match' as Database['public']['Enums']['activity_type'],
      title: 'New Match',
      description: 'You have a new podcast match',
      read: false,
      priority: 'high' as Database['public']['Enums']['notification_priority'],
      action_url: '/matches/1',
      metadata: { match_id: 'match-1' },
      created_at: new Date().toISOString()
    };

    it('should handle FETCH_NOTIFICATIONS_START', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_START'
      });

      expect(nextState.notifications.loading).toBe(true);
      expect(nextState.notifications.error).toBeNull();
      // Should not affect other state slices
      expect(nextState.matches).toEqual(initialState.matches);
    });

    it('should handle FETCH_NOTIFICATIONS_SUCCESS', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: [mockNotification]
      });

      expect(nextState.notifications.loading).toBe(false);
      expect(nextState.notifications.error).toBeNull();
      expect(nextState.notifications.data).toEqual([mockNotification]);
      expect(nextState.notifications.unreadCount).toBe(1); // Should count unread
    });

    it('should handle FETCH_NOTIFICATIONS_ERROR', () => {
      const error = 'Failed to fetch notifications';
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_ERROR',
        payload: error
      });

      expect(nextState.notifications.loading).toBe(false);
      expect(nextState.notifications.error).toBe(error);
      expect(nextState.notifications.data).toEqual([]);
    });

    it('should handle MARK_NOTIFICATION_READ', () => {
      // First add a notification to the state
      const stateWithNotification = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: [mockNotification]
      });

      const nextState = dashboardReducer(stateWithNotification, {
        type: 'MARK_NOTIFICATION_READ',
        payload: mockNotification.id
      });

      expect(nextState.notifications.data[0].read).toBe(true);
      expect(nextState.notifications.unreadCount).toBe(0);
      // Other properties should remain unchanged
      expect(nextState.notifications.data[0].title).toBe(
        mockNotification.title
      );
    });

    it('should handle NEW_NOTIFICATION', () => {
      const newNotification = {
        ...mockNotification,
        id: 'notif-2',
        title: 'Another notification'
      };

      // First add an existing notification
      const stateWithNotification = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: [mockNotification]
      });

      // Then add a new one
      const nextState = dashboardReducer(stateWithNotification, {
        type: 'NEW_NOTIFICATION',
        payload: newNotification
      });

      expect(nextState.notifications.data).toHaveLength(2);
      expect(nextState.notifications.data[0]).toEqual(newNotification); // Should be at the start
      expect(nextState.notifications.unreadCount).toBe(2);
    });

    it('should not modify state for unknown notification id', () => {
      const stateWithNotification = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: [mockNotification]
      });

      const nextState = dashboardReducer(stateWithNotification, {
        type: 'MARK_NOTIFICATION_READ',
        payload: 'non-existent-id'
      });

      // State should remain unchanged
      expect(nextState).toEqual(stateWithNotification);
    });

    it('should handle multiple unread counts correctly', () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-2', read: true },
        { ...mockNotification, id: 'notif-3' }
      ];

      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: notifications
      });

      expect(nextState.notifications.unreadCount).toBe(2); // Only unread ones
    });
  });

  // Activity reducer tests
  describe('activity actions', () => {
    const mockActivity = {
      id: 'activity-1',
      author_id: 'author-1',
      type: 'match' as Database['public']['Enums']['activity_type'],
      title: 'New Match Activity',
      description: 'Matched with Test Podcast',
      metadata: { match_id: 'match-1' },
      created_at: new Date().toISOString()
    };

    it('should handle FETCH_ACTIVITIES_START', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_ACTIVITIES_START'
      });

      expect(nextState.activities.loading).toBe(true);
      expect(nextState.activities.error).toBeNull();
      // Should not affect other state slices
      expect(nextState.matches).toEqual(initialState.matches);
    });

    it('should handle FETCH_ACTIVITIES_SUCCESS', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_ACTIVITIES_SUCCESS',
        payload: [mockActivity]
      });

      expect(nextState.activities.loading).toBe(false);
      expect(nextState.activities.error).toBeNull();
      expect(nextState.activities.data).toEqual([mockActivity]);
    });

    it('should handle FETCH_ACTIVITIES_ERROR', () => {
      const error = 'Failed to fetch activities';
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_ACTIVITIES_ERROR',
        payload: error
      });

      expect(nextState.activities.loading).toBe(false);
      expect(nextState.activities.error).toBe(error);
      expect(nextState.activities.data).toEqual([]);
    });

    it('should handle FETCH_GROUPED_ACTIVITIES_SUCCESS', () => {
      const today = new Date().toISOString().split('T')[0];
      const groupedActivities = [
        {
          date: today,
          activities: [
            mockActivity,
            { ...mockActivity, id: 'activity-2', title: 'Another activity' }
          ]
        }
      ];

      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_GROUPED_ACTIVITIES_SUCCESS',
        payload: groupedActivities
      });

      expect(nextState.activities.loading).toBe(false);
      expect(nextState.activities.error).toBeNull();
      expect(nextState.activities.groupedData).toEqual(groupedActivities);
      // Should not affect regular activities list
      expect(nextState.activities.data).toEqual(initialState.activities.data);
    });

    it('should handle empty grouped activities', () => {
      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_GROUPED_ACTIVITIES_SUCCESS',
        payload: []
      });

      expect(nextState.activities.groupedData).toEqual([]);
      expect(nextState.activities.loading).toBe(false);
      expect(nextState.activities.error).toBeNull();
    });

    it('should preserve activity order in grouped data', () => {
      const today = new Date().toISOString().split('T')[0];
      const activities = [
        mockActivity,
        { ...mockActivity, id: 'activity-2', title: 'Second activity' },
        { ...mockActivity, id: 'activity-3', title: 'Third activity' }
      ];

      const groupedActivities = [
        {
          date: today,
          activities
        }
      ];

      const nextState = dashboardReducer(initialState, {
        type: 'FETCH_GROUPED_ACTIVITIES_SUCCESS',
        payload: groupedActivities
      });

      expect(nextState.activities.groupedData[0].activities).toHaveLength(3);
      expect(nextState.activities.groupedData[0].activities[0].id).toBe(
        'activity-1'
      );
      expect(nextState.activities.groupedData[0].activities[2].id).toBe(
        'activity-3'
      );
    });
  });

  // We'll continue with activity tests next...
});
