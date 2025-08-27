import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import type { Track } from '../types/spotify';
import { useAuth } from './auth';

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
  const playerRef = useRef<any | null>(null);
  const posInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    // Load Spotify Web Playback SDK if not already present
    const loadSDK = () => {
      if ((window as any).Spotify) return onSpotifyReady();
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      (window as any).onSpotifyWebPlaybackSDKReady = onSpotifyReady;
    };

    const onSpotifyReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'Spotify Lite Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
      });

      player.addListener('ready', ({ device_id }: any) => {
        setDeviceId(device_id);
      });
      player.addListener('not_ready', ({ device_id }: any) => {
        if (deviceId === device_id) setDeviceId(null);
      });
      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setPlaying(!state.paused);
        // map track and timing
        const track = state.track_window?.current_track;
        if (track) {
          setCurrent({ id: track.id, name: track.name, artists: track.artists?.map((a: any) => ({ id: a.id, name: a.name })), album: { id: track.album.id, name: track.album.name, images: track.album.images }, uri: track.uri });
          setDurationMs(track.duration_ms ?? 0);
        }
        // position (ms)
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
    if (!token) return;
    // Play using Web API on active deviceId
    const targetDevice = deviceId;
    const url = `https://api.spotify.com/v1/me/player/play${targetDevice ? `?device_id=${encodeURIComponent(targetDevice)}` : ''}`;
    await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [trackUri] }),
    });
  };

  const play = async (t: Track) => {
    setCurrent(t);
    if (t.uri) {
      try {
        await callPlayApi(t.uri);
        setPlaying(true);
      } catch (e) {
        console.warn('Play API failed', e);
      }
    }
  };

  const pause = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setPlaying(false);
    } catch (e) {
      console.warn('Pause failed', e);
    }
  };

  const resume = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/play', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setPlaying(true);
    } catch (e) {
      console.warn('Resume failed', e);
    }
  };

  const seek = async (ms: number) => {
    if (!token) return;
    try {
      const url = `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.max(0, Math.round(ms))}`;
      await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setPositionMs(Math.max(0, Math.round(ms)));
    } catch (e) {
      console.warn('Seek failed', e);
    }
  };

  const next = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.warn('Next failed', e);
    }
  };

  const previous = async () => {
    if (!token) return;
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.warn('Previous failed', e);
    }
  };

  const setVolume = async (v: number) => {
    if (!token || !deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(v * 100)}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.warn('Set volume failed', e);
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
