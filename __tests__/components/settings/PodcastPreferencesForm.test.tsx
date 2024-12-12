import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PodcastPreferencesForm } from '@/components/settings/AuthorSettings';
import { toast } from '@/components/ui/toast';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/ui/toast', () => ({
  toast: vi.fn()
}));

describe('PodcastPreferencesForm', () => {
  const mockOnSubmit = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields', async () => {
    render(
      <PodcastPreferencesForm
        preferences={{}}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(submitButton);

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/add at least one example show/i)).toBeDefined();
      expect(screen.getByText(/add at least one topic/i)).toBeDefined();
      expect(
        screen.getByText(/add at least one target audience/i)
      ).toBeDefined();
    });

    // Verify onSubmit wasn't called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data', async () => {
    render(
      <PodcastPreferencesForm
        preferences={{}}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );

    // Fill required fields with proper newlines
    const exampleShowsInput = screen.getByLabelText(/example shows/i);
    const interviewTopicsInput = screen.getByLabelText(/interview topics/i);
    const targetAudienceInput = screen.getByLabelText(/target audience/i);
    const minListenersInput = screen.getByLabelText(/minimum listeners/i);
    const maxDurationInput = screen.getByLabelText(/maximum duration/i);

    // Use fireEvent.change to properly set textarea values with newlines
    fireEvent.change(exampleShowsInput, {
      target: { value: 'Show 1\nShow 2' }
    });
    fireEvent.change(interviewTopicsInput, {
      target: { value: 'Topic 1\nTopic 2' }
    });
    fireEvent.change(targetAudienceInput, {
      target: { value: 'Audience 1\nAudience 2' }
    });

    // Use userEvent for number inputs
    await userEvent.type(minListenersInput, '1000');
    await userEvent.type(maxDurationInput, '60');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(submitButton);

    // Verify form submission with all expected fields
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        example_shows: ['Show 1', 'Show 2'],
        interview_topics: ['Topic 1', 'Topic 2'],
        target_audience: ['Audience 1', 'Audience 2'],
        min_listeners: 1000,
        max_duration: 60,
        preferred_formats: [],
        content_boundaries: [],
        availability: {}
      });
    });
  });

  it('displays loading state when submitting', () => {
    render(
      <PodcastPreferencesForm
        preferences={{}}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });
});
