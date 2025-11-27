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
  setContextUri,
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

interface Device {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

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
  availableDevices: Device[];
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  play: (track?: Track | { context_uri?: string; uris?: string[]; offset?: { position?: number } }) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  setRepeat: (mode: 'off' | 'context' | 'track') => Promise<void>;
  getAvailableDevices: () => Promise<void>;
  transferPlayback: (deviceId: string) => Promise<void>;
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
  const { token, isGuest } = useAuth();
    const dispatch = useAppDispatch();
    const storePlayer = useAppSelector(s => s.player);
    const [availableDevices, setAvailableDevices] = React.useState<Device[]>([]);

    // Persist only settings to localStorage (not track state - that syncs from Spotify server)
    useEffect(() => {
      const stateToSave = {
        volume: storePlayer.volume,
        isShuffled: storePlayer.isShuffled,
        repeatMode: storePlayer.repeatMode
      };
      localStorage.setItem('spotify_player_state', JSON.stringify(stateToSave));
    }, [storePlayer.volume, storePlayer.isShuffled, storePlayer.repeatMode]);

    const playerRef = useRef<SpotifyPlayer | null>(null);
    const positionInterval = useRef<number | null>(null as unknown as number | null);

    // Track if initial load has been done
    const initialLoadDone = useRef(false);

    const fetchPlaybackState = async () => {
    if (!token || isGuest) return;
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player', { headers: { Authorization: `Bearer ${token}` } });
        
        // Handle case when no active playback (204 No Content or empty response)
        if (res.status === 204 || !res.ok) {
          // No active playback - keep player empty
          initialLoadDone.current = true;
          return;
        }
        
        const state = await safeParseJSON(res);
        if (!state) {
          // No active playback - keep player empty
          initialLoadDone.current = true;
          return;
        }

        // Mark initial load as done once we get a valid state
        initialLoadDone.current = true;

        dispatch(setShuffled(state.shuffle_state || false));
        dispatch(setRepeatAction((state.repeat_state as any) || 'off'));
        dispatch(setActiveDevice({ id: state.device?.id ?? null, name: state.device?.name ?? null }));
        // Store the context URI (playlist/album the track is playing from)
        dispatch(setContextUri(state.context?.uri || null));
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
        // If no current item in playback state, keep player empty
      } catch (err) {
        console.error('fetchPlaybackState error', err);
      }
    };

    useEffect(() => {
      if (!token || isGuest) return;
      const id = setInterval(fetchPlaybackState, 5000);
      fetchPlaybackState();
      return () => clearInterval(id);
    }, [token, storePlayer.deviceId]);

    // Load Spotify SDK and wire events
    useEffect(() => {
  if (!token || isGuest) return;
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

    // Player control helpers - enhanced for remote playback
    const play = async (trackOrOptions?: Track | { context_uri?: string; uris?: string[]; offset?: { position?: number } }) => {
      if (!token || isGuest) {
        console.log('Cannot play: missing token or guest mode', { hasToken: !!token, isGuest });
        return;
      }

      try {
        if (trackOrOptions) {
          // For specific playback options or Track playback
          const targetDeviceId = storePlayer.deviceId || storePlayer.activeDeviceId;
          const params = targetDeviceId ? `?device_id=${targetDeviceId}` : '';

          // If an options object with context_uri or uris is provided, use it directly
          if ((trackOrOptions as any).context_uri || (trackOrOptions as any).uris) {
            const body: any = {};
            if ((trackOrOptions as any).context_uri) body.context_uri = (trackOrOptions as any).context_uri;
            if ((trackOrOptions as any).uris) body.uris = (trackOrOptions as any).uris;
            if ((trackOrOptions as any).offset) body.offset = (trackOrOptions as any).offset;

            await fetch(`https://api.spotify.com/v1/me/player/play${params}`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } else if ((trackOrOptions as any).uri) {
            // Track object with uri
            await fetch(`https://api.spotify.com/v1/me/player/play${params}`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ uris: [(trackOrOptions as any).uri] })
            });
          } else {
            // Fallback: attempt resume
            if (storePlayer.isRemotePlaying) {
              await fetch('https://api.spotify.com/v1/me/player/play', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
              dispatch(setPlaying(true));
            } else {
              await playerRef.current?.resume();
            }
          }
        } else {
          // Resume current playback
          if (storePlayer.isRemotePlaying) {
            // Use Web API for remote devices
            await fetch('https://api.spotify.com/v1/me/player/play', {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setPlaying(true));
          } else {
            // Use local player for this device
            await playerRef.current?.resume();
          }
        }
      } catch (err) {
        console.error('play error', err);
      }
    };

    const pause = async () => {
      try {
        if (storePlayer.isRemotePlaying) {
          // Use Web API for remote devices
          await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          dispatch(setPlaying(false));
        } else {
          // Use local player for this device
          await playerRef.current?.pause();
          dispatch(setPlaying(false));
        }
      } catch (err) {
        console.error('pause error', err);
      }
    };

    const resume = async () => {
      try {
        // For remote playback, don't include device_id to avoid transferring playback
        if (storePlayer.isRemotePlaying && storePlayer.activeDeviceId) {
          // Use Web API for remote devices - no device_id to keep playback on remote
          await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          dispatch(setPlaying(true));
          return;
        }
        
        const targetDeviceId = storePlayer.deviceId || storePlayer.activeDeviceId;
        
        // If we have a current track but no active playback (e.g., loaded from recently played),
        // we need to start playing the track, not just resume
        if (storePlayer.currentTrack?.uri && targetDeviceId) {
          // Build the request body - use context if available to enable shuffle within playlist/album
          const body: any = {
            position_ms: storePlayer.position || 0
          };
          
          if (storePlayer.contextUri) {
            // Play within the context (playlist/album) so shuffle works
            body.context_uri = storePlayer.contextUri;
            body.offset = { uri: storePlayer.currentTrack.uri };
          } else {
            // No context, just play the single track
            body.uris = [storePlayer.currentTrack.uri];
          }
          
          const params = `?device_id=${targetDeviceId}`;
          const response = await fetch(`https://api.spotify.com/v1/me/player/play${params}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          
          if (response.ok || response.status === 204) {
            dispatch(setPlaying(true));
            return;
          }
        }
        
        // Fallback to standard resume behavior using local player
        await playerRef.current?.resume();
        dispatch(setPlaying(true));
      } catch (err) {
        console.error('resume error', err);
      }
    };

    const nextTrack = async () => {
      try {
        const currentTrackBeforeSkip = storePlayer.currentTrack;
        
        // Prefer SDK/local player when available
        try {
          if (playerRef.current && !storePlayer.isRemotePlaying) {
            // @ts-ignore - nextTrack may exist on the SDK player
            if (typeof (playerRef.current as any).nextTrack === 'function') {
              await (playerRef.current as any).nextTrack();
              
              // Check if playback stopped after skip (no next track in queue)
              setTimeout(async () => {
                await fetchPlaybackState();
                if (!storePlayer.playing && currentTrackBeforeSkip) {
                  // Playback stopped, trigger manual skip handling
                  console.log('🎵 Playback stopped after skip, will trigger recommendation');
                  // We'll emit a custom event that the recommendation service can listen to
                  window.dispatchEvent(new CustomEvent('manual-skip', { 
                    detail: { track: currentTrackBeforeSkip } 
                  }));
                }
              }, 1000);
              return;
            }
          }
        } catch (e) {
          // Fall through to Web API
        }

        // Fallback to Web API for remote devices or if SDK method unavailable
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Check if the request was successful
        if (response.ok) {
          // Refresh state after track change
          setTimeout(async () => {
            await fetchPlaybackState();
            if (!storePlayer.playing && currentTrackBeforeSkip) {
              // Playback stopped, trigger manual skip handling
              console.log('🎵 Playback stopped after Web API skip, will trigger recommendation');
              window.dispatchEvent(new CustomEvent('manual-skip', { 
                detail: { track: currentTrackBeforeSkip } 
              }));
            }
          }, 1000);
        }
      } catch (err) {
        console.error('nextTrack error', err);
      }
    };

    const previousTrack = async () => {
      try {
        // Prefer SDK/local player when available
        try {
          if (playerRef.current && !storePlayer.isRemotePlaying) {
            // @ts-ignore - previousTrack may exist on the SDK player
            if (typeof (playerRef.current as any).previousTrack === 'function') {
              await (playerRef.current as any).previousTrack();
              return;
            }
          }
        } catch (e) {
          // Fall through to Web API
        }

        // Fallback to Web API for remote devices or if SDK method unavailable
        await fetch('https://api.spotify.com/v1/me/player/previous', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh state after track change
        setTimeout(fetchPlaybackState, 500);
      } catch (err) {
        console.error('previousTrack error', err);
      }
    };

    const seek = async (position: number) => {
      try {
        if (storePlayer.isRemotePlaying) {
          // Use Web API for remote devices
          await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          dispatch(setPosition(position));
        } else {
          // Use local player for this device
          await playerRef.current?.seek(position);
          dispatch(setPosition(position));
        }
      } catch (err) {
        console.error('seek error', err);
      }
    };

    const setVolume = async (newVolume: number) => {
      try {
        if (storePlayer.isRemotePlaying) {
          // Use Web API for remote devices
          const volumePercent = Math.round(newVolume * 100);
          await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          dispatch(setVolumeAction(newVolume));
        } else {
          // Use local player for this device
          await playerRef.current?.setVolume(newVolume);
          dispatch(setVolumeAction(newVolume));
        }
      } catch (err) {
        console.error('setVolume error', err);
      }
    };

    const togglePlay = async () => {
      if (storePlayer.playing) await pause(); else await resume();
    };

    const toggleShuffle = async () => {
      if (!token || isGuest) return;
      try {
        const newShuffle = !storePlayer.isShuffled;
        // Only include device_id for local playback, not for remote devices
        const params = new URLSearchParams({ state: String(newShuffle) });
        if (!storePlayer.isRemotePlaying && storePlayer.deviceId) {
          params.set('device_id', storePlayer.deviceId);
        }
        await fetch(`https://api.spotify.com/v1/me/player/shuffle?${params.toString()}`, { 
          method: 'PUT', 
          headers: { Authorization: `Bearer ${token}` } 
        });
        dispatch(setShuffled(newShuffle));
        // Refresh state to ensure consistency
        setTimeout(fetchPlaybackState, 300);
      } catch (err) {
        console.error('toggleShuffle error', err);
      }
    };

    const setRepeat = async (mode: 'off' | 'context' | 'track') => {
      if (!token || isGuest) return;
      try {
        // Only include device_id for local playback, not for remote devices
        const params = new URLSearchParams({ state: mode });
        if (!storePlayer.isRemotePlaying && storePlayer.deviceId) {
          params.set('device_id', storePlayer.deviceId);
        }

        const url = `https://api.spotify.com/v1/me/player/repeat?${params.toString()}`;
        const res = await fetch(url, { 
          method: 'PUT', 
          headers: { Authorization: `Bearer ${token}` } 
        });

        if (!res.ok) {
          // Try to surface useful debug info
          let text = '';
          try { text = await res.text(); } catch {}
          console.error('setRepeat failed', res.status, res.statusText, text);
          return;
        }

        dispatch(setRepeatAction(mode));
        // Refresh state to ensure consistency
        setTimeout(fetchPlaybackState, 300);
      } catch (err) {
        console.error('setRepeat error', err);
      }
    };

    // Device management functions
    const getAvailableDevices = async () => {
      if (!token || isGuest) return;
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableDevices(data.devices || []);
        }
      } catch (err) {
        console.error('getAvailableDevices error', err);
      }
    };

    const transferPlayback = async (deviceId: string) => {
      if (!token || isGuest) return;
      try {
        await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: storePlayer.playing
          })
        });
        // Refresh devices after transfer
        setTimeout(() => {
          getAvailableDevices();
          fetchPlaybackState();
        }, 1000);
      } catch (err) {
        console.error('transferPlayback error', err);
      }
    };

    // Periodically fetch available devices
    React.useEffect(() => {
      if (!token || isGuest) return;
      
      const fetchDevices = () => {
        getAvailableDevices();
      };
      
      // Fetch devices immediately and then every 30 seconds
      fetchDevices();
      const interval = setInterval(fetchDevices, 30000);
      
      return () => clearInterval(interval);
    }, [token, isGuest]);

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
      availableDevices,
      togglePlay,
      nextTrack,
      previousTrack,
      seek,
      setVolume,
      play,
      pause,
      resume,
      toggleShuffle,
      setRepeat,
      getAvailableDevices,
      transferPlayback
    };

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
  };
