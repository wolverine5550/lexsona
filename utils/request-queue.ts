/**
 * Types for request queue
 */
type QueuedRequest = {
  id: string;
  request: () => Promise<any>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
};

type QueueStatus = {
  pending: number;
  processing: boolean;
  lastProcessed: number | null;
};

/**
 * Request Queue Manager
 * Handles queuing and processing of requests when offline
 */
export class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;
  private lastProcessedTime: number | null = null;
  private statusListeners: ((status: QueueStatus) => void)[] = [];

  /**
   * Add a request to the queue
   * @param request Function that returns a promise
   * @param maxRetries Maximum number of retry attempts
   * @returns Promise that resolves when request is processed
   */
  async addToQueue(
    request: () => Promise<any>,
    maxRetries: number = 3
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: crypto.randomUUID(),
        request,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
        resolve,
        reject
      };

      this.queue.push(queuedRequest);
      this.notifyStatusListeners();
    });
  }

  /**
   * Process all queued requests
   * Called when connection is restored
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    this.notifyStatusListeners();

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        const result = await request.request();
        request.resolve?.(result);
        this.queue.shift(); // Remove processed request
        this.lastProcessedTime = Date.now();
      } catch (error) {
        if (request.retryCount < request.maxRetries) {
          request.retryCount++;
          // Move to end of queue for retry
          this.queue.push(this.queue.shift()!);
        } else {
          request.reject?.(error);
          this.queue.shift(); // Remove failed request
        }
      }

      this.notifyStatusListeners();
    }

    this.isProcessing = false;
    this.notifyStatusListeners();
  }

  /**
   * Subscribe to queue status updates
   * @param listener Callback function for status updates
   */
  subscribeToStatus(listener: (status: QueueStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus()); // Initial status

    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current queue status
   */
  private getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.isProcessing,
      lastProcessed: this.lastProcessedTime
    };
  }

  /**
   * Notify all status listeners of queue changes
   */
  private notifyStatusListeners(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((listener) => listener(status));
  }
}

// Create singleton instance
export const requestQueue = new RequestQueueManager();
