import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Track } from '../types/spotify'

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
}

const initialState: PlayerState = {
  playing: false,
  currentTrack: null,
  position: 0,
  duration: 0,
  volume: 0.5,
  deviceId: null,
  activeDeviceId: null,
  activeDeviceName: null,
  isRemotePlaying: false,
  isShuffled: false,
  repeatMode: 'off',
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlaying(state, action: PayloadAction<boolean>) {
      state.playing = action.payload
    },
    setCurrentTrack(state, action: PayloadAction<Track | null>) {
      state.currentTrack = action.payload
    },
    setPosition(state, action: PayloadAction<number>) {
      state.position = action.payload
    },
    setDuration(state, action: PayloadAction<number>) {
      state.duration = action.payload
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload
    },
    setDeviceId(state, action: PayloadAction<string | null>) {
      state.deviceId = action.payload
    },
    setActiveDevice(state, action: PayloadAction<{ id: string | null; name: string | null }>) {
      state.activeDeviceId = action.payload.id
      state.activeDeviceName = action.payload.name
    },
    setRemotePlaying(state, action: PayloadAction<boolean>) {
      state.isRemotePlaying = action.payload
    },
    setShuffled(state, action: PayloadAction<boolean>) {
      state.isShuffled = action.payload
    },
    setRepeat(state, action: PayloadAction<'off' | 'context' | 'track'>) {
      state.repeatMode = action.payload
    },
    reset(state) {
      Object.assign(state, initialState)
    }
  },
})

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
  reset,
} = playerSlice.actions

export default playerSlice.reducer
