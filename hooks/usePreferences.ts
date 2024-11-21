import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Preferences {
  userId: string;
  preferred_categories?: string[];
  // Add other preference fields as needed
}

export const usePreferences = (userId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const savePreferences = async (preferences: Partial<Preferences>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (supabaseError) {
        throw new Error('Failed to save preferences');
      }

      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    savePreferences
  };
};
