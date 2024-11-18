/**
 * Interface for the rate limiter instance
 */
interface RateLimiter {
  wait: () => Promise<void>;
  reset: () => void;
}

/**
 * Creates a rate limiter to control API request frequency
 * @param maxRequests - Maximum number of requests allowed in the time window
 * @param timeWindow - Time window in milliseconds
 * @returns RateLimiter instance with wait and reset methods
 */
export function rateLimit(
  maxRequests: number,
  timeWindow: number
): RateLimiter {
  let requests: number[] = [];

  /**
   * Removes timestamps older than the time window
   */
  const clearOldRequests = () => {
    const now = Date.now();
    requests = requests.filter((timestamp) => now - timestamp < timeWindow);
  };

  /**
   * Waits until a request can be made within rate limits
   */
  const wait = async (): Promise<void> => {
    clearOldRequests();

    if (requests.length >= maxRequests) {
      const oldestRequest = requests[0];
      const now = Date.now();
      const timeToWait = timeWindow - (now - oldestRequest);

      if (timeToWait > 0) {
        await new Promise((resolve) => setTimeout(resolve, timeToWait));
        return wait(); // Recursively check again after waiting
      }
    }

    requests.push(Date.now());
  };

  /**
   * Resets the rate limiter state
   */
  const reset = (): void => {
    requests = [];
  };

  return { wait, reset };
}
