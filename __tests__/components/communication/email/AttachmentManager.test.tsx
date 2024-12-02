import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AttachmentManager from '@/components/communication/email/AttachmentManager';

describe('AttachmentManager Component', () => {
  const mockOnAttachmentAdd = vi.fn();
  const mockOnAttachmentRemove = vi.fn();
  const mockFile = new File(['test content'], 'test.txt', {
    type: 'text/plain'
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Core functionality tests
  describe('Core Functionality', () => {
    it('should render empty state correctly', () => {
      render(
        <AttachmentManager
          attachments={[]}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
        />
      );

      expect(
        screen.getByText(/drag and drop files here or click to upload/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/supported files:/i)).toBeInTheDocument();
    });

    it('should render existing attachments', () => {
      const attachments = [
        {
          id: 'att-1',
          email_id: 'email-1',
          file_name: 'test.txt',
          file_size: 1024,
          file_type: 'text/plain',
          storage_path: '/uploads/test.txt',
          created_at: new Date().toISOString(),
          created_by: 'user-1'
        }
      ];

      render(
        <AttachmentManager
          attachments={attachments}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
        />
      );

      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('should handle file removal', async () => {
      const attachments = [
        {
          id: 'att-1',
          email_id: 'email-1',
          file_name: 'test.txt',
          file_size: 1024,
          file_type: 'text/plain',
          storage_path: '/uploads/test.txt',
          created_at: new Date().toISOString(),
          created_by: 'user-1'
        }
      ];

      render(
        <AttachmentManager
          attachments={attachments}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
        />
      );

      const removeButton = screen.getByLabelText(/remove test.txt/i);
      fireEvent.click(removeButton);

      expect(mockOnAttachmentRemove).toHaveBeenCalledWith('att-1');
    });
  });

  // File upload tests
  describe('File Upload', () => {
    it('should handle file upload', async () => {
      render(
        <AttachmentManager
          attachments={[]}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
        />
      );

      const input = screen.getByLabelText(/upload files/i);
      fireEvent.change(input, {
        target: { files: [mockFile] }
      });

      await waitFor(() => {
        expect(mockOnAttachmentAdd).toHaveBeenCalledWith([mockFile]);
      });
    });

    it('should handle file size limit', async () => {
      // Create a file larger than 10MB (11MB)
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.txt',
        {
          type: 'text/plain'
        }
      );

      render(
        <AttachmentManager
          attachments={[]}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
        />
      );

      const input = screen.getByLabelText(/upload files/i);

      // Use await act when triggering the file change
      await act(async () => {
        fireEvent.change(input, {
          target: { files: [largeFile] }
        });
      });

      // Look for the error message in the alert role element
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/file size exceeds.*large\.txt/i);
      expect(mockOnAttachmentAdd).not.toHaveBeenCalled();
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('should disable upload when disabled prop is true', () => {
      render(
        <AttachmentManager
          attachments={[]}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
          disabled={true}
        />
      );

      expect(screen.getByLabelText(/upload files/i)).toBeDisabled();
    });

    it('should disable remove buttons when disabled', () => {
      const mockAttachments = [
        {
          id: '1',
          email_id: 'email1',
          file_name: 'test.txt',
          file_size: 1024,
          file_type: 'text/plain',
          storage_path: '/path/to/file',
          created_at: '2023-01-01',
          created_by: 'user1'
        }
      ];

      render(
        <AttachmentManager
          attachments={mockAttachments}
          onAttachmentAdd={mockOnAttachmentAdd}
          onAttachmentRemove={mockOnAttachmentRemove}
          disabled={true}
        />
      );

      const removeButton = screen.getByLabelText(/remove test\.txt/i);
      expect(removeButton).toBeDisabled();
      expect(removeButton).toHaveClass('opacity-50');
    });
  });
});
