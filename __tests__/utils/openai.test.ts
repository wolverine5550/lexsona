import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock OpenAI class
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      }
    };
  }
}));

// Mock rate limiter
vi.mock('@/utils/rate-limit', () => ({
  rateLimit: () => ({
    wait: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn()
  })
}));

// Import after mocks
import { EnhancedOpenAIClient } from '@/utils/openai';
import type { ChatMessage } from '@/types/openai';

describe('OpenAI Client', () => {
  let client: EnhancedOpenAIClient;

  beforeEach(() => {
    // Create new client with test key
    client = new EnhancedOpenAIClient('test-key');
    vi.clearAllMocks();
  });

  it('processes chat completion successfully', async () => {
    const testMessages: ChatMessage[] = [
      { role: 'user', content: 'Test message' }
    ];

    const result = await client.processChatCompletion(testMessages);
    expect(result).toBe('Test response');
  });
});
