import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './auth';
import type { Track } from '../types/spotify';

interface PlayerContextType {
  player: SpotifyPlayer | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  deviceId: string | null;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
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
  
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

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
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        if (!state) return;

        const track = state.track_window.current_track;
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
        
        setPlaying(!state.paused);
        setPosition(state.position);
        setDuration(track.duration_ms);
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
    if (!token || !deviceId) return;

    try {
      if (track) {
        // Play specific track
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [track.uri]
          })
        });
      } else if (player) {
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

  const value = {
    player,
    currentTrack: current,
    isPlaying: playing,
    position,
    duration,
    volume,
    deviceId,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    play,
    pause,
    resume
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
