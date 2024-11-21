import OpenAI from 'openai';
import { rateLimit } from '@/utils/rate-limit';
import type {
  ChatMessage,
  OpenAIOptions,
  OpenAIErrorResponse
} from '@/types/openai';

// Constants for rate limiting
const RATE_LIMIT = {
  requests: 50,
  perSeconds: 60,
  timeout: 100
};

export class EnhancedOpenAIClient {
  private client: OpenAI;
  private limiter: ReturnType<typeof rateLimit>;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || '') {
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.client = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID
    });

    this.limiter = rateLimit(RATE_LIMIT.requests, RATE_LIMIT.perSeconds * 1000);
  }

  /**
   * Processes a chat completion request with rate limiting and error handling
   * @param messages - Array of chat messages to process
   * @param options - Additional options for the API call
   * @returns Processed response from OpenAI
   */
  async processChatCompletion(
    messages: ChatMessage[],
    options: OpenAIOptions = {}
  ): Promise<string> {
    try {
      // Wait for rate limit window
      await this.limiter.wait();

      // Set default options
      const {
        model = 'gpt-4',
        temperature = 0.7,
        maxTokens = 500,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0
      } = options;

      // Make API call with full options
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty
      });

      // Return first choice's content
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // Handle OpenAI API errors with proper typing
      const e = error as OpenAIErrorResponse;

      if (e.error?.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded');
      }
      if (e.error?.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key');
      }
      if (e.error?.code === 'context_length_exceeded') {
        throw new Error('Input too long for model');
      }

      // Re-throw with more context
      throw new Error(
        `OpenAI API error: ${e.error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Resets the rate limiter state
   */
  resetRateLimiter(): void {
    this.limiter.reset();
  }
}

// Export a function to create the client instead of a singleton
let clientInstance: EnhancedOpenAIClient | null = null;

export function getOpenAIClient(): EnhancedOpenAIClient {
  if (!clientInstance) {
    clientInstance = new EnhancedOpenAIClient();
  }
  return clientInstance;
}
