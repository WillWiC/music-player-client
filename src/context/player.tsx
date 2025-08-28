import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { Track } from '../types/spotify';
import { useAuth } from './auth';

// Define Spotify Web Playback SDK types
interface SpotifyApi {
  Player: new (options: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
  }) => SpotifyPlayer;
}

interface SpotifyPlayer {
  addListener(event: 'ready', listener: (data: { device_id: string }) => void): void;
  addListener(event: 'not_ready', listener: (data: { device_id: string }) => void): void;
  addListener(event: 'player_state_changed', listener: (state: SpotifyPlayerState | null) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
}

interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  track_window: {
    current_track: {
      id: string;
      name: string;
      uri: string;
      duration_ms: number;
      artists: Array<{ id: string; name: string }>;
      album: {
        id: string;
        name: string;
        images: Array<{ url: string; height?: number; width?: number }>;
      };
    };
  };
}

declare global {
  interface Window {
    Spotify?: SpotifyApi;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type PlayerContextType = {
  current: Track | null;
  playing: boolean;
  deviceId: string | null;
  positionMs: number;
  durationMs: number;
  play: (t: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setVolume: (v: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const posInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    // Load Spotify Web Playback SDK if not already present
    const loadSDK = () => {
      if (window.Spotify) return onSpotifyReady();
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = onSpotifyReady;
    };

    const onSpotifyReady = () => {
      if (!window.Spotify) {
        console.error('Spotify Web Playback SDK not available');
        return;
      }

      const player = new window.Spotify.Player({
        name: 'Spotify Lite Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
      });
      
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify player not ready, device ID:', device_id);
        if (deviceId === device_id) setDeviceId(null);
      });
      
      player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        if (!state) return;
        
        setPlaying(!state.paused);
        
        // Map track and timing
        const track = state.track_window?.current_track;
        if (track) {
          setCurrent({
            id: track.id,
            name: track.name,
            artists: track.artists?.map((a) => ({ id: a.id, name: a.name })),
            album: {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images || [],
              artists: [] // Required by Album interface but not available in player state
            },
            uri: track.uri,
            duration_ms: track.duration_ms
          });
          setDurationMs(track.duration_ms ?? 0);
        }
        
        // Position (ms)
        const pos = typeof state.position === 'number' ? state.position : 0;
        setPositionMs(pos);
      });

      player.connect();
      playerRef.current = player;
    };

    loadSDK();
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [token]);

  const callPlayApi = async (trackUri: string) => {
    if (!token) {
      console.error('No token available for playback');
      return;
    }
    
    console.log('Calling play API with URI:', trackUri);
    console.log('Using device ID:', deviceId);
    
    // Play using Web API on active deviceId
    const targetDevice = deviceId;
    const url = `https://api.spotify.com/v1/me/player/play${targetDevice ? `?device_id=${encodeURIComponent(targetDevice)}` : ''}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [trackUri] }),
    });
    
    if (!response.ok) {
      console.error('Play API failed with status:', response.status);
      if (response.status === 404) {
        throw new Error('No active device found. Please open Spotify and start playing a song first, then try again.');
      } else if (response.status === 403) {
        throw new Error('Spotify Premium is required for playback control.');
      } else {
        const errorText = await response.text();
        console.error('API Error details:', errorText);
        throw new Error(`Playback failed: ${response.status}`);
      }
    }
  };

  const play = async (t: Track) => {
    console.log('Play function called with track:', t.name);
    console.log('Device ID:', deviceId);
    console.log('Token available:', !!token);
    
    setCurrent(t);
    if (t.uri) {
      try {
        await callPlayApi(t.uri);
        setPlaying(true);
        console.log('Track should now be playing');
      } catch (error) {
        console.error('Play API failed:', error);
        
        // Try to get current player state for debugging
        if (token) {
          try {
            const response = await fetch('https://api.spotify.com/v1/me/player', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
              const playerState = await response.json();
              console.log('Current player state:', playerState);
            } else if (response.status === 204) {
              console.log('No active device found. Please open Spotify and start playing a song first.');
            } else {
              console.log('Player state check failed with status:', response.status);
            }
          } catch (stateError) {
            console.error('Failed to get player state:', stateError);
          }
        }
        
        // Re-throw the error so calling code can handle it
        throw error;
      }
    } else {
      throw new Error('Track URI is not available');
    }
  };

  const pause = async () => {
    console.log('Pause function called');
    console.log('Token available:', !!token);
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', { 
        method: 'PUT', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.ok) {
        setPlaying(false);
        console.log('Track paused successfully');
      } else {
        console.error('Pause failed with status:', response.status);
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else if (response.status === 403) {
          throw new Error('Spotify Premium is required for playback control.');
        } else {
          const errorText = await response.text();
          throw new Error(`Pause failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Pause failed:', error);
      throw error;
    }
  };

  const resume = async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/play', { 
        method: 'PUT', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.ok) {
        setPlaying(true);
      } else {
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else if (response.status === 403) {
          throw new Error('Spotify Premium is required for playback control.');
        } else {
          const errorText = await response.text();
          throw new Error(`Resume failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Resume failed:', error);
      throw error;
    }
  };

  const seek = async (ms: number) => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      const position = Math.max(0, Math.round(ms));
      const url = `https://api.spotify.com/v1/me/player/seek?position_ms=${position}`;
      const response = await fetch(url, { 
        method: 'PUT', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.ok) {
        setPositionMs(position);
      } else {
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else {
          const errorText = await response.text();
          throw new Error(`Seek failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Seek failed:', error);
      throw error;
    }
  };

  const next = async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/next', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else {
          const errorText = await response.text();
          throw new Error(`Next track failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Next failed:', error);
      throw error;
    }
  };

  const previous = async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else {
          const errorText = await response.text();
          throw new Error(`Previous track failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Previous failed:', error);
      throw error;
    }
  };

  const setVolume = async (v: number) => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    if (!deviceId) {
      throw new Error('No active device found');
    }
    
    try {
      const volume = Math.round(Math.max(0, Math.min(100, v * 100)));
      const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, { 
        method: 'PUT', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No active device found. Please open Spotify and start playing a song first.');
        } else {
          const errorText = await response.text();
          throw new Error(`Set volume failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Set volume failed:', error);
      throw error;
    }
  };

  // keep a lightweight interval to bump position while playing (fallback)
  useEffect(() => {
    if (playing) {
      if (posInterval.current) window.clearInterval(posInterval.current);
      posInterval.current = window.setInterval(() => setPositionMs(p => Math.min((durationMs || Infinity), p + 1000)), 1000) as unknown as number;
    } else {
      if (posInterval.current) {
        window.clearInterval(posInterval.current);
        posInterval.current = null;
      }
    }
    return () => {
      if (posInterval.current) {
        window.clearInterval(posInterval.current);
        posInterval.current = null;
      }
    };
  }, [playing, durationMs]);

  return (
    <PlayerContext.Provider value={{ current, playing, deviceId, positionMs, durationMs, play, pause, resume, seek, next, previous, setVolume }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};
