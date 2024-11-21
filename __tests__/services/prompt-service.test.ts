import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Set up mock before importing services
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              version: 'v1',
              success: true,
              relevance_score: 85,
              response_time: 1200,
              created_at: new Date().toISOString()
            }
          ],
          error: null
        })
      })
    })
  }))
}));

// Import services after mock setup
import { PromptService } from '@/services/prompt-service';
import type { PromptTemplate, PromptVersion } from '@/types/prompt';

describe('PromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metrics Management', () => {
    it('should retrieve version metrics', async () => {
      const metrics = await PromptService.getVersionMetrics('v1');

      expect(metrics).toEqual({
        version: 'v1',
        success_rate: 1,
        avg_relevance_score: 85,
        total_uses: 1
      });
    });
  });
});
