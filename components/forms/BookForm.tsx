'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingSuccess } from '@/components/ui/OnboardingSuccess';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { ResumeProgress } from '@/components/ui/ResumeProgress';

// Book genres available for selection
const BOOK_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'Business',
  'Self-Help',
  'History',
  'Technology'
];

// Target audience options
const TARGET_AUDIENCES = [
  'General Adult',
  'Young Adult',
  'Professional',
  'Academic',
  'Children'
];

interface BookFormData {
  title: string;
  description: string;
  genre: string[];
  targetAudience: string[];
  publishDate: string;
  links: {
    amazon?: string;
    goodreads?: string;
    website?: string;
  };
  marketingGoals: string;
}

// Extend error type to include submit error
interface FormErrors extends Partial<BookFormData> {
  submit?: string;
}

export function BookForm() {
  const router = useRouter();
  const supabase = createClient();

  // Get onboarding context
  const { markStepComplete, setCanProceed } = useOnboarding();

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  // Replace useState with useFormPersistence
  const { formData, setFormData, clearSavedData, lastSaved } =
    useFormPersistence<BookFormData>({
      key: 'book_details',
      initialState: {
        title: '',
        description: '',
        genre: [],
        targetAudience: [],
        publishDate: '',
        links: {},
        marketingGoals: ''
      }
    });

  // Track if user has chosen to discard saved progress
  const [discardedProgress, setDiscardedProgress] = useState(false);

  // Show resume progress if there's saved data and user hasn't discarded it
  const showResumeProgress = lastSaved && !discardedProgress && !isSuccess;

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate form data
   * Returns true if valid, false otherwise
   */
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description || formData.description.length < 100) {
      newErrors.description = 'Description must be at least 100 characters';
    }
    if (formData.genre.length === 0) {
      newErrors.genre = [];
    }
    if (formData.targetAudience.length === 0) {
      newErrors.targetAudience = [];
    }
    if (!formData.publishDate)
      newErrors.publishDate = 'Publish date is required';
    if (!formData.marketingGoals)
      newErrors.marketingGoals = 'Marketing goals are required';

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
    field: keyof BookFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateForm();
  };

  /**
   * Handle genre selection/deselection
   */
  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => {
      const current = prev.genre;
      const updated = current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre];
      return { ...prev, genre: updated };
    });
    validateForm();
  };

  /**
   * Handle target audience selection/deselection
   */
  const handleAudienceToggle = (audience: string) => {
    setFormData((prev) => {
      const current = prev.targetAudience;
      const updated = current.includes(audience)
        ? current.filter((a) => a !== audience)
        : [...current, audience];
      return { ...prev, targetAudience: updated };
    });
    validateForm();
  };

  /**
   * Handle link updates
   */
  const handleLinkChange = (
    platform: keyof typeof formData.links,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      links: {
        ...prev.links,
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

      // Save book data
      const { error } = await supabase.from('books').insert({
        author_id: user.id,
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        target_audience: formData.targetAudience,
        publish_date: formData.publishDate,
        links: formData.links,
        marketing_goals: formData.marketingGoals
      });

      if (error) throw error;

      // Clear saved data on successful submission
      clearSavedData();

      // Mark step as complete and show success
      markStepComplete(2);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors({ submit: 'Failed to save book' });
    }
  };

  // Show success state if complete
  if (isSuccess) {
    return (
      <OnboardingSuccess
        title="Setup Complete! 🎉"
        message="Your profile and book details are ready. You can now start connecting with podcasts."
        nextStepPath="/dashboard"
        nextStepText="Go to Dashboard"
        showSkip={false} // Hide skip button since this is the final step
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
            setDiscardedProgress(true);
          }}
          onDiscard={() => {
            clearSavedData();
            setDiscardedProgress(true);
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Book Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your book's title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Book Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe your book and its key messages..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Book Genre
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Select all genres that apply to your book
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {BOOK_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreToggle(genre)}
                className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${
                    formData.genre.includes(genre)
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  } border`}
              >
                {genre}
              </button>
            ))}
          </div>
          {errors.genre && (
            <p className="mt-2 text-sm text-red-500">
              Select at least one genre
            </p>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Target Audience
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Who is your book primarily written for?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TARGET_AUDIENCES.map((audience) => (
              <button
                key={audience}
                type="button"
                onClick={() => handleAudienceToggle(audience)}
                className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${
                    formData.targetAudience.includes(audience)
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  } border`}
              >
                {audience}
              </button>
            ))}
          </div>
          {errors.targetAudience && (
            <p className="mt-2 text-sm text-red-500">
              Select at least one target audience
            </p>
          )}
        </div>

        {/* Publish Date */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Publish Date
          </label>
          <input
            type="date"
            value={formData.publishDate}
            onChange={(e) => handleChange('publishDate', e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.publishDate && (
            <p className="mt-1 text-sm text-red-500">{errors.publishDate}</p>
          )}
        </div>

        {/* Book Links */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-zinc-200">
            Book Links
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            Add links where podcasters can learn more about your book
          </p>

          {/* Amazon Link */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Amazon
            </label>
            <input
              type="url"
              value={formData.links.amazon || ''}
              onChange={(e) => handleLinkChange('amazon', e.target.value)}
              placeholder="https://amazon.com/your-book"
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Goodreads Link */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Goodreads
            </label>
            <input
              type="url"
              value={formData.links.goodreads || ''}
              onChange={(e) => handleLinkChange('goodreads', e.target.value)}
              placeholder="https://goodreads.com/book/show/your-book"
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Book Website */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Book Website
            </label>
            <input
              type="url"
              value={formData.links.website || ''}
              onChange={(e) => handleLinkChange('website', e.target.value)}
              placeholder="https://your-book-website.com"
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Marketing Goals */}
        <div>
          <label className="block text-sm font-medium text-zinc-200">
            Marketing Goals
          </label>
          <p className="mt-1 text-sm text-zinc-400">
            What do you hope to achieve through podcast appearances?
          </p>
          <textarea
            value={formData.marketingGoals}
            onChange={(e) => handleChange('marketingGoals', e.target.value)}
            rows={4}
            className="mt-3 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Increase book sales, build author platform, connect with readers..."
          />
          {errors.marketingGoals && (
            <p className="mt-1 text-sm text-red-500">{errors.marketingGoals}</p>
          )}
        </div>

        {/* Submit Error Display */}
        {errors.submit && (
          <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
}
