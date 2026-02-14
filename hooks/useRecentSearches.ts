/**
 * Recent Searches Hook
 * AsyncStorage-backed recent medication searches
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@puzzle_pharm_recent_searches';
const MAX_SEARCHES = 10;

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface UseRecentSearchesReturn {
  recentSearches: string[];
  addSearch: (query: string) => Promise<void>;
  removeSearch: (query: string) => Promise<void>;
  clearSearches: () => Promise<void>;
  loading: boolean;
}

export const useRecentSearches = (): UseRecentSearchesReturn => {
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  // Load searches from AsyncStorage
  useEffect(() => {
    const loadSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: RecentSearch[] = JSON.parse(stored);
          // Sort by most recent and filter duplicates
          const unique = parsed
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_SEARCHES);
          setSearches(unique);
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSearches();
  }, []);

  // Save searches to AsyncStorage
  const saveSearches = useCallback(async (newSearches: RecentSearch[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }, []);

  // Add a new search
  const addSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const normalizedQuery = query.trim().toLowerCase();

    setSearches(prev => {
      // Remove existing entry with same query
      const filtered = prev.filter(
        s => s.query.toLowerCase() !== normalizedQuery
      );

      // Add new search at the beginning
      const newSearches: RecentSearch[] = [
        { query: query.trim(), timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_SEARCHES);

      saveSearches(newSearches);
      return newSearches;
    });
  }, [saveSearches]);

  // Remove a specific search
  const removeSearch = useCallback(async (query: string) => {
    setSearches(prev => {
      const filtered = prev.filter(
        s => s.query.toLowerCase() !== query.toLowerCase()
      );
      saveSearches(filtered);
      return filtered;
    });
  }, [saveSearches]);

  // Clear all searches
  const clearSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSearches([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  return {
    recentSearches: searches.map(s => s.query),
    addSearch,
    removeSearch,
    clearSearches,
    loading,
  };
};

export default useRecentSearches;

