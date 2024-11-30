'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import {
  privacySchema,
  type PrivacySettings,
  type PrivacyLevel
} from '@/types/settings';
import type { ExtendedUser } from '@/types/supabase';
import { PrivacySettingsSkeleton } from '@/components/ui/PrivacySettingsSkeleton';
import type { FieldErrors } from 'react-hook-form';

// Define labels for privacy levels
const privacyLevelLabels: Record<PrivacyLevel, string> = {
  public: 'Everyone',
  private: 'Only me',
  connections: 'My connections'
};

// Define descriptions for privacy levels
const privacyLevelDescriptions: Record<PrivacyLevel, string> = {
  public: 'Anyone can see this information',
  private: 'Only you can see this information',
  connections: 'Only people you are connected with can see this information'
};

// Define section descriptions
const sectionDescriptions = {
  profile_visibility: {
    title: 'Profile Visibility',
    description: 'Control who can see different parts of your profile'
  },
  discovery: {
    title: 'Search & Discovery',
    description: 'Manage how others can find and interact with your profile'
  },
  communication: {
    title: 'Communication',
    description: 'Control how others can communicate with you'
  }
};

// Helper function for generating unique IDs
const generateId = (section: string, field: string) =>
  `privacy-${section}-${field}`;

export default function PrivacySettings() {
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
  } = useForm<PrivacySettings>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      // Set sensible defaults for new users
      profile_visibility: {
        basic_info: 'public',
        contact_info: 'connections',
        expertise: 'public'
      },
      discovery: {
        show_in_search: true,
        allow_recommendations: true,
        show_online_status: true
      },
      communication: {
        allow_messages: 'connections',
        allow_connection_requests: true,
        show_read_receipts: true
      }
    }
  });

  // Type-safe error accessor
  const getFieldError = (field: string) => {
    type FormErrors = FieldErrors<PrivacySettings>;
    const [section, key] = field.split('.');

    if (
      section === 'profile_visibility' ||
      section === 'discovery' ||
      section === 'communication'
    ) {
      const sectionErrors = errors[section as keyof FormErrors];
      if (sectionErrors) {
        // Type assertion for the field error
        type FieldErrorType = {
          type?: string;
          message?: string;
        };
        const fieldError = sectionErrors[
          key as keyof typeof sectionErrors
        ] as FieldErrorType;
        return fieldError?.message;
      }
    }
    return undefined;
  };

  // Type-safe error checker
  const hasFieldError = (field: string) => {
    type FormErrors = FieldErrors<PrivacySettings>;
    const [section, key] = field.split('.');

    if (
      section === 'profile_visibility' ||
      section === 'discovery' ||
      section === 'communication'
    ) {
      const sectionErrors = errors[section as keyof FormErrors];
      if (sectionErrors) {
        return !!sectionErrors[key as keyof typeof sectionErrors];
      }
    }
    return false;
  };

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  // Load user's privacy settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      try {
        const { data, error } = await settingsService.privacy.getSettings(
          user.id
        );

        if (error) throw error;

        if (data?.settings) {
          // Type assertion for settings data
          const settings = data.settings as PrivacySettings;

          // Update form with saved settings
          Object.entries(settings).forEach(([key, value]) => {
            if (
              key === 'profile_visibility' ||
              key === 'discovery' ||
              key === 'communication'
            ) {
              setValue(key, value);
            }
          });
          // Reset form state after loading
          reset(settings);
        }
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Failed to load privacy settings'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user?.id, setValue, reset]);

  // Handle form submission
  const onSubmit = async (data: PrivacySettings) => {
    if (!user?.id) return;

    try {
      setSubmitStatus(null);

      const { error } = await settingsService.privacy.updateSettings(
        user.id,
        data
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Privacy settings updated successfully'
      });

      // Reset form state but keep values
      reset(data);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update privacy settings'
      });
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return <PrivacySettingsSkeleton />;
  }

  // Radio group component with accessibility
  const RadioGroup = ({
    name,
    label,
    description,
    field
  }: {
    name: string;
    label: string;
    description?: string;
    field:
      | `profile_visibility.${keyof PrivacySettings['profile_visibility']}`
      | 'communication.allow_messages';
  }) => (
    <div
      className="space-y-2"
      role="radiogroup"
      aria-labelledby={`${name}-label`}
    >
      <label
        id={`${name}-label`}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {description && (
        <p id={`${name}-description`} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      <div className="flex space-x-4">
        {(['public', 'private', 'connections'] as const).map((level) => {
          const id = generateId(name, level);
          return (
            <label
              key={level}
              htmlFor={id}
              className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
            >
              <input
                id={id}
                type="radio"
                {...register(field)}
                value={level}
                aria-describedby={`${id}-description`}
                className="sr-only"
              />
              <div className="flex flex-1">
                <div className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900">
                    {privacyLevelLabels[level]}
                  </span>
                  <span
                    id={`${id}-description`}
                    className="mt-1 flex items-center text-sm text-gray-500"
                  >
                    {privacyLevelDescriptions[level]}
                  </span>
                </div>
              </div>
              <div
                className={`absolute -inset-px rounded-lg border-2 pointer-events-none ${
                  watch(field) === level
                    ? 'border-blue-500'
                    : 'border-transparent'
                }`}
                aria-hidden="true"
              />
            </label>
          );
        })}
      </div>
      {hasFieldError(field) && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {getFieldError(field)}
        </p>
      )}
    </div>
  );

  // Toggle component with accessibility
  const Toggle = ({
    name,
    label,
    description,
    field
  }: {
    name: string;
    label: string;
    description: string;
    field:
      | `discovery.${keyof PrivacySettings['discovery']}`
      | `communication.${keyof PrivacySettings['communication']}`;
  }) => {
    const id = generateId(name, field.split('.')[1]);
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            type="checkbox"
            {...register(field)}
            aria-describedby={`${id}-description`}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
        <div className="ml-3">
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <p id={`${id}-description`} className="text-sm text-gray-500">
            {description}
          </p>
          {hasFieldError(field) && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {getFieldError(field)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 p-6"
      noValidate // Use custom validation
      aria-label="Privacy Settings Form"
    >
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-lg font-medium text-gray-900">Privacy Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control your privacy and visibility preferences
        </p>
      </div>

      {/* Profile Visibility Section */}
      <section
        aria-labelledby="profile-visibility-heading"
        className="space-y-6"
      >
        <div>
          <h2
            id="profile-visibility-heading"
            className="text-base font-medium text-gray-900"
          >
            {sectionDescriptions.profile_visibility.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {sectionDescriptions.profile_visibility.description}
          </p>
        </div>

        <RadioGroup
          name="basic-info"
          label="Basic Information"
          field="profile_visibility.basic_info"
        />

        <RadioGroup
          name="contact-info"
          label="Contact Information"
          field="profile_visibility.contact_info"
        />

        <RadioGroup
          name="expertise"
          label="Areas of Expertise"
          field="profile_visibility.expertise"
        />
      </section>

      {/* Discovery Section */}
      <section
        aria-labelledby="discovery-heading"
        className="space-y-6 pt-6 border-t border-gray-200"
      >
        <div>
          <h2
            id="discovery-heading"
            className="text-base font-medium text-gray-900"
          >
            {sectionDescriptions.discovery.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {sectionDescriptions.discovery.description}
          </p>
        </div>

        <Toggle
          name="discovery"
          label="Show in Search Results"
          description="Allow your profile to appear in search results"
          field="discovery.show_in_search"
        />

        <Toggle
          name="discovery"
          label="Allow Profile Recommendations"
          description="Let us recommend your profile to others based on shared interests"
          field="discovery.allow_recommendations"
        />

        <Toggle
          name="discovery"
          label="Show Online Status"
          description="Display when you are actively using the platform"
          field="discovery.show_online_status"
        />
      </section>

      {/* Communication Section */}
      <section
        aria-labelledby="communication-heading"
        className="space-y-6 pt-6 border-t border-gray-200"
      >
        <div>
          <h2
            id="communication-heading"
            className="text-base font-medium text-gray-900"
          >
            {sectionDescriptions.communication.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {sectionDescriptions.communication.description}
          </p>
        </div>

        <RadioGroup
          name="communication"
          label="Message Permissions"
          field="communication.allow_messages"
        />

        <Toggle
          name="communication"
          label="Allow Connection Requests"
          description="Let others send you connection requests"
          field="communication.allow_connection_requests"
        />

        <Toggle
          name="communication"
          label="Show Read Receipts"
          description="Let others know when you have read their messages"
          field="communication.show_read_receipts"
        />
      </section>

      {/* Form Actions */}
      <div
        className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200"
        role="group"
        aria-label="Form Actions"
      >
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
          disabled={!isDirty || isSubmitting || hasErrors}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          aria-busy={isSubmitting}
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
