/**
 * Redux Player Slice
 * Manages the state of the Spotify Web Playback player
 * 
 * STATE MANAGED:
 * - playing: Whether music is currently playing
 * - currentTrack: The currently playing track object
 * - position: Current playback position (ms)
 * - duration: Total track duration (ms)
 * - volume: Volume level (0.0 - 1.0)
 * - deviceId: Web player device identifier
 * - activeDeviceId: Currently active Spotify device ID
 * - activeDeviceName: Name of currently active device
 * - isRemotePlaying: Is music playing on a remote device (not this web app)
 * - isShuffled: Is shuffle mode enabled
 * - repeatMode: Repeat mode (off, context, track)
 * 
 * USED FOR:
 * - Player UI updates
 * - Playback control (play/pause/skip)
 * - Volume and shuffle/repeat control
 * - Displaying current track info
 * - Device management
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Track } from '../types/spotify'

/** Player state interface for type safety */
interface PlayerState {
  playing: boolean
  currentTrack: Track | null
  position: number
  duration: number
  volume: number
  deviceId: string | null
  activeDeviceId: string | null
  activeDeviceName: string | null
  isRemotePlaying: boolean
  isShuffled: boolean
  repeatMode: 'off' | 'context' | 'track'
  contextUri: string | null // The playlist/album URI the current track is playing from
}

/** Initial player state - all reset to default/empty */
const loadPersistedState = (): Partial<PlayerState> => {
  try {
    const saved = localStorage.getItem('spotify_player_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore settings, not track state - track state should sync from Spotify server
      return {
        volume: parsed.volume,
        isShuffled: parsed.isShuffled,
        repeatMode: parsed.repeatMode
      };
    }
  } catch (e) {
    console.warn('Failed to load player state', e);
  }
  return {};
};

const persisted = loadPersistedState();

const initialState: PlayerState = {
  playing: false,
  currentTrack: null, // Always null on init - will be fetched from Spotify server
  position: 0,
  duration: 0,
  volume: persisted.volume || 0.5,
  deviceId: null,
  activeDeviceId: null,
  activeDeviceName: null,
  isRemotePlaying: false,
  isShuffled: persisted.isShuffled || false,
  repeatMode: persisted.repeatMode || 'off',
  contextUri: null, // The playlist/album context - will be fetched from Spotify server
}

/**
 * Redux slice for player state management
 * Provides actions to update player state throughout the app
 */
const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    /** Update playing status */
    setPlaying(state, action: PayloadAction<boolean>) {
      state.playing = action.payload
    },
    /** Set the current track being played */
    setCurrentTrack(state, action: PayloadAction<Track | null>) {
      state.currentTrack = action.payload
    },
    /** Update current playback position in ms */
    setPosition(state, action: PayloadAction<number>) {
      state.position = action.payload
    },
    /** Update total track duration in ms */
    setDuration(state, action: PayloadAction<number>) {
      state.duration = action.payload
    },
    /** Update volume level (0.0 - 1.0) */
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload
    },
    setDeviceId(state, action: PayloadAction<string | null>) {
      state.deviceId = action.payload
    },
    /** Set active playback device (ID and name) */
    setActiveDevice(state, action: PayloadAction<{ id: string | null; name: string | null }>) {
      state.activeDeviceId = action.payload.id
      state.activeDeviceName = action.payload.name
    },
    /** Track if music is playing on a remote device */
    setRemotePlaying(state, action: PayloadAction<boolean>) {
      state.isRemotePlaying = action.payload
    },
    /** Update shuffle mode status */
    setShuffled(state, action: PayloadAction<boolean>) {
      state.isShuffled = action.payload
    },
    /** Update repeat mode (off/context/track) */
    setRepeat(state, action: PayloadAction<'off' | 'context' | 'track'>) {
      state.repeatMode = action.payload
    },
    /** Set the context URI (playlist/album) for current playback */
    setContextUri(state, action: PayloadAction<string | null>) {
      state.contextUri = action.payload
    },
    /** Reset all player state to initial values */
    reset(state) {
      Object.assign(state, initialState)
    }
  },
})

/** Exported actions for use in components */
export const {
  setPlaying,
  setCurrentTrack,
  setPosition,
  setDuration,
  setVolume,
  setDeviceId,
  setActiveDevice,
  setRemotePlaying,
  setShuffled,
  setRepeat,
  setContextUri,
  reset,
} = playerSlice.actions

/** Export reducer as default for store configuration */
export default playerSlice.reducer

