// Set up all mocks before any imports
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const MockQuill = ({ value, onChange, placeholder }: any) => (
      <div data-testid="mock-quill">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid="quill-editor"
        />
      </div>
    );
    return MockQuill;
  }
}));

vi.mock('react-quill', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }: any) => (
    <div data-testid="mock-quill">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="quill-editor"
      />
    </div>
  )
}));

vi.mock('@/lib/utils/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  notifyLoading: vi.fn().mockReturnValue('mock-toast-id'),
  dismissToast: vi.fn()
}));

vi.mock('@/app/api', () => ({
  fetchTemplates: vi.fn().mockResolvedValue([])
}));

// Now import React and other dependencies
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Import the component after all mocks are set up
import EmailDraftEditor from '@/components/communication/email/EmailDraftEditor';

const createMockDraft = (overrides = {}) => ({
  id: 'draft-1',
  subject: 'Test Subject',
  body: 'Test Body',
  to: ['test@example.com'],
  cc: [],
  bcc: [],
  attachments: [],
  status: 'draft',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

describe('EmailDraftEditor Component', () => {
  let queryClient: QueryClient;
  const mockOnSave = vi.fn().mockResolvedValue({});
  const mockOnCancel = vi.fn();
  const mockOnSend = vi.fn().mockResolvedValue({});
  const mockOnSchedule = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    });
  });

  // Test wrapper component
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  // Core functionality tests
  describe('Core Functionality', () => {
    it('should render empty form correctly', async () => {
      renderWithProviders(
        <EmailDraftEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onSend={mockOnSend}
          onSchedule={mockOnSchedule}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByTestId('mock-quill')).toBeInTheDocument();
      });
    });

    // ... rest of the tests ...
  });
});
