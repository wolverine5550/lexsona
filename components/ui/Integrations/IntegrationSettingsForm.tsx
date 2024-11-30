'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { IntegrationSettingsFormData } from '@/types/settings';
import { integrationSettingsSchema } from '@/types/settings';
import { WebhookSection } from './WebhookSection';
import { OAuthSection } from './OAuthSection';
import { NotificationSection } from './NotificationSection';

interface IntegrationSettingsFormProps {
  initialData?: IntegrationSettingsFormData;
  onSubmit: (data: IntegrationSettingsFormData) => Promise<void>;
  onTestWebhook?: (url: string, secret?: string) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Form for managing integration settings
 * Includes webhook configuration, OAuth settings, and notification preferences
 */
export function IntegrationSettingsForm({
  initialData,
  onSubmit,
  onTestWebhook,
  isSubmitting = false
}: IntegrationSettingsFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm<IntegrationSettingsFormData>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: initialData
  });

  // Watch specific fields with type safety
  const webhookEnabled = watch('webhooks.enabled') as boolean;
  const emailNotificationsEnabled = watch(
    'notifications.email_notifications'
  ) as boolean;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Webhook Configuration */}
      <WebhookSection
        register={register}
        errors={errors}
        enabled={webhookEnabled}
        onTest={onTestWebhook}
        watch={watch}
      />

      {/* OAuth Settings */}
      <OAuthSection register={register} errors={errors} />

      {/* Notification Settings */}
      <NotificationSection
        register={register}
        errors={errors}
        emailEnabled={emailNotificationsEnabled}
      />

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
