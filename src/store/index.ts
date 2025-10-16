/**
 * Redux Store Configuration
 * Configures and exports the Redux store for global state management
 * 
 * CONFIGURED SLICES:
 * - player: Manages Spotify player state (playback, volume, device, etc.)
 * 
 * USAGE:
 * - Wrap app with <Provider store={store}>
 * - Use useAppDispatch() and useAppSelector() in components
 * - Access player state via store hooks
 */

import { configureStore } from '@reduxjs/toolkit'
import playerReducer from './playerSlice'

/**
 * Redux store configuration
 * Combines all reducers and configures the store with Redux Toolkit
 */
export const store = configureStore({
  reducer: {
    player: playerReducer,
  },
})

/** Type-safe state type for useAppSelector */
export type RootState = ReturnType<typeof store.getState>

/** Type-safe dispatch type for useAppDispatch */
export type AppDispatch = typeof store.dispatch

