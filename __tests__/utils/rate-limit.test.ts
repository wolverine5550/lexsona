import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/utils/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within rate limit', async () => {
    const limiter = rateLimit(2, 1000); // 2 requests per second

    await limiter.wait(); // First request
    await limiter.wait(); // Second request

    expect(true).toBe(true); // Should not throw
  });

  it('should delay requests that exceed rate limit', async () => {
    const limiter = rateLimit(1, 1000); // 1 request per second

    const startTime = Date.now();
    await limiter.wait(); // First request

    const promise = limiter.wait(); // Second request should be delayed

    vi.advanceTimersByTime(1000); // Advance time by 1 second
    await promise;

    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });

  it('should reset rate limiter state', async () => {
    const limiter = rateLimit(1, 1000);

    await limiter.wait(); // First request
    limiter.reset();
    await limiter.wait(); // Should work immediately after reset

    expect(true).toBe(true); // Should not throw
  });
});
