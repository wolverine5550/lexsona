import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthorSettings } from '@/components/settings/AuthorSettings';
import { toast } from '@/components/ui/toast';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(() => ({
    session: {
      user: {
        id: 'test-user-id'
      }
    }
  }))
}));

// Mock the toast
vi.mock('@/components/ui/toast', () => ({
  toast: vi.fn()
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AuthorSettings', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('loads and displays initial data', async () => {
    const mockData = {
      data: {
        profile: {
          name: 'Test Author',
          bio: 'Test Bio'
        },
        preferences: {
          example_shows: ['Show 1', 'Show 2'],
          interview_topics: ['Topic 1']
        }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<AuthorSettings />);

    // Wait for data to load and form to be rendered
    await waitFor(() => {
      expect(
        screen.queryByTestId('profile-settings-skeleton')
      ).not.toBeInTheDocument();
    });

    // Wait for form fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    });

    // Verify profile data is displayed
    expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Bio')).toBeInTheDocument();
  });

  it('handles profile update successfully', async () => {
    const mockData = {
      data: {
        profile: {
          name: '',
          bio: '',
          location: '',
          expertise: [],
          socialLinks: {}
        },
        preferences: null
      }
    };

    // Mock the initial data fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    // Mock the update request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<AuthorSettings />);

    // Wait for loading to complete and form to be rendered
    await waitFor(() => {
      expect(
        screen.queryByTestId('profile-settings-skeleton')
      ).not.toBeInTheDocument();
    });

    // Wait for form fields to be rendered
    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    // Fill in profile form
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, {
      target: { value: 'New Name' }
    });

    // Select expertise
    const expertiseCheckbox = screen.getByLabelText('React');
    fireEvent.click(expertiseCheckbox);

    // Wait for form validation to complete
    await waitFor(() => {
      expect(screen.queryByText(/expected array/i)).not.toBeInTheDocument();
    });

    // Submit form
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Wait for the success message
    await waitFor(() => {
      expect(
        screen.getByText(/profile updated successfully/i)
      ).toBeInTheDocument();
    });

    // Verify API call
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Once for initial load, once for update
        expect(mockFetch).toHaveBeenLastCalledWith('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              name: 'New Name',
              bio: '',
              location: '',
              expertiseLevel: 'react',
              socialLinks: {}
            }
          })
        });
      },
      { timeout: 3000 }
    );

    // Verify success toast
    expect(toast).toHaveBeenCalledWith({
      title: 'Success',
      description: expect.any(String)
    });
  });

  it('handles errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<AuthorSettings />);

    // Wait for error state
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Error',
        description: expect.any(String),
        variant: 'destructive'
      });
    });
  });
});
