import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileForm from '@/components/author/EditProfileForm';
import { useRouter } from 'next/navigation';
import { mockAuthor } from '@/__tests__/setup/commonMocks';

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn()
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

describe('EditProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with author data', () => {
    render(<EditProfileForm author={mockAuthor} />);

    // Check if form fields are populated
    expect(screen.getByDisplayValue(mockAuthor.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockAuthor.bio)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockAuthor.location)).toBeInTheDocument();
  });

  it('handles avatar upload', () => {
    render(<EditProfileForm author={mockAuthor} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-input');

    fireEvent.change(input, { target: { files: [file] } });

    // Check if preview is updated
    expect(screen.getByAltText('Profile preview')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    render(<EditProfileForm author={mockAuthor} />);

    // Update form fields
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Updated Name' }
    });

    // Submit form
    fireEvent.submit(screen.getByTestId('edit-profile-form'));

    // Wait for the submit button to show "Saving..."
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    // Wait for the simulated API call to complete
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          `/author/${mockAuthor.id}`
        );
        expect(mockRouter.refresh).toHaveBeenCalled();
      },
      { timeout: 2000 }
    ); // Increase timeout to account for simulated delay
  });

  it('handles cancel button click', () => {
    render(<EditProfileForm author={mockAuthor} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    render(<EditProfileForm author={mockAuthor} />);

    // Clear required field
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '' }
    });

    // Submit form
    fireEvent.submit(screen.getByRole('form'));

    // Check for validation message
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  // Test for accessibility
  it('has proper form labeling and ARIA attributes', () => {
    render(<EditProfileForm author={mockAuthor} />);

    // Get form by tag name instead of role
    const form = screen.getByTestId('edit-profile-form');
    expect(form).toHaveAttribute('aria-label', 'Edit profile form');

    // Check all inputs have associated labels
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('aria-label');
    });
  });
});
