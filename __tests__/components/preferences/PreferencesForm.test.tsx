import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PreferencesForm from '@/components/preferences/PreferencesForm';

// Mock useSession hook
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user' } },
    isLoading: false
  })
}));

describe('PreferencesForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all preference options', () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Check topics
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();

    // Check length options
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();

    // Check style preferences
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Storytelling')).toBeInTheDocument();
  });

  it('should validate form submission', async () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Try to submit without selections
    fireEvent.click(screen.getByText('Save Preferences'));

    // Check error messages
    await waitFor(() => {
      expect(
        screen.getByText('Please select at least one topic')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please select at least one style preference')
      ).toBeInTheDocument();
    });

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle successful submission', async () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Select preferences
    fireEvent.click(screen.getByText('Technology'));
    fireEvent.click(screen.getByText('Interview'));
    fireEvent.click(screen.getByText('Medium'));

    // Submit form
    fireEvent.click(screen.getByText('Save Preferences'));

    // Verify onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        topics: ['technology'],
        preferredLength: 'medium',
        stylePreferences: {
          isInterviewPreferred: true,
          isStorytellingPreferred: false,
          isEducationalPreferred: false,
          isDebatePreferred: false
        }
      });
    });
  });
});
