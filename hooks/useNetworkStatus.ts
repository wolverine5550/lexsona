'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Interface for network status state
 */
interface NetworkStatus {
  isOnline: boolean; // Current online/offline status
  wasOffline: boolean; // Tracks if we were previously offline
  lastOnline: number; // Timestamp of last online status
}

/**
 * Custom hook to handle network status and connectivity issues
 * Provides real-time network status updates and reconnection handling
 */
export function useNetworkStatus() {
  // Initialize state with current network status
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: Date.now()
  });

  /**
   * Handler for when the network comes back online
   * Updates status and timestamps
   */
  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      isOnline: true,
      wasOffline: !prev.isOnline, // Only true if we were actually offline
      lastOnline: Date.now()
    }));
  }, []);

  /**
   * Handler for when the network goes offline
   * Updates status while preserving last online timestamp
   */
  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false
    }));
  }, []);

  /**
   * Set up event listeners for online/offline events
   */
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Helper function to check if we've been offline for too long
   * @param threshold - Time in milliseconds to consider as "too long"
   */
  const hasBeenOfflineTooLong = useCallback(
    (threshold: number = 30000) => {
      if (status.isOnline) return false;
      return Date.now() - status.lastOnline > threshold;
    },
    [status.isOnline, status.lastOnline]
  );

  return {
    ...status,
    hasBeenOfflineTooLong
  };
}
