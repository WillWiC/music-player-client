/**
 * React Hook for Local Music Analysis
 * Analyzes user's music library locally using algorithms to find similar songs
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../context/auth';
import { 
  localAnalysisService, 
  type LocalAnalysisResult, 
  type SimilarSongResult,
  type LocalDiscovery
} from '../services/localAnalysisService';
import type { Track } from '../types/spotify';

export interface UseLocalAnalysisReturn {
  // Data
  analysis: LocalAnalysisResult | null;
  similarSongs: SimilarSongResult[];
  localDiscoveries: LocalDiscovery[];
  
  // State
  isAnalyzing: boolean;
  error: string | null;
  progress: number;
  
  // Actions
  analyzeLibrary: (tracks: Track[], forceRefresh?: boolean) => Promise<void>;
  getSimilarToTrack: (trackId: string, limit?: number) => Promise<SimilarSongResult[]>;
  clearAnalysis: () => void;
}

const ANALYSIS_CACHE_KEY = 'local_analysis_result';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedAnalysis {
  analysis: LocalAnalysisResult;
  timestamp: number;
  userId?: string;
}

export const useLocalAnalysis = (): UseLocalAnalysisReturn => {
  const { token, user } = useAuth();
  
  const [analysis, setAnalysis] = useState<LocalAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Initialize service with token
  useEffect(() => {
    if (token) {
      localAnalysisService.setToken(token);
    }
  }, [token]);

  /**
   * Load cached analysis if available
   */
  const loadCachedAnalysis = useCallback((): LocalAnalysisResult | null => {
    try {
      const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedAnalysis = JSON.parse(cached);
      
      // Check user ID
      if (user?.id && cachedData.userId && cachedData.userId !== user.id) {
        localStorage.removeItem(ANALYSIS_CACHE_KEY);
        return null;
      }
      
      // Check TTL
      if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
        localStorage.removeItem(ANALYSIS_CACHE_KEY);
        return null;
      }

      return cachedData.analysis;
    } catch {
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
      return null;
    }
  }, [user]);

  /**
   * Cache analysis result (lightweight version to avoid quota issues)
   * Full track data is kept in the service's memory
   */
  const cacheAnalysis = useCallback((result: LocalAnalysisResult) => {
    try {
      // Create lightweight version to avoid quota issues
      // Store _fullTrackCount so UI can show accurate numbers
      const lightweightResult = {
        ...result,
        clusters: result.clusters.map(c => ({
          ...c,
          tracks: c.tracks.slice(0, 10),
          _fullTrackCount: c.tracks.length // Preserve actual count
        })),
        similarSongs: result.similarSongs.slice(0, 20),
        localDiscoveries: result.localDiscoveries.slice(0, 20)
      };
      
      const cachedData: CachedAnalysis = {
        analysis: lightweightResult,
        timestamp: Date.now(),
        userId: user?.id
      };
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cachedData));
    } catch (err) {
      console.warn('Failed to cache analysis (storage quota):', err);
      // Clear old caches to free space
      try {
        localStorage.removeItem(ANALYSIS_CACHE_KEY);
        localStorage.removeItem('local-analysis-cache');
        localStorage.removeItem('local-analysis-tracks');
      } catch (e) {
        // Ignore
      }
    }
  }, [user]);

  /**
   * Analyze user's music library
   */
  const analyzeLibrary = useCallback(async (tracks: Track[], forceRefresh: boolean = false) => {
    if (!token || isAnalyzing) return;

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = loadCachedAnalysis();
      if (cached) {
        console.log('✓ Using cached local analysis');
        setAnalysis(cached);
        return;
      }
    } else {
      // Clear local storage cache when forcing refresh
      console.log('🔄 Clearing analysis cache for refresh...');
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const result = await localAnalysisService.analyzeLibrary(tracks, forceRefresh);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setAnalysis(result);
      cacheAnalysis(result);
      
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze music library';
      setError(message);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [token, isAnalyzing, loadCachedAnalysis, cacheAnalysis]);

  /**
   * Get similar songs to a specific track
   */
  const getSimilarToTrack = useCallback(async (trackId: string, limit: number = 10): Promise<SimilarSongResult[]> => {
    try {
      return await localAnalysisService.getRecommendationsForTrack(trackId, limit);
    } catch (err) {
      console.error('Failed to get similar tracks:', err);
      return [];
    }
  }, []);

  /**
   * Clear analysis cache
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setProgress(0);
    localAnalysisService.clearCache();
    localStorage.removeItem(ANALYSIS_CACHE_KEY);
  }, []);

  /**
   * Load cached analysis on mount
   */
  useEffect(() => {
    if (token && !analysis && !isAnalyzing) {
      const cached = loadCachedAnalysis();
      if (cached) {
        setAnalysis(cached);
      }
    }
  }, [token, analysis, isAnalyzing, loadCachedAnalysis]);

  /**
   * Clear on logout
   */
  useEffect(() => {
    if (!token) {
      setAnalysis(null);
      setError(null);
    }
  }, [token]);

  // Memoize similar songs from analysis
  const similarSongs = useMemo(() => {
    return analysis?.similarSongs || [];
  }, [analysis]);

  // Memoize local discoveries from analysis
  const localDiscoveries = useMemo(() => {
    return analysis?.localDiscoveries || [];
  }, [analysis]);

  return {
    analysis,
    similarSongs,
    localDiscoveries,
    isAnalyzing,
    error,
    progress,
    analyzeLibrary,
    getSimilarToTrack,
    clearAnalysis
  };
};

export default useLocalAnalysis;
