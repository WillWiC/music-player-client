/**
 * Redux Hooks with TypeScript Support
 * Provides type-safe hooks for accessing Redux store
 * 
 * ALWAYS USE THESE INSTEAD OF PLAIN useDispatch/useSelector:
 * - useAppDispatch: Typed dispatch hook
 * - useAppSelector: Typed selector hook
 * 
 * BENEFITS:
 * - Full TypeScript support
 * - Autocomplete for state and actions
 * - Type checking at compile time
 * - Prevents runtime errors from type mismatches
 * 
 * USAGE IN COMPONENTS:
 * const dispatch = useAppDispatch();
 * const playing = useAppSelector(state => state.player.playing);
 */

import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './index'

/**
 * Type-safe dispatch hook
 * Use instead of useDispatch to get proper TypeScript support
 */
export const useAppDispatch = () => useDispatch<AppDispatch>()

/**
 * Type-safe selector hook
 * Use instead of useSelector to get proper TypeScript support
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

