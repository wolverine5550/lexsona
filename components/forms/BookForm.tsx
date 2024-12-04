'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface BookFormData {
  title: string;
  description: string;
  genre: string[];
  targetAudience: string[];
}

interface FormErrors extends Partial<BookFormData> {
  submit?: string;
}

interface TouchedFields {
  [key: string]: boolean;
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
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});

  // Initialize form data after mount
  useEffect(() => {
    setMounted(true);
    setFormData({
      title: existingBook?.title || '',
      description: existingBook?.description || '',
      genre: existingBook?.genre || [],
      targetAudience: existingBook?.target_audience || []
    });
  }, [existingBook]);

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    description: '',
    genre: [],
    targetAudience: []
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const data = formData;

    // Required fields validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!data.genre.length) {
      newErrors.genre = 'At least one genre is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (
    field: keyof BookFormData,
    value: string | string[]
  ) => {
    if (field === 'genre' || field === 'targetAudience') {
      // Handle array fields by splitting comma-separated values
      const arrayValue =
        typeof value === 'string'
          ? value.split(',').map((v) => v.trim())
          : value;
      setFormData((prev) => ({
        ...prev,
        [field]: arrayValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

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

      console.log('Saving book data:', {
        author_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        target_audience: formData.targetAudience
      });

      const { error } = await supabase.from('books').upsert({
        author_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        target_audience: formData.targetAudience
      });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      markStepComplete(1);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error saving book:', error);
      setErrors({ submit: `Failed to save book: ${error.message}` });
      setHasErrors(true);
      scrollToFirstError();
    } finally {
      setLoading(false);
    }
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.text-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        const nearestInput =
          firstErrorElement.previousElementSibling as HTMLElement;
        if (nearestInput) {
          nearestInput.focus();
        }
      }
    }, 100);
  };

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

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-zinc-200">
          Book Title
        </label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          onBlur={() => setTouchedFields((prev) => ({ ...prev, title: true }))}
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.title ? 'border-red-500' : 'border-zinc-800'
          }`}
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
          onChange={(e) => handleFieldChange('description', e.target.value)}
          onBlur={() =>
            setTouchedFields((prev) => ({ ...prev, description: true }))
          }
          rows={4}
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.description
              ? 'border-red-500'
              : 'border-zinc-800'
          }`}
        />
        {isSubmitted && errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="genre" className="text-sm font-medium text-zinc-200">
          Genre (comma-separated)
        </label>
        <input
          id="genre"
          value={formData.genre.join(', ')}
          onChange={(e) => handleFieldChange('genre', e.target.value)}
          onBlur={() => setTouchedFields((prev) => ({ ...prev, genre: true }))}
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.genre ? 'border-red-500' : 'border-zinc-800'
          }`}
          placeholder="e.g., Fiction, Mystery, Thriller"
        />
        {isSubmitted && errors.genre && (
          <p className="mt-1 text-sm text-red-500">{errors.genre}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="targetAudience"
          className="text-sm font-medium text-zinc-200"
        >
          Target Audience (comma-separated, Optional)
        </label>
        <input
          id="targetAudience"
          value={formData.targetAudience.join(', ')}
          onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
          onBlur={() =>
            setTouchedFields((prev) => ({ ...prev, targetAudience: true }))
          }
          className={`w-full rounded-lg border px-4 py-2 text-zinc-100 bg-zinc-900 ${
            isSubmitted && errors.targetAudience
              ? 'border-red-500'
              : 'border-zinc-800'
          }`}
          placeholder="e.g., Young Adults, Business Professionals"
        />
        {isSubmitted && errors.targetAudience && (
          <p className="mt-1 text-sm text-red-500">{errors.targetAudience}</p>
        )}
      </div>

      <Button
        type="submit"
        className={`w-full ${hasErrors && isSubmitted ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
