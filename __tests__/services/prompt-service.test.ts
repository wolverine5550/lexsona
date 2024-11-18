import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PromptService } from '@/services/prompt-service';
import { createClient } from '@/utils/supabase/client';
import type { PromptTemplate, PromptVersion } from '@/types/prompt';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => {
  const mockClient = {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null
          })
        })
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              version: 'v1',
              template: 'Test template',
              created_at: new Date().toISOString()
            },
            error: null
          })
        }),
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  version: 'v1',
                  success_rate: 0.95,
                  avg_relevance_score: 85
                }
              ],
              error: null
            })
          })
        })
      }),
      upsert: vi.fn().mockResolvedValue({ error: null })
    })
  };

  return {
    createClient: () => mockClient
  };
});

describe('PromptService', () => {
  const testTemplate: PromptTemplate = {
    version: 'v1',
    template: 'Test template {{variable}}',
    validate: () => true,
    format: (vars) => `Test template ${vars}`
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Management', () => {
    it('should store new template version', async () => {
      const id = await PromptService.storeTemplate(testTemplate);
      expect(id).toBe('test-id');
    });

    it('should retrieve template by version', async () => {
      const template = await PromptService.getTemplate('v1');
      expect(template.version).toBe('v1');
      expect(template.template).toContain('Test template');
    });

    it('should handle template not found', async () => {
      const mockError = new Error('Not found');
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError
              })
            })
          })
        })
      };

      vi.mocked(createClient).mockReturnValueOnce(mockClient as any);

      await expect(
        PromptService.getTemplate('invalid' as PromptVersion)
      ).rejects.toThrow();
    });
  });

  describe('Metrics Management', () => {
    it('should record metrics', async () => {
      await expect(
        PromptService.recordMetrics('v1', {
          success: true,
          relevanceScore: 85,
          responseTime: 1200
        })
      ).resolves.not.toThrow();
    });

    it('should retrieve version metrics', async () => {
      const metrics = await PromptService.getVersionMetrics('v1');
      expect(metrics).toBeDefined();
      expect(metrics.success_rate).toBeDefined();
      expect(metrics.avg_relevance_score).toBeDefined();
    });

    it('should get recommended version', async () => {
      const version = await PromptService.getRecommendedVersion();
      expect(version).toBe('v1');
    });
  });
});
