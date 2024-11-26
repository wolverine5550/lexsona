import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthorProfileForm } from '@/components/forms/AuthorProfileForm';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { describe, it, expect, vi } from 'vitest';

// Add type for form data
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
let mockFormData: AuthorProfileFormData = {
  firstName: '',
  lastName: '',
  bio: '',
  expertise: [],
  socialLinks: {}
};

vi.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: vi.fn(() => ({
    formData: mockFormData,
    setFormData: mockSetFormData,
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
      upsert: () => Promise.resolve({ error: null })
    })
  })
}));

describe('AuthorProfileForm', () => {
  const renderForm = () =>
    render(
      <OnboardingProvider>
        <AuthorProfileForm />
      </OnboardingProvider>
    );

  beforeEach(() => {
    window.localStorage.clear();
    mockLastSaved = null;
    mockFormData = {
      firstName: '',
      lastName: '',
      bio: '',
      expertise: [],
      socialLinks: {}
    };
    vi.clearAllMocks();
  });

  it('should show resume banner when saved data exists', () => {
    // Set lastSaved to trigger banner
    mockLastSaved = new Date();

    renderForm();
    expect(screen.getByText('Resume Your Progress')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderForm();
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });
  });

  it('should show success message on successful submission', async () => {
    // Update mock form data to pass validation
    mockFormData = {
      firstName: 'John',
      lastName: 'Doe',
      bio: 'A very long bio that meets the minimum length requirement...',
      expertise: ['Fiction Writing'],
      socialLinks: {}
    };

    renderForm();

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(
        screen.getByText('Profile Created Successfully!')
      ).toBeInTheDocument();
    });
  });
});
