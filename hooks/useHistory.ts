import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  id: number; // timestamp
  originalDrawingImage: string;
  recognizedObject: string;
  coloringPageImage: string;
  coloredImage: string | null;
  story: string;
  storyImage: string;
  speechData: string;
  storyTheme: string;
}

const HISTORY_STORAGE_KEY = 'creativeSuiteHistory';
const MAX_HISTORY_ITEMS = 5;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      // Ensure we don't save more than the max limit
      const historyToSave = history.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyToSave));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history, isInitialized]);
  
  const isHistoryFull = history.length >= MAX_HISTORY_ITEMS;

  const addHistory = useCallback((item: Omit<HistoryItem, 'id'>) => {
    setHistory(prev => {
        const newHistory = [{ ...item, id: Date.now() }, ...prev];
        return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const deleteHistory = useCallback((id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  return { history, addHistory, deleteHistory, isHistoryFull };
};
