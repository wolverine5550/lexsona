import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'test-metric-1',
                response_time: 1200,
                success_rate: 0.95,
                error_count: 2,
                timestamp: new Date().toISOString()
              }
            ],
            error: null
          })
        })
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    })
  })
}));

// Import after mocks
import { PerformanceOptimizer } from '@/services/performance-optimizer';

describe('PerformanceOptimizer', () => {
  let mockClient: ReturnType<typeof createClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = vi.mocked(createClient)();
    // Set the mock client on the PerformanceOptimizer
    PerformanceOptimizer.supabase = mockClient;
  });

  describe('Metric Collection', () => {
    it('should track performance metrics', async () => {
      const metrics = {
        responseTime: 1200,
        successRate: 0.95,
        errorCount: 2
      };

      await PerformanceOptimizer.trackMetrics(metrics);

      expect(mockClient.from).toHaveBeenCalledWith('performance_metrics');
      expect(
        mockClient.from('performance_metrics').insert
      ).toHaveBeenCalledWith({
        response_time: metrics.responseTime,
        success_rate: metrics.successRate,
        error_count: metrics.errorCount,
        timestamp: expect.any(String)
      });
    });

    it('should analyze performance data', async () => {
      const analysis = await PerformanceOptimizer.analyzePerformance();

      expect(analysis).toBeDefined();
      expect(analysis.metrics).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });
  });
});
