'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { IntegrationSettingsFormData } from '@/types/settings';

interface NotificationSectionProps {
  register: UseFormRegister<IntegrationSettingsFormData>;
  errors: FieldErrors<IntegrationSettingsFormData>;
  emailEnabled: boolean;
}

/**
 * Notification settings section
 * Includes Slack webhook and email notification preferences
 */
export function NotificationSection({
  register,
  errors,
  emailEnabled
}: NotificationSectionProps) {
  return (
    <section className="space-y-6 pt-6 border-t border-gray-200">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Notification Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how you want to receive integration notifications
        </p>
      </div>

      {/* Slack Webhook */}
      <div>
        <label
          htmlFor="slack-webhook"
          className="block text-sm font-medium text-gray-700"
        >
          Slack Webhook URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="slack-webhook"
            {...register('notifications.slack_webhook')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://hooks.slack.com/services/..."
          />
          {errors.notifications?.slack_webhook && (
            <p className="mt-1 text-sm text-red-600">
              {errors.notifications.slack_webhook.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              {...register('notifications.email_notifications')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label className="text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <p className="text-sm text-gray-500">
              Receive integration updates via email
            </p>
          </div>
        </div>

        {emailEnabled && (
          <div className="ml-8">
            <label
              htmlFor="notification-email"
              className="block text-sm font-medium text-gray-700"
            >
              Notification Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="notification-email"
                {...register('notifications.notification_email')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.notifications?.notification_email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.notifications.notification_email.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
