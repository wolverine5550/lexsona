import { createClient } from '@/utils/supabase/client';

/**
 * Types for error handling and reporting
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorReport {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  severity: ErrorSeverity;
  context: {
    userId?: string;
    podcastId?: string;
    requestData?: any;
    stackTrace?: string;
  };
  status: 'new' | 'investigating' | 'resolved';
  resolution?: string;
}

/**
 * Service to handle errors, retries, and fallbacks for the recommendation system
 */
export class ErrorHandler {
  private static supabase = createClient();
  private static readonly ERROR_LOG_TABLE = 'error_logs';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Report and log an error
   */
  public static async reportError(
    error: Error,
    severity: ErrorSeverity,
    context: ErrorReport['context']
  ): Promise<void> {
    const errorReport: Omit<ErrorReport, 'id'> = {
      timestamp: new Date().toISOString(),
      errorType: error.name,
      message: error.message,
      severity,
      context: {
        ...context,
        stackTrace: error.stack
      },
      status: 'new'
    };

    // Log error to Supabase
    const { error: dbError } = await this.supabase
      .from(this.ERROR_LOG_TABLE)
      .insert(errorReport);

    if (dbError) {
      console.error('Failed to log error:', dbError);
    }

    // If error is critical, trigger immediate notification
    if (severity === 'critical') {
      await this.notifyCriticalError(errorReport);
    }
  }

  /**
   * Retry a function with exponential backoff
   */
  public static async withRetry<T>(
    operation: () => Promise<T>,
    context: { name: string; userId?: string }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Log retry attempt
        await this.reportError(lastError, 'low', {
          userId: context.userId,
          requestData: { operation: context.name, attempt }
        });

        // Wait before retrying (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    // If all retries failed, report final error and throw
    if (lastError) {
      await this.reportError(lastError, 'high', {
        userId: context.userId,
        requestData: { operation: context.name, finalAttempt: true }
      });
      throw lastError;
    }

    throw new Error('Unexpected error in retry logic');
  }

  /**
   * Get fallback recommendations when main recommendation system fails
   */
  public static async getFallbackRecommendations(
    userId: string
  ): Promise<any[]> {
    try {
      // Try to get popular podcasts in user's preferred categories
      const { data: preferences } = await this.supabase
        .from('podcast_preferences')
        .select('style_preferences')
        .eq('author_id', userId)
        .single();

      if (preferences?.style_preferences) {
        // Get top podcasts matching preferred styles
        const { data: podcasts } = await this.supabase
          .from('podcasts')
          .select('*')
          .order('rating', { ascending: false })
          .limit(10);

        if (podcasts?.length) {
          // Filter podcasts based on style preferences
          return podcasts.filter((podcast) => {
            const userPrefs = preferences.style_preferences;
            return (
              (userPrefs.isInterviewPreferred &&
                podcast.format === 'interview') ||
              (userPrefs.isStorytellingPreferred &&
                podcast.format === 'storytelling') ||
              (userPrefs.isEducationalPreferred &&
                podcast.format === 'educational') ||
              (userPrefs.isDebatePreferred && podcast.format === 'debate')
            );
          });
        }
      }

      // If no preferences or matching podcasts found, return general popular podcasts
      const { data: popularPodcasts } = await this.supabase
        .from('podcasts')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10);

      return popularPodcasts || [];
    } catch (error) {
      // Log the fallback error
      await this.reportError(error as Error, 'high', { userId });
      // Return empty array as last resort
      return [];
    }
  }

  /**
   * Notify team of critical errors
   */
  private static async notifyCriticalError(
    errorReport: Omit<ErrorReport, 'id'>
  ): Promise<void> {
    // Implementation would depend on notification service (e.g., SendGrid, Slack)
    console.error('CRITICAL ERROR:', errorReport);
  }

  public static async logError(
    userId: string,
    error: Error,
    context: string
  ): Promise<void> {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    try {
      // First, get current error count
      const { data: currentPrefs } = await this.supabase
        .from('podcast_preferences')
        .select('error_count')
        .eq('author_id', userId)
        .single();

      const error_count = (currentPrefs?.error_count || 0) + 1;

      // Update user preferences
      const { error: preferencesError } = await this.supabase
        .from('podcast_preferences')
        .update({
          error_count,
          last_error: errorDetails,
          updated_at: new Date().toISOString()
        })
        .eq('author_id', userId);

      if (preferencesError) {
        console.error('Failed to update error count:', preferencesError);
      }

      // Log to error_logs table
      const { error: logError } = await this.supabase
        .from('error_logs')
        .insert({
          user_id: userId,
          error_details: errorDetails,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Failed to log error:', logError);
      }
    } catch (err) {
      console.error('Error in error handler:', err);
    }
  }
}
