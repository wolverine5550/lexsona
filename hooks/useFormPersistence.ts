'use client';

import { useState, useCallback, useEffect } from 'react';

export interface UseFormPersistenceProps<T> {
  key: string;
  initialData?: T;
}

export function useFormPersistence<T>({
  key,
  initialData
}: UseFormPersistenceProps<T>) {
  const [formData, setInternalFormData] = useState<T | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        setInternalFormData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        if (initialData) {
          setInternalFormData(initialData);
        }
      }
    } else if (initialData) {
      setInternalFormData(initialData);
    }
  }, [key, initialData]);

  // Create a wrapped setFormData function that also persists to localStorage
  const setFormData = useCallback(
    (data: T | ((prev: T | null) => T)) => {
      const newData = data instanceof Function ? data(formData) : data;
      try {
        localStorage.setItem(key, JSON.stringify(newData));
        setLastSaved(new Date());
        setInternalFormData(newData);
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    },
    [key, formData]
  );

  // Load persisted data with callback
  const loadPersistedData = useCallback(
    (callback: (data: T | null) => void) => {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          callback(parsedData);
        } catch (error) {
          console.error('Error loading persisted data:', error);
          callback(null);
        }
      } else {
        callback(initialData || null);
      }
    },
    [key, initialData]
  );

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(key);
    setInternalFormData(initialData || null);
    setLastSaved(null);
  }, [key, initialData]);

  return {
    formData,
    setFormData,
    loadPersistedData,
    clearSavedData,
    lastSaved
  };
}
