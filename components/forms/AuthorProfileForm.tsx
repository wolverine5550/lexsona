'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types_db';
import Image from 'next/image';
import LoadingButton from '@/components/ui/LoadingButton';
import { z } from 'zod';
import Skeleton from '@/components/ui/Skeleton';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { useSession } from '@/hooks/useSession';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from '@/components/ui/Toasts/use-toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { withErrorBoundary } from '@/components/ui/ErrorBoundary';
import { withTimeout, RequestTimeoutError } from '@/utils/request-handlers';
import { useRequestQueue } from '@/hooks/useRequestQueue';

/**
 * Props for the AuthorProfileForm component
 * @param existingProfile - The user's existing profile data, if any
 */
type Props = {
  existingProfile?:
    | Database['public']['Tables']['author_profiles']['Row']
    | null;
};

/**
 * Social media platform configuration
 * Defines the supported platforms and their input configurations
 */
const SOCIAL_PLATFORMS = {
  facebook: {
    label: 'Facebook Profile URL',
    placeholder: 'https://facebook.com/username',
    icon: '🔗' // We can replace these with proper icons later
  },
  twitter: {
    label: 'X (Twitter) Profile URL',
    placeholder: 'https://x.com/username',
    icon: '🔗'
  },
  instagram: {
    label: 'Instagram Profile URL',
    placeholder: 'https://instagram.com/username',
    icon: '🔗'
  },
  linkedin: {
    label: 'LinkedIn Profile URL',
    placeholder: 'https://linkedin.com/in/username',
    icon: '🔗'
  }
};

/**
 * Define validation schemas
 */
const socialUrlSchema = z.string().url().optional().or(z.literal(''));

const authorProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s-']+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s-']+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must be less than 500 characters'),

  expertise: z
    .array(z.string())
    .min(1, 'At least one area of expertise is required')
    .max(5, 'Maximum 5 areas of expertise allowed'),

  socialLinks: z.object({
    facebook: socialUrlSchema,
    twitter: socialUrlSchema,
    instagram: socialUrlSchema,
    linkedin: socialUrlSchema
  })
});

// Add type for validation errors
type ValidationErrors = {
  [key: string]: string[];
};

// Add type for the field schema shape
type SchemaShape = typeof authorProfileSchema.shape;

// Add type for upload errors
type UploadError = {
  type: 'upload_error' | 'storage_error' | 'network_error';
  message: string;
  details?: string;
};

// Add retry logic constants
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Delay helper function for retry logic
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Base Author Profile Form Component
 * Handles creation and updates of author profiles
 */
function AuthorProfileForm({ existingProfile }: Props) {
  const router = useRouter();
  const { session, isLoading: isSessionLoading, refreshSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState(existingProfile?.first_name || '');
  const [lastName, setLastName] = useState(existingProfile?.last_name || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [expertise, setExpertise] = useState<string[]>(
    existingProfile?.expertise || []
  );
  const [socialLinks, setSocialLinks] = useState<{ [key: string]: string }>(
    existingProfile?.social_links || {}
  );
  const [avatarUrl, setAvatarUrl] = useState(existingProfile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string[];
  }>({});

  // Add touched state to track which fields have been interacted with
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Add new state for form loading
  const [isFormLoading, setIsFormLoading] = useState(true);

  // Add new state for tracking form changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add form state tracking
  const initialFormState = {
    firstName: existingProfile?.first_name || '',
    lastName: existingProfile?.last_name || '',
    bio: existingProfile?.bio || '',
    expertise: existingProfile?.expertise || [],
    socialLinks: existingProfile?.social_links || {},
    avatarUrl: existingProfile?.avatar_url || ''
  };

  // Add network status hook
  const { isOnline, wasOffline, hasBeenOfflineTooLong } = useNetworkStatus();

  // Add request queue hook
  const { queueStatus, addToQueue } = useRequestQueue();

  /**
   * Checks if the current form state differs from the initial state
   * @returns boolean indicating if there are unsaved changes
   */
  const checkForChanges = () => {
    const currentFormState = {
      firstName,
      lastName,
      bio,
      expertise,
      socialLinks,
      avatarUrl
    };

    return (
      JSON.stringify(currentFormState) !== JSON.stringify(initialFormState)
    );
  };

  /**
   * Marks a field as touched when user interacts with it
   * @param fieldName - The name of the field being touched
   */
  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  /**
   * Validates a single field
   * @param fieldName - The name of the field to validate
   * @param value - The current value of the field
   */
  const validateField = (fieldName: keyof SchemaShape, value: any) => {
    try {
      // Extract the relevant part of the schema for this field
      const fieldSchema = authorProfileSchema.shape[fieldName];
      fieldSchema.parse(value);

      // Clear errors for this field if validation passes
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: err.errors.map((e) => e.message)
        }));
      }
    }
  };

  // Enhance existing change handlers with validation
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('firstName')) {
      validateField('firstName', value);
    }
  };

  // Add handler for lastName
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    if (touchedFields.has('lastName')) {
      validateField('lastName', value);
    }
  };

  /**
   * Handles avatar file selection
   * Validates file type and size before setting state
   */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    // Create a preview URL
    setAvatarUrl(URL.createObjectURL(file));
  };

  /**
   * Updates a social media link
   * @param platform - The social media platform (e.g., 'facebook', 'twitter')
   * @param url - The profile URL
   */
  const handleSocialLinkChange = (platform: string, url: string) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: url
    }));
  };

  /**
   * Enhanced avatar upload with retry logic and better error handling
   * @param supabase - Supabase client instance
   * @param userId - Current user's ID
   * @param retryCount - Current retry attempt number
   * @returns URL of uploaded avatar or throws error
   */
  const uploadAvatar = async (
    supabase: any,
    userId: string,
    retryCount = 0
  ): Promise<string> => {
    if (!avatarFile) return avatarUrl;

    try {
      // Check if storage bucket is available
      const { data: bucketData, error: bucketError } =
        await supabase.storage.getBucket('avatars');

      if (bucketError) {
        throw {
          type: 'storage_error',
          message: 'Unable to access storage',
          details: bucketError.message
        } as UploadError;
      }

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;

      // Attempt file upload
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Handle specific error cases
        if (error.statusCode === 413) {
          throw {
            type: 'upload_error',
            message: 'File size too large',
            details: 'Please upload a smaller image'
          } as UploadError;
        }

        // If we haven't exceeded retry attempts, try again
        if (retryCount < MAX_UPLOAD_RETRIES) {
          await delay(RETRY_DELAY * (retryCount + 1));
          return uploadAvatar(supabase, userId, retryCount + 1);
        }

        throw {
          type: 'upload_error',
          message: 'Failed to upload image',
          details: error.message
        } as UploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
        error: urlError
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (urlError) {
        throw {
          type: 'storage_error',
          message: 'Failed to get public URL',
          details: urlError.message
        } as UploadError;
      }

      return publicUrl;
    } catch (err) {
      // If it's already an UploadError, rethrow it
      if ((err as UploadError).type) {
        throw err;
      }

      // Handle network errors
      if (
        err instanceof Error &&
        'code' in err &&
        err.code === 'NETWORK_ERROR'
      ) {
        throw {
          type: 'network_error',
          message: 'Network connection error',
          details: 'Please check your internet connection'
        } as UploadError;
      }

      // Handle any other unexpected errors
      throw {
        type: 'upload_error',
        message: 'Unexpected error during upload',
        details: err instanceof Error ? err.message : 'Unknown error occurred'
      } as UploadError;
    }
  };

  /**
   * Validates all form fields before submission
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    try {
      authorProfileSchema.parse({
        firstName,
        lastName,
        bio,
        expertise,
        socialLinks
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: ValidationErrors = {};
        err.errors.forEach((error) => {
          const path = error.path[0] as keyof SchemaShape;
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(error.message);
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  /**
   * Show network status toast when connection changes
   */
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: 'You are offline',
        description: 'Changes will be saved when you reconnect',
        variant: 'destructive'
      });
    } else if (wasOffline) {
      toast({
        title: 'Back online',
        description: 'Your connection has been restored'
      });
    }
  }, [isOnline, wasOffline]);

  /**
   * Enhanced form submission with offline support and request queuing
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields first
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If offline, queue the request
      if (!isOnline) {
        // Create a request function that will be executed when back online
        await addToQueue(async () => {
          const supabase = createClient();
          const {
            data: { user }
          } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');

          // Upload avatar first if changed
          const finalAvatarUrl = avatarFile
            ? await uploadAvatar(supabase, user.id)
            : avatarUrl;

          const profileData = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            bio,
            expertise,
            social_links: socialLinks,
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString()
          };

          return supabase.from('author_profiles').upsert(profileData);
        });

        // Show success message for queued request
        toast({
          title: 'Changes queued',
          description:
            "Your profile updates will be saved when you're back online"
        });

        setIsLoading(false);
        return;
      }

      // If online, proceed with normal submission
      // Wrap the Supabase operations with timeout handling
      await withTimeout(
        async () => {
          // Check session before submission
          if (!session) {
            throw new Error('No active session found');
          }

          const supabase = createClient();

          // Verify user session with timeout
          const { user, error: userError } = await withTimeout(
            async () => {
              const {
                data: { user },
                error
              } = await supabase.auth.getUser();
              if (error) throw error;
              return { user, error };
            },
            { timeoutMs: 3000 } // 3 second timeout for auth check
          );

          if (userError) {
            // Attempt to refresh session
            const refreshed = await refreshSession();
            if (!refreshed) {
              throw new Error('Session expired. Please sign in again.');
            }
          }

          if (!user) throw new Error('No user found');

          // Upload avatar with timeout if changed
          const finalAvatarUrl = avatarFile
            ? await withTimeout(() => uploadAvatar(supabase, user.id), {
                timeoutMs: 15000, // 15 second timeout for file upload
                maxRetries: 2, // Try up to 2 times
                retryDelayMs: 2000 // Wait 2 seconds between retries
              })
            : avatarUrl;

          // Prepare profile data
          const profileData = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            bio,
            expertise,
            social_links: socialLinks,
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString()
          };

          // Update or insert profile with timeout
          const { error: upsertError } = await withTimeout(
            async () => supabase.from('author_profiles').upsert(profileData),
            { timeoutMs: 5000 } // 5 second timeout for database operation
          );

          if (upsertError) throw upsertError;

          // Handle successful submission
          if (!existingProfile) {
            router.push('/onboarding/book');
          } else {
            setIsLoading(false);
            router.refresh();
          }
        },
        {
          timeoutMs: 30000, // 30 second timeout for entire operation
          maxRetries: 2, // Try up to 2 times
          retryDelayMs: 1000 // Wait 1 second between retries
        }
      );
    } catch (err) {
      if (err instanceof RequestTimeoutError) {
        setError('The request timed out. Please try again.');
      } else if (err instanceof Error) {
        if (err.message.includes('session')) {
          router.push(
            '/signin?message=Your session has expired. Please sign in again.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong');
      }
      setIsLoading(false);
    }
  };

  // Add error display component for field-level errors
  const FieldError = ({ fieldName }: { fieldName: string }) => {
    const errors = validationErrors[fieldName];
    if (!errors || !touchedFields.has(fieldName)) return null;

    return (
      <div className="mt-1 text-sm text-red-500">
        {errors.map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </div>
    );
  };

  // Add useEffect to simulate initial data loading
  useEffect(() => {
    // Simulate loading existing profile data
    const loadProfileData = async () => {
      try {
        setIsFormLoading(true);
        // If we have an existing profile, we're already done loading
        if (existingProfile) {
          setIsFormLoading(false);
          return;
        }
        // Simulate loading time for new profiles
        await delay(1000);
        setIsFormLoading(false);
      } catch (error) {
        setError('Failed to load profile data');
        setIsFormLoading(false);
      }
    };

    loadProfileData();
  }, [existingProfile]);

  // Add loading skeleton component
  const FormSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-32" />
      <Skeleton className="h-10" />
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );

  // Show loading state while session is being checked
  if (isSessionLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Show error if no session is found
  if (!session) {
    router.push('/signin');
    return null;
  }

  return (
    <>
      <UnsavedChangesAlert
        hasUnsavedChanges={hasUnsavedChanges}
        message="You have unsaved changes in your profile. Are you sure you want to leave?"
      />
      {isFormLoading ? (
        <FormSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add queue status indicator */}
          {queueStatus.pending > 0 && (
            <div className="rounded-md bg-blue-500/20 p-3 text-sm text-blue-500">
              {queueStatus.processing ? (
                <p>
                  Processing queued changes... ({queueStatus.pending} remaining)
                </p>
              ) : (
                <p>
                  {queueStatus.pending} changes queued for when you're back
                  online
                </p>
              )}
            </div>
          )}

          {/* Add offline indicator */}
          {!isOnline && (
            <div className="rounded-md bg-yellow-500/20 p-3 text-sm text-yellow-500">
              You are currently offline. Your changes will be saved when you
              reconnect.
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-zinc-200"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={handleFirstNameChange}
                onBlur={() => handleFieldTouch('firstName')}
                className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
                  validationErrors.firstName && touchedFields.has('firstName')
                    ? 'border-red-500'
                    : ''
                }`}
                required
              />
              <FieldError fieldName="firstName" />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-zinc-200"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={handleLastNameChange}
                onBlur={() => handleFieldTouch('lastName')}
                className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
                  validationErrors.lastName && touchedFields.has('lastName')
                    ? 'border-red-500'
                    : ''
                }`}
                required
              />
              <FieldError fieldName="lastName" />
            </div>
          </div>

          {/* Avatar Upload */}
          <div>
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-zinc-200"
            >
              Profile Photo
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {avatarUrl && (
                <div className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image
                    src={avatarUrl}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="rounded-md border border-zinc-700 bg-zinc-800 text-white file:mr-4 file:border-0 file:bg-zinc-700 file:px-4 file:py-2 file:text-white hover:file:bg-zinc-600"
              />
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Optional. Maximum file size: 5MB
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-zinc-200"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
              required
            />
          </div>

          {/* Expertise Field */}
          <div>
            <label
              htmlFor="expertise"
              className="block text-sm font-medium text-zinc-200"
            >
              Areas of Expertise (comma-separated)
            </label>
            <input
              type="text"
              id="expertise"
              value={expertise.join(', ')}
              onChange={(e) =>
                setExpertise(e.target.value.split(',').map((s) => s.trim()))
              }
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
              placeholder="e.g., Marketing, Technology, Self-Help"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Social Media Links
            </h3>
            {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => (
              <div key={platform}>
                <label
                  htmlFor={platform}
                  className="block text-sm font-medium text-zinc-200"
                >
                  {config.icon} {config.label}
                </label>
                <input
                  type="url"
                  id={platform}
                  value={socialLinks[platform] || ''}
                  onChange={(e) =>
                    handleSocialLinkChange(platform, e.target.value)
                  }
                  className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
                  placeholder={config.placeholder}
                />
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            disabled={isSessionLoading}
          >
            {existingProfile ? 'Update Profile' : 'Create Profile'}
          </LoadingButton>
        </form>
      )}
    </>
  );
}

/**
 * Wrapped version of AuthorProfileForm with error boundary
 * This is the default export that will be used by other components
 */
export default withErrorBoundary(
  AuthorProfileForm,
  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
    <h3 className="text-lg font-semibold text-red-500">
      Error Loading Profile Form
    </h3>
    <p className="mt-2 text-sm text-zinc-400">
      There was a problem loading the profile form. Please refresh the page or
      try again later.
    </p>
  </div>
);
