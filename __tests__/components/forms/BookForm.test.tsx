import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookForm } from '@/components/forms/BookForm';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
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
  const renderForm = () =>
    render(
      <OnboardingProvider>
        <BookForm />
      </OnboardingProvider>
    );

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should show resume banner when saved data exists', () => {
    // Set up saved data
    localStorage.setItem(
      'form_book_details',
      JSON.stringify({ title: 'My Book' })
    );
    localStorage.setItem(
      'form_book_details_timestamp',
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
    renderForm();

    // Click a genre button
    fireEvent.click(screen.getByText('Fiction'));

    // Genre should be selected (have blue styling)
    const genreButton = screen.getByText('Fiction').closest('button');
    expect(genreButton).toHaveClass('bg-blue-500/20');
  });

  it('should handle target audience selection', async () => {
    renderForm();

    // Click an audience button
    fireEvent.click(screen.getByText('General Adult'));

    // Audience should be selected (have blue styling)
    const audienceButton = screen.getByText('General Adult').closest('button');
    expect(audienceButton).toHaveClass('bg-blue-500/20');
  });

  it('should show success message on successful submission', async () => {
    renderForm();

    // Fill out required fields
    fireEvent.change(screen.getByLabelText('Book Title'), {
      target: { value: 'My Amazing Book' }
    });
    fireEvent.change(screen.getByLabelText('Book Description'), {
      target: {
        value:
          'A very long description that meets the minimum length requirement. This book is about...'
      }
    });
    fireEvent.click(screen.getByText('Fiction')); // Select genre
    fireEvent.click(screen.getByText('General Adult')); // Select audience
    fireEvent.change(screen.getByLabelText('Publish Date'), {
      target: { value: '2024-01-01' }
    });
    fireEvent.change(screen.getByLabelText('Marketing Goals'), {
      target: { value: 'Reach new readers and increase sales' }
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText('Setup Complete! 🎉')).toBeInTheDocument();
    });
  });

  it('should handle form persistence', async () => {
    renderForm();

    // Fill out a field
    fireEvent.change(screen.getByLabelText('Book Title'), {
      target: { value: 'My Book Title' }
    });

    // Check if data was saved to localStorage
    const savedData = JSON.parse(
      localStorage.getItem('form_book_details') || '{}'
    );
    expect(savedData.title).toBe('My Book Title');
  });
});
