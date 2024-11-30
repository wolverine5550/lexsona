import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database';
import type {
  ProfileFormData,
  AccountFormData,
  NotificationPreferences,
  PrivacySettings,
  EmailPreferences,
  EmailCategory,
  CategorySettings,
  UnsubscribeData,
  ApiKey,
  ApiKeyFormData,
  IntegrationSettings,
  IntegrationSettingsFormData
} from '@/types/settings';
import { generateApiKey, hashApiKey, encryptSecret } from '@/utils/api-key';

export const settingsService = {
  profile: {
    /**
     * Get the current user's profile settings
     */
    async getProfile(userId: string) {
      const supabase = createClient();
      return await supabase
        .from('author_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    /**
     * Update the user's profile settings
     */
    async updateProfile(userId: string, data: ProfileFormData) {
      const supabase = createClient();

      // Format the data for the database
      const profileData = {
        user_id: userId,
        name: data.name,
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        title: data.title || null,
        company: data.company || null,
        expertise: data.expertise,
        social_links: {
          twitter: data.twitter || null,
          linkedin: data.linkedin || null
        },
        updated_at: new Date().toISOString()
      };

      return await supabase.from('author_profiles').upsert(profileData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    }
  },
  account: {
    /**
     * Update user's password
     */
    async updatePassword(
      userId: string,
      currentPassword: string,
      newPassword: string
    ) {
      const supabase = createClient();
      return await supabase.auth.updateUser({
        password: newPassword
      });
    },

    /**
     * Resend email verification
     */
    async resendVerification(email: string) {
      const supabase = createClient();
      return await supabase.auth.resend({
        type: 'signup',
        email
      });
    },

    /**
     * Delete user account
     */
    async deleteAccount(userId: string) {
      const supabase = createClient();
      // First delete user data
      await supabase.from('author_profiles').delete().eq('user_id', userId);

      // Then delete auth user
      return await supabase.auth.admin.deleteUser(userId);
    },

    /**
     * Get all active sessions for the user
     */
    async getSessions() {
      const supabase = createClient();
      const {
        data: { session: currentSession },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        return { data: null, error: sessionError };
      }

      // Get all sessions
      const { data: allSessions } = await supabase.auth.admin.listUsers();
      const sessions = allSessions?.users || [];

      return {
        data: {
          sessions: sessions.map((user) => ({
            access_token: user.id,
            user,
            created_at: user.created_at
          })),
          current_session: currentSession
        },
        error: null
      };
    },

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionId: string) {
      const supabase = createClient();
      // Since Supabase doesn't have a direct method to revoke a specific session,
      // we'll sign out all other sessions and keep the current one
      return await supabase.auth.signOut({ scope: 'others' });
    }
  },
  notifications: {
    /**
     * Get user's notification preferences
     */
    async getPreferences(userId: string) {
      const supabase = createClient();
      const response = await supabase
        .from('notification_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      return {
        data: response.data as { preferences: NotificationPreferences } | null,
        error: response.error
      };
    },

    /**
     * Update user's notification preferences
     */
    async updatePreferences(
      userId: string,
      preferences: NotificationPreferences
    ) {
      const supabase = createClient();

      const preferencesData = {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      };

      return await supabase
        .from('notification_preferences')
        .upsert(preferencesData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
    },

    /**
     * Update push notification subscription
     */
    async updatePushSubscription(
      userId: string,
      subscription: PushSubscription | null
    ) {
      const supabase = createClient();

      if (!subscription) {
        // Remove subscription
        return await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }

      // Add or update subscription
      return await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          subscription: subscription,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      );
    }
  },
  privacy: {
    /**
     * Get user's privacy settings
     */
    async getSettings(userId: string) {
      const supabase = createClient();
      return await supabase
        .from('privacy_settings')
        .select('settings')
        .eq('user_id', userId)
        .single();
    },

    /**
     * Update user's privacy settings
     */
    async updateSettings(userId: string, settings: PrivacySettings) {
      const supabase = createClient();

      const privacyData = {
        user_id: userId,
        settings,
        updated_at: new Date().toISOString()
      };

      return await supabase.from('privacy_settings').upsert(privacyData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    }
  },
  email: {
    /**
     * Get user's email preferences
     * Retrieves all email and communication preferences including:
     * - Global email settings
     * - Category-specific preferences
     * - Time preferences
     * - Unsubscribe data
     */
    async getPreferences(userId: string) {
      const supabase = createClient();
      return await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    /**
     * Update user's email preferences
     * Updates all email settings in a single transaction
     * @param userId - The user's ID
     * @param preferences - The complete email preferences object
     */
    async updatePreferences(userId: string, preferences: EmailPreferences) {
      const supabase = createClient();

      const preferencesData = {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      };

      return await supabase.from('email_preferences').upsert(preferencesData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    },

    /**
     * Update category-specific preferences
     * Allows updating settings for a single email category
     * @param userId - The user's ID
     * @param category - The email category to update
     * @param settings - The new settings for the category
     */
    async updateCategoryPreferences(
      userId: string,
      category: EmailCategory,
      settings: CategorySettings
    ) {
      const supabase = createClient();

      // First get current preferences
      const { data: currentData } = await this.getPreferences(userId);

      if (!currentData) {
        throw new Error('No preferences found');
      }

      // Update only the specified category
      const updatedCategories = {
        ...currentData.categories,
        [category]: settings
      };

      return await supabase
        .from('email_preferences')
        .update({
          categories: updatedCategories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    },

    /**
     * Unsubscribe from specific categories
     * Records unsubscribe data and updates preferences
     * @param userId - The user's ID
     * @param categories - Array of categories to unsubscribe from
     * @param reason - Optional reason for unsubscribing
     */
    async unsubscribe(
      userId: string,
      categories: EmailCategory[],
      reason?: string
    ) {
      const supabase = createClient();

      const unsubscribeData: UnsubscribeData = {
        last_updated: new Date().toISOString(),
        categories_unsubscribed: categories,
        reason
      };

      // Update preferences to disable selected categories
      const updatedCategories = categories.reduce(
        (acc, category) => ({
          ...acc,
          [category]: {
            enabled: false,
            frequency: 'never'
          }
        }),
        {}
      );

      return await supabase
        .from('email_preferences')
        .update({
          categories: updatedCategories,
          unsubscribe_data: unsubscribeData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    },

    /**
     * Update time preferences
     * Sets timezone and quiet hours preferences
     * @param userId - The user's ID
     * @param timezone - User's timezone
     * @param quietHours - Optional quiet hours settings
     */
    async updateTimePreferences(
      userId: string,
      timezone: string,
      quietHours?: {
        enabled: boolean;
        start?: string;
        end?: string;
      }
    ) {
      const supabase = createClient();

      return await supabase
        .from('email_preferences')
        .update({
          time_preferences: {
            timezone,
            quiet_hours: quietHours || { enabled: false },
            // Keep existing preferred days
            preferred_days: (await this.getPreferences(userId))?.data
              ?.time_preferences?.preferred_days || [
              'mon',
              'tue',
              'wed',
              'thu',
              'fri'
            ]
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }
  },
  apiKeys: {
    /**
     * Get all API keys for a user
     * Retrieves both active and inactive keys
     * @param userId - The user's ID
     */
    async getKeys(userId: string) {
      const supabase = createClient();
      return await supabase
        .from('api_keys')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
    },

    /**
     * Create a new API key
     * Generates a new key with specified permissions
     * @param userId - The user's ID
     * @param data - Key creation data including name and scopes
     */
    async createKey(userId: string, data: ApiKeyFormData) {
      const supabase = createClient();
      const key = generateApiKey(); // Utility to generate secure key
      const hashedKey = await hashApiKey(key); // Hash before storage

      const keyData = {
        created_by: userId,
        key: hashedKey,
        name: data.name,
        scopes: data.scopes,
        status: 'active',
        expires_at: data.expires_at || null,
        created_at: new Date().toISOString(),
        description: data.description
      };

      const { data: savedKey, error } = await supabase
        .from('api_keys')
        .insert(keyData)
        .select()
        .single();

      if (error) throw error;

      // Return the actual key only on creation
      return {
        ...savedKey,
        key // Original unhashed key
      };
    },

    /**
     * Revoke an API key
     * Marks the key as revoked and records revocation details
     * @param userId - The user's ID
     * @param keyId - The key to revoke
     */
    async revokeKey(userId: string, keyId: string) {
      const supabase = createClient();
      return await supabase
        .from('api_keys')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: userId
        })
        .eq('id', keyId)
        .eq('created_by', userId); // Ensure user owns the key
    },

    /**
     * Update API key details
     * Can update name, description, and expiration
     * @param userId - The user's ID
     * @param keyId - The key to update
     * @param data - Updated key data
     */
    async updateKey(
      userId: string,
      keyId: string,
      data: Partial<ApiKeyFormData>
    ) {
      const supabase = createClient();
      return await supabase
        .from('api_keys')
        .update({
          name: data.name,
          description: data.description,
          expires_at: data.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('created_by', userId);
    }
  },
  integrations: {
    /**
     * Get integration settings
     * Retrieves all integration configurations
     * @param userId - The user's ID
     */
    async getSettings(userId: string) {
      const supabase = createClient();
      return await supabase
        .from('integration_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    /**
     * Update integration settings
     * Updates webhook, OAuth, and notification configurations
     * @param userId - The user's ID
     * @param settings - The new settings
     */
    async updateSettings(
      userId: string,
      settings: IntegrationSettingsFormData
    ) {
      const supabase = createClient();

      // Encrypt sensitive data before storage
      const encryptedSettings = {
        ...settings,
        webhooks: {
          ...settings.webhooks,
          secret: settings.webhooks.secret
            ? await encryptSecret(settings.webhooks.secret)
            : undefined
        },
        oauth: {
          ...settings.oauth,
          client_secret: settings.oauth.client_secret
            ? await encryptSecret(settings.oauth.client_secret)
            : undefined
        }
      };

      return await supabase.from('integration_settings').upsert(
        {
          user_id: userId,
          settings: encryptedSettings,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      );
    },

    /**
     * Test webhook configuration
     * Sends a test event to verify webhook setup
     * @param url - The webhook URL to test
     * @param secret - The webhook secret
     */
    async testWebhook(url: string, secret?: string) {
      const testEvent = {
        type: 'test',
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret && { 'X-Webhook-Secret': secret })
          },
          body: JSON.stringify(testEvent)
        });

        return {
          success: response.ok,
          status: response.status,
          message: response.ok
            ? 'Webhook test successful'
            : 'Webhook test failed'
        };
      } catch (error) {
        return {
          success: false,
          status: 0,
          message: 'Failed to connect to webhook URL'
        };
      }
    }
  }
};
