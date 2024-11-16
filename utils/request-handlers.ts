/**
 * Configuration type for request timeout and retry behavior
 */
type TimeoutConfig = {
  timeoutMs?: number; // Timeout duration in milliseconds
  maxRetries?: number; // Maximum number of retry attempts
  retryDelayMs?: number; // Delay between retries in milliseconds
};

/**
 * Custom error class for timeout errors
 */
export class RequestTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Delay utility for retry logic
 * @param ms Time to delay in milliseconds
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a promise with timeout and retry logic
 * @param promise The promise to wrap with timeout
 * @param config Timeout and retry configuration
 * @returns Promise result or throws timeout error
 */
export async function withTimeout<T>(
  promiseFn: () => Promise<T>,
  config: TimeoutConfig = {}
): Promise<T> {
  const { timeoutMs = 5000, maxRetries = 3, retryDelayMs = 1000 } = config;

  let lastError: Error | null = null;

  // Try the request up to maxRetries times
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise that rejects after timeoutMs
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new RequestTimeoutError());
        }, timeoutMs);
      });

      // Race between the actual request and the timeout
      const result = await Promise.race([promiseFn(), timeoutPromise]);

      return result;
    } catch (error) {
      lastError = error as Error;

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // If it was a timeout error, wait before retrying
      if (error instanceof RequestTimeoutError) {
        console.log(
          `Request timed out, retrying (${attempt + 1}/${maxRetries})`
        );
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError || new Error('Unknown error occurred');
}
