import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthorProfileForm } from '@/components/forms/AuthorProfileForm';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
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
  });

  it('should show resume banner when saved data exists', () => {
    // Set up saved data
    localStorage.setItem(
      'form_author_profile',
      JSON.stringify({ firstName: 'John' })
    );
    localStorage.setItem(
      'form_author_profile_timestamp',
      new Date().toISOString()
    );

    renderForm();
    expect(screen.getByText('Resume Your Progress')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderForm();

    // Try to submit empty form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });
  });

  it('should show success message on successful submission', async () => {
    renderForm();

    // Fill out form
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Bio'), {
      target: {
        value: 'A very long bio that meets the minimum length requirement...'
      }
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(
        screen.getByText('Profile Created Successfully!')
      ).toBeInTheDocument();
    });
  });
});
