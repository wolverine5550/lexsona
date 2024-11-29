'use client';

import { useEffect } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { MatchList } from './MatchList';
import { NotificationPanel } from './NotificationPanel';
import { InterviewSchedule } from './InterviewSchedule';
import { ActivityFeed } from './ActivityFeed';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { dashboardService } from '@/services/dashboard/base';
import type { Database } from '@/types/database';

type MatchPayload = Database['public']['Tables']['matches']['Row'];

export function Dashboard() {
  const { dispatch, actions } = useDashboard();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;

      await Promise.all([
        actions.fetchMatches(),
        actions.fetchNotifications(),
        actions.fetchInterviews(),
        actions.fetchActivities(),
        actions.fetchStats()
      ]);
    };

    loadData();

    // Set up real-time subscriptions
    const unsubMatches = dashboardService.matches.subscribeToMatches?.(
      'author1',
      (match) => {
        if (mounted) {
          dispatch({ type: 'SET_MATCHES', payload: [match] });
        }
      }
    );

    const unsubNotifications =
      dashboardService.notifications.subscribeToNotifications(
        'author1',
        (notification) => {
          if (mounted) {
            dispatch({ type: 'SET_NOTIFICATIONS', payload: [notification] });
          }
        }
      );

    return () => {
      mounted = false;
      if (typeof unsubMatches === 'function') unsubMatches();
      if (unsubNotifications) unsubNotifications();
    };
  }, [dispatch, actions]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <MatchList />
        <InterviewSchedule />
        <NotificationPanel />
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
}
