'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import {
  notificationSchema,
  type NotificationPreferences,
  type NotificationType
} from '@/types/settings';
import type { ExtendedUser } from '@/types/supabase';
import { NotificationSettingsSkeleton } from '@/components/ui/NotificationSettingsSkeleton';

// Define notification type labels for display
const notificationLabels: Record<NotificationType, string> = {
  match_found: 'New podcast matches',
  interview_scheduled: 'Interview confirmations',
  interview_reminder: 'Interview reminders',
  message_received: 'New messages',
  review_posted: 'New reviews'
};

// Define notification type descriptions
const notificationDescriptions: Record<NotificationType, string> = {
  match_found: 'When new podcast matches are found for your profile',
  interview_scheduled: 'When a podcast host confirms an interview',
  interview_reminder: '24 hours before scheduled interviews',
  message_received: 'When you receive new messages',
  review_posted: 'When someone leaves a review'
};

export default function NotificationSettings() {
  const { session } = useSession();
  const user = session?.user as ExtendedUser;
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [pushSupported, setPushSupported] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: {
        match_found: true,
        interview_scheduled: true,
        interview_reminder: true,
        message_received: true,
        review_posted: true
      },
      in_app_notifications: {
        match_found: true,
        interview_scheduled: true,
        interview_reminder: true,
        message_received: true,
        review_posted: true
      },
      push_notifications: {
        enabled: false,
        match_found: true,
        interview_scheduled: true,
        interview_reminder: true,
        message_received: true,
        review_posted: true
      }
    }
  });

  // Watch push notification enabled state
  const pushEnabled = watch('push_notifications.enabled');

  // Check push notification support on mount
  useEffect(() => {
    setPushSupported('Notification' in window);
  }, []);

  // Load user's notification preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user?.id) return;

      try {
        const { data, error } =
          await settingsService.notifications.getPreferences(user.id);

        if (error) throw error;

        if (data) {
          // Set form values from saved preferences
          Object.entries(data.preferences).forEach(([key, value]) => {
            if (
              key === 'email_notifications' ||
              key === 'in_app_notifications' ||
              key === 'push_notifications'
            ) {
              setValue(key, value as any);
            }
          });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Failed to load notification preferences'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, [user?.id, setValue]);

  // Handle form submission
  const onSubmit = async (data: NotificationPreferences) => {
    try {
      const response = await settingsService.notifications.updatePreferences(
        user.id,
        data
      );
      if (response.error) throw response.error;

      setSubmitStatus({
        type: 'success',
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update notification preferences'
      });
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return <NotificationSettingsSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Notification Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Email Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              Email Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Notifications sent to {user?.email}
            </p>
          </div>
          {/* Master toggle for email notifications - Future enhancement */}
        </div>

        {/* Email notification options */}
        <div className="space-y-4">
          {Object.entries(notificationLabels).map(([key, label]) => (
            <div key={key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={`email_${key}`}
                {...register(`email_notifications.${key as NotificationType}`)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label
                  htmlFor={`email_${key}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
                <p className="text-sm text-gray-500">
                  {notificationDescriptions[key as NotificationType]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* In-app Notifications Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              In-app Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Notifications shown within the application
            </p>
          </div>
        </div>

        {/* In-app notification options */}
        <div className="space-y-4">
          {Object.entries(notificationLabels).map(([key, label]) => (
            <div key={key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={`in_app_${key}`}
                {...register(`in_app_notifications.${key as NotificationType}`)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label
                  htmlFor={`in_app_${key}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
                <p className="text-sm text-gray-500">
                  {notificationDescriptions[key as NotificationType]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Browser notifications when you're not using the app
            </p>
          </div>
          {/* Master toggle for push notifications */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="push_enabled"
              {...register('push_notifications.enabled')}
              disabled={!pushSupported}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <label
              htmlFor="push_enabled"
              className="ml-2 text-sm text-gray-700"
            >
              Enable Push Notifications
            </label>
          </div>
        </div>

        {/* Push notification options - only shown when enabled */}
        {pushEnabled && (
          <div className="space-y-4">
            {Object.entries(notificationLabels).map(([key, label]) => (
              <div key={key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`push_${key}`}
                  {...register(`push_notifications.${key as NotificationType}`)}
                  disabled={!pushSupported}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`push_${key}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {label}
                  </label>
                  <p className="text-sm text-gray-500">
                    {notificationDescriptions[key as NotificationType]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Push notification support warning */}
        {!pushSupported && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Push Notifications Not Supported
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your browser doesn't support push notifications. Try using a
                  modern browser like Chrome or Firefox.
                </p>
              </div>
            </div>
          </div>
        )}
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
          role="alert"
          className={`mt-4 p-4 rounded-md ${
            submitStatus.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {submitStatus.message}
        </div>
      )}
    </form>
  );
}
