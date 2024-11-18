import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import type { UserPreferences } from '@/types/preferences';

/**
 * Custom hook for managing user preferences
 * Handles loading, saving, and caching of preferences
 */
export function usePreferences() {
  // Get current user session
  const { session } = useSession();

  // State management
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches user preferences from the API
   */
  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Saves user preferences to the API
   */
  const savePreferences = async (
    newPreferences: Omit<
      UserPreferences,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >
  ) => {
    try {
      setError(null);

      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const data = await response.json();
      setPreferences(data);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error saving preferences:', err);
      throw err;
    }
  };

  /**
   * Load preferences when user session changes
   */
  useEffect(() => {
    if (session?.user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    preferences,
    isLoading,
    error,
    savePreferences,
    refreshPreferences: fetchPreferences
  };
}
