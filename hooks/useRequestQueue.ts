import { useState, useEffect } from 'react';
import { requestQueue } from '@/utils/request-queue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Hook to manage request queue status and offline requests
 */
export function useRequestQueue() {
  const { isOnline } = useNetworkStatus();
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: false,
    lastProcessed: null as number | null
  });

  // Subscribe to queue status updates
  useEffect(() => {
    return requestQueue.subscribeToStatus(setQueueStatus);
  }, []);

  // Process queue when back online
  useEffect(() => {
    if (isOnline && queueStatus.pending > 0) {
      requestQueue.processQueue();
    }
  }, [isOnline, queueStatus.pending]);

  return {
    queueStatus,
    addToQueue: requestQueue.addToQueue.bind(requestQueue)
  };
}
