import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './auth';
import type { Track } from '../types/spotify';

interface SearchResults {
  tracks: Track[];
  albums: any[];
  artists: any[];
  playlists: any[];
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResults;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: { tracks: boolean; albums: boolean; artists: boolean; playlists: boolean };
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  performSearch: (query: string) => Promise<void>;
  loadMore: (type: 'tracks' | 'albums' | 'artists' | 'playlists') => Promise<void>;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tracks: [], albums: [], artists: [], playlists: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState({ tracks: true, albums: true, artists: true, playlists: true });
  const [offsets, setOffsets] = useState({ tracks: 0, albums: 0, artists: 0, playlists: 0 });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 40; // Fetch 40 items at a time

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentSearches');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 10));
        }
      }
    } catch (e) {
      console.warn('Failed to load recent searches', e);
    }
  }, []);

  const addRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      try {
        const normalized = searchQuery.trim();
        const lower = normalized.toLowerCase();
        const deduped = [normalized, ...prev.filter(s => s.toLowerCase() !== lower)].slice(0, 10);
        
        localStorage.setItem('recentSearches', JSON.stringify(deduped));
        return deduped;
      } catch (e) {
        console.warn('Failed to save recent search', e);
        return prev;
      }
    });
  }, []);

  const removeRecentSearch = useCallback((searchQuery: string) => {
    setRecentSearches(prev => {
      try {
        const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
        localStorage.setItem('recentSearches', JSON.stringify(filtered));
        return filtered;
      } catch (e) {
        console.warn('Failed to remove recent search', e);
        return prev;
      }
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem('recentSearches');
      setRecentSearches([]);
    } catch (e) {
      console.warn('Failed to clear recent searches', e);
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
      setOffsets({ tracks: 0, albums: 0, artists: 0, playlists: 0 });
      setHasMore({ tracks: true, albums: true, artists: true, playlists: true });
      return;
    }

    if (!token) {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
      return;
    }

    setIsSearching(true);
    addRecentSearch(searchQuery);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,album,artist,playlist&limit=${LIMIT}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const tracks = data.tracks?.items || [];
      const albums = data.albums?.items || [];
      const artists = data.artists?.items || [];
      const playlists = data.playlists?.items || [];
      
      setResults({
        tracks,
        albums,
        artists,
        playlists
      });
      
      // Set initial offsets and hasMore flags
      setOffsets({
        tracks: LIMIT,
        albums: LIMIT,
        artists: LIMIT,
        playlists: LIMIT
      });
      
      setHasMore({
        tracks: tracks.length === LIMIT && (data.tracks?.total || 0) > LIMIT,
        albums: albums.length === LIMIT && (data.albums?.total || 0) > LIMIT,
        artists: artists.length === LIMIT && (data.artists?.total || 0) > LIMIT,
        playlists: playlists.length === LIMIT && (data.playlists?.total || 0) > LIMIT
      });
    } catch (err) {
      console.error('Search failed', err);
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
    } finally {
      setIsSearching(false);
    }
  }, [token, addRecentSearch, LIMIT]);

  const loadMore = useCallback(async (type: 'tracks' | 'albums' | 'artists' | 'playlists') => {
    if (!query.trim() || !token || !hasMore[type] || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const currentOffset = offsets[type];
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type.slice(0, -1)}&limit=${LIMIT}&offset=${currentOffset}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const key = type as keyof SearchResults;
      const newItems = data[key]?.items || [];
      const total = data[key]?.total || 0;
      
      setResults(prev => ({
        ...prev,
        [type]: [...prev[type], ...newItems]
      }));
      
      // Update offset
      setOffsets(prev => ({
        ...prev,
        [type]: currentOffset + LIMIT
      }));
      
      // Update hasMore
      setHasMore(prev => ({
        ...prev,
        [type]: results[type].length + newItems.length < total && newItems.length === LIMIT
      }));
    } catch (err) {
      console.error(`Failed to load more ${type}`, err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [query, token, hasMore, isLoadingMore, offsets, results, LIMIT]);

  const clearResults = useCallback(() => {
    setResults({ tracks: [], albums: [], artists: [], playlists: [] });
    setQuery('');
    setOffsets({ tracks: 0, albums: 0, artists: 0, playlists: 0 });
    setHasMore({ tracks: true, albums: true, artists: true, playlists: true });
  }, []);

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        // Inline search to avoid dependency on performSearch
        const searchQuery = query.trim();
        if (!searchQuery || !token) {
          setResults({ tracks: [], albums: [], artists: [], playlists: [] });
          return;
        }

        setIsSearching(true);
        addRecentSearch(searchQuery);

        fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,album,artist,playlist&limit=${LIMIT}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            const tracks = data.tracks?.items || [];
            const albums = data.albums?.items || [];
            const artists = data.artists?.items || [];
            const playlists = data.playlists?.items || [];
            
            setResults({
              tracks,
              albums,
              artists,
              playlists
            });
            
            // Set initial offsets and hasMore flags
            setOffsets({
              tracks: LIMIT,
              albums: LIMIT,
              artists: LIMIT,
              playlists: LIMIT
            });
            
            setHasMore({
              tracks: tracks.length === LIMIT && (data.tracks?.total || 0) > LIMIT,
              albums: albums.length === LIMIT && (data.albums?.total || 0) > LIMIT,
              artists: artists.length === LIMIT && (data.artists?.total || 0) > LIMIT,
              playlists: playlists.length === LIMIT && (data.playlists?.total || 0) > LIMIT
            });
          })
          .catch(err => {
            console.error('Search failed', err);
            setResults({ tracks: [], albums: [], artists: [], playlists: [] });
          })
          .finally(() => {
            setIsSearching(false);
          });
      }, 350);
    } else {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
    }

    // Cleanup on unmount or query change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, token, addRecentSearch]);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        isSearching,
        isLoadingMore,
        hasMore,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        performSearch,
        loadMore,
        clearResults
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};
