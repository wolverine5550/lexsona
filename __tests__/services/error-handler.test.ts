import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Set up mock before importing anything that uses it
vi.mock('@/utils/supabase/client', () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
  const mockClient = { from: mockFrom };

  return {
    createClient: vi.fn().mockReturnValue(mockClient)
  };
});

// Import after mock setup
import { createClient } from '@/utils/supabase/client';
import { ErrorHandler } from '@/services/error-handler';
import type { ErrorSeverity } from '@/services/error-handler';

describe('ErrorHandler', () => {
  let mockClient: ReturnType<typeof createClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = vi.mocked(createClient)();
  });

  describe('Error Reporting', () => {
    it('should log errors to database', async () => {
      const testError = new Error('Test error');
      const severity: ErrorSeverity = 'medium';

      await ErrorHandler.reportError(testError, severity, { userId: 'user1' });

      // Verify the mock calls
      expect(mockClient.from).toHaveBeenCalledWith('error_logs');
      expect(mockClient.from('error_logs').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'Error',
          message: 'Test error',
          severity: 'medium',
          context: expect.objectContaining({ userId: 'user1' })
        })
      );
    });
  });
});
