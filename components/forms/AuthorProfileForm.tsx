'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';

// Constants for form options
const EXPERTISE_OPTIONS = [
  'Fiction Writing',
  'Non-Fiction',
  'Business',
  'Self-Help',
  'Technology',
  'Health & Wellness',
  'Education',
  'Personal Development',
  'Science',
  'History',
  'Politics',
  'Arts & Culture'
];

const SOCIAL_PLATFORMS = {
  website: 'Website',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok'
} as const;

interface AuthorProfileFormProps {
  existingProfile?: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    expertise?: string[];
    social_links?: {
      website?: string;
      x?: string;
      linkedin?: string;
      instagram?: string;
      tiktok?: string;
    };
  };
}

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

interface FormErrors {
  firstName?: string;
  lastName?: string;
  bio?: string;
  expertise?: string[];
  submit?: string;
}

export function AuthorProfileForm({ existingProfile }: AuthorProfileFormProps) {
  const router = useRouter();
  const { markStepComplete } = useOnboarding();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  // Initialize form data with default values
  const defaultFormData: AuthorProfileFormData = {
    firstName: existingProfile?.first_name || '',
    lastName: existingProfile?.last_name || '',
    bio: existingProfile?.bio || '',
    expertise: existingProfile?.expertise || [],
    socialLinks: existingProfile?.social_links || {
      website: '',
      x: '',
      linkedin: '',
      instagram: '',
      tiktok: ''
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Use form persistence hook with proper initialization
  const { formData, setFormData, clearSavedData } =
    useFormPersistence<AuthorProfileFormData>({
      key: 'author_profile',
      initialData: defaultFormData
    });

  // Ensure formData is never null by using defaultFormData as fallback
  const currentFormData = formData || defaultFormData;

  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!currentFormData.firstName)
      newErrors.firstName = 'First name is required';
    if (!currentFormData.lastName) newErrors.lastName = 'Last name is required';
    if (!currentFormData.bio || currentFormData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }
    if (currentFormData.expertise.length === 0) {
      newErrors.expertise = [];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof AuthorProfileFormData,
    value: string | string[]
  ) => {
    const updatedData = { ...currentFormData, [field]: value };
    setFormData(updatedData);
    // Only validate if form has been submitted once
    if (isSubmitted) {
      validateForm();
    }
  };

  const handleExpertiseToggle = (expertise: string) => {
    const current = currentFormData.expertise;
    const updated = current.includes(expertise)
      ? current.filter((e) => e !== expertise)
      : [...current, expertise];

    handleChange('expertise', updated);
  };

  const handleSocialLinkChange = (
    platform: keyof typeof currentFormData.socialLinks,
    value: string
  ) => {
    const updatedData = {
      ...currentFormData,
      socialLinks: {
        ...currentFormData.socialLinks,
        [platform]: value
      }
    };
    setFormData(updatedData);
    validateForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('author_profiles').upsert({
        id: user.id,
        first_name: currentFormData.firstName,
        last_name: currentFormData.lastName,
        bio: currentFormData.bio,
        expertise: currentFormData.expertise,
        social_links: currentFormData.socialLinks
      });

      if (error) throw error;

      // Mark step as complete
      await markStepComplete(0);

      // Clear form data
      clearSavedData();

      // Add a small delay before navigation to ensure state updates are complete
      setTimeout(() => {
        // Use window.location for a full page navigation
        window.location.href = '/onboarding/book';
      }, 100);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setErrors({
        submit: `Failed to save profile: ${error.message}`
      });
      setLoading(false);
    }
  };

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-500">{errors.submit}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-white"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={currentFormData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-white"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={currentFormData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-white">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={currentFormData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
          )}
          <p className="mt-2 text-sm text-zinc-400">
            Minimum 50 characters. This will be shown on your public profile.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Areas of Expertise
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERTISE_OPTIONS.map((expertise) => (
              <label
                key={expertise}
                className={`flex cursor-pointer items-center space-x-2 rounded-lg border p-4 ${
                  currentFormData.expertise.includes(expertise)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={currentFormData.expertise.includes(expertise)}
                  onChange={() => handleExpertiseToggle(expertise)}
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-200">{expertise}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Social Media Links (Optional)
          </label>
          <div className="mt-2 space-y-4">
            {Object.entries(SOCIAL_PLATFORMS).map(([platform, label]) => (
              <div key={platform}>
                <label
                  htmlFor={platform}
                  className="block text-sm font-medium text-zinc-400"
                >
                  {label}
                </label>
                <input
                  type="url"
                  id={platform}
                  name={platform}
                  value={
                    currentFormData.socialLinks[
                      platform as keyof typeof currentFormData.socialLinks
                    ]
                  }
                  onChange={(e) =>
                    handleSocialLinkChange(
                      platform as keyof typeof currentFormData.socialLinks,
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Your ${label} URL`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Submitting...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
