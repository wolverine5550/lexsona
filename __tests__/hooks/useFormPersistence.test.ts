import { renderHook, act } from '@testing-library/react';
import { useFormPersistence } from '@/hooks/useFormPersistence';

describe('useFormPersistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  it('should initialize with initial state when no saved data exists', () => {
    const initialState = { name: 'test' };
    const { result } = renderHook(() =>
      useFormPersistence({ key: 'test', initialState })
    );

    expect(result.current.formData).toEqual(initialState);
  });

  it('should load saved data from localStorage', () => {
    const savedData = { name: 'saved' };
    localStorage.setItem('form_test', JSON.stringify(savedData));

    const { result } = renderHook(() =>
      useFormPersistence({ key: 'test', initialState: { name: '' } })
    );

    expect(result.current.formData).toEqual(savedData);
  });

  it('should save data to localStorage when updated', () => {
    const { result } = renderHook(() =>
      useFormPersistence({ key: 'test', initialState: { name: '' } })
    );

    act(() => {
      result.current.setFormData({ name: 'updated' });
    });

    const saved = localStorage.getItem('form_test');
    expect(JSON.parse(saved!)).toEqual({ name: 'updated' });
  });

  it('should clear saved data', () => {
    localStorage.setItem('form_test', JSON.stringify({ name: 'saved' }));

    const { result } = renderHook(() =>
      useFormPersistence({ key: 'test', initialState: { name: '' } })
    );

    act(() => {
      result.current.clearSavedData();
    });

    expect(localStorage.getItem('form_test')).toBeNull();
    expect(result.current.formData).toEqual({ name: '' });
  });
});
