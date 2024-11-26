'use client';

import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface UseFormPersistenceProps<T> {
  key: string;
  initialState: T;
  autoSaveDelay?: number; // Delay in ms before auto-saving
}

/**
 * Hook to persist form state in localStorage
 * Automatically saves form data and restores it on page load
 */
export function useFormPersistence<T>({
  key,
  initialState,
  autoSaveDelay = 1000 // Default 1 second delay
}: UseFormPersistenceProps<T>) {
  // Initialize state with persisted data or initial state
  const [formData, setFormData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialState;

    // Try to get saved data from localStorage
    const saved = localStorage.getItem(`form_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
        return initialState;
      }
    }

    return initialState;
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: T) => {
      try {
        localStorage.setItem(`form_${key}`, JSON.stringify(data));
        // Save timestamp for "Resume Progress" feature
        localStorage.setItem(`form_${key}_timestamp`, new Date().toISOString());
      } catch (e) {
        console.error('Error auto-saving form data:', e);
      }
    }, autoSaveDelay),
    [key, autoSaveDelay]
  );

  // Auto-save whenever form data changes
  useEffect(() => {
    debouncedSave(formData);
    return () => {
      debouncedSave.cancel();
    };
  }, [formData, debouncedSave]);

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`form_${key}`);
      setFormData(initialState);
    } catch (e) {
      console.error('Error clearing form data:', e);
    }
  };

  // Get last saved timestamp
  const getLastSaved = () => {
    try {
      const timestamp = localStorage.getItem(`form_${key}_timestamp`);
      return timestamp ? new Date(timestamp) : null;
    } catch (e) {
      console.error('Error getting last saved timestamp:', e);
      return null;
    }
  };

  return {
    formData,
    setFormData,
    clearSavedData,
    lastSaved: getLastSaved()
  };
}
