'use client';

import type {
  UseFormRegister,
  FieldErrors,
  UseFormWatch
} from 'react-hook-form';
import type { IntegrationSettingsFormData } from '@/types/settings';

interface WebhookSectionProps {
  register: UseFormRegister<IntegrationSettingsFormData>;
  errors: FieldErrors<IntegrationSettingsFormData>;
  enabled: boolean;
  onTest?: (url: string, secret?: string) => Promise<void>;
  watch: UseFormWatch<IntegrationSettingsFormData>;
}

/**
 * Webhook configuration section
 * Includes URL, secret, and event selection
 */
export function WebhookSection({
  register,
  errors,
  enabled,
  onTest,
  watch
}: WebhookSectionProps) {
  const webhookEvents = [
    { value: 'user.created', label: 'User Created' },
    { value: 'user.updated', label: 'User Updated' },
    { value: 'interview.scheduled', label: 'Interview Scheduled' },
    { value: 'interview.updated', label: 'Interview Updated' },
    { value: 'review.posted', label: 'Review Posted' }
  ];

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Webhook Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure webhook endpoints to receive real-time updates
        </p>
      </div>

      {/* Enable Webhooks */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            {...register('webhooks.enabled')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3">
          <label className="text-sm font-medium text-gray-700">
            Enable Webhooks
          </label>
          <p className="text-sm text-gray-500">
            Receive real-time updates via HTTP webhooks
          </p>
        </div>
      </div>

      {enabled && (
        <div className="space-y-4 ml-8">
          {/* Webhook URL */}
          <div>
            <label
              htmlFor="webhook-url"
              className="block text-sm font-medium text-gray-700"
            >
              Webhook URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                id="webhook-url"
                {...register('webhooks.url')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="https://api.example.com/webhooks"
              />
              {errors.webhooks?.url && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.webhooks.url.message}
                </p>
              )}
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label
              htmlFor="webhook-secret"
              className="block text-sm font-medium text-gray-700"
            >
              Webhook Secret
            </label>
            <div className="mt-1">
              <input
                type="password"
                id="webhook-secret"
                {...register('webhooks.secret')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter a secret key"
              />
              {errors.webhooks?.secret && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.webhooks.secret.message}
                </p>
              )}
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Events to Send
            </label>
            <div className="mt-2 space-y-2">
              {webhookEvents.map(({ value, label }) => (
                <div key={value} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      value={value}
                      {...register('webhooks.events')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="text-sm text-gray-700">{label}</label>
                  </div>
                </div>
              ))}
            </div>
            {errors.webhooks?.events && (
              <p className="mt-1 text-sm text-red-600">
                {errors.webhooks.events.message}
              </p>
            )}
          </div>

          {/* Test Button */}
          {onTest && (
            <button
              type="button"
              onClick={() =>
                onTest(
                  watch('webhooks.url') as string,
                  watch('webhooks.secret')
                )
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test Webhook
            </button>
          )}
        </div>
      )}
    </section>
  );
}
