import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  key: string;
  onSave?: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ 
  data, 
  key, 
  onSave, 
  debounceMs = 1000, 
  enabled = true 
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((data: T) => {
    try {
      localStorage.setItem(`autosave_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [key]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }, [key]);

  // Clear localStorage backup
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }, [key]);

  // Debounced save
  useEffect(() => {
    if (!enabled) return;

    const currentDataStr = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentDataStr === previousDataRef.current) {
      return;
    }
    
    previousDataRef.current = currentDataStr;
    setHasUnsavedChanges(true);

    // Save to localStorage immediately as backup
    saveToLocalStorage(data);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the actual save
    if (onSave) {
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(data);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          clearLocalStorage(); // Clear backup after successful save
        } catch (error) {
          console.error('Autosave failed:', error);
          // Keep localStorage backup on failure
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, onSave, debounceMs, saveToLocalStorage, clearLocalStorage]);

  // Manual save
  const saveNow = useCallback(async () => {
    if (!onSave) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      clearLocalStorage();
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, clearLocalStorage]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    loadFromLocalStorage,
    clearLocalStorage,
  };
}
