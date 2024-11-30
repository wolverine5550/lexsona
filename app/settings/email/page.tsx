'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import {
  emailPreferencesSchema,
  type EmailPreferences,
  type EmailCategory,
  type EmailFrequency
} from '@/types/settings';
import type { ExtendedUser } from '@/types/supabase';
import { EmailPreferencesSkeleton } from '@/components/ui/EmailPreferencesSkeleton';
import { FrequencySelect } from '@/components/ui/EmailPreferences/FrequencySelect';
import { CategoryToggle } from '@/components/ui/EmailPreferences/CategoryToggle';

// Define category labels and descriptions
const categoryLabels: Record<EmailCategory, string> = {
  marketing: 'Marketing & Promotions',
  product_updates: 'Product Updates',
  security: 'Security Alerts',
  activity: 'Account Activity',
  recommendations: 'Podcast Recommendations'
};

const categoryDescriptions: Record<EmailCategory, string> = {
  marketing: 'News about features and special offers',
  product_updates: 'Important updates about our service',
  security: 'Security and privacy-related notifications',
  activity: 'Updates about your account activity',
  recommendations: 'Personalized podcast recommendations'
};

// Define frequency options
const frequencyOptions = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'never', label: 'Never' }
] as const;

type CategoryField = `categories.${EmailCategory}.${string}`;
type CategoryValue<T extends 'enabled' | 'frequency'> = T extends 'enabled'
  ? boolean
  : EmailFrequency;

type NestedPath<T extends 'enabled' | 'frequency'> =
  `categories.${EmailCategory}.${T}`;

export default function EmailPreferencesPage() {
  // Get user session
  const { session } = useSession();
  const user = session?.user as ExtendedUser;

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<EmailPreferences>({
    resolver: zodResolver(emailPreferencesSchema)
  });

  // Watch global email enabled state
  const emailEnabled = watch('email_enabled');
  const globalFrequency = watch('frequency');

  // Type-safe watch function for nested fields
  const watchNestedField = <T extends 'enabled' | 'frequency'>(
    category: EmailCategory,
    field: T
  ): CategoryValue<T> => {
    const path = `categories.${category}.${field}` as NestedPath<T>;
    return watch(path) as CategoryValue<T>;
  };

  // Type-safe setValue function for nested fields
  const setNestedValue = <T extends 'enabled' | 'frequency'>(
    category: EmailCategory,
    field: T,
    value: CategoryValue<T>
  ) => {
    const path = `categories.${category}.${field}` as NestedPath<T>;
    setValue(path, value as any); // Type assertion needed due to react-hook-form limitations
  };

  // Type-safe error access
  const getFieldError = (
    category: EmailCategory,
    field: 'enabled' | 'frequency'
  ): string | undefined => {
    const categoryErrors = errors.categories?.[category];
    if (!categoryErrors) return undefined;

    const fieldError = categoryErrors[field];
    return fieldError?.message;
  };

  // Load user's email preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user?.id) return;

      try {
        const { data, error } = await settingsService.email.getPreferences(
          user.id
        );

        if (error) throw error;

        if (data) {
          // Reset form with saved preferences
          reset(data);
        }
      } catch (error) {
        console.error('Failed to load email preferences:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Failed to load email preferences'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user?.id, reset]);

  // Handle form submission
  const onSubmit = async (data: EmailPreferences) => {
    if (!user?.id) return;

    try {
      setSubmitStatus(null);

      const { error } = await settingsService.email.updatePreferences(
        user.id,
        data
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Email preferences updated successfully'
      });

      // Reset form state but keep values
      reset(data);
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update email preferences'
      });
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return <EmailPreferencesSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-lg font-medium text-gray-900">Email Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your email notifications and communication preferences
        </p>
      </div>

      {/* Global Email Settings */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Global Email Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Control how you receive all email notifications
          </p>
        </div>

        {/* Master Toggle */}
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5">
            <input
              id="email-enabled"
              type="checkbox"
              {...register('email_enabled')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="email-enabled"
              className="block text-sm font-medium text-gray-700"
            >
              Enable Email Notifications
            </label>
            <p className="text-sm text-gray-500">
              Receive important updates and notifications via email
            </p>
          </div>
        </div>

        {/* Global Frequency */}
        {emailEnabled && (
          <div className="ml-8">
            <label
              htmlFor="frequency-global"
              className="block text-sm font-medium text-gray-700"
            >
              Default Frequency
            </label>
            <FrequencySelect
              name="global"
              value={globalFrequency as EmailFrequency}
              onChange={(value: EmailFrequency) => setValue('frequency', value)}
              error={errors.frequency?.message}
            />
          </div>
        )}
      </div>

      {/* Category Settings */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Category Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize notifications for each category
          </p>
        </div>

        {/* Category Toggles */}
        <div className="space-y-6">
          {Object.entries(categoryLabels).map(([category, label]) => {
            const typedCategory = category as EmailCategory;
            return (
              <CategoryToggle
                key={category}
                category={typedCategory}
                label={label}
                description={categoryDescriptions[typedCategory]}
                enabled={watchNestedField(typedCategory, 'enabled')}
                frequency={watchNestedField(typedCategory, 'frequency')}
                onEnabledChange={(enabled: boolean) =>
                  setNestedValue(typedCategory, 'enabled', enabled)
                }
                onFrequencyChange={(freq: EmailFrequency) =>
                  setNestedValue(typedCategory, 'frequency', freq)
                }
                error={{
                  enabled: getFieldError(typedCategory, 'enabled'),
                  frequency: getFieldError(typedCategory, 'frequency')
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Time Preferences */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Time Preferences
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose when you want to receive emails
          </p>
        </div>

        {/* Timezone Selection */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700"
          >
            Your Timezone
          </label>
          <select
            id="timezone"
            {...register('time_preferences.timezone')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {/* Add timezone options */}
            <option value="UTC">UTC</option>
            {/* Add more timezones as needed */}
          </select>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <div className="flex items-center h-5">
              <input
                id="quiet-hours-enabled"
                type="checkbox"
                {...register('time_preferences.quiet_hours.enabled')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="quiet-hours-enabled"
                className="block text-sm font-medium text-gray-700"
              >
                Enable Quiet Hours
              </label>
              <p className="text-sm text-gray-500">
                Don't send emails during specified hours
              </p>
            </div>
          </div>

          {watch('time_preferences.quiet_hours.enabled') && (
            <div className="ml-8 grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="quiet-hours-start"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="quiet-hours-start"
                  {...register('time_preferences.quiet_hours.start')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="quiet-hours-end"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="quiet-hours-end"
                  {...register('time_preferences.quiet_hours.end')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Status Messages */}
      {submitStatus && (
        <div
          className={`mt-4 p-4 rounded-md ${
            submitStatus.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          {submitStatus.message}
        </div>
      )}
    </form>
  );
}
