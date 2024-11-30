import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfileForm from '@/components/author/EditProfileForm';
import { Author } from '@/types/author';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

const mockAuthor: Author = {
  id: '1',
  name: 'John Doe',
  avatar: '/images/avatars/john-doe.jpg',
  bio: 'Test author bio',
  location: 'New York, USA',
  joinedDate: '2023-01-01',
  totalListens: 15000,
  followers: 1000,
  following: 500,
  socialLinks: {
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  works: [],
  interviews: []
};

describe('EditProfileForm', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(`/author/${mockAuthor.id}`);
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
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

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Edit profile form');

    // Check all inputs have associated labels
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('aria-label');
    });
  });
});
