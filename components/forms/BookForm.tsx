'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface BookFormData {
  title: string;
  description: string;
  genre: string;
  publishDate: string;
  targetAudience: string;
}

interface FormErrors extends Partial<BookFormData> {
  submit?: string;
}

interface BookFormProps {
  existingBook?: any;
}

export function BookForm({ existingBook }: BookFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { markStepComplete } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mounted, setMounted] = useState(false);

  // Initialize form data after mount
  useEffect(() => {
    setMounted(true);
    setFormData({
      title: existingBook?.title || '',
      description: existingBook?.description || '',
      genre: existingBook?.genre || '',
      publishDate: existingBook?.publish_date || '',
      targetAudience: existingBook?.target_audience || ''
    });
  }, [existingBook]);

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    description: '',
    genre: '',
    publishDate: '',
    targetAudience: ''
  });

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    if (!formData.genre) newErrors.genre = 'Genre is required';

    setErrors(newErrors);
    setHasErrors(Object.keys(newErrors).length > 0);

    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const isValid = validateForm();
    if (!isValid) {
      scrollToFirstError(); // Add scroll to error
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('books').upsert({
        author_id: user.id,
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        publish_date: formData.publishDate,
        target_audience: formData.targetAudience
      });

      if (error) throw error;

      markStepComplete(1);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors({ submit: 'Failed to save book' });
      setHasErrors(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-200">
          Book Title
        </label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100"
        />
        {isSubmitted && errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium text-zinc-200"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100"
        />
        {isSubmitted && errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="genre" className="text-sm font-medium text-zinc-200">
          Genre
        </label>
        <input
          id="genre"
          value={formData.genre}
          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100"
        />
        {isSubmitted && errors.genre && (
          <p className="mt-1 text-sm text-red-500">{errors.genre}</p>
        )}
      </div>

      <Button
        type="submit"
        className={`w-full ${hasErrors ? 'bg-red-600 hover:bg-red-700' : ''}`}
        loading={loading}
      >
        {loading
          ? 'Saving...'
          : hasErrors && isSubmitted
            ? 'Failed - Check Errors Above'
            : 'Complete Setup'}
      </Button>
    </form>
  );
}
