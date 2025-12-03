/**
 * Library Context
 * Centralized cache management for Spotify library items (playlists, tracks, albums, artists)
 * Provides cross-synchronization between Spotify API and local storage
 */

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';

// Types for library items
export interface LibraryCache {
  playlists: any[];
  tracks: any[];
  albums: any[];
  artists: any[];
}

export interface LibraryContextType {
  // Cached data
  playlists: any[];
  tracks: any[];
  albums: any[];
  artists: any[];
  
  // Loading states
  isLoading: boolean;
  isLoadingPlaylists: boolean;
  isLoadingTracks: boolean;
  isLoadingAlbums: boolean;
  isLoadingArtists: boolean;
  
  // Refresh functions
  refreshAll: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  refreshTracks: () => Promise<void>;
  refreshAlbums: () => Promise<void>;
  refreshArtists: () => Promise<void>;
  
  // Optimistic update helpers (for immediate UI feedback)
  addTrackOptimistic: (track: any) => void;
  removeTrackOptimistic: (trackId: string) => void;
  addPlaylistOptimistic: (playlist: any) => void;
  removePlaylistOptimistic: (playlistId: string) => void;
  addAlbumOptimistic: (album: any) => void;
  removeAlbumOptimistic: (albumId: string) => void;
  addArtistOptimistic: (artist: any) => void;
  removeArtistOptimistic: (artistId: string) => void;
  
  // Last update timestamps
  lastUpdated: {
    playlists: number | null;
    tracks: number | null;
    albums: number | null;
    artists: number | null;
  };
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

// LocalStorage keys for persistent cache
const STORAGE_KEYS = {
  playlists: 'spotify_library_playlists',
  tracks: 'spotify_library_tracks',
  albums: 'spotify_library_albums',
  artists: 'spotify_library_artists',
  timestamps: 'spotify_library_timestamps',
};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// Background sync interval (2 minutes) - to catch updates from other clients
const BACKGROUND_SYNC_INTERVAL_MS = 2 * 60 * 1000;

// Minimum time before refreshing on visibility change (30 seconds)
const VISIBILITY_REFRESH_THRESHOLD_MS = 30 * 1000;

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isGuest } = useAuth();
  
  // State for library items
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  
  // Loading states
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  
  // Track last token to detect changes
  const lastTokenRef = useRef<string | null>(null);
  
  // Last update timestamps
  const [lastUpdated, setLastUpdated] = useState<{
    playlists: number | null;
    tracks: number | null;
    albums: number | null;
    artists: number | null;
  }>({
    playlists: null,
    tracks: null,
    albums: null,
    artists: null,
  });

  // Load cached data from localStorage on mount
  useEffect(() => {
    try {
      const cachedPlaylists = localStorage.getItem(STORAGE_KEYS.playlists);
      const cachedTracks = localStorage.getItem(STORAGE_KEYS.tracks);
      const cachedAlbums = localStorage.getItem(STORAGE_KEYS.albums);
      const cachedArtists = localStorage.getItem(STORAGE_KEYS.artists);
      const cachedTimestamps = localStorage.getItem(STORAGE_KEYS.timestamps);
      
      if (cachedPlaylists) setPlaylists(JSON.parse(cachedPlaylists));
      if (cachedTracks) setTracks(JSON.parse(cachedTracks));
      if (cachedAlbums) setAlbums(JSON.parse(cachedAlbums));
      if (cachedArtists) setArtists(JSON.parse(cachedArtists));
      if (cachedTimestamps) setLastUpdated(JSON.parse(cachedTimestamps));
      
      console.log('Library cache loaded from localStorage');
    } catch (error) {
      console.error('Error loading library cache from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, []);

  // Utility to detect if two arrays have different items (by ID)
  const hasChanges = useCallback((currentItems: any[], newItems: any[]): boolean => {
    // Quick length check
    if (currentItems.length !== newItems.length) return true;
    
    // Create sets of IDs for comparison
    const currentIds = new Set(currentItems.map(item => item.id));
    const newIds = new Set(newItems.map(item => item.id));
    
    // Check if all IDs match
    if (currentIds.size !== newIds.size) return true;
    for (const id of currentIds) {
      if (!newIds.has(id)) return true;
    }
    
    return false;
  }, []);

  // Helper to fetch all pages from a paginated Spotify endpoint
  const fetchAllPages = useCallback(async (url: string, dataKey: string = 'items'): Promise<any[]> => {
    if (!token) return [];
    
    const allItems: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const res: Response = await fetch(nextUrl, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('Token expired during fetch');
        }
        break;
      }
      
      const data: any = await res.json();
      const items = dataKey === 'artists' ? data.artists?.items : data.items;
      if (items) allItems.push(...items);
      
      nextUrl = data.next || (dataKey === 'artists' ? data.artists?.next : null);
    }

    return allItems;
  }, [token]);

  // Refresh playlists
  const refreshPlaylists = useCallback(async () => {
    if (isGuest || !token || token === 'GUEST') {
      setPlaylists([]);
      saveToLocalStorage(STORAGE_KEYS.playlists, []);
      return;
    }
    
    setIsLoadingPlaylists(true);
    try {
      console.log('Checking playlists from Spotify API...');
      const playlistItems = await fetchAllPages('https://api.spotify.com/v1/me/playlists?limit=50');
      
      // Only update if changes detected
      setPlaylists(prev => {
        if (!hasChanges(prev, playlistItems)) {
          console.log('No playlist changes detected, skipping UI update');
          return prev;
        }
        console.log(`Playlist changes detected, updating UI (${playlistItems.length} playlists)`);
        saveToLocalStorage(STORAGE_KEYS.playlists, playlistItems);
        return playlistItems;
      });
      
      const newTimestamp = Date.now();
      setLastUpdated(prev => {
        const updated = { ...prev, playlists: newTimestamp };
        saveToLocalStorage(STORAGE_KEYS.timestamps, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error refreshing playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [token, isGuest, fetchAllPages, saveToLocalStorage, hasChanges]);

  // Refresh tracks (liked songs)
  const refreshTracks = useCallback(async () => {
    if (isGuest || !token || token === 'GUEST') {
      setTracks([]);
      saveToLocalStorage(STORAGE_KEYS.tracks, []);
      return;
    }
    
    setIsLoadingTracks(true);
    try {
      console.log('Checking liked tracks from Spotify API...');
      const trackItems = await fetchAllPages('https://api.spotify.com/v1/me/tracks?limit=50');
      const extractedTracks = trackItems.map((i: any) => i.track);
      
      // Only update if changes detected
      setTracks(prev => {
        if (!hasChanges(prev, extractedTracks)) {
          console.log('No track changes detected, skipping UI update');
          return prev;
        }
        console.log(`Track changes detected, updating UI (${extractedTracks.length} tracks)`);
        saveToLocalStorage(STORAGE_KEYS.tracks, extractedTracks);
        return extractedTracks;
      });
      
      const newTimestamp = Date.now();
      setLastUpdated(prev => {
        const updated = { ...prev, tracks: newTimestamp };
        saveToLocalStorage(STORAGE_KEYS.timestamps, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error refreshing tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  }, [token, isGuest, fetchAllPages, saveToLocalStorage, hasChanges]);

  // Refresh albums
  const refreshAlbums = useCallback(async () => {
    if (isGuest || !token || token === 'GUEST') {
      setAlbums([]);
      saveToLocalStorage(STORAGE_KEYS.albums, []);
      return;
    }
    
    setIsLoadingAlbums(true);
    try {
      console.log('Checking albums from Spotify API...');
      const albumItems = await fetchAllPages('https://api.spotify.com/v1/me/albums?limit=50');
      const extractedAlbums = albumItems.map((i: any) => i.album);
      
      // Only update if changes detected
      setAlbums(prev => {
        if (!hasChanges(prev, extractedAlbums)) {
          console.log('No album changes detected, skipping UI update');
          return prev;
        }
        console.log(`Album changes detected, updating UI (${extractedAlbums.length} albums)`);
        saveToLocalStorage(STORAGE_KEYS.albums, extractedAlbums);
        return extractedAlbums;
      });
      
      const newTimestamp = Date.now();
      setLastUpdated(prev => {
        const updated = { ...prev, albums: newTimestamp };
        saveToLocalStorage(STORAGE_KEYS.timestamps, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error refreshing albums:', error);
    } finally {
      setIsLoadingAlbums(false);
    }
  }, [token, isGuest, fetchAllPages, saveToLocalStorage, hasChanges]);

  // Refresh artists
  const refreshArtists = useCallback(async () => {
    if (isGuest || !token || token === 'GUEST') {
      setArtists([]);
      saveToLocalStorage(STORAGE_KEYS.artists, []);
      return;
    }
    
    setIsLoadingArtists(true);
    try {
      console.log('Checking followed artists from Spotify API...');
      const artistItems = await fetchAllPages(
        'https://api.spotify.com/v1/me/following?type=artist&limit=50',
        'artists'
      );
      
      // Only update if changes detected
      setArtists(prev => {
        if (!hasChanges(prev, artistItems)) {
          console.log('No artist changes detected, skipping UI update');
          return prev;
        }
        console.log(`Artist changes detected, updating UI (${artistItems.length} artists)`);
        saveToLocalStorage(STORAGE_KEYS.artists, artistItems);
        return artistItems;
      });
      
      const newTimestamp = Date.now();
      setLastUpdated(prev => {
        const updated = { ...prev, artists: newTimestamp };
        saveToLocalStorage(STORAGE_KEYS.timestamps, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error refreshing artists:', error);
    } finally {
      setIsLoadingArtists(false);
    }
  }, [token, isGuest, fetchAllPages, saveToLocalStorage, hasChanges]);

  // Refresh all library data
  const refreshAll = useCallback(async () => {
    console.log('Refreshing all library data...');
    await Promise.all([
      refreshPlaylists(),
      refreshTracks(),
      refreshAlbums(),
      refreshArtists(),
    ]);
    console.log('All library data refreshed');
  }, [refreshPlaylists, refreshTracks, refreshAlbums, refreshArtists]);

  // Optimistic update functions for immediate UI feedback
  const addTrackOptimistic = useCallback((track: any) => {
    setTracks(prev => {
      // Check if already exists
      if (prev.some(t => t.id === track.id)) return prev;
      const updated = [track, ...prev];
      saveToLocalStorage(STORAGE_KEYS.tracks, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const removeTrackOptimistic = useCallback((trackId: string) => {
    setTracks(prev => {
      const updated = prev.filter(t => t.id !== trackId);
      saveToLocalStorage(STORAGE_KEYS.tracks, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const addPlaylistOptimistic = useCallback((playlist: any) => {
    setPlaylists(prev => {
      if (prev.some(p => p.id === playlist.id)) return prev;
      const updated = [playlist, ...prev];
      saveToLocalStorage(STORAGE_KEYS.playlists, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const removePlaylistOptimistic = useCallback((playlistId: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(p => p.id !== playlistId);
      saveToLocalStorage(STORAGE_KEYS.playlists, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const addAlbumOptimistic = useCallback((album: any) => {
    setAlbums(prev => {
      if (prev.some(a => a.id === album.id)) return prev;
      const updated = [album, ...prev];
      saveToLocalStorage(STORAGE_KEYS.albums, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const removeAlbumOptimistic = useCallback((albumId: string) => {
    setAlbums(prev => {
      const updated = prev.filter(a => a.id !== albumId);
      saveToLocalStorage(STORAGE_KEYS.albums, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const addArtistOptimistic = useCallback((artist: any) => {
    setArtists(prev => {
      if (prev.some(a => a.id === artist.id)) return prev;
      const updated = [artist, ...prev];
      saveToLocalStorage(STORAGE_KEYS.artists, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const removeArtistOptimistic = useCallback((artistId: string) => {
    setArtists(prev => {
      const updated = prev.filter(a => a.id !== artistId);
      saveToLocalStorage(STORAGE_KEYS.artists, updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  // Initial fetch and token change handling
  useEffect(() => {
    if (isGuest || !token || token === 'GUEST') {
      console.log('Guest mode or no token - clearing library cache');
      setPlaylists([]);
      setTracks([]);
      setAlbums([]);
      setArtists([]);
      lastTokenRef.current = null;
      return;
    }

    // If token changed, reset and refetch
    if (lastTokenRef.current && lastTokenRef.current !== token) {
      console.log('Token changed, refreshing all library data');
      lastTokenRef.current = token;
      refreshAll();
      return;
    }

    // Check if cache is stale or empty
    const now = Date.now();
    const shouldRefresh = (timestamp: number | null) => 
      !timestamp || (now - timestamp > CACHE_EXPIRY_MS);

    lastTokenRef.current = token;

    // Refresh stale data
    if (shouldRefresh(lastUpdated.playlists) || playlists.length === 0) {
      refreshPlaylists();
    }
    if (shouldRefresh(lastUpdated.tracks) || tracks.length === 0) {
      refreshTracks();
    }
    if (shouldRefresh(lastUpdated.albums) || albums.length === 0) {
      refreshAlbums();
    }
    if (shouldRefresh(lastUpdated.artists) || artists.length === 0) {
      refreshArtists();
    }
  }, [token, isGuest]);

  // Clear cache on logout
  useEffect(() => {
    if (isGuest || !token) {
      // Clear localStorage cache on logout
      localStorage.removeItem(STORAGE_KEYS.playlists);
      localStorage.removeItem(STORAGE_KEYS.tracks);
      localStorage.removeItem(STORAGE_KEYS.albums);
      localStorage.removeItem(STORAGE_KEYS.artists);
      localStorage.removeItem(STORAGE_KEYS.timestamps);
    }
  }, [isGuest, token]);

  // Background periodic sync - catches updates from other clients (Spotify app, web, etc.)
  useEffect(() => {
    if (isGuest || !token || token === 'GUEST') return;

    const intervalId = setInterval(() => {
      console.log('Background sync: refreshing library data...');
      refreshAll();
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [token, isGuest, refreshAll]);

  // Visibility change handler - refresh when user returns to the tab
  useEffect(() => {
    if (isGuest || !token || token === 'GUEST') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if enough time has passed since last update
        const now = Date.now();
        const oldestUpdate = Math.min(
          lastUpdated.playlists || 0,
          lastUpdated.tracks || 0,
          lastUpdated.albums || 0,
          lastUpdated.artists || 0
        );
        
        if (now - oldestUpdate > VISIBILITY_REFRESH_THRESHOLD_MS) {
          console.log('Tab became visible, refreshing library data...');
          refreshAll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, isGuest, refreshAll, lastUpdated]);

  // Window focus handler - refresh when window regains focus (for multi-window scenarios)
  useEffect(() => {
    if (isGuest || !token || token === 'GUEST') return;

    const handleFocus = () => {
      const now = Date.now();
      const oldestUpdate = Math.min(
        lastUpdated.playlists || 0,
        lastUpdated.tracks || 0,
        lastUpdated.albums || 0,
        lastUpdated.artists || 0
      );
      
      if (now - oldestUpdate > VISIBILITY_REFRESH_THRESHOLD_MS) {
        console.log('Window focused, refreshing library data...');
        refreshAll();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, isGuest, refreshAll, lastUpdated]);

  const isLoading = isLoadingPlaylists || isLoadingTracks || isLoadingAlbums || isLoadingArtists;

  const value: LibraryContextType = {
    playlists,
    tracks,
    albums,
    artists,
    isLoading,
    isLoadingPlaylists,
    isLoadingTracks,
    isLoadingAlbums,
    isLoadingArtists,
    refreshAll,
    refreshPlaylists,
    refreshTracks,
    refreshAlbums,
    refreshArtists,
    addTrackOptimistic,
    removeTrackOptimistic,
    addPlaylistOptimistic,
    removePlaylistOptimistic,
    addAlbumOptimistic,
    removeAlbumOptimistic,
    addArtistOptimistic,
    removeArtistOptimistic,
    lastUpdated,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};
