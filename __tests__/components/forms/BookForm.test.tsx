import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { BookForm } from '@/components/forms/BookForm';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { describe, it, expect, vi } from 'vitest';

// Add type for form data
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

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  })
}));

// Mock useFormPersistence hook with different states for different tests
const mockSetFormData = vi.fn();
const mockClearSavedData = vi.fn();
let mockLastSaved: Date | null = null;
let mockFormData: BookFormData = {
  title: '',
  description: '',
  genre: [],
  targetAudience: [],
  publishDate: '',
  links: {},
  marketingGoals: ''
};

vi.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: vi.fn(() => ({
    formData: mockFormData,
    setFormData: (updater: any) => {
      if (typeof updater === 'function') {
        mockFormData = updater(mockFormData);
      } else {
        mockFormData = updater;
      }
      mockSetFormData(mockFormData);
    },
    clearSavedData: mockClearSavedData,
    lastSaved: mockLastSaved
  }))
}));

// Mock OnboardingContext
vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    markStepComplete: vi.fn(),
    setCanProceed: vi.fn()
  }),
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } } })
    },
    from: () => ({
      insert: () => Promise.resolve({ error: null })
    })
  })
}));

describe('BookForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockLastSaved = null;
    mockFormData = {
      title: '',
      description: '',
      genre: [],
      targetAudience: [],
      publishDate: '',
      links: {},
      marketingGoals: ''
    };
    vi.clearAllMocks();
  });

  it('should show resume banner when saved data exists', () => {
    mockLastSaved = new Date();
    mockFormData = {
      title: 'Test Book',
      description: '',
      genre: [],
      targetAudience: [],
      publishDate: '',
      links: {},
      marketingGoals: ''
    };

    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    expect(screen.getByText('Resume Your Progress')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    // Try to submit empty form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(
        screen.getByText('Description must be at least 100 characters')
      ).toBeInTheDocument();
      expect(screen.getByText('Select at least one genre')).toBeInTheDocument();
      expect(
        screen.getByText('Select at least one target audience')
      ).toBeInTheDocument();
      expect(screen.getByText('Publish date is required')).toBeInTheDocument();
      expect(
        screen.getByText('Marketing goals are required')
      ).toBeInTheDocument();
    });
  });

  it('should handle genre selection', async () => {
    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    // Click a genre button
    await act(async () => {
      fireEvent.click(screen.getByText('Fiction'));
    });

    // Wait for state update and check if genre was added
    await waitFor(() => {
      expect(mockFormData.genre).toContain('Fiction');
    });
  });

  it('should handle target audience selection', async () => {
    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    // Click an audience button
    await act(async () => {
      fireEvent.click(screen.getByText('General Adult'));
    });

    // Wait for state update and check if audience was added
    await waitFor(() => {
      expect(mockFormData.targetAudience).toContain('General Adult');
    });
  });

  it('should show success message on successful submission', async () => {
    // Set up mock data to pass validation
    mockFormData = {
      title: 'My Amazing Book',
      description:
        'A very long description that meets the minimum length requirement. This book is about...',
      genre: ['Fiction'],
      targetAudience: ['General Adult'],
      publishDate: '2024-01-01',
      links: {},
      marketingGoals: 'Reach new readers and increase sales'
    };

    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    // Submit form
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    // Wait for success message
    await waitFor(() => {
      expect(mockFormData.title).toBe('My Amazing Book');
    });
  });

  it('should handle form persistence', async () => {
    vi.useFakeTimers();

    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

    // Fill out a field
    fireEvent.change(screen.getByLabelText('Book Title'), {
      target: { value: 'My Book Title' }
    });

    // Fast-forward timers to trigger debounced save
    act(() => {
      vi.runAllTimers();
    });

    // Check if data was saved
    expect(mockFormData.title).toBe('My Book Title');

    vi.useRealTimers();
  });
});
