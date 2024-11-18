import React, { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import type {
  UserPreferences,
  PodcastTopic,
  PodcastLength,
  PreferencesFormErrors
} from '@/types/preferences';

/**
 * Available podcast topics with display names
 */
const PODCAST_TOPICS: { value: PodcastTopic; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'news', label: 'News & Current Events' },
  { value: 'sports', label: 'Sports' },
  { value: 'culture', label: 'Culture & Arts' },
  { value: 'politics', label: 'Politics & Society' }
];

/**
 * Podcast length options with durations
 */
const LENGTH_OPTIONS: {
  value: PodcastLength;
  label: string;
  duration: string;
}[] = [
  { value: 'short', label: 'Short', duration: '0-30 minutes' },
  { value: 'medium', label: 'Medium', duration: '30-60 minutes' },
  { value: 'long', label: 'Long', duration: '60+ minutes' }
];

/**
 * Props for PreferencesForm component
 */
interface PreferencesFormProps {
  initialPreferences?: UserPreferences;
  onSubmit: (
    preferences: Omit<
      UserPreferences,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >
  ) => Promise<void>;
}

export default function PreferencesForm({
  initialPreferences,
  onSubmit
}: PreferencesFormProps) {
  // Get current user session
  const { session } = useSession();

  // Form state
  const [topics, setTopics] = useState<PodcastTopic[]>(
    initialPreferences?.topics || []
  );
  const [preferredLength, setPreferredLength] = useState<PodcastLength>(
    initialPreferences?.preferredLength || 'medium'
  );
  const [stylePreferences, setStylePreferences] = useState(
    initialPreferences?.stylePreferences || {
      isInterviewPreferred: false,
      isStorytellingPreferred: false,
      isEducationalPreferred: false,
      isDebatePreferred: false
    }
  );

  // Error state
  const [errors, setErrors] = useState<PreferencesFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates form data before submission
   */
  const validateForm = (): boolean => {
    const newErrors: PreferencesFormErrors = {};

    if (topics.length === 0) {
      newErrors.topics = 'Please select at least one topic';
    }
    if (topics.length > 5) {
      newErrors.topics = 'Please select no more than 5 topics';
    }

    const hasStylePreference = Object.values(stylePreferences).some(
      (value) => value
    );
    if (!hasStylePreference) {
      newErrors.stylePreferences =
        'Please select at least one style preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await onSubmit({
        topics,
        preferredLength,
        stylePreferences
      });
    } catch (error) {
      setErrors({
        ...errors,
        submit: 'Failed to save preferences. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Topics Selection */}
      <div>
        <h3 className="text-lg font-medium text-zinc-200">
          What topics interest you?
        </h3>
        <p className="text-sm text-zinc-400">
          Select up to 5 topics that you'd like to hear about
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PODCAST_TOPICS.map(({ value, label }) => (
            <label
              key={value}
              className={`
                flex cursor-pointer items-center rounded-lg border p-4 
                ${
                  topics.includes(value)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-800'
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={topics.includes(value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTopics([...topics, value]);
                  } else {
                    setTopics(topics.filter((t) => t !== value));
                  }
                }}
              />
              <span className="text-sm font-medium text-zinc-200">{label}</span>
            </label>
          ))}
        </div>
        {errors.topics && (
          <p className="mt-2 text-sm text-red-500">{errors.topics}</p>
        )}
      </div>

      {/* Length Preference */}
      <div>
        <h3 className="text-lg font-medium text-zinc-200">
          Preferred episode length
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {LENGTH_OPTIONS.map(({ value, label, duration }) => (
            <label
              key={value}
              className={`
                flex cursor-pointer flex-col items-center rounded-lg border p-4
                ${
                  preferredLength === value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-800'
                }
              `}
            >
              <input
                type="radio"
                name="length"
                className="sr-only"
                value={value}
                checked={preferredLength === value}
                onChange={(e) =>
                  setPreferredLength(e.target.value as PodcastLength)
                }
              />
              <span className="text-sm font-medium text-zinc-200">{label}</span>
              <span className="mt-1 text-xs text-zinc-400">{duration}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Style Preferences */}
      <div>
        <h3 className="text-lg font-medium text-zinc-200">
          Preferred podcast styles
        </h3>
        <p className="text-sm text-zinc-400">
          Select the types of podcasts you enjoy
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Object.entries(stylePreferences).map(([key, value]) => (
            <label
              key={key}
              className={`
                flex cursor-pointer items-center rounded-lg border p-4
                ${value ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-700 bg-zinc-800'}
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={value}
                onChange={() => {
                  setStylePreferences({
                    ...stylePreferences,
                    [key]: !value
                  });
                }}
              />
              <span className="text-sm font-medium text-zinc-200">
                {key.replace('is', '').replace('Preferred', '')}
              </span>
            </label>
          ))}
        </div>
        {errors.stylePreferences && (
          <p className="mt-2 text-sm text-red-500">{errors.stylePreferences}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Preferences'}
      </button>

      {errors.submit && (
        <p className="mt-2 text-sm text-red-500">{errors.submit}</p>
      )}
    </form>
  );
}
