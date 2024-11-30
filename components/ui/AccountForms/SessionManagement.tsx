'use client';

import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SessionData } from '@/types/supabase';
import { settingsService } from '@/services/settings/base';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface RawSession {
  access_token: string;
  user: User;
  created_at: string;
}

interface SessionResponse {
  data: {
    sessions: RawSession[];
    current_session: Session | null;
  } | null;
  error: Error | null;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(
    null
  );
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response =
        (await settingsService.account.getSessions()) as SessionResponse;

      if (response.error) throw response.error;
      if (!response.data) throw new Error('No session data received');

      const transformedSessions: SessionData[] = response.data.sessions.map(
        (session: RawSession) => ({
          id: session.access_token,
          user: session.user,
          last_sign_in_at: session.created_at,
          current:
            session.access_token ===
            response.data?.current_session?.access_token
        })
      );

      setSessions(transformedSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedSession?.id) return;

    try {
      setIsRevoking(true);
      const { error } = await settingsService.account.revokeSession(
        selectedSession.id
      );

      if (error) throw error;

      setSessions((prev) =>
        prev.filter((session) => session.id !== selectedSession.id)
      );
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError('Failed to revoke session');
    } finally {
      setIsRevoking(false);
      setSelectedSession(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-800">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900">Active Sessions</h3>
      <div className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No active sessions found</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session.user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  Last active:{' '}
                  {new Date(session.last_sign_in_at || '').toLocaleString()}
                </p>
                {session.current && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Current Session
                  </span>
                )}
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Revoke Access
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onConfirm={handleRevoke}
        title="Revoke Session"
        message="Are you sure you want to revoke this session? The user will be signed out immediately."
        confirmLabel={isRevoking ? 'Revoking...' : 'Revoke Access'}
        cancelLabel="Cancel"
        isDangerous
      />
    </div>
  );
}
