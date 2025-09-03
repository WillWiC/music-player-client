import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface PlayerState {
  playing: boolean
  trackId?: string | null
}

const initialState: PlayerState = {
  playing: false,
  trackId: null,
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    play(state, action: PayloadAction<{ trackId?: string } | undefined>) {
      state.playing = true
      if (action?.payload?.trackId) state.trackId = action.payload.trackId
    },
    pause(state) {
      state.playing = false
    },
    stop(state) {
      state.playing = false
      state.trackId = null
    },
    setTrack(state, action: PayloadAction<string | null>) {
      state.trackId = action.payload
    },
  },
})

export const { play, pause, stop, setTrack } = playerSlice.actions
export default playerSlice.reducer
