import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecipientSelector from '@/components/communication/email/RecipientSelector';

describe('RecipientSelector Component', () => {
  const mockOnRecipientChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Core functionality tests
  describe('Core Functionality', () => {
    it('should render empty inputs correctly', () => {
      render(<RecipientSelector onRecipientChange={mockOnRecipientChange} />);

      expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient name/i)).toBeInTheDocument();
    });

    it('should render with existing recipient data', () => {
      render(
        <RecipientSelector
          recipientEmail="test@example.com"
          recipientName="John Doe"
          onRecipientChange={mockOnRecipientChange}
        />
      );

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('should handle email change', async () => {
      render(<RecipientSelector onRecipientChange={mockOnRecipientChange} />);

      // Clear any initial calls
      mockOnRecipientChange.mockClear();

      const emailInput = screen.getByLabelText(/recipient email/i);
      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' }
      });

      await waitFor(() => {
        expect(mockOnRecipientChange).toHaveBeenCalledWith(
          'test@example.com',
          undefined
        );
      });
    });
  });

  // Validation tests
  describe('Validation', () => {
    it('should validate email format', async () => {
      render(<RecipientSelector onRecipientChange={mockOnRecipientChange} />);

      const emailInput = screen.getByLabelText(/recipient email/i);

      // Invalid email
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' }
      });
      expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

      // Valid email
      fireEvent.change(emailInput, {
        target: { value: 'valid@example.com' }
      });
      expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument();
    });

    it('should not call onRecipientChange with invalid email', async () => {
      render(<RecipientSelector onRecipientChange={mockOnRecipientChange} />);

      // Clear any initial calls
      mockOnRecipientChange.mockClear();

      const emailInput = screen.getByLabelText(/recipient email/i);
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' }
      });

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockOnRecipientChange).not.toHaveBeenCalled();
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('should disable inputs when disabled prop is true', () => {
      render(
        <RecipientSelector
          onRecipientChange={mockOnRecipientChange}
          disabled={true}
        />
      );

      expect(screen.getByLabelText(/recipient email/i)).toBeDisabled();
      expect(screen.getByLabelText(/recipient name/i)).toBeDisabled();
    });

    it('should not trigger onRecipientChange when disabled', async () => {
      render(
        <RecipientSelector
          recipientEmail=""
          recipientName=""
          onRecipientChange={mockOnRecipientChange}
          disabled={true}
        />
      );

      // Clear any initial calls
      mockOnRecipientChange.mockClear();

      const emailInput = screen.getByLabelText(/recipient email/i);
      fireEvent.change(emailInput, {
        target: { value: 'test@example.com' }
      });

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockOnRecipientChange).not.toHaveBeenCalled();
    });
  });
});
