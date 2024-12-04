'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { ResumeProgress } from '@/components/ui/ResumeProgress';

interface AuthorProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  expertise: string[];
  socialLinks: {
    website?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    tiktok?: string;
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

interface AuthorProfile {
  id: string;
  first_name: string;
  last_name: string;
  bio: string;
  expertise: string[];
  social_links: {
    website?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface AuthorProfileFormProps {
  existingProfile?: AuthorProfile | null;
}

export function AuthorProfileForm({ existingProfile }: AuthorProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Get onboarding context
  const { markStepComplete } = useOnboarding();

  // Remove success state since we're navigating directly
  const { formData, setFormData, clearSavedData, lastSaved } =
    useFormPersistence<AuthorProfileFormData>({
      key: 'author_profile',
      initialState: {
        firstName: existingProfile?.first_name || '',
        lastName: existingProfile?.last_name || '',
        bio: existingProfile?.bio || '',
        expertise: existingProfile?.expertise || [],
        socialLinks: existingProfile?.social_links || {}
      }
    });

  // Track if user has chosen to discard saved progress
  const [discardedProgress, setDiscardedProgress] = useState(false);

  // Show resume progress if there's saved data and user hasn't discarded it
  const showResumeProgress = lastSaved && !discardedProgress;

  // Validation state with extended error type
  const [errors, setErrors] = useState<FormErrors>({});

  // Add client-side only rendering for ResumeProgress
  const [mounted, setMounted] = useState(false);

  // Add state to track if form has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Only show ResumeProgress after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  const [hasErrors, setHasErrors] = useState(false);

  /**
   * Scroll to first error with smooth behavior
   */
  const scrollToFirstError = () => {
    // Wait for the error messages to be rendered
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.text-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Optional: Add focus for accessibility
        const nearestInput =
          firstErrorElement.previousElementSibling as HTMLElement;
        if (nearestInput) {
          nearestInput.focus();
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  };

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
      newErrors.expertise = [];
    }

    setErrors(newErrors);
    setHasErrors(Object.keys(newErrors).length > 0);

    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field changes
   */
  const handleChange = (
    field: keyof AuthorProfileFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Only validate if form has been submitted once
    if (isSubmitted) {
      validateForm();
    }
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
    setIsSubmitted(true);

    const isValid = validateForm();
    if (!isValid) {
      scrollToFirstError();
      return;
    }

    setLoading(true);
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

      // Mark step as complete (Author Profile is step 0)
      markStepComplete(0);

      // Navigate directly to book form
      router.push('/onboarding/book');
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ submit: 'Failed to save profile' });
      setHasErrors(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Resume Progress Banner - Only show after mount */}
      {mounted && showResumeProgress && (
        <ResumeProgress
          lastSaved={lastSaved}
          onResume={() => setDiscardedProgress(true)}
          onDiscard={() => {
            clearSavedData();
            setDiscardedProgress(true);
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6" role="form">
        {/* Name Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-zinc-200"
            >
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isSubmitted && errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-zinc-200"
            >
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isSubmitted && errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
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
            name="bio"
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us about yourself and your work..."
          />
          {isSubmitted && errors.bio && (
            <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
          )}
        </div>

        {/* Social Links - Moved up */}
        <div className="space-y-4">
          <label
            htmlFor="socialLinks"
            className="block text-sm font-medium text-zinc-200"
          >
            Social & Professional Links
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Add links to help podcasters learn more about you
          </p>

          {/* Website */}
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-zinc-300"
            >
              Website
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                https://
              </span>
              <input
                id="website"
                name="website"
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

          {/* X (formerly Twitter) */}
          <div>
            <label
              htmlFor="x"
              className="block text-sm font-medium text-zinc-300"
            >
              X
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                @
              </span>
              <input
                id="x"
                name="x"
                type="text"
                value={formData.socialLinks.x || ''}
                onChange={(e) => handleSocialLinkChange('x', e.target.value)}
                placeholder="username"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Instagram */}
          <div>
            <label
              htmlFor="instagram"
              className="block text-sm font-medium text-zinc-300"
            >
              Instagram
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                @
              </span>
              <input
                id="instagram"
                name="instagram"
                type="text"
                value={formData.socialLinks.instagram || ''}
                onChange={(e) =>
                  handleSocialLinkChange('instagram', e.target.value)
                }
                placeholder="username"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TikTok */}
          <div>
            <label
              htmlFor="tiktok"
              className="block text-sm font-medium text-zinc-300"
            >
              TikTok
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                @
              </span>
              <input
                id="tiktok"
                name="tiktok"
                type="text"
                value={formData.socialLinks.tiktok || ''}
                onChange={(e) =>
                  handleSocialLinkChange('tiktok', e.target.value)
                }
                placeholder="username"
                className="block w-full rounded-r-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label
              htmlFor="linkedin"
              className="block text-sm font-medium text-zinc-300"
            >
              LinkedIn
            </label>
            <div className="mt-1 flex rounded-md">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-800 bg-zinc-900 px-3 text-zinc-400">
                linkedin.com/in/
              </span>
              <input
                id="linkedin"
                name="linkedin"
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

        {/* Expertise Selection - Moved down */}
        <div>
          <label
            htmlFor="expertise"
            className="block text-sm font-medium text-zinc-200"
          >
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
          {isSubmitted && errors.expertise && (
            <p className="mt-2 text-sm text-red-500">
              Select at least one area of expertise
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className={`w-full ${hasErrors ? 'bg-red-600 hover:bg-red-700' : ''}`}
          loading={loading}
        >
          {loading
            ? 'Saving...'
            : hasErrors && isSubmitted
              ? 'Failed - Check Errors Above'
              : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
