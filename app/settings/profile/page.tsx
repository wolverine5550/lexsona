'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import { profileSchema, type ProfileFormData } from '@/types/settings';

// Available expertise options
const expertiseOptions = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Education',
  'Arts',
  'Entertainment',
  'Politics',
  'Sports',
  'Finance'
];

export default function ProfileSettings() {
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      expertise: []
    }
  });

  // Load initial profile data
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await settingsService.profile.getProfile(
          session.user.id
        );

        if (error) throw error;

        if (data) {
          // Set form values
          setValue('name', data.name);
          setValue('bio', data.bio || '');
          setValue('location', data.location || '');
          setValue('website', data.website || '');
          setValue('title', data.title || '');
          setValue('company', data.company || '');
          setValue('expertise', data.expertise || []);
          setValue('twitter', data.social_links?.twitter || '');
          setValue('linkedin', data.social_links?.linkedin || '');

          // Reset form state
          reset(data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Failed to load profile data'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session?.user?.id, setValue, reset]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    if (!session?.user?.id) return;

    try {
      setSubmitStatus(null);

      const { error } = await settingsService.profile.updateProfile(
        session.user.id,
        data
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Profile updated successfully'
      });

      // Reset form dirty state but keep values
      reset(data);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        {/* Add more skeleton items as needed */}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
      {/* Form Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your public profile information
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">
          Basic Information
        </h3>

        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Bio Field */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            {...register('bio')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        {/* Location Field */}
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="City, Country"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">
              {errors.location.message}
            </p>
          )}
        </div>

        {/* Website Field */}
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            {...register('website')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://example.com"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">
              {errors.website.message}
            </p>
          )}
        </div>
      </div>

      {/* Professional Information Section */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-base font-medium text-gray-900">
          Professional Information
        </h3>

        {/* Title Field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Professional Title
          </label>
          <input
            type="text"
            id="title"
            {...register('title')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Author, Speaker, Consultant"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Company Field */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700"
          >
            Company/Organization
          </label>
          <input
            type="text"
            id="company"
            {...register('company')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-600">
              {errors.company.message}
            </p>
          )}
        </div>

        {/* Expertise Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Areas of Expertise <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-sm text-gray-500">
            Select up to 5 areas that best describe your expertise
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {expertiseOptions.map((option) => (
              <label
                key={option}
                className="relative flex items-start py-2 px-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <input
                    type="checkbox"
                    {...register('expertise')}
                    value={option}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">{option}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.expertise && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expertise.message}
            </p>
          )}
        </div>
      </div>

      {/* Social Media Section */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <h3 className="text-base font-medium text-gray-900">Social Media</h3>

        {/* Twitter Field */}
        <div>
          <label
            htmlFor="twitter"
            className="block text-sm font-medium text-gray-700"
          >
            Twitter Handle
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              @
            </span>
            <input
              type="text"
              id="twitter"
              {...register('twitter')}
              className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {errors.twitter && (
            <p className="mt-1 text-sm text-red-600">
              {errors.twitter.message}
            </p>
          )}
        </div>

        {/* LinkedIn Field */}
        <div>
          <label
            htmlFor="linkedin"
            className="block text-sm font-medium text-gray-700"
          >
            LinkedIn Profile
          </label>
          <input
            type="url"
            id="linkedin"
            {...register('linkedin')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://linkedin.com/in/username"
          />
          {errors.linkedin && (
            <p className="mt-1 text-sm text-red-600">
              {errors.linkedin.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
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
        >
          {submitStatus.message}
        </div>
      )}
    </form>
  );
}
