import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    mockOnSubmit.mockClear();
  });

  it('should render all preference options', () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Check topics
    expect(screen.getByLabelText(/technology/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entertainment/i)).toBeInTheDocument();
  });

  it('should validate form submission', () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Try to submit without selections
    const submitButton = screen.getByRole('button', {
      name: /save preferences/i
    });
    fireEvent.click(submitButton);

    // Check error messages
    expect(
      screen.getByText(/please select at least one topic/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please select at least one style preference/i)
    ).toBeInTheDocument();

    // Verify onSubmit wasn't called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle successful submission', async () => {
    render(<PreferencesForm onSubmit={mockOnSubmit} />);

    // Select preferences using label text
    fireEvent.click(screen.getByLabelText(/technology/i));
    fireEvent.click(screen.getByLabelText(/interview/i));
    fireEvent.click(screen.getByLabelText(/medium/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    // Verify onSubmit was called with correct data
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
