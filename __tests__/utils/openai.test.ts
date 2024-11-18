import { vi, describe, it, expect, beforeEach } from 'vitest';
import { openaiClient } from '@/utils/openai';
import type { ChatMessage } from '@/types/openai';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    OPENAI_ORG_ID: 'test-org'
  }
}));

// Mock OpenAI client responses
const mockCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

describe('Enhanced OpenAI Client', () => {
  // Sample chat messages for testing
  const testMessages: ChatMessage[] = [
    { role: 'user', content: 'Test message' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    openaiClient.resetRateLimiter();
  });

  it('should process chat completion successfully', async () => {
    // Mock successful API response
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: { content: 'Test response' },
          finish_reason: 'stop'
        }
      ]
    });

    const result = await openaiClient.processChatCompletion(testMessages);
    expect(result).toBe('Test response');

    // Verify API was called with correct parameters
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: testMessages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });
  });

  it('should handle rate limit errors', async () => {
    // Mock rate limit error response
    mockCreate.mockRejectedValueOnce({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded'
      }
    });

    await expect(
      openaiClient.processChatCompletion(testMessages)
    ).rejects.toThrow('OpenAI rate limit exceeded');
  });

  it('should handle invalid API key errors', async () => {
    // Mock invalid API key error
    mockCreate.mockRejectedValueOnce({
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key'
      }
    });

    await expect(
      openaiClient.processChatCompletion(testMessages)
    ).rejects.toThrow('Invalid OpenAI API key');
  });

  it('should handle context length errors', async () => {
    // Mock context length error
    mockCreate.mockRejectedValueOnce({
      error: {
        code: 'context_length_exceeded',
        message: 'Maximum context length exceeded'
      }
    });

    await expect(
      openaiClient.processChatCompletion(testMessages)
    ).rejects.toThrow('Input too long for model');
  });

  it('should respect rate limits', async () => {
    // Mock successful responses
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Test' } }]
    });

    // Make multiple requests
    const startTime = Date.now();
    await Promise.all([
      openaiClient.processChatCompletion(testMessages),
      openaiClient.processChatCompletion(testMessages),
      openaiClient.processChatCompletion(testMessages)
    ]);
    const endTime = Date.now();

    // Verify requests were rate limited
    const timeTaken = endTime - startTime;
    expect(timeTaken).toBeGreaterThan(200); // At least 2 rate limit delays
  });

  it('should handle custom options', async () => {
    // Mock successful response
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Test' } }]
    });

    // Test with custom options
    await openaiClient.processChatCompletion(testMessages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 1000
    });

    // Verify custom options were used
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        max_tokens: 1000
      })
    );
  });
});
