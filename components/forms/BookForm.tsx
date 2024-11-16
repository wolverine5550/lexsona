'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types_db';
import LoadingButton from '@/components/ui/LoadingButton';
import { useSession } from '@/hooks/useSession';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from '@/components/ui/Toasts/use-toast';
import { z } from 'zod';
import ErrorBoundary, {
  withErrorBoundary
} from '@/components/ui/ErrorBoundary';
import UnsavedChangesAlert from '@/components/ui/UnsavedChangesAlert';
import { withTimeout, RequestTimeoutError } from '@/utils/request-handlers';
import { useRequestQueue } from '@/hooks/useRequestQueue';

/**
 * Props for the BookForm component
 * @param existingBook - The user's existing book data, if any
 */
type Props = {
  existingBook?: Database['public']['Tables']['books']['Row'] | null;
};

/**
 * Book platform configuration
 * Defines the supported platforms and their input configurations
 */
const BOOK_PLATFORMS = {
  amazon: {
    label: 'Amazon Book URL',
    placeholder: 'https://amazon.com/your-book',
    icon: '📚'
  },
  goodreads: {
    label: 'Goodreads URL',
    placeholder: 'https://goodreads.com/book/show/your-book',
    icon: '📖'
  },
  website: {
    label: 'Book Website',
    placeholder: 'https://your-book-website.com',
    icon: '🌐'
  }
};

/**
 * Validation schemas for book form
 * Defines validation rules for each field
 */
const bookUrlSchema = z.string().url().optional().or(z.literal(''));

const bookFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),

  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  genre: z
    .array(z.string())
    .min(1, 'At least one genre is required')
    .max(3, 'Maximum 3 genres allowed'),

  targetAudience: z
    .array(z.string())
    .min(1, 'At least one target audience is required')
    .max(5, 'Maximum 5 target audiences allowed'),

  keywords: z
    .array(z.string())
    .min(3, 'At least 3 keywords are required')
    .max(10, 'Maximum 10 keywords allowed'),

  bookLinks: z.object({
    amazon: bookUrlSchema,
    goodreads: bookUrlSchema,
    website: bookUrlSchema
  })
});

/**
 * Type definitions
 */
type ValidationErrors = {
  [key: string]: string[];
};

type SchemaShape = typeof bookFormSchema.shape;

/**
 * Base Book Form Component
 * Handles creation and updates of book details
 * Includes session handling and validation
 */
function BookForm({ existingBook }: Props) {
  const router = useRouter();

  // Initialize session management hook
  const { session, isLoading: isSessionLoading, refreshSession } = useSession();

  // Form loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form field states
  const [title, setTitle] = useState(existingBook?.title || '');
  const [description, setDescription] = useState(
    existingBook?.description || ''
  );
  const [genre, setGenre] = useState<string[]>(existingBook?.genre || []);
  const [targetAudience, setTargetAudience] = useState<string[]>(
    existingBook?.target_audience
      ? Array.isArray(existingBook.target_audience)
        ? existingBook.target_audience
        : [existingBook.target_audience]
      : []
  );
  const [keywords, setKeywords] = useState<string[]>(
    existingBook?.keywords || []
  );
  const [bookLinks, setBookLinks] = useState<{ [key: string]: string }>(
    existingBook?.book_links || {}
  );

  // Add network status hook
  const { isOnline, wasOffline, hasBeenOfflineTooLong } = useNetworkStatus();

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Add state for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add form state tracking
  const initialFormState = {
    title: existingBook?.title || '',
    description: existingBook?.description || '',
    genre: existingBook?.genre || [],
    targetAudience: existingBook?.target_audience || [],
    keywords: existingBook?.keywords || [],
    bookLinks: existingBook?.book_links || {}
  };

  // Add request queue hook
  const { queueStatus, addToQueue } = useRequestQueue();

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
      const fieldSchema = bookFormSchema.shape[fieldName];
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

  /**
   * Validates all form fields before submission
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    try {
      bookFormSchema.parse({
        title,
        description,
        genre,
        targetAudience,
        keywords,
        bookLinks
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
   * Updates a book platform link
   * @param platform - The platform (e.g., 'amazon', 'goodreads')
   * @param url - The book URL
   */
  const handleBookLinkChange = (platform: string, url: string) => {
    const newBookLinks = {
      ...bookLinks,
      [platform]: url
    };
    setBookLinks(newBookLinks);
    if (touchedFields.has('bookLinks')) {
      validateField('bookLinks', newBookLinks);
    }
  };

  /**
   * Enhanced form submission with offline support
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If offline, queue the request
      if (!isOnline) {
        await addToQueue(async () => {
          const supabase = createClient();
          const {
            data: { user }
          } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');

          const bookData = {
            id: existingBook?.id,
            author_id: user.id,
            title,
            description,
            genre,
            target_audience: targetAudience,
            keywords,
            book_links: bookLinks,
            updated_at: new Date().toISOString()
          };

          return supabase.from('books').upsert(bookData);
        });

        toast({
          title: 'Changes queued',
          description: "Your changes will be saved when you're back online"
        });

        setIsLoading(false);
        return;
      }

      // If online, proceed with normal submission
      // Mark all fields as touched
      const allFields = [
        'title',
        'description',
        'genre',
        'targetAudience',
        'keywords',
        'bookLinks'
      ];
      setTouchedFields(new Set(allFields));

      // Check network status before submission
      if (!isOnline) {
        setError(
          'You are currently offline. Please check your connection and try again.'
        );
        return;
      }

      // Check if offline duration is too long
      if (hasBeenOfflineTooLong(30000)) {
        setError(
          'Your session may have expired. Please refresh the page and try again.'
        );
        return;
      }

      // Wrap the Supabase operations with timeout handling
      await withTimeout(
        async () => {
          // Verify active session exists
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

          // Handle session errors
          if (userError) {
            // Attempt to refresh the session
            const refreshed = await refreshSession();
            if (!refreshed) {
              throw new Error('Session expired. Please sign in again.');
            }
          }

          // Verify user exists after potential refresh
          if (!user) throw new Error('No user found');

          // Prepare book data for submission
          const bookData = {
            id: existingBook?.id, // Will be ignored for new books
            author_id: user.id,
            title,
            description,
            genre,
            target_audience: targetAudience,
            keywords,
            book_links: bookLinks,
            updated_at: new Date().toISOString()
          };

          // Update or insert book
          const { error: upsertError } = await supabase
            .from('books')
            .upsert(bookData);

          if (upsertError) throw upsertError;

          // Handle successful submission
          if (!existingBook) {
            router.push('/dashboard');
          } else {
            setIsLoading(false);
            router.refresh();
          }
        },
        {
          timeoutMs: 10000, // 10 second timeout for entire operation
          maxRetries: 2, // Try up to 2 times
          retryDelayMs: 1000 // Wait 1 second between retries
        }
      );
    } catch (err) {
      if (err instanceof RequestTimeoutError) {
        setError('The request timed out. Please try again.');
      } else {
        // Handle other errors as before
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
      setIsLoading(false);
    }
  };

  // Update change handlers to check for unsaved changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('title')) {
      validateField('title', value);
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setDescription(value);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('description')) {
      validateField('description', value);
    }
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map((s) => s.trim());
    setGenre(values);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('genre')) {
      validateField('genre', values);
    }
  };

  const handleTargetAudienceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const values = e.target.value.split(',').map((s) => s.trim());
    setTargetAudience(values);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('targetAudience')) {
      validateField('targetAudience', values);
    }
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map((s) => s.trim());
    setKeywords(values);
    setHasUnsavedChanges(checkForChanges());
    if (touchedFields.has('keywords')) {
      validateField('keywords', values);
    }
  };

  /**
   * Checks if the current form state differs from the initial state
   * @returns boolean indicating if there are unsaved changes
   */
  const checkForChanges = () => {
    const currentFormState = {
      title,
      description,
      genre,
      targetAudience,
      keywords,
      bookLinks
    };

    return (
      JSON.stringify(currentFormState) !== JSON.stringify(initialFormState)
    );
  };

  // Show loading state while session is being checked
  if (isSessionLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // Redirect to sign in if no session is found
  if (!session) {
    router.push('/signin');
    return null;
  }

  return (
    <>
      <UnsavedChangesAlert
        hasUnsavedChanges={hasUnsavedChanges}
        message="You have unsaved changes in your book details. Are you sure you want to leave?"
      />
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
                {queueStatus.pending} changes queued for when you're back online
              </p>
            )}
          </div>
        )}

        {/* Add offline indicator */}
        {!isOnline && (
          <div className="rounded-md bg-yellow-500/20 p-3 text-sm text-yellow-500">
            You are currently offline. Some features may be unavailable.
          </div>
        )}

        {/* Title Field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-zinc-200"
          >
            Book Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            onBlur={() => handleFieldTouch('title')}
            className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
              validationErrors.title && touchedFields.has('title')
                ? 'border-red-500'
                : ''
            }`}
            required
          />
          <FieldError fieldName="title" />
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-zinc-200"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            onBlur={() => handleFieldTouch('description')}
            rows={4}
            className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
              validationErrors.description && touchedFields.has('description')
                ? 'border-red-500'
                : ''
            }`}
            required
          />
          <FieldError fieldName="description" />
        </div>

        {/* Genre Field */}
        <div>
          <label
            htmlFor="genre"
            className="block text-sm font-medium text-zinc-200"
          >
            Genres (comma-separated)
          </label>
          <input
            type="text"
            id="genre"
            value={genre.join(', ')}
            onChange={handleGenreChange}
            onBlur={() => handleFieldTouch('genre')}
            className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
              validationErrors.genre && touchedFields.has('genre')
                ? 'border-red-500'
                : ''
            }`}
            placeholder="e.g., Business, Self-Help, Technology"
          />
          <FieldError fieldName="genre" />
        </div>

        {/* Target Audience Field */}
        <div>
          <label
            htmlFor="audience"
            className="block text-sm font-medium text-zinc-200"
          >
            Target Audience (comma-separated)
          </label>
          <input
            type="text"
            id="audience"
            value={targetAudience.join(', ')}
            onChange={handleTargetAudienceChange}
            onBlur={() => handleFieldTouch('targetAudience')}
            className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
              validationErrors.targetAudience &&
              touchedFields.has('targetAudience')
                ? 'border-red-500'
                : ''
            }`}
            placeholder="e.g., Entrepreneurs, Developers, Marketing Professionals"
          />
          <FieldError fieldName="targetAudience" />
        </div>

        {/* Keywords Field */}
        <div>
          <label
            htmlFor="keywords"
            className="block text-sm font-medium text-zinc-200"
          >
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords.join(', ')}
            onChange={handleKeywordsChange}
            onBlur={() => handleFieldTouch('keywords')}
            className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
              validationErrors.keywords && touchedFields.has('keywords')
                ? 'border-red-500'
                : ''
            }`}
            placeholder="e.g., startup, technology, marketing"
          />
          <FieldError fieldName="keywords" />
        </div>

        {/* Book Platform Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-200">Book Links</h3>
          {Object.entries(BOOK_PLATFORMS).map(([platform, config]) => (
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
                value={bookLinks[platform] || ''}
                onChange={(e) => handleBookLinkChange(platform, e.target.value)}
                onBlur={() => handleFieldTouch('bookLinks')}
                className={`mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white ${
                  validationErrors.bookLinks && touchedFields.has('bookLinks')
                    ? 'border-red-500'
                    : ''
                }`}
                placeholder={config.placeholder}
              />
            </div>
          ))}
          <FieldError fieldName="bookLinks" />
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
          {existingBook ? 'Update Book' : 'Add Book'}
        </LoadingButton>
      </form>
    </>
  );
}

/**
 * Wrapped version of BookForm with error boundary
 * This is the default export that will be used by other components
 */
export default withErrorBoundary(
  BookForm,
  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
    <h3 className="text-lg font-semibold text-red-500">
      Error Loading Book Form
    </h3>
    <p className="mt-2 text-sm text-zinc-400">
      There was a problem loading the book form. Please refresh the page or try
      again later.
    </p>
  </div>
);
