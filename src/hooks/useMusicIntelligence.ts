/**
 * React Hook for Music Intelligence and Playlist Recommendations
 * Provides smart playlist recommendations and music insights
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/auth';
import { 
  MusicIntelligenceService, 
  type UserMusicProfile, 
  type PlaylistRecommendation, 
  type MusicInsights 
} from '../services/musicIntelligenceService';

export interface UseMusicIntelligenceReturn {
  // Data
  profile: UserMusicProfile | null;
  recommendations: PlaylistRecommendation[];
  insights: MusicInsights | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  generateProfile: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  clearError: () => void;
}

const CACHE_KEY = 'music_intelligence_profile';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useMusicIntelligence = (): UseMusicIntelligenceReturn => {
  const { token, user } = useAuth();
  
  const [profile, setProfile] = useState<UserMusicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize service when token is available
  const service = React.useMemo(() => {
    if (!token) return null;
    return new MusicIntelligenceService(token);
  }, [token]);

  /**
   * Load cached profile if available and not expired
   */
  const loadCachedProfile = useCallback((): UserMusicProfile | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { profile: cachedProfile, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cachedProfile;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  /**
   * Cache profile to localStorage
   */
  const cacheProfile = useCallback((profile: UserMusicProfile) => {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache music profile:', error);
    }
  }, []);

  /**
   * Generate comprehensive music profile
   */
  const generateProfile = useCallback(async () => {
    if (!token || !user || !service || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedProfile = loadCachedProfile();
      if (cachedProfile) {
        setProfile(cachedProfile);
        setIsLoading(false);
        return;
      }

      // Generate new profile
      const newProfile = await service.generateMusicProfile(user);
      setProfile(newProfile);
      cacheProfile(newProfile);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze your music preferences';
      setError(errorMessage);
      console.error('Failed to generate music profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, service, isLoading, loadCachedProfile, cacheProfile]);

  /**
   * Refresh recommendations without full profile regeneration
   */
  const refreshRecommendations = useCallback(async () => {
    if (!token || !user || !service || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate new profile (this will include fresh recommendations)
      const newProfile = await service.generateMusicProfile(user);
      setProfile(newProfile);
      cacheProfile(newProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh recommendations';
      setError(errorMessage);
      console.error('Failed to refresh recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, profile, service, cacheProfile]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Auto-load profile on mount if user is authenticated
   */
  useEffect(() => {
    if (token && user && !profile && !isLoading) {
      // Load cached profile immediately if available
      const cachedProfile = loadCachedProfile();
      if (cachedProfile) {
        setProfile(cachedProfile);
      } else {
        // Generate new profile if no cache
        generateProfile();
      }
    }
  }, [token, user, profile, isLoading, loadCachedProfile, generateProfile]);

  /**
   * Clear profile when user logs out
   */
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setError(null);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [token]);

  return {
    // Data
    profile,
    recommendations: profile?.recommendations || [],
    insights: profile?.insights || null,
    
    // State
    isLoading,
    error,
    
    // Actions
    generateProfile,
    refreshRecommendations,
    clearError
  };
};

export default useMusicIntelligence;