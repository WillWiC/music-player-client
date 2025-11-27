/**
 * Local Analysis Service
 * Analyzes user's music library locally using algorithms to find similar songs
 * No external AI required - pure local computation
 */

import type { Track } from '../types/spotify';
import { recommendationEngine, type AudioFeatures } from './recommendationEngine';
import { audioFeaturesService, type SpotifyTrack } from './audioFeaturesService';

export interface AnalyzedTrack {
  track: Track;
  features: AudioFeatures;
  genres: string[];
  cluster?: string;
  similarityScore?: number;
}

export interface SimilarSongResult {
  track: Track;
  similarity: number;
  reasons: string[];
  matchedFeatures: string[];
}

export interface MusicCluster {
  name: string;
  description: string;
  tracks: AnalyzedTrack[];
  centroid: AudioFeatures;
  dominantGenres: string[];
}

export interface LocalDiscovery {
  track: Track;
  discoveryScore: number;
  reasons: string[];
  category: string; // e.g., 'hidden-gem', 'mood-shift', 'genre-explorer'
}

export interface LocalAnalysisResult {
  clusters: MusicCluster[];
  similarSongs: SimilarSongResult[];
  localDiscoveries: LocalDiscovery[]; // Hidden gems from your library using local algorithms
  musicProfile: {
    averageFeatures: AudioFeatures;
    genreDistribution: { genre: string; count: number; percentage: number }[];
    moodDistribution: { mood: string; percentage: number }[];
    energyProfile: 'high-energy' | 'balanced' | 'chill';
    acousticProfile: 'electronic' | 'mixed' | 'acoustic';
  };
  analyzedCount: number;
  lastUpdated: string;
}

// Mood definitions based on audio features
const MOOD_DEFINITIONS = {
  'Energetic & Happy': { minEnergy: 0.7, minValence: 0.6 },
  'Energetic & Intense': { minEnergy: 0.7, maxValence: 0.4 },
  'Calm & Positive': { maxEnergy: 0.5, minValence: 0.6 },
  'Melancholic': { maxEnergy: 0.5, maxValence: 0.4 },
  'Party & Dance': { minDanceability: 0.7, minEnergy: 0.6 },
  'Focus & Study': { maxEnergy: 0.5, minInstrumentalness: 0.3 },
  'Acoustic & Intimate': { minAcousticness: 0.6 },
  'Electronic & Modern': { maxAcousticness: 0.3, minEnergy: 0.5 }
};

// Cluster definitions with priority order (higher priority = checked first)
const CLUSTER_DEFINITIONS = [
  { 
    name: 'High Energy Bangers', 
    icon: '⚡',
    condition: (f: AudioFeatures) => f.energy > 0.75 && f.danceability > 0.65,
    priority: 10
  },
  { 
    name: 'Dance Floor Hits', 
    icon: '💃',
    condition: (f: AudioFeatures) => f.danceability > 0.75 && f.energy > 0.5,
    priority: 9
  },
  { 
    name: 'Uplifting Anthems', 
    icon: '☀️',
    condition: (f: AudioFeatures) => f.valence > 0.65 && f.energy > 0.55,
    priority: 8
  },
  { 
    name: 'Electronic Beats', 
    icon: '🎹',
    condition: (f: AudioFeatures) => f.acousticness < 0.25 && f.energy > 0.5,
    priority: 7
  },
  { 
    name: 'Chill Vibes', 
    icon: '🌙',
    condition: (f: AudioFeatures) => f.energy < 0.45 && f.valence > 0.45,
    priority: 6
  },
  { 
    name: 'Melancholic Moods', 
    icon: '💜',
    condition: (f: AudioFeatures) => f.valence < 0.4 && f.energy < 0.55,
    priority: 5
  },
  { 
    name: 'Acoustic Sessions', 
    icon: '🎸',
    condition: (f: AudioFeatures) => f.acousticness > 0.55,
    priority: 4
  },
  { 
    name: 'Instrumental Focus', 
    icon: '🎼',
    condition: (f: AudioFeatures) => f.instrumentalness > 0.4,
    priority: 3
  },
  { 
    name: 'Vocal & Lyrical', 
    icon: '🎤',
    condition: (f: AudioFeatures) => f.speechiness > 0.15 && f.instrumentalness < 0.3,
    priority: 2
  },
  { 
    name: 'Moderate Energy', 
    icon: '🎵',
    condition: (f: AudioFeatures) => f.energy >= 0.45 && f.energy <= 0.65,
    priority: 1
  }
];

export class LocalAnalysisService {
  private token: string | null = null;
  private analyzedTracks: Map<string, AnalyzedTrack> = new Map();
  private artistGenreCache: Map<string, string[]> = new Map(); // Cache artist genres
  private analysisCache: LocalAnalysisResult | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.loadCachedAnalysis();
  }

  /**
   * Set Spotify access token
   */
  setToken(token: string): void {
    this.token = token;
    audioFeaturesService.setToken(token);
  }

  /**
   * Load cached analysis from localStorage
   * NOTE: Cached data has limited tracks per cluster to save space
   * Full analysis requires re-running analyzeLibrary
   */
  private loadCachedAnalysis(): void {
    try {
      const cached = localStorage.getItem('local-analysis-cache');
      if (cached) {
        const data = JSON.parse(cached);
        // Mark as cached (incomplete data)
        this.analysisCache = {
          ...data.result,
          _isCachedVersion: true // Flag to indicate limited track data
        };
        this.cacheTimestamp = data.timestamp;
        
        // Don't restore analyzedTracks from cache - it's too large
        // The full analysis will rebuild this when needed
      }
    } catch (error) {
      console.warn('Failed to load cached analysis:', error);
    }
  }

  /**
   * Save analysis to localStorage (lightweight - limited track data)
   * Full track data is kept in memory only
   */
  private saveAnalysisCache(result: LocalAnalysisResult): void {
    try {
      // Only cache essential data, NOT full track objects to avoid quota issues
      const lightweightResult = {
        ...result,
        // Keep clusters but limit tracks per cluster, store full count
        clusters: result.clusters.map(c => ({
          ...c,
          tracks: c.tracks.slice(0, 10), // Only keep 10 tracks per cluster for cache
          _fullTrackCount: c.tracks.length // Store actual count for display
        })),
        // Limit similar songs
        similarSongs: result.similarSongs.slice(0, 20),
        // Limit discoveries - up to 80 total (20 per category)
        localDiscoveries: result.localDiscoveries.slice(0, 80)
      };
      
      localStorage.setItem('local-analysis-cache', JSON.stringify({
        result: lightweightResult,
        timestamp: Date.now()
      }));
      
      // Don't cache individual tracks anymore - too large
      localStorage.removeItem('local-analysis-tracks');
    } catch (error) {
      // Handle quota exceeded error gracefully
      console.warn('Failed to save analysis cache (storage quota):', error);
      // Clear old caches to free space
      try {
        localStorage.removeItem('local-analysis-cache');
        localStorage.removeItem('local-analysis-tracks');
        localStorage.removeItem('local_analysis_result');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return this.analysisCache !== null && 
           Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  /**
   * Analyze a single track and generate features
   */
  async analyzeTrack(track: Track): Promise<AnalyzedTrack> {
    // Check if already analyzed
    if (this.analyzedTracks.has(track.id)) {
      return this.analyzedTracks.get(track.id)!;
    }

    // Convert to SpotifyTrack format
    const spotifyTrack: SpotifyTrack = {
      id: track.id,
      name: track.name,
      artists: track.artists.map(a => ({ id: a.id, name: a.name })),
      album: track.album || { id: '', name: '', images: [] },
      popularity: track.popularity || 50,
      uri: track.uri,
      duration_ms: track.duration_ms
    };

    // Generate audio features using local algorithm
    const features = await audioFeaturesService.generateAudioFeatures(spotifyTrack);
    
    // Get genres from artists
    const genres = await this.getTrackGenres(track);

    const analyzedTrack: AnalyzedTrack = {
      track,
      features,
      genres,
      cluster: this.assignCluster(features)
    };

    this.analyzedTracks.set(track.id, analyzedTrack);
    return analyzedTrack;
  }

  /**
   * Get genres for a track based on its artists (uses cached artist genres)
   */
  private async getTrackGenres(track: Track): Promise<string[]> {
    const genres: string[] = [];
    
    for (const artist of track.artists) {
      // Check cache first
      const cached = this.artistGenreCache.get(artist.id);
      if (cached) {
        genres.push(...cached);
      }
    }

    return [...new Set(genres)]; // Remove duplicates
  }

  /**
   * Batch fetch genres for all artists in the track list
   * Uses Spotify's batch artist endpoint (up to 50 at a time)
   */
  private async batchFetchArtistGenres(tracks: Track[]): Promise<void> {
    // Collect unique artist IDs that we don't have cached
    const artistIds = new Set<string>();
    tracks.forEach(track => {
      track.artists?.forEach(artist => {
        if (artist.id && !this.artistGenreCache.has(artist.id)) {
          artistIds.add(artist.id);
        }
      });
    });

    const uniqueArtistIds = Array.from(artistIds);
    console.log(`📡 Fetching genres for ${uniqueArtistIds.length} unique artists...`);

    if (uniqueArtistIds.length === 0 || !this.token) return;

    // Batch fetch artists (50 at a time - Spotify's limit)
    const batchSize = 50;
    for (let i = 0; i < uniqueArtistIds.length; i += batchSize) {
      const batch = uniqueArtistIds.slice(i, i + batchSize);
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
          { headers: { 'Authorization': `Bearer ${this.token}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          data.artists?.forEach((artist: { id: string; genres?: string[] }) => {
            if (artist?.id) {
              this.artistGenreCache.set(artist.id, artist.genres || []);
            }
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch artist batch:`, err);
      }
    }

    console.log(`✓ Cached genres for ${this.artistGenreCache.size} artists`);
  }

  /**
   * Assign a cluster name based on audio features (returns best matching cluster)
   */
  private assignCluster(features: AudioFeatures): string {
    // Sort by priority (highest first) and find first matching
    const sortedDefinitions = [...CLUSTER_DEFINITIONS].sort((a, b) => b.priority - a.priority);
    for (const cluster of sortedDefinitions) {
      if (cluster.condition(features)) {
        return cluster.name;
      }
    }
    return 'Mixed Vibes';
  }

  /**
   * Calculate similarity between two tracks
   */
  calculateTrackSimilarity(track1: AnalyzedTrack, track2: AnalyzedTrack): { similarity: number; matchedFeatures: string[] } {
    const matchedFeatures: string[] = [];
    
    // Calculate audio feature similarity
    const featureSimilarity = recommendationEngine.calculateSimilarity(track1.features, track2.features);
    
    // Check which features match closely
    const featureThreshold = 0.15;
    if (Math.abs(track1.features.energy - track2.features.energy) < featureThreshold) {
      matchedFeatures.push('energy');
    }
    if (Math.abs(track1.features.valence - track2.features.valence) < featureThreshold) {
      matchedFeatures.push('mood');
    }
    if (Math.abs(track1.features.danceability - track2.features.danceability) < featureThreshold) {
      matchedFeatures.push('danceability');
    }
    if (Math.abs(track1.features.acousticness - track2.features.acousticness) < featureThreshold) {
      matchedFeatures.push('acousticness');
    }
    if (Math.abs(track1.features.tempo - track2.features.tempo) < 15) {
      matchedFeatures.push('tempo');
    }

    // Calculate genre overlap
    const genreOverlap = this.calculateGenreOverlap(track1.genres, track2.genres);
    
    // Weight: 70% audio features, 30% genre overlap
    const similarity = featureSimilarity * 0.7 + genreOverlap * 0.3;

    if (genreOverlap > 0.3) {
      matchedFeatures.push('genre');
    }

    return { similarity, matchedFeatures };
  }

  /**
   * Calculate genre overlap between two sets of genres
   */
  private calculateGenreOverlap(genres1: string[], genres2: string[]): number {
    if (genres1.length === 0 || genres2.length === 0) return 0;

    const set1 = new Set(genres1.map(g => g.toLowerCase()));
    const set2 = new Set(genres2.map(g => g.toLowerCase()));
    
    let overlap = 0;
    set1.forEach(g => {
      if (set2.has(g)) overlap++;
      // Also check for partial matches
      set2.forEach(g2 => {
        if (g !== g2 && (g.includes(g2) || g2.includes(g))) {
          overlap += 0.5;
        }
      });
    });

    const maxSize = Math.max(set1.size, set2.size);
    return Math.min(1, overlap / maxSize);
  }

  /**
   * Find similar songs from user's library
   */
  findSimilarSongs(targetTrack: AnalyzedTrack, limit: number = 10): SimilarSongResult[] {
    const results: SimilarSongResult[] = [];

    this.analyzedTracks.forEach((analyzed, trackId) => {
      if (trackId === targetTrack.track.id) return; // Skip self

      const { similarity, matchedFeatures } = this.calculateTrackSimilarity(targetTrack, analyzed);
      
      if (similarity > 0.5) { // Only include tracks with >50% similarity
        const reasons: string[] = [];
        
        if (matchedFeatures.includes('energy')) {
          reasons.push('Similar energy level');
        }
        if (matchedFeatures.includes('mood')) {
          reasons.push('Similar mood/vibe');
        }
        if (matchedFeatures.includes('danceability')) {
          reasons.push('Similar danceability');
        }
        if (matchedFeatures.includes('genre')) {
          reasons.push('Shared genres');
        }
        if (matchedFeatures.includes('tempo')) {
          reasons.push('Similar tempo');
        }
        if (matchedFeatures.includes('acousticness')) {
          reasons.push('Similar acoustic feel');
        }

        results.push({
          track: analyzed.track,
          similarity,
          reasons,
          matchedFeatures
        });
      }
    });

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Cluster tracks into groups based on predefined categories (no duplicates)
   */
  clusterTracks(tracks: AnalyzedTrack[], _numClusters: number = 5): MusicCluster[] {
    if (tracks.length === 0) return [];

    // Group tracks by their best matching category
    const categoryGroups: Map<string, AnalyzedTrack[]> = new Map();
    const sortedDefinitions = [...CLUSTER_DEFINITIONS].sort((a, b) => b.priority - a.priority);

    // Assign each track to exactly one category
    for (const track of tracks) {
      let assigned = false;
      for (const def of sortedDefinitions) {
        if (def.condition(track.features)) {
          const existing = categoryGroups.get(def.name) || [];
          existing.push(track);
          categoryGroups.set(def.name, existing);
          assigned = true;
          break;
        }
      }
      // Fallback for tracks that don't match any category
      if (!assigned) {
        const existing = categoryGroups.get('Mixed Vibes') || [];
        existing.push(track);
        categoryGroups.set('Mixed Vibes', existing);
      }
    }

    // Build cluster objects from category groups
    const clusters: MusicCluster[] = [];
    
    categoryGroups.forEach((clusterTracks, categoryName) => {
      if (clusterTracks.length === 0) return;

      const centroid = this.calculateCentroid(clusterTracks);
      const dominantGenres = this.getDominantGenres(clusterTracks);
      const description = this.getClusterDescription(centroid);

      clusters.push({
        name: categoryName,
        description,
        tracks: clusterTracks,
        centroid,
        dominantGenres
      });
    });

    // Sort clusters by size (largest first), then by priority
    return clusters.sort((a, b) => {
      // First by track count
      if (b.tracks.length !== a.tracks.length) {
        return b.tracks.length - a.tracks.length;
      }
      // Then by category priority
      const aPriority = CLUSTER_DEFINITIONS.find(d => d.name === a.name)?.priority || 0;
      const bPriority = CLUSTER_DEFINITIONS.find(d => d.name === b.name)?.priority || 0;
      return bPriority - aPriority;
    });
  }

  /**
   * Calculate centroid of a cluster
   */
  private calculateCentroid(tracks: AnalyzedTrack[]): AudioFeatures {
    const centroid: AudioFeatures = {
      id: 'centroid',
      duration_ms: 0,
      acousticness: 0,
      danceability: 0,
      energy: 0,
      instrumentalness: 0,
      key: 0,
      liveness: 0,
      loudness: 0,
      mode: 0,
      speechiness: 0,
      tempo: 0,
      time_signature: 4,
      valence: 0
    };

    for (const track of tracks) {
      const f = track.features;
      centroid.acousticness += f.acousticness;
      centroid.danceability += f.danceability;
      centroid.energy += f.energy;
      centroid.instrumentalness += f.instrumentalness;
      centroid.liveness += f.liveness;
      centroid.loudness += f.loudness;
      centroid.speechiness += f.speechiness;
      centroid.tempo += f.tempo;
      centroid.valence += f.valence;
    }

    const n = tracks.length;
    centroid.acousticness /= n;
    centroid.danceability /= n;
    centroid.energy /= n;
    centroid.instrumentalness /= n;
    centroid.liveness /= n;
    centroid.loudness /= n;
    centroid.speechiness /= n;
    centroid.tempo /= n;
    centroid.valence /= n;

    return centroid;
  }

  /**
   * Get dominant genres from a cluster
   */
  private getDominantGenres(tracks: AnalyzedTrack[]): string[] {
    const genreCounts: Record<string, number> = {};
    
    tracks.forEach(track => {
      track.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
  }

  /**
   * Generate cluster description based on centroid
   */
  private getClusterDescription(centroid: AudioFeatures): string {
    const parts: string[] = [];

    if (centroid.energy > 0.7) parts.push('high energy');
    else if (centroid.energy < 0.4) parts.push('relaxed');
    
    if (centroid.valence > 0.7) parts.push('upbeat');
    else if (centroid.valence < 0.4) parts.push('moody');
    
    if (centroid.danceability > 0.7) parts.push('danceable');
    if (centroid.acousticness > 0.6) parts.push('acoustic');
    else if (centroid.acousticness < 0.3) parts.push('electronic');

    if (parts.length === 0) return 'A balanced mix of tracks';
    
    return `${parts.join(', ')} tracks`;
  }

  /**
   * Analyze mood distribution
   */
  private analyzeMoodDistribution(tracks: AnalyzedTrack[]): { mood: string; percentage: number }[] {
    const moodCounts: Record<string, number> = {};
    
    tracks.forEach(track => {
      const f = track.features;
      
      for (const [mood, conditions] of Object.entries(MOOD_DEFINITIONS)) {
        let matches = true;
        if ('minEnergy' in conditions && f.energy < conditions.minEnergy) matches = false;
        if ('maxEnergy' in conditions && f.energy > conditions.maxEnergy) matches = false;
        if ('minValence' in conditions && f.valence < conditions.minValence) matches = false;
        if ('maxValence' in conditions && f.valence > conditions.maxValence) matches = false;
        if ('minDanceability' in conditions && f.danceability < conditions.minDanceability) matches = false;
        if ('minAcousticness' in conditions && f.acousticness < conditions.minAcousticness) matches = false;
        if ('maxAcousticness' in conditions && f.acousticness > conditions.maxAcousticness) matches = false;
        if ('minInstrumentalness' in conditions && f.instrumentalness < conditions.minInstrumentalness) matches = false;
        
        if (matches) {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          break; // Only count primary mood
        }
      }
    });

    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0) || 1;
    
    return Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Perform full local analysis on user's music library
   * Always performs full analysis to ensure all tracks are included in clusters
   */
  async analyzeLibrary(tracks: Track[], forceRefresh: boolean = false): Promise<LocalAnalysisResult> {
    // Check if we have a FULL (non-cached) analysis that's still valid
    const hasFullAnalysis = this.analysisCache !== null && 
                            !(this.analysisCache as any)._isCachedVersion &&
                            Date.now() - this.cacheTimestamp < this.CACHE_TTL;
    
    if (!forceRefresh && hasFullAnalysis) {
      console.log('✓ Using in-memory full analysis');
      return this.analysisCache!;
    }

    // Clear previous data when forcing refresh or when only cached version exists
    if (forceRefresh || (this.analysisCache as any)?._isCachedVersion) {
      console.log('🔄 Running full analysis (cached version has limited track data)');
      this.analyzedTracks.clear();
      this.artistGenreCache.clear();
      this.analysisCache = null;
    }

    console.log(`🔍 Analyzing ${tracks.length} tracks locally...`);
    const startTime = Date.now();

    // OPTIMIZATION: Batch fetch all artist genres first (much faster than per-track)
    await this.batchFetchArtistGenres(tracks);

    // Analyze all tracks
    const analyzedTracks: AnalyzedTrack[] = [];
    for (const track of tracks) {
      try {
        const analyzed = await this.analyzeTrack(track);
        analyzedTracks.push(analyzed);
      } catch (error) {
        console.warn(`Failed to analyze track ${track.name}:`, error);
      }
    }

    // Cluster tracks
    const clusters = this.clusterTracks(analyzedTracks, Math.min(6, Math.ceil(analyzedTracks.length / 5)));

    // Calculate average features
    const averageFeatures = analyzedTracks.length > 0 
      ? this.calculateCentroid(analyzedTracks)
      : this.getDefaultFeatures();

    // Calculate genre distribution - COUNT ONLY TOP GENRE PER TRACK
    // Each track contributes exactly 1 genre (the most specific/relevant one)
    const genrePriority: Record<string, number> = {
      'k-pop': 100, 'j-pop': 100, 'c-pop': 100,
      'latin': 90, 'reggaeton': 90,
      'hip-hop': 85, 'rap': 85, 'trap': 85,
      'classical': 85, 'jazz': 85,
      'country': 80, 'r&b': 80, 'soul': 80,
      'gospel': 75, 'blues': 75,
      'electronic': 70, 'edm': 70, 'house': 70, 'techno': 70,
      'rock': 65, 'metal': 65, 'punk': 65, 'alternative': 65,
      'indie': 60,
      'pop': 50,
      'acoustic': 40,
      'ambient': 35,
    };
    
    const genreCounts: Record<string, number> = {};
    analyzedTracks.forEach(t => {
      if (t.genres.length > 0) {
        // Pick TOP genre based on priority (most specific wins)
        const topGenre = t.genres.reduce((best, current) => {
          const bestLower = best.toLowerCase();
          const currentLower = current.toLowerCase();
          const bestPriority = genrePriority[bestLower] ?? 50;
          const currentPriority = genrePriority[currentLower] ?? 50;
          return currentPriority > bestPriority ? current : best;
        }, t.genres[0]);
        
        genreCounts[topGenre] = (genreCounts[topGenre] || 0) + 1;
      }
    });
    
    // Use total number of analyzed tracks as the base for percentage
    const totalTracks = analyzedTracks.length || 1;
    const genreDistribution = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalTracks) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.log(`📊 Genre distribution calculated from ${totalTracks} tracks`);

    // Analyze mood distribution
    const moodDistribution = this.analyzeMoodDistribution(analyzedTracks);

    // Determine profiles
    const energyProfile = averageFeatures.energy > 0.65 ? 'high-energy' 
      : averageFeatures.energy < 0.4 ? 'chill' 
      : 'balanced';
    
    const acousticProfile = averageFeatures.acousticness > 0.5 ? 'acoustic'
      : averageFeatures.acousticness < 0.25 ? 'electronic'
      : 'mixed';

    // Find cross-cluster similar songs (songs that could fit multiple clusters)
    const similarSongs: SimilarSongResult[] = [];
    
    // For each cluster, find songs similar to its centroid from other clusters
    clusters.forEach((cluster) => {
      const otherTracks = analyzedTracks.filter(t => 
        !cluster.tracks.some(ct => ct.track.id === t.track.id)
      );

      const centroidTrack: AnalyzedTrack = {
        track: { id: 'centroid', name: 'Centroid' } as Track,
        features: cluster.centroid,
        genres: cluster.dominantGenres
      };

      otherTracks.forEach(track => {
        const { similarity, matchedFeatures } = this.calculateTrackSimilarity(centroidTrack, track);
        
        if (similarity > 0.7) {
          const existing = similarSongs.find(s => s.track.id === track.track.id);
          if (!existing || existing.similarity < similarity) {
            const reasons = [
              `Similar to "${cluster.name}" cluster`,
              ...matchedFeatures.map(f => `Matched ${f}`)
            ];
            
            if (existing) {
              existing.similarity = similarity;
              existing.reasons = reasons;
              existing.matchedFeatures = matchedFeatures;
            } else {
              similarSongs.push({
                track: track.track,
                similarity,
                reasons,
                matchedFeatures
              });
            }
          }
        }
      });
    });

    // Generate local discoveries (hidden gems from the library)
    const localDiscoveries = this.generateLocalDiscoveries(analyzedTracks, clusters, averageFeatures);

    const result: LocalAnalysisResult = {
      clusters,
      similarSongs: similarSongs.sort((a, b) => b.similarity - a.similarity).slice(0, 20),
      localDiscoveries,
      musicProfile: {
        averageFeatures,
        genreDistribution,
        moodDistribution,
        energyProfile,
        acousticProfile
      },
      analyzedCount: analyzedTracks.length,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✓ Analysis complete in ${Date.now() - startTime}ms`);
    
    // Cache the result
    this.analysisCache = result;
    this.cacheTimestamp = Date.now();
    this.saveAnalysisCache(result);

    return result;
  }

  /**
   * Get recommendations based on a seed track
   */
  async getRecommendationsForTrack(trackId: string, limit: number = 10): Promise<SimilarSongResult[]> {
    const seedTrack = this.analyzedTracks.get(trackId);
    if (!seedTrack) {
      return [];
    }

    return this.findSimilarSongs(seedTrack, limit);
  }

  /**
   * Get recommendations based on mood
   */
  getRecommendationsByMood(mood: string, limit: number = 10): Track[] {
    const moodConditions = MOOD_DEFINITIONS[mood as keyof typeof MOOD_DEFINITIONS];
    if (!moodConditions) return [];

    const matchingTracks: { track: Track; score: number }[] = [];

    this.analyzedTracks.forEach(analyzed => {
      const f = analyzed.features;
      let score = 0;
      let matches = 0;

      if ('minEnergy' in moodConditions) {
        score += f.energy >= moodConditions.minEnergy ? 1 : 0;
        matches++;
      }
      if ('maxEnergy' in moodConditions) {
        score += f.energy <= moodConditions.maxEnergy ? 1 : 0;
        matches++;
      }
      if ('minValence' in moodConditions) {
        score += f.valence >= moodConditions.minValence ? 1 : 0;
        matches++;
      }
      if ('maxValence' in moodConditions) {
        score += f.valence <= moodConditions.maxValence ? 1 : 0;
        matches++;
      }
      if ('minDanceability' in moodConditions) {
        score += f.danceability >= moodConditions.minDanceability ? 1 : 0;
        matches++;
      }
      if ('minAcousticness' in moodConditions) {
        score += f.acousticness >= moodConditions.minAcousticness ? 1 : 0;
        matches++;
      }
      if ('maxAcousticness' in moodConditions) {
        score += f.acousticness <= moodConditions.maxAcousticness ? 1 : 0;
        matches++;
      }
      if ('minInstrumentalness' in moodConditions) {
        score += f.instrumentalness >= moodConditions.minInstrumentalness ? 1 : 0;
        matches++;
      }

      const normalizedScore = matches > 0 ? score / matches : 0;
      if (normalizedScore >= 0.8) {
        matchingTracks.push({ track: analyzed.track, score: normalizedScore });
      }
    });

    return matchingTracks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(t => t.track);
  }

  /**
   * Get default audio features
   */
  private getDefaultFeatures(): AudioFeatures {
    return {
      id: 'default',
      duration_ms: 200000,
      acousticness: 0.5,
      danceability: 0.5,
      energy: 0.5,
      instrumentalness: 0.1,
      key: 5,
      liveness: 0.1,
      loudness: -10,
      mode: 1,
      speechiness: 0.1,
      tempo: 120,
      time_signature: 4,
      valence: 0.5
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.analyzedTracks.clear();
    this.analysisCache = null;
    this.cacheTimestamp = 0;
    localStorage.removeItem('local-analysis-cache');
    localStorage.removeItem('local-analysis-tracks');
  }

  /**
   * Get analysis stats
   */
  getStats() {
    return {
      analyzedTracksCount: this.analyzedTracks.size,
      cacheValid: this.isCacheValid(),
      lastUpdated: this.analysisCache?.lastUpdated || null
    };
  }

  /**
   * Generate local discoveries - hidden gems from your library using local algorithms
   * Finds tracks that are unique, underappreciated, or bridge different styles
   */
  private generateLocalDiscoveries(
    analyzedTracks: AnalyzedTrack[], 
    clusters: MusicCluster[], 
    averageFeatures: AudioFeatures
  ): LocalDiscovery[] {
    const hiddenGems: LocalDiscovery[] = [];
    const moodShifters: LocalDiscovery[] = [];
    const genreExplorers: LocalDiscovery[] = [];
    const perfectMatches: LocalDiscovery[] = [];

    // Category 1: Hidden Gems - tracks that are outliers in their cluster (unique within your library)
    // Each category now tracks independently - tracks can appear in multiple categories
    clusters.forEach(cluster => {
      if (cluster.tracks.length < 2) return;
      
      // Calculate distances and sort to get the most unique tracks
      const tracksWithDistance = cluster.tracks.map(track => ({
        track,
        distance: this.calculateFeatureDistance(track.features, cluster.centroid),
        clusterName: cluster.name
      })).sort((a, b) => b.distance - a.distance);
      
      // Take more outliers from each cluster (relaxed threshold)
      tracksWithDistance.forEach(({ track, distance, clusterName }) => {
        if (distance > 0.15) { // Lowered from 0.25
          hiddenGems.push({
            track: track.track,
            discoveryScore: Math.min(0.95, 0.6 + distance * 0.6),
            reasons: [
              `Unique track in your "${clusterName}" collection`,
              'Stands out from similar songs in your library'
            ],
            category: 'hidden-gem'
          });
        }
      });
    });

    // Category 2: Mood Shifters - tracks that bridge different moods
    analyzedTracks.forEach(track => {
      const f = track.features;
      // Calculate a mood contrast score based on multiple criteria
      let contrastScore = 0;
      const reasons: string[] = [];
      
      // Various contrasting mood combinations
      if (f.energy > 0.4 && f.acousticness > 0.3) {
        contrastScore += (f.energy + f.acousticness) / 2;
        reasons.push('Energy meets acoustic warmth');
      }
      if (f.valence > 0.4 && f.instrumentalness > 0.2) {
        contrastScore += (f.valence + f.instrumentalness) / 2;
        reasons.push('Uplifting instrumental vibes');
      }
      if (f.danceability > 0.5 && f.acousticness > 0.4) {
        contrastScore += (f.danceability + f.acousticness) / 2;
        reasons.push('Danceable with organic sound');
      }
      if (f.energy > 0.6 && f.valence < 0.5) {
        contrastScore += (f.energy + (1 - f.valence)) / 2;
        reasons.push('Energetic yet emotionally deep');
      }
      if (f.danceability > 0.4 && f.speechiness > 0.05) {
        contrastScore += (f.danceability + f.speechiness) / 2;
        reasons.push('Rhythmic with vocal presence');
      }
      if (f.energy < 0.4 && f.valence > 0.6) {
        contrastScore += ((1 - f.energy) + f.valence) / 2;
        reasons.push('Calm yet uplifting mood');
      }
      
      if (contrastScore > 0.3 && reasons.length > 0) {
        moodShifters.push({
          track: track.track,
          discoveryScore: Math.min(0.95, 0.5 + contrastScore * 0.3),
          reasons: ['Blends contrasting musical elements', ...reasons.slice(0, 2)],
          category: 'mood-shift'
        });
      }
    });

    // Category 3: Genre Explorers - tracks from less common genres in your library
    const genreCounts: Record<string, number> = {};
    analyzedTracks.forEach(t => {
      t.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    
    // Calculate genre rarity scores
    const totalGenreOccurrences = Object.values(genreCounts).reduce((a, b) => a + b, 0);
    const genreRarityScore: Record<string, number> = {};
    Object.entries(genreCounts).forEach(([genre, count]) => {
      // Higher score = more rare
      genreRarityScore[genre] = 1 - (count / totalGenreOccurrences);
    });
    
    analyzedTracks.forEach(track => {
      if (track.genres.length === 0) return;
      
      // Calculate average rarity of track's genres
      const avgRarity = track.genres.reduce((sum, g) => sum + (genreRarityScore[g] || 0), 0) / track.genres.length;
      
      if (avgRarity > 0.7) { // Top 30% rarest
        const rareGenres = track.genres
          .filter(g => genreRarityScore[g] > 0.8)
          .slice(0, 2);
        
        genreExplorers.push({
          track: track.track,
          discoveryScore: 0.6 + avgRarity * 0.35,
          reasons: [
            rareGenres.length > 0 
              ? `Explores ${rareGenres.join(' & ')} sounds`
              : `Explores ${track.genres[0] || 'unique'} sounds`,
            'Represents a rare genre in your collection'
          ],
          category: 'genre-explorer'
        });
      }
    });

    // Category 4: Profile Matches - tracks that closely match your overall taste profile
    const tracksWithProfileDistance = analyzedTracks
      .map(track => ({
        track,
        distance: this.calculateFeatureDistance(track.features, averageFeatures)
      }))
      .sort((a, b) => a.distance - b.distance);
    
    // Take tracks closest to your average profile
    tracksWithProfileDistance.forEach(({ track, distance }) => {
      if (distance < 0.5) { // Relaxed from 0.35
        perfectMatches.push({
          track: track.track,
          discoveryScore: Math.min(0.98, 0.7 + (0.5 - distance) * 0.6),
          reasons: [
            'Perfectly matches your music taste profile',
            'Embodies your listening preferences'
          ],
          category: 'perfect-match'
        });
      }
    });

    // Deduplicate within each category and take top 20
    const dedupeAndLimit = (arr: LocalDiscovery[], limit: number = 20): LocalDiscovery[] => {
      const seen = new Set<string>();
      return arr
        .sort((a, b) => b.discoveryScore - a.discoveryScore)
        .filter(d => {
          if (seen.has(d.track.id)) return false;
          seen.add(d.track.id);
          return true;
        })
        .slice(0, limit);
    };

    // Combine all categories - each category contributes up to 20
    const combined: LocalDiscovery[] = [
      ...dedupeAndLimit(hiddenGems, 20),
      ...dedupeAndLimit(moodShifters, 20),
      ...dedupeAndLimit(genreExplorers, 20),
      ...dedupeAndLimit(perfectMatches, 20)
    ];

    // Final deduplication across categories (keep highest scoring version)
    const finalMap = new Map<string, LocalDiscovery>();
    combined.forEach(d => {
      const existing = finalMap.get(d.track.id);
      if (!existing || d.discoveryScore > existing.discoveryScore) {
        finalMap.set(d.track.id, d);
      }
    });

    // Sort by discovery score
    return Array.from(finalMap.values())
      .sort((a, b) => b.discoveryScore - a.discoveryScore);
  }

  /**
   * Calculate Euclidean distance between two audio feature sets
   */
  private calculateFeatureDistance(f1: AudioFeatures, f2: AudioFeatures): number {
    const weights = {
      energy: 1.5,
      danceability: 1.3,
      valence: 1.2,
      acousticness: 1.0,
      instrumentalness: 0.8,
      speechiness: 0.5,
      liveness: 0.3
    };

    let distance = 0;
    distance += Math.pow((f1.energy - f2.energy) * weights.energy, 2);
    distance += Math.pow((f1.danceability - f2.danceability) * weights.danceability, 2);
    distance += Math.pow((f1.valence - f2.valence) * weights.valence, 2);
    distance += Math.pow((f1.acousticness - f2.acousticness) * weights.acousticness, 2);
    distance += Math.pow((f1.instrumentalness - f2.instrumentalness) * weights.instrumentalness, 2);
    distance += Math.pow((f1.speechiness - f2.speechiness) * weights.speechiness, 2);
    distance += Math.pow((f1.liveness - f2.liveness) * weights.liveness, 2);

    return Math.sqrt(distance);
  }
}

// Singleton instance
export const localAnalysisService = new LocalAnalysisService();
