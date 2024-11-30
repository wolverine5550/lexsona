'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import { profileSchema, type ProfileFormData } from '@/types/settings';
import type { ExtendedUser } from '@/types/supabase';

/**
 * Profile settings component
 * Handles user profile information and preferences
 */
export function ProfileSettings() {
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
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onSubmit'
  });

  // Load user's profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      try {
        const { data, error } = await settingsService.profile.getProfile(
          user.id
        );
        if (error) throw error;
        if (data) {
          reset(data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Failed to load profile'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user?.id, reset]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    try {
      setSubmitStatus(null);
      const { error } = await settingsService.profile.updateProfile(
        user.id,
        data
      );
      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update profile'
      });
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div
        className="p-6 space-y-4 animate-pulse"
        data-testid="profile-settings-skeleton"
      >
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 p-6"
      role="form"
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            {...register('bio')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            {...register('location')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">
              {errors.location.message}
            </p>
          )}
        </div>

        {/* Expertise */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Areas of Expertise
          </label>
          <div className="mt-2 space-y-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="expertise-react"
                  type="checkbox"
                  {...register('expertise')}
                  value="react"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="expertise-react"
                  className="text-sm text-gray-700"
                >
                  React
                </label>
              </div>
            </div>
          </div>
          {errors.expertise && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expertise.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
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
        >
          {submitStatus.message}
        </div>
      )}
    </form>
  );
}
