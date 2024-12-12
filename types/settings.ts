import { z } from 'zod';

// Profile schema
export const profileSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  location: z
    .string()
    .max(100, 'Location cannot exceed 100 characters')
    .optional(),
  website: z
    .string()
    .url('Please enter a valid URL')
    .max(100, 'Website URL cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),

  // Professional Information
  title: z.string().max(100, 'Title cannot exceed 100 characters').optional(),
  company: z
    .string()
    .max(100, 'Company name cannot exceed 100 characters')
    .optional(),
  expertise: z
    .array(z.string())
    .min(1, 'Please select at least one area of expertise')
    .max(5, 'Cannot select more than 5 areas of expertise'),

  // Social Media Links
  twitter: z
    .string()
    .max(100, 'Twitter handle cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .max(100, 'LinkedIn URL cannot exceed 100 characters')
    .optional()
    .or(z.literal(''))
});

// Account schema
export const accountSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
});

// Infer TypeScript type from the schema
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;

// Define notification types
export type NotificationType =
  | 'match_found' // New podcast match
  | 'interview_scheduled' // Interview confirmed
  | 'interview_reminder' // Upcoming interview
  | 'message_received' // New message
  | 'review_posted'; // New review

// Define notification channels
export type NotificationChannel =
  | 'email' // Email notifications
  | 'in_app' // In-app notifications
  | 'push'; // Browser push notifications

// Schema for notification preferences
export const notificationSchema = z.object({
  // Email notification settings
  email_notifications: z.object({
    match_found: z.boolean(),
    interview_scheduled: z.boolean(),
    interview_reminder: z.boolean(),
    message_received: z.boolean(),
    review_posted: z.boolean()
  }),

  // In-app notification settings
  in_app_notifications: z.object({
    match_found: z.boolean(),
    interview_scheduled: z.boolean(),
    interview_reminder: z.boolean(),
    message_received: z.boolean(),
    review_posted: z.boolean()
  }),

  // Push notification settings
  push_notifications: z.object({
    enabled: z.boolean(), // Master toggle for push notifications
    match_found: z.boolean(),
    interview_scheduled: z.boolean(),
    interview_reminder: z.boolean(),
    message_received: z.boolean(),
    review_posted: z.boolean()
  })
});

export type NotificationPreferences = z.infer<typeof notificationSchema>;

// Define privacy setting types
export type PrivacyLevel = 'public' | 'private' | 'connections';

export const privacySchema = z.object({
  // Profile visibility settings
  profile_visibility: z.object({
    basic_info: z.enum(['public', 'private', 'connections'], {
      description: 'Who can see your basic profile information'
    }),
    contact_info: z.enum(['public', 'private', 'connections'], {
      description: 'Who can see your contact information'
    }),
    expertise: z.enum(['public', 'private', 'connections'], {
      description: 'Who can see your areas of expertise'
    })
  }),

  // Search and discovery settings
  discovery: z.object({
    show_in_search: z.boolean({
      description: 'Allow your profile to appear in search results'
    }),
    allow_recommendations: z.boolean({
      description: 'Allow us to recommend your profile to others'
    }),
    show_online_status: z.boolean({
      description: 'Show when you are online'
    })
  }),

  // Communication preferences
  communication: z.object({
    allow_messages: z.enum(['public', 'private', 'connections'], {
      description: 'Who can send you messages'
    }),
    allow_connection_requests: z.boolean({
      description: 'Allow others to send you connection requests'
    }),
    show_read_receipts: z.boolean({
      description: 'Show when you have read messages'
    })
  })
});

export type PrivacySettings = z.infer<typeof privacySchema>;

// Define email frequency options
export type EmailFrequency =
  | 'immediate' // Send emails as events occur
  | 'daily' // Daily digest of all notifications
  | 'weekly' // Weekly digest of all notifications
  | 'never'; // Don't send any emails

// Define email categories
export type EmailCategory =
  | 'marketing' // Marketing and promotional emails
  | 'product_updates' // New features and updates
  | 'security' // Security alerts and notifications
  | 'activity' // Account activity notifications
  | 'recommendations'; // Podcast recommendations

// Schema for email preferences
export const emailPreferencesSchema = z.object({
  // Global email settings
  email_enabled: z.boolean().default(true),
  frequency: z
    .enum(['immediate', 'daily', 'weekly', 'never'])
    .default('immediate'),

  // Category preferences
  categories: z.object({
    marketing: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(['immediate', 'daily', 'weekly', 'never'])
        .optional()
        .default('weekly')
    }),
    product_updates: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(['immediate', 'daily', 'weekly', 'never'])
        .optional()
        .default('weekly')
    }),
    security: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(['immediate', 'daily', 'weekly', 'never'])
        .optional()
        .default('immediate')
    }),
    activity: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(['immediate', 'daily', 'weekly', 'never'])
        .optional()
        .default('daily')
    }),
    recommendations: z.object({
      enabled: z.boolean().default(true),
      frequency: z
        .enum(['immediate', 'daily', 'weekly', 'never'])
        .optional()
        .default('weekly')
    })
  }),

  // Communication time preferences
  time_preferences: z.object({
    timezone: z.string().default('UTC'),
    quiet_hours: z.object({
      enabled: z.boolean().default(false),
      start: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(),
      end: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional()
    }),
    preferred_days: z
      .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
      .optional()
      .default(['mon', 'tue', 'wed', 'thu', 'fri'])
  }),

  // Unsubscribe settings
  unsubscribe_data: z
    .object({
      last_updated: z.string().datetime().optional(),
      reason: z.string().optional(),
      categories_unsubscribed: z
        .array(
          z.enum([
            'marketing',
            'product_updates',
            'security',
            'activity',
            'recommendations'
          ])
        )
        .optional()
    })
    .optional()
});

// Infer TypeScript type from schema
export type EmailPreferences = z.infer<typeof emailPreferencesSchema>;

// Helper type for email category settings
export type CategorySettings = {
  enabled: boolean;
  frequency: EmailFrequency;
};

// Helper type for unsubscribe data
export type UnsubscribeData = {
  last_updated?: string;
  reason?: string;
  categories_unsubscribed?: EmailCategory[];
};

// Define API key scopes/permissions
export type ApiKeyScope =
  | 'read:profile' // Read profile information
  | 'write:profile' // Update profile information
  | 'read:podcasts' // Read podcast data
  | 'write:podcasts' // Create/update podcast data
  | 'read:analytics' // Read analytics data
  | 'read:interviews' // Read interview data
  | 'write:interviews'; // Schedule/update interviews

// Define API key status
export type ApiKeyStatus = 'active' | 'expired' | 'revoked';

// API key data structure
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  description?: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  created_by: string;
  revoked_at?: string;
  revoked_by?: string;
}

// Schema for creating/updating API keys
export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  scopes: z
    .array(
      z.enum([
        'read:profile',
        'write:profile',
        'read:podcasts',
        'write:podcasts',
        'read:analytics',
        'read:interviews',
        'write:interviews'
      ])
    )
    .min(1, 'At least one permission is required'),
  expires_at: z.string().datetime().nullable().optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
});

// Integration settings
export interface IntegrationSettings {
  webhooks: {
    enabled: boolean;
    url?: string;
    secret?: string;
    events: string[]; // Event types to trigger webhook
  };
  oauth: {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;
    scopes: string[];
  };
  notifications: {
    slack_webhook?: string;
    email_notifications: boolean;
    notification_email?: string;
  };
}

// Schema for integration settings
export const integrationSettingsSchema = z.object({
  webhooks: z.object({
    enabled: z.boolean(),
    url: z.string().url('Must be a valid URL').optional(),
    secret: z.string().min(16).optional(),
    events: z.array(z.string()).min(1, 'Select at least one event')
  }),
  oauth: z.object({
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
    redirect_uri: z.string().url('Must be a valid URL').optional(),
    scopes: z.array(z.string())
  }),
  notifications: z.object({
    slack_webhook: z
      .string()
      .url('Must be a valid Slack webhook URL')
      .optional(),
    email_notifications: z.boolean(),
    notification_email: z.string().email('Must be a valid email').optional()
  })
});

export type ApiKeyFormData = z.infer<typeof apiKeySchema>;
export type IntegrationSettingsFormData = z.infer<
  typeof integrationSettingsSchema
>;

/**
 * Validation schema for podcast preferences
 */
export const podcastPreferencesSchema = z.object({
  example_shows: z.array(z.string()).min(1, 'Add at least one example show'),
  interview_topics: z.array(z.string()).min(1, 'Add at least one topic'),
  target_audience: z
    .array(z.string())
    .min(1, 'Add at least one target audience'),
  preferred_formats: z.array(z.string()).optional(),
  content_boundaries: z.array(z.string()).optional(),
  min_listeners: z.number().min(0).optional(),
  max_duration: z.number().min(0).optional(),
  availability: z
    .object({
      weekdays: z.array(z.string()).optional(),
      timeSlots: z.array(z.string()).optional()
    })
    .optional()
});

export type PodcastPreferencesFormData = z.infer<
  typeof podcastPreferencesSchema
>;
