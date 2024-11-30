'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { IntegrationSettingsFormData } from '@/types/settings';

interface OAuthSectionProps {
  register: UseFormRegister<IntegrationSettingsFormData>;
  errors: FieldErrors<IntegrationSettingsFormData>;
}

/**
 * OAuth configuration section
 * Handles OAuth client credentials and redirect URI settings
 */
export function OAuthSection({ register, errors }: OAuthSectionProps) {
  return (
    <section className="space-y-6 pt-6 border-t border-gray-200">
      <div>
        <h3 className="text-lg font-medium text-gray-900">OAuth Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure OAuth credentials for third-party integrations
        </p>
      </div>

      {/* Client ID */}
      <div>
        <label
          htmlFor="client-id"
          className="block text-sm font-medium text-gray-700"
        >
          Client ID
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="client-id"
            {...register('oauth.client_id')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.oauth?.client_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.oauth.client_id.message}
            </p>
          )}
        </div>
      </div>

      {/* Client Secret */}
      <div>
        <label
          htmlFor="client-secret"
          className="block text-sm font-medium text-gray-700"
        >
          Client Secret
        </label>
        <div className="mt-1">
          <input
            type="password"
            id="client-secret"
            {...register('oauth.client_secret')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.oauth?.client_secret && (
            <p className="mt-1 text-sm text-red-600">
              {errors.oauth.client_secret.message}
            </p>
          )}
        </div>
      </div>

      {/* Redirect URI */}
      <div>
        <label
          htmlFor="redirect-uri"
          className="block text-sm font-medium text-gray-700"
        >
          Redirect URI
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="redirect-uri"
            {...register('oauth.redirect_uri')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://your-app.com/oauth/callback"
          />
          {errors.oauth?.redirect_uri && (
            <p className="mt-1 text-sm text-red-600">
              {errors.oauth.redirect_uri.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
