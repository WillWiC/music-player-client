import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useAuth } from './auth';

interface PlaylistsContextType {
  playlists: any[];
  isLoadingPlaylists: boolean;
  refreshPlaylists: () => void;
}

const PlaylistsContext = createContext<PlaylistsContextType | undefined>(undefined);

export const usePlaylists = () => {
  const context = useContext(PlaylistsContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistsProvider');
  }
  return context;
};

export const PlaylistsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isGuest } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  
  // Persistent cache across component mounts
  const playlistsCache = useRef<any[]>([]);
  const playlistsFetched = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const fetchPlaylists = async (forceRefresh: boolean = false) => {
    // Don't fetch playlists if user is in guest mode or no token
    if (isGuest || !token || token === 'GUEST') {
      console.log('Guest mode or no token - clearing playlists');
      setPlaylists([]);
      playlistsCache.current = [];
      playlistsFetched.current = false;
      lastTokenRef.current = null;
      return;
    }

    // If we have cached playlists for the same token and not forcing refresh, use them
    if (!forceRefresh && 
        playlistsFetched.current && 
        lastTokenRef.current === token && 
        playlistsCache.current.length > 0) {
      console.log('Using cached playlists, no fetch needed');
      setPlaylists(playlistsCache.current);
      return;
    }

    // If token changed, reset the cache
    if (lastTokenRef.current && lastTokenRef.current !== token) {
      console.log('Token changed, resetting playlist cache');
      playlistsFetched.current = false;
      playlistsCache.current = [];
    }

    // Only fetch if we don't have cached data for this token or forcing refresh
    setIsLoadingPlaylists(true);
    try {
      console.log('Fetching fresh playlists with token:', token.substring(0, 20) + '...');
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Playlists API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Playlists data received:', data);
        const playlistItems = data.items || [];
        
        // Update both state and cache
        setPlaylists(playlistItems);
        playlistsCache.current = playlistItems;
        playlistsFetched.current = true;
        lastTokenRef.current = token;
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch playlists:', response.status, errorData);
        
        // If token is expired, clear cache
        if (response.status === 401) {
          console.log('Token expired, clearing cache');
          playlistsFetched.current = false;
          lastTokenRef.current = null;
          playlistsCache.current = [];
          setPlaylists([]);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      playlistsFetched.current = false;
      lastTokenRef.current = null;
      playlistsCache.current = [];
      setPlaylists([]);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Initial fetch on mount or when auth state changes
  useEffect(() => {
    fetchPlaylists();
  }, [token, isGuest]);

  // Manual refresh function
  const refreshPlaylists = () => {
    fetchPlaylists(true);
  };

  const value: PlaylistsContextType = {
    playlists,
    isLoadingPlaylists,
    refreshPlaylists,
  };

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  );
};