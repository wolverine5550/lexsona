'use client';

import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface UseFormPersistenceProps<T> {
  key: string;
  initialState: T;
  autoSaveDelay?: number;
}

export function useFormPersistence<T>({
  key,
  initialState,
  autoSaveDelay = 1000
}: UseFormPersistenceProps<T>) {
  // Initialize with initialState first
  const [formData, setFormData] = useState<T>(initialState);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Effect to load saved data on client-side only
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem(`form_${key}`);
      const timestamp = localStorage.getItem(`form_${key}_timestamp`);

      if (saved) {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      }

      if (timestamp) {
        setLastSaved(new Date(timestamp));
      }
    } catch (e) {
      console.error('Error loading saved form data:', e);
    }
  }, [key]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: T) => {
      if (!isClient) return;

      try {
        localStorage.setItem(`form_${key}`, JSON.stringify(data));
        const now = new Date();
        localStorage.setItem(`form_${key}_timestamp`, now.toISOString());
        setLastSaved(now);
      } catch (e) {
        console.error('Error auto-saving form data:', e);
      }
    }, autoSaveDelay),
    [key, autoSaveDelay, isClient]
  );

  // Auto-save whenever form data changes
  useEffect(() => {
    if (isClient) {
      debouncedSave(formData);
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [formData, debouncedSave, isClient]);

  const clearSavedData = useCallback(() => {
    if (!isClient) return;

    try {
      localStorage.removeItem(`form_${key}`);
      localStorage.removeItem(`form_${key}_timestamp`);
      setFormData(initialState);
      setLastSaved(null);
    } catch (e) {
      console.error('Error clearing form data:', e);
    }
  }, [key, initialState, isClient]);

  return {
    formData,
    setFormData,
    clearSavedData,
    lastSaved
  };
}
