'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';

interface PodcastPreferencesFormData {
  example_shows: string[];
  interview_topics: string[];
  target_audiences: string[];
  preferred_episode_length: string;
  preferred_formats: string[];
  content_restrictions: string;
  additional_notes: string;
}

// Track raw input values separately from the processed array
interface RawInputValues {
  example_shows: string;
  interview_topics: string;
  target_audiences: string;
}

const EPISODE_LENGTH_OPTIONS = [
  'Under 30 minutes',
  '30-60 minutes',
  '60-90 minutes',
  'Over 90 minutes',
  'No preference'
];

const FORMAT_OPTIONS = [
  'One-on-one interview',
  'Panel discussion',
  'Solo host conversation',
  'Co-hosted show',
  'Q&A format'
];

export function PodcastPreferencesForm() {
  const router = useRouter();
  const { markStepComplete } = useOnboarding();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  // Initialize form state
  const defaultFormData: PodcastPreferencesFormData = {
    example_shows: [],
    interview_topics: [],
    target_audiences: [],
    preferred_episode_length: '',
    preferred_formats: [],
    content_restrictions: '',
    additional_notes: ''
  };

  // Track raw input values
  const [rawInputs, setRawInputs] = useState<RawInputValues>({
    example_shows: '',
    interview_topics: '',
    target_audiences: ''
  });

  // Form validation and error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  // Use form persistence hook with proper type
  const { formData, setFormData } =
    useFormPersistence<PodcastPreferencesFormData>({
      key: 'podcast-preferences',
      initialData: defaultFormData
    });

  // Ensure formData is never null by using defaultFormData as fallback
  const currentFormData = formData || defaultFormData;

  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
    // Initialize raw inputs from current form data
    setRawInputs({
      example_shows: currentFormData.example_shows.join(', '),
      interview_topics: currentFormData.interview_topics.join(', '),
      target_audiences: currentFormData.target_audiences.join(', ')
    });
  }, []);

  // Handle array field changes
  const handleArrayFieldChange = (
    field: keyof RawInputValues,
    value: string
  ) => {
    // Update raw input value
    setRawInputs((prev) => ({
      ...prev,
      [field]: value
    }));

    // Update processed array in form data
    const arrayValue = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
    setFormData({
      ...currentFormData,
      [field]: arrayValue
    });
  };

  // Function to format array for display
  const formatArrayForDisplay = (arr: string[]) => {
    return arr.join(', ');
  };

  // Handle checkbox group changes (preferred formats)
  const handleCheckboxChange = (value: string) => {
    const newFormats = currentFormData.preferred_formats.includes(value)
      ? currentFormData.preferred_formats.filter((format) => format !== value)
      : [...currentFormData.preferred_formats, value];

    const updatedData = {
      ...currentFormData,
      preferred_formats: newFormats
    };
    setFormData(updatedData);
  };

  // Handle text field changes
  const handleTextChange = (
    field: keyof Pick<
      PodcastPreferencesFormData,
      'content_restrictions' | 'additional_notes'
    >,
    value: string
  ) => {
    const updatedData = {
      ...currentFormData,
      [field]: value
    };
    setFormData(updatedData);
  };

  // Handle episode length change
  const handleEpisodeLengthChange = (value: string) => {
    const updatedData = {
      ...currentFormData,
      preferred_episode_length: value
    };
    setFormData(updatedData);
  };

  // Form validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (currentFormData.example_shows.length === 0) {
      newErrors.example_shows = 'Please provide at least one example show';
    }

    if (currentFormData.interview_topics.length === 0) {
      newErrors.interview_topics =
        'Please provide at least one interview topic';
    }

    if (currentFormData.target_audiences.length === 0) {
      newErrors.target_audiences =
        'Please provide at least one target audience';
    }

    if (!currentFormData.preferred_episode_length) {
      newErrors.preferred_episode_length =
        'Please select a preferred episode length';
    }

    setErrors(newErrors);
    setHasErrors(Object.keys(newErrors).length > 0);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
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

      // First try to get existing preferences
      const { data: existingPrefs } = await supabase
        .from('podcast_preferences')
        .select('id')
        .eq('author_id', user.id)
        .single();

      const { error } = await supabase.from('podcast_preferences').upsert(
        {
          id: existingPrefs?.id, // Include the ID if it exists
          author_id: user.id,
          example_shows: currentFormData.example_shows,
          interview_topics: currentFormData.interview_topics,
          target_audiences: currentFormData.target_audiences,
          preferred_episode_length: currentFormData.preferred_episode_length,
          preferred_formats: currentFormData.preferred_formats,
          content_restrictions: currentFormData.content_restrictions,
          additional_notes: currentFormData.additional_notes
        },
        {
          onConflict: 'author_id', // Specify the column to check for conflicts
          ignoreDuplicates: false // We want to update if there's a duplicate
        }
      );

      if (error) throw error;

      await markStepComplete(2);

      // Add a small delay before navigation to ensure state updates are complete
      setTimeout(() => {
        // Use window.location for a full page navigation
        window.location.href = '/dashboard';
      }, 100);
    } catch (error: any) {
      console.error('Error saving podcast preferences:', error);
      setErrors({ submit: `Failed to save preferences: ${error.message}` });
      setHasErrors(true);
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

      {/* Example Shows */}
      <div className="space-y-2">
        <label
          htmlFor="example_shows"
          className="text-sm font-medium text-zinc-200"
        >
          Example Podcasts (comma-separated)
        </label>
        <input
          id="example_shows"
          type="text"
          value={rawInputs.example_shows}
          onChange={(e) =>
            handleArrayFieldChange('example_shows', e.target.value)
          }
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.example_shows
              ? 'border-red-500'
              : 'border-zinc-800'
          }`}
          placeholder="e.g., The Tim Ferriss Show, Smart Passive Income, The Joe Rogan Experience"
        />
        {isSubmitted && errors.example_shows && (
          <p className="mt-1 text-sm text-red-500">{errors.example_shows}</p>
        )}
      </div>

      {/* Interview Topics */}
      <div className="space-y-2">
        <label
          htmlFor="interview_topics"
          className="text-sm font-medium text-zinc-200"
        >
          Key Interview Topics (comma-separated)
        </label>
        <input
          id="interview_topics"
          type="text"
          value={rawInputs.interview_topics}
          onChange={(e) =>
            handleArrayFieldChange('interview_topics', e.target.value)
          }
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.interview_topics
              ? 'border-red-500'
              : 'border-zinc-800'
          }`}
          placeholder="e.g., Book themes, Writing process, Industry insights"
        />
        {isSubmitted && errors.interview_topics && (
          <p className="mt-1 text-sm text-red-500">{errors.interview_topics}</p>
        )}
      </div>

      {/* Target Audiences */}
      <div className="space-y-2">
        <label
          htmlFor="target_audiences"
          className="text-sm font-medium text-zinc-200"
        >
          Target Audiences (comma-separated)
        </label>
        <input
          id="target_audiences"
          type="text"
          value={rawInputs.target_audiences}
          onChange={(e) =>
            handleArrayFieldChange('target_audiences', e.target.value)
          }
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.target_audiences
              ? 'border-red-500'
              : 'border-zinc-800'
          }`}
          placeholder="e.g., Business professionals, Creative writers, Tech enthusiasts"
        />
        {isSubmitted && errors.target_audiences && (
          <p className="mt-1 text-sm text-red-500">{errors.target_audiences}</p>
        )}
      </div>

      {/* Episode Length Preference */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200">
          Preferred Episode Length
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {EPISODE_LENGTH_OPTIONS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center justify-center rounded-lg border p-4 text-sm ${
                currentFormData.preferred_episode_length === option
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-zinc-800 text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="preferred_episode_length"
                value={option}
                checked={currentFormData.preferred_episode_length === option}
                onChange={(e) => handleEpisodeLengthChange(e.target.value)}
                className="sr-only"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {isSubmitted && errors.preferred_episode_length && (
          <p className="mt-1 text-sm text-red-500">
            {errors.preferred_episode_length}
          </p>
        )}
      </div>

      {/* Preferred Formats */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200">
          Preferred Podcast Formats
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FORMAT_OPTIONS.map((format) => (
            <label
              key={format}
              className={`flex cursor-pointer items-center space-x-2 rounded-lg border p-4 ${
                currentFormData.preferred_formats.includes(format)
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <input
                type="checkbox"
                checked={currentFormData.preferred_formats.includes(format)}
                onChange={() => handleCheckboxChange(format)}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-200">{format}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Content Restrictions */}
      <div className="space-y-2">
        <label
          htmlFor="content_restrictions"
          className="text-sm font-medium text-zinc-200"
        >
          Content Restrictions
        </label>
        <textarea
          id="content_restrictions"
          value={currentFormData.content_restrictions}
          onChange={(e) =>
            handleTextChange('content_restrictions', e.target.value)
          }
          rows={2}
          className="w-full rounded-lg border border-zinc-800 px-4 py-2 text-zinc-100 bg-zinc-900"
          placeholder="Any topics or content you'd prefer to avoid discussing..."
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label
          htmlFor="additional_notes"
          className="text-sm font-medium text-zinc-200"
        >
          Additional Notes
        </label>
        <textarea
          id="additional_notes"
          value={currentFormData.additional_notes}
          onChange={(e) => handleTextChange('additional_notes', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-800 px-4 py-2 text-zinc-100 bg-zinc-900"
          placeholder="Any other preferences or notes about your podcast appearance goals..."
        />
      </div>

      <Button
        type="submit"
        className={`w-full ${hasErrors && isSubmitted ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        loading={loading}
      >
        {loading
          ? 'Submitting...'
          : hasErrors && isSubmitted
            ? 'Failed - Check Errors Above'
            : 'Finish'}
      </Button>
    </form>
  );
}
