import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './auth';
import type { Track } from '../types/spotify';

// Helper function to safely parse JSON from Spotify API responses
const safeParseJSON = async (response: Response) => {
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) {
    return null; // No content to parse
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    return null;
  }
};

interface PlayerContextType {
  player: SpotifyPlayer | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  deviceId: string | null;
  activeDeviceId: string | null;
  activeDeviceName: string | null;
  isRemotePlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'context' | 'track';
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setRepeat: (mode: 'off' | 'context' | 'track') => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export { PlayerContext };

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(null);
  const [shuffled, setShuffled] = useState(false);
  const [repeat, setRepeatState] = useState<'off' | 'context' | 'track'>('off');
  const [isRemotePlaying, setIsRemotePlaying] = useState(false);
  
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch current playback state from Spotify API
  const fetchPlaybackState = async () => {
    if (!token) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const state = await safeParseJSON(response);
        if (state) {
          setShuffled(state.shuffle_state || false);
          setRepeatState(state.repeat_state || 'off');

          // Active device details
          const activeId = state.device?.id ?? null;
          const activeName = state.device?.name ?? null;
          setActiveDeviceId(activeId);
          setActiveDeviceName(activeName);

          // If another device (not this web SDK) is playing, populate current track from API
          const playingOnOther = !!(activeId && deviceId && activeId !== deviceId && state.is_playing);
          setIsRemotePlaying(playingOnOther);

          if (state.item) {
            const track = state.item;
            // Map API item to internal Track shape
            setCurrent({
              id: track.id,
              name: track.name,
              artists: (track.artists || []).map((artist: any) => ({
                id: artist.id || artist.uri?.split(':')?.[2] || artist.name,
                name: artist.name,
                external_urls: { spotify: artist.external_urls?.spotify || '' },
                href: artist.href || '',
                type: 'artist' as const,
                uri: artist.uri || ''
              })),
              album: {
                id: track.album?.id || track.album?.uri?.split(':')?.[2] || '',
                name: track.album?.name || '',
                images: (track.album?.images || []).map((img: any) => ({ url: img.url, height: null, width: null })),
                external_urls: { spotify: track.album?.external_urls?.spotify || '' },
                href: track.album?.href || '',
                type: 'album' as const,
                uri: track.album?.uri || '',
                album_type: track.album?.album_type || 'album',
                total_tracks: track.album?.total_tracks || 0,
                available_markets: track.album?.available_markets || [],
                release_date: track.album?.release_date || '',
                release_date_precision: track.album?.release_date_precision || 'day',
                artists: []
              },
              duration_ms: track.duration_ms,
              explicit: track.explicit || false,
              external_urls: { spotify: `https://open.spotify.com/track/${track.id}` },
              href: `https://api.spotify.com/v1/tracks/${track.id}`,
              preview_url: track.preview_url || null,
              type: 'track' as const,
              uri: track.uri
            });

            setPlaying(!!state.is_playing);
            setPosition(state.progress_ms || 0);
            setDuration(track.duration_ms || 0);
          }
        } else {
          // No active playback device - reset state
          setShuffled(false);
          setRepeatState('off');
          setActiveDeviceId(null);
          setActiveDeviceName(null);
          setIsRemotePlaying(false);
        }
      }
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
  };

  // Poll playback state every 5 seconds so we can show remote-device playback
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      fetchPlaybackState();
    }, 5000);

    // initial fetch
    fetchPlaybackState();

    return () => clearInterval(id);
  }, [token, deviceId]);

  useEffect(() => {
    if (!token) return;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Music Player Client',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: volume
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        fetchPlaybackState();
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      // Initialization Error
      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
      });

      // Authentication Error
      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
      });

      // Account Error
      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      // Playback Error
      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        if (!state) return;

        console.log('Player state changed:', state);
        
        const track = state.track_window.current_track;
        console.log('Current track from player:', track);
        
        if (track) {
          setCurrent({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({ 
              id: artist.uri.split(':')[2], 
              name: artist.name,
              external_urls: { spotify: `https://open.spotify.com/artist/${artist.uri.split(':')[2]}` },
              href: `https://api.spotify.com/v1/artists/${artist.uri.split(':')[2]}`,
              type: 'artist' as const,
              uri: artist.uri
            })),
            album: {
              id: track.album.uri.split(':')[2],
              name: track.album.name,
              images: track.album.images.map(img => ({ 
                url: img.url, 
                height: null, 
                width: null 
              })),
              external_urls: { spotify: `https://open.spotify.com/album/${track.album.uri.split(':')[2]}` },
              href: `https://api.spotify.com/v1/albums/${track.album.uri.split(':')[2]}`,
              type: 'album' as const,
              uri: track.album.uri,
              album_type: 'album' as const,
              total_tracks: 0,
              available_markets: [],
              release_date: '',
              release_date_precision: 'day' as const,
              artists: []
            },
            duration_ms: track.duration_ms,
            explicit: false,
            external_urls: { spotify: `https://open.spotify.com/track/${track.id}` },
            href: `https://api.spotify.com/v1/tracks/${track.id}`,
            preview_url: null,
            type: 'track' as const,
            uri: track.uri
          });
        }
        
        setPlaying(!state.paused);
        setPosition(state.position);
        setDuration(track ? track.duration_ms : 0);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [token]);

  // Update position while playing
  useEffect(() => {
    if (playing) {
      positionInterval.current = setInterval(() => {
        setPosition(prev => Math.min(prev + 1000, duration));
      }, 1000);
    } else {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
        positionInterval.current = null;
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [playing, duration]);

  const play = async (track?: Track) => {
    if (!token || !deviceId) {
      console.log('Cannot play: missing token or device ID', { token: !!token, deviceId });
      return;
    }

    try {
      if (track) {
        console.log('Playing specific track:', track.name, 'by', track.artists.map(a => a.name).join(', '));
        // Play specific track
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [track.uri]
          })
        });
        
        if (!response.ok) {
          console.error('Failed to play track:', response.status, response.statusText);
        } else {
          console.log('Track play request successful');
        }
      } else if (player) {
        console.log('Resuming current track');
        // Resume current track
        await player.resume();
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  };

  const pause = async () => {
    if (player) {
      await player.pause();
    }
  };

  const resume = async () => {
    if (player) {
      await player.resume();
    }
  };

  const next = async () => {
    if (player) {
      await player.nextTrack();
    }
  };

  const previous = async () => {
    if (player) {
      await player.previousTrack();
    }
  };

  const seek = async (position: number) => {
    if (player) {
      await player.seek(position);
      setPosition(position);
    }
  };

  const setVolume = async (newVolume: number) => {
    if (player) {
      await player.setVolume(newVolume);
      setVolumeState(newVolume);
    }
  };

  // Helper functions to match Dashboard expectations
  const togglePlay = async () => {
    if (playing) {
      await pause();
    } else {
      await resume();
    }
  };

  const nextTrack = async () => {
    await next();
  };

  const previousTrack = async () => {
    await previous();
  };

  const toggleShuffle = async () => {
    if (!token) return;

    try {
      const newShuffleState = !shuffled;
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setShuffled(newShuffleState);
    } catch (error) {
      console.error('Error toggling shuffle:', error);
    }
  };

  const setRepeat = async (mode: 'off' | 'context' | 'track') => {
    if (!token) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setRepeatState(mode);
    } catch (error) {
      console.error('Error setting repeat mode:', error);
    }
  };

  const value = {
    player,
    currentTrack: current,
    isPlaying: playing,
    position,
    duration,
    volume,
    deviceId,
  activeDeviceId,
  activeDeviceName,
  isRemotePlaying,
    isShuffled: shuffled,
    repeatMode: repeat,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    play,
    pause,
    resume,
    toggleShuffle,
    setRepeat
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
