import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './auth';
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  setPlaying,
  setCurrentTrack,
  setPosition,
  setDuration,
  setVolume as setVolumeAction,
  setDeviceId,
  setActiveDevice,
  setRemotePlaying,
  setShuffled,
  setRepeat as setRepeatAction,
} from '../store/playerSlice'
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
    const dispatch = useAppDispatch();
    const storePlayer = useAppSelector(s => s.player);

    const playerRef = useRef<SpotifyPlayer | null>(null);
    const positionInterval = useRef<number | null>(null as unknown as number | null);

    const fetchPlaybackState = async () => {
      if (!token) return;
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const state = await safeParseJSON(res);
        if (!state) return;

        dispatch(setShuffled(state.shuffle_state || false));
        dispatch(setRepeatAction((state.repeat_state as any) || 'off'));
        dispatch(setActiveDevice({ id: state.device?.id ?? null, name: state.device?.name ?? null }));
        const playingOnOther = !!(state.device?.id && storePlayer.deviceId && state.device.id !== storePlayer.deviceId && state.is_playing);
        dispatch(setRemotePlaying(playingOnOther));

        if (state.item) {
          const track = state.item;
          const mapped = {
            id: track.id,
            name: track.name,
            artists: (track.artists || []).map((a: any) => ({ id: a.id || a.uri?.split(':')?.[2] || a.name, name: a.name, external_urls: { spotify: a.external_urls?.spotify || '' }, href: a.href || '', type: 'artist' as const, uri: a.uri || '' })),
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
          };

          dispatch(setCurrentTrack(mapped as Track));
          dispatch(setPlaying(!!state.is_playing));
          dispatch(setPosition(state.progress_ms || 0));
          dispatch(setDuration(track.duration_ms || 0));
        }
      } catch (err) {
        console.error('fetchPlaybackState error', err);
      }
    };

    useEffect(() => {
      if (!token) return;
      const id = setInterval(fetchPlaybackState, 5000);
      fetchPlaybackState();
      return () => clearInterval(id);
    }, [token, storePlayer.deviceId]);

    // Load Spotify SDK and wire events
    useEffect(() => {
      if (!token) return;
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.head.appendChild(script);

      // @ts-ignore
      window.onSpotifyWebPlaybackSDKReady = () => {
        // @ts-ignore
        const spotifyPlayer = new window.Spotify.Player({
          name: 'Music Player Client',
          getOAuthToken: (cb: (t: string) => void) => cb(token),
          volume: storePlayer.volume
        });

        spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
          dispatch(setDeviceId(device_id));
          fetchPlaybackState();
        });

        spotifyPlayer.addListener('not_ready', () => {
          dispatch(setDeviceId(null));
        });

        spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
          if (!state) return;
          const track = state.track_window?.current_track;
          if (track) {
            // map minimal fields and dispatch
            const mapped = {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a: any) => ({ id: a.uri.split(':')[2], name: a.name, external_urls: { spotify: `https://open.spotify.com/artist/${a.uri.split(':')[2]}` }, href: `https://api.spotify.com/v1/artists/${a.uri.split(':')[2]}`, type: 'artist' as const, uri: a.uri })),
              album: { id: track.album.uri.split(':')[2], name: track.album.name, images: track.album.images.map((img: any) => ({ url: img.url, height: null, width: null })), external_urls: { spotify: `https://open.spotify.com/album/${track.album.uri.split(':')[2]}` }, href: `https://api.spotify.com/v1/albums/${track.album.uri.split(':')[2]}`, type: 'album' as const, uri: track.album.uri, album_type: 'album' as const, total_tracks: 0, available_markets: [], release_date: '', release_date_precision: 'day' as const, artists: [] },
              duration_ms: track.duration_ms,
              explicit: false,
              external_urls: { spotify: `https://open.spotify.com/track/${track.id}` },
              href: `https://api.spotify.com/v1/tracks/${track.id}`,
              preview_url: null,
              type: 'track' as const,
              uri: track.uri
            };
            dispatch(setCurrentTrack(mapped as Track));
          }

          dispatch(setPlaying(!state.paused));
          dispatch(setPosition(state.position || 0));
          const dur = track ? track.duration_ms : 0;
          dispatch(setDuration(dur));
        });

        spotifyPlayer.connect();
        playerRef.current = spotifyPlayer;
      };

      return () => {
        try {
          playerRef.current?.disconnect();
        } catch {}
        if (positionInterval.current) {
          clearInterval(positionInterval.current as unknown as number);
          positionInterval.current = null;
        }
      };
    }, [token]);

    // Update position ticker
    useEffect(() => {
      if (storePlayer.playing) {
        positionInterval.current = window.setInterval(() => {
          dispatch(setPosition(Math.min(storePlayer.position + 1000, storePlayer.duration)));
        }, 1000);
      } else {
        if (positionInterval.current) {
          clearInterval(positionInterval.current as unknown as number);
          positionInterval.current = null;
        }
      }

      return () => {
        if (positionInterval.current) {
          clearInterval(positionInterval.current as unknown as number);
          positionInterval.current = null;
        }
      };
    }, [storePlayer.playing, storePlayer.duration, storePlayer.position]);

    // Player control helpers
    const play = async (track?: Track) => {
      if (!token || !storePlayer.deviceId) {
        console.log('Cannot play: missing token or device ID', { token: !!token, deviceId: storePlayer.deviceId });
        return;
      }

      try {
        if (track) {
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${storePlayer.deviceId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [track.uri] })
          });
        } else {
          await playerRef.current?.resume();
        }
      } catch (err) {
        console.error('play error', err);
      }
    };

    const pause = async () => {
      try {
        await playerRef.current?.pause();
        dispatch(setPlaying(false));
      } catch (err) {
        console.error('pause error', err);
      }
    };

    const resume = async () => {
      try {
        await playerRef.current?.resume();
        dispatch(setPlaying(true));
      } catch (err) {
        console.error('resume error', err);
      }
    };

    const nextTrack = async () => {
      try {
        await playerRef.current?.nextTrack();
      } catch (err) {
        console.error('nextTrack error', err);
      }
    };

    const previousTrack = async () => {
      try {
        await playerRef.current?.previousTrack();
      } catch (err) {
        console.error('previousTrack error', err);
      }
    };

    const seek = async (position: number) => {
      try {
        await playerRef.current?.seek(position);
        dispatch(setPosition(position));
      } catch (err) {
        console.error('seek error', err);
      }
    };

    const setVolume = async (newVolume: number) => {
      try {
        await playerRef.current?.setVolume(newVolume);
        dispatch(setVolumeAction(newVolume));
      } catch (err) {
        console.error('setVolume error', err);
      }
    };

    const togglePlay = async () => {
      if (storePlayer.playing) await pause(); else await resume();
    };

    const toggleShuffle = async () => {
      if (!token) return;
      try {
        const newShuffle = !storePlayer.isShuffled;
        await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffle}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
        dispatch(setShuffled(newShuffle));
      } catch (err) {
        console.error('toggleShuffle error', err);
      }
    };

    const setRepeat = async (mode: 'off' | 'context' | 'track') => {
      if (!token) return;
      try {
        await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
        dispatch(setRepeatAction(mode));
      } catch (err) {
        console.error('setRepeat error', err);
      }
    };

    const value: PlayerContextType = {
      player: playerRef.current,
      currentTrack: storePlayer.currentTrack,
      isPlaying: storePlayer.playing,
      position: storePlayer.position,
      duration: storePlayer.duration,
      volume: storePlayer.volume,
      deviceId: storePlayer.deviceId,
      activeDeviceId: storePlayer.activeDeviceId,
      activeDeviceName: storePlayer.activeDeviceName,
      isRemotePlaying: storePlayer.isRemotePlaying,
      isShuffled: storePlayer.isShuffled,
      repeatMode: storePlayer.repeatMode,
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

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
  };
