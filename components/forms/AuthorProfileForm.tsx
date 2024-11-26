'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingSuccess } from '@/components/ui/OnboardingSuccess';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { ResumeProgress } from '@/components/ui/ResumeProgress';

interface AuthorProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  expertise: string[];
  socialLinks: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// Extend the error type to include submit error
interface FormErrors extends Partial<AuthorProfileFormData> {
  submit?: string;
}

// Available expertise options
const EXPERTISE_OPTIONS = [
  'Fiction Writing',
  'Non-Fiction',
  'Self-Help',
  'Business',
  'Technology',
  'Health & Wellness',
  'Personal Development',
  'Biography',
  'History',
  'Science',
  'Education',
  "Children's Books"
];

export function AuthorProfileForm() {
  const router = useRouter();
  const supabase = createClient();

  // Get onboarding context
  const { markStepComplete, setCanProceed } = useOnboarding();

  // Success state - moved up
  const [isSuccess, setIsSuccess] = useState(false);

  // Replace useState with useFormPersistence
  const { formData, setFormData, clearSavedData, lastSaved } =
    useFormPersistence<AuthorProfileFormData>({
      key: 'author_profile',
      initialState: {
        firstName: '',
        lastName: '',
        bio: '',
        expertise: [],
        socialLinks: {}
      }
    });

  // Track if user has chosen to discard saved progress
  const [discardedProgress, setDiscardedProgress] = useState(false);

  // Show resume progress if there's saved data and user hasn't discarded it
  const showResumeProgress = lastSaved && !discardedProgress && !isSuccess;

  // Validation state with extended error type
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate form data
   * Returns true if valid, false otherwise
   */
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }
    if (formData.expertise.length === 0) {
      // Now expertise is correctly typed as string[]
      newErrors.expertise = [];
    }

    setErrors(newErrors);

    // Update canProceed based on validation
    const isValid = Object.keys(newErrors).length === 0;
    setCanProceed(isValid);

    return isValid;
  };

  /**
   * Handle form field changes
   */
  const handleChange = (
    field: keyof AuthorProfileFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on change to provide immediate feedback
    validateForm();
  };

  /**
   * Handle expertise selection/deselection
   */
  const handleExpertiseToggle = (expertise: string) => {
    setFormData((prev) => {
      const current = prev.expertise;
      const updated = current.includes(expertise)
        ? current.filter((e) => e !== expertise)
        : [...current, expertise];

      return { ...prev, expertise: updated };
    });
    validateForm();
  };

  /**
   * Handle social link updates
   */
  const handleSocialLinkChange = (
    platform: keyof typeof formData.socialLinks,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
    validateForm();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save profile data
      const { error } = await supabase.from('author_profiles').upsert({
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        expertise: formData.expertise,
        social_links: formData.socialLinks
      });

      if (error) throw error;

      // Clear saved data on successful submission
      clearSavedData();

      // Mark step as complete and show success
      markStepComplete(1);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ submit: 'Failed to save profile' });
    }
  };

  // Show success state if complete
  if (isSuccess) {
    return (
      <OnboardingSuccess
        title="Profile Created Successfully!"
        message="Great job! Now let's add information about your book."
        nextStepPath="/onboarding/book"
        nextStepText="Add Book Details"
      />
    );
  }

  return (
    <div>
      {/* Resume Progress Banner */}
      {showResumeProgress && (
        <ResumeProgress
          lastSaved={lastSaved}
          onResume={() => {
            // Form data is already loaded by the hook
            // Just close the banner
            setDiscardedProgress(true);
          }}
          onDiscard={() => {
            clearSavedData();
            setDiscardedProgress(true);
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-200">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Bio Field */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us about yourself and your work..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
          )}
        </div>

        {/* Expertise Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Areas of Expertise
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Select all that apply to your writing and background
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {EXPERTISE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleExpertiseToggle(option)}
                className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${
                    formData.expertise.includes(option)
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  } border`}
              >
                {option}
              </button>
            ))}
          </div>
          {errors.expertise && (
            <p className="mt-2 text-sm text-red-500">
              Select at least one area of expertise
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-200">
            Social & Professional Links
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Add links to help podcasters learn more about you
          </p>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Website
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                https://
              </span>
              <input
                type="text"
                value={formData.socialLinks.website || ''}
                onChange={(e) =>
                  handleSocialLinkChange('website', e.target.value)
                }
                placeholder="yourwebsite.com"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Twitter
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                @
              </span>
              <input
                type="text"
                value={formData.socialLinks.twitter || ''}
                onChange={(e) =>
                  handleSocialLinkChange('twitter', e.target.value)
                }
                placeholder="username"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              LinkedIn
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                linkedin.com/in/
              </span>
              <input
                type="text"
                value={formData.socialLinks.linkedin || ''}
                onChange={(e) =>
                  handleSocialLinkChange('linkedin', e.target.value)
                }
                placeholder="profile"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
