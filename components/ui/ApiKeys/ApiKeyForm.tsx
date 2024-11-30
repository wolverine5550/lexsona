'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ApiKeyFormData, ApiKeyScope } from '@/types/settings';
import { apiKeySchema } from '@/types/settings';

interface ApiKeyFormProps {
  onSubmit: (data: ApiKeyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Form for creating new API keys
 * Includes name, description, scopes, and expiration settings
 */
export function ApiKeyForm({
  onSubmit,
  isSubmitting = false
}: ApiKeyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema)
  });

  // Available scopes with descriptions
  const availableScopes: Record<ApiKeyScope, string> = {
    'read:profile': 'Read profile information',
    'write:profile': 'Update profile information',
    'read:podcasts': 'Read podcast data',
    'write:podcasts': 'Create and update podcast data',
    'read:analytics': 'Access analytics data',
    'read:interviews': 'Read interview information',
    'write:interviews': 'Schedule and update interviews'
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Key Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="e.g., Production API Key"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="What will this key be used for?"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Scopes Selection */}
      <div>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">
            Permissions
          </legend>
          <div className="mt-2 space-y-2">
            {Object.entries(availableScopes).map(([scope, description]) => (
              <div key={scope} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    {...register('scopes')}
                    value={scope}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    {scope}
                  </label>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
          {errors.scopes && (
            <p className="mt-1 text-sm text-red-600">{errors.scopes.message}</p>
          )}
        </fieldset>
      </div>

      {/* Expiration Field */}
      <div>
        <label
          htmlFor="expires_at"
          className="block text-sm font-medium text-gray-700"
        >
          Expiration (Optional)
        </label>
        <input
          type="datetime-local"
          id="expires_at"
          {...register('expires_at')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.expires_at && (
          <p className="mt-1 text-sm text-red-600">
            {errors.expires_at.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create API Key'}
        </button>
      </div>
    </form>
  );
}
