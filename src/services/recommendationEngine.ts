/*
 * Recommendation Engine
 * Provides intelligent music recommendations based on audio features and user preferences
 */

export interface AudioFeatures {
  id: string;
  duration_ms: number;
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
}

export interface TrackWithFeatures {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
  popularity: number;
  uri: string;
  preview_url?: string;
  duration_ms: number;
  genres?: string[];
  audio_features: AudioFeatures;
}

export interface RecommendationOptions {
  target_acousticness?: number;
  target_danceability?: number;
  target_energy?: number;
  target_instrumentalness?: number;
  target_liveness?: number;
  target_loudness?: number;
  target_speechiness?: number;
  target_tempo?: number;
  target_valence?: number;
  min_acousticness?: number;
  max_acousticness?: number;
  min_danceability?: number;
  max_danceability?: number;
  min_energy?: number;
  max_energy?: number;
  min_instrumentalness?: number;
  max_instrumentalness?: number;
  min_liveness?: number;
  max_liveness?: number;
  min_loudness?: number;
  max_loudness?: number;
  min_speechiness?: number;
  max_speechiness?: number;
  min_tempo?: number;
  max_tempo?: number;
  min_valence?: number;
  max_valence?: number;
}

class RecommendationEngine {
  private audioFeaturesCache: Map<string, AudioFeatures> = new Map();
  private trackLibrary: Map<string, TrackWithFeatures> = new Map();
  private userPreferences: Map<string, number> = new Map();

  constructor() {
    this.loadCachedData();
  }

  /**
   * Load cached data from localStorage
   */
  private loadCachedData(): void {
    try {
      const cachedFeatures = localStorage.getItem('recommendation-engine-features');
      if (cachedFeatures) {
        const featuresData = JSON.parse(cachedFeatures);
        this.audioFeaturesCache = new Map(featuresData);
      }

      const cachedTracks = localStorage.getItem('recommendation-engine-tracks');
      if (cachedTracks) {
        const tracksData = JSON.parse(cachedTracks);
        this.trackLibrary = new Map(tracksData);
      }

      const cachedPreferences = localStorage.getItem('recommendation-engine-preferences');
      if (cachedPreferences) {
        const preferencesData = JSON.parse(cachedPreferences);
        this.userPreferences = new Map(preferencesData);
      }
    } catch (error) {
      console.warn('Failed to load recommendation engine cache:', error);
    }
  }

  /**
   * Save cached data to localStorage
   */
  private saveCachedData(): void {
    try {
      const featuresData = Array.from(this.audioFeaturesCache.entries());
      localStorage.setItem('recommendation-engine-features', JSON.stringify(featuresData));

      const tracksData = Array.from(this.trackLibrary.entries());
      localStorage.setItem('recommendation-engine-tracks', JSON.stringify(tracksData));

      const preferencesData = Array.from(this.userPreferences.entries());
      localStorage.setItem('recommendation-engine-preferences', JSON.stringify(preferencesData));
    } catch (error) {
      console.warn('Failed to save recommendation engine cache:', error);
    }
  }

  /**
   * Cache audio features for a track
   */
  cacheAudioFeatures(trackId: string, features: AudioFeatures): void {
    this.audioFeaturesCache.set(trackId, features);
    this.saveCachedData();
  }

  /**
   * Get cached audio features for a track
   */
  getCachedFeatures(trackId: string): AudioFeatures | null {
    return this.audioFeaturesCache.get(trackId) || null;
  }

  /**
   * Add a track to the library
   */
  addTrack(track: TrackWithFeatures): void {
    this.trackLibrary.set(track.id, track);
    this.cacheAudioFeatures(track.id, track.audio_features);
  }

  /**
   * Get a track from the library
   */
  getTrack(trackId: string): TrackWithFeatures | null {
    return this.trackLibrary.get(trackId) || null;
  }

  /**
   * Calculate similarity between two sets of audio features
   */
  calculateSimilarity(features1: AudioFeatures, features2: AudioFeatures): number {
    const weights = {
      acousticness: 0.1,
      danceability: 0.15,
      energy: 0.15,
      instrumentalness: 0.05,
      liveness: 0.05,
      loudness: 0.1,
      speechiness: 0.05,
      tempo: 0.1,
      valence: 0.15,
      mode: 0.05,
      key: 0.05
    };

    let similarity = 0;
    let totalWeight = 0;

    // Compare each feature with weighted importance
    for (const [feature, weight] of Object.entries(weights)) {
      if (feature in features1 && feature in features2) {
        const val1 = features1[feature as keyof AudioFeatures] as number;
        const val2 = features2[feature as keyof AudioFeatures] as number;
        const diff = Math.abs(val1 - val2);
        const normalizedDiff = feature === 'tempo' ? diff / 200 : diff; // Normalize tempo
        similarity += weight * (1 - normalizedDiff);
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  /**
   * Find similar tracks based on audio features
   */
  findSimilarTracks(targetFeatures: AudioFeatures, limit: number = 10): TrackWithFeatures[] {
    const similarities: Array<{ track: TrackWithFeatures; similarity: number }> = [];

    for (const track of this.trackLibrary.values()) {
      const similarity = this.calculateSimilarity(targetFeatures, track.audio_features);
      similarities.push({ track, similarity });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.track);
  }

  /**
   * Generate recommendations based on seed tracks
   */
  generateRecommendations(
    seedTracks: string[],
    options: RecommendationOptions = {},
    limit: number = 20
  ): TrackWithFeatures[] {
    if (seedTracks.length === 0) {
      return this.getRandomTracks(limit);
    }

    // Get seed track features
    const seedFeatures: AudioFeatures[] = [];
    for (const trackId of seedTracks) {
      const features = this.getCachedFeatures(trackId);
      if (features) {
        seedFeatures.push(features);
      }
    }

    if (seedFeatures.length === 0) {
      return this.getRandomTracks(limit);
    }

    // Calculate average features from seed tracks
    const avgFeatures = this.calculateAverageFeatures(seedFeatures);

    // Apply user preferences and options
    const targetFeatures = this.applyRecommendationOptions(avgFeatures, options);

    // Find similar tracks
    const recommendations = this.findSimilarTracks(targetFeatures, limit * 2);

    // Filter out seed tracks and apply additional filters
    const filteredRecommendations = recommendations
      .filter(track => !seedTracks.includes(track.id))
      .filter(track => this.matchesRecommendationCriteria(track.audio_features, options))
      .slice(0, limit);

    return filteredRecommendations;
  }

  /**
   * Calculate average features from multiple tracks
   */
  private calculateAverageFeatures(featuresArray: AudioFeatures[]): AudioFeatures {
    if (featuresArray.length === 0) {
      throw new Error('Cannot calculate average of empty features array');
    }

    const avgFeatures: AudioFeatures = {
      id: 'average',
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
      time_signature: 0,
      valence: 0
    };

    // Sum all features
    for (const features of featuresArray) {
      avgFeatures.duration_ms += features.duration_ms;
      avgFeatures.acousticness += features.acousticness;
      avgFeatures.danceability += features.danceability;
      avgFeatures.energy += features.energy;
      avgFeatures.instrumentalness += features.instrumentalness;
      avgFeatures.key += features.key;
      avgFeatures.liveness += features.liveness;
      avgFeatures.loudness += features.loudness;
      avgFeatures.mode += features.mode;
      avgFeatures.speechiness += features.speechiness;
      avgFeatures.tempo += features.tempo;
      avgFeatures.time_signature += features.time_signature;
      avgFeatures.valence += features.valence;
    }

    // Calculate averages
    const count = featuresArray.length;
    avgFeatures.duration_ms = Math.round(avgFeatures.duration_ms / count);
    avgFeatures.acousticness /= count;
    avgFeatures.danceability /= count;
    avgFeatures.energy /= count;
    avgFeatures.instrumentalness /= count;
    avgFeatures.key = Math.round(avgFeatures.key / count);
    avgFeatures.liveness /= count;
    avgFeatures.loudness /= count;
    avgFeatures.mode = Math.round(avgFeatures.mode / count);
    avgFeatures.speechiness /= count;
    avgFeatures.tempo /= count;
    avgFeatures.time_signature = Math.round(avgFeatures.time_signature / count);
    avgFeatures.valence /= count;

    return avgFeatures;
  }

  /**
   * Apply recommendation options to target features
   */
  private applyRecommendationOptions(
    baseFeatures: AudioFeatures,
    options: RecommendationOptions
  ): AudioFeatures {
    const targetFeatures = { ...baseFeatures };

    // Apply target values if specified
    if (options.target_acousticness !== undefined) targetFeatures.acousticness = options.target_acousticness;
    if (options.target_danceability !== undefined) targetFeatures.danceability = options.target_danceability;
    if (options.target_energy !== undefined) targetFeatures.energy = options.target_energy;
    if (options.target_instrumentalness !== undefined) targetFeatures.instrumentalness = options.target_instrumentalness;
    if (options.target_liveness !== undefined) targetFeatures.liveness = options.target_liveness;
    if (options.target_loudness !== undefined) targetFeatures.loudness = options.target_loudness;
    if (options.target_speechiness !== undefined) targetFeatures.speechiness = options.target_speechiness;
    if (options.target_tempo !== undefined) targetFeatures.tempo = options.target_tempo;
    if (options.target_valence !== undefined) targetFeatures.valence = options.target_valence;

    return targetFeatures;
  }

  /**
   * Check if track matches recommendation criteria
   */
  private matchesRecommendationCriteria(
    features: AudioFeatures,
    options: RecommendationOptions
  ): boolean {
    // Check min/max constraints
    if (options.min_acousticness !== undefined && features.acousticness < options.min_acousticness) return false;
    if (options.max_acousticness !== undefined && features.acousticness > options.max_acousticness) return false;
    if (options.min_danceability !== undefined && features.danceability < options.min_danceability) return false;
    if (options.max_danceability !== undefined && features.danceability > options.max_danceability) return false;
    if (options.min_energy !== undefined && features.energy < options.min_energy) return false;
    if (options.max_energy !== undefined && features.energy > options.max_energy) return false;
    if (options.min_instrumentalness !== undefined && features.instrumentalness < options.min_instrumentalness) return false;
    if (options.max_instrumentalness !== undefined && features.instrumentalness > options.max_instrumentalness) return false;
    if (options.min_liveness !== undefined && features.liveness < options.min_liveness) return false;
    if (options.max_liveness !== undefined && features.liveness > options.max_liveness) return false;
    if (options.min_loudness !== undefined && features.loudness < options.min_loudness) return false;
    if (options.max_loudness !== undefined && features.loudness > options.max_loudness) return false;
    if (options.min_speechiness !== undefined && features.speechiness < options.min_speechiness) return false;
    if (options.max_speechiness !== undefined && features.speechiness > options.max_speechiness) return false;
    if (options.min_tempo !== undefined && features.tempo < options.min_tempo) return false;
    if (options.max_tempo !== undefined && features.tempo > options.max_tempo) return false;
    if (options.min_valence !== undefined && features.valence < options.min_valence) return false;
    if (options.max_valence !== undefined && features.valence > options.max_valence) return false;

    return true;
  }

  /**
   * Get random tracks from the library
   */
  private getRandomTracks(limit: number): TrackWithFeatures[] {
    const allTracks = Array.from(this.trackLibrary.values());
    const shuffled = allTracks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  /**
   * Update user preferences based on listening behavior
   */
  updateUserPreferences(feature: string, value: number, weight: number = 1): void {
    const currentValue = this.userPreferences.get(feature) || 0;
    const newValue = (currentValue + value * weight) / (1 + weight);
    this.userPreferences.set(feature, newValue);
    this.saveCachedData();
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): Map<string, number> {
    return new Map(this.userPreferences);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.audioFeaturesCache.clear();
    this.trackLibrary.clear();
    this.userPreferences.clear();
    
    localStorage.removeItem('recommendation-engine-features');
    localStorage.removeItem('recommendation-engine-tracks');
    localStorage.removeItem('recommendation-engine-preferences');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      audioFeaturesCount: this.audioFeaturesCache.size,
      trackLibraryCount: this.trackLibrary.size,
      userPreferencesCount: this.userPreferences.size
    };
  }

  /**
   * Export data for backup
   */
  exportData() {
    return {
      audioFeatures: Array.from(this.audioFeaturesCache.entries()),
      tracks: Array.from(this.trackLibrary.entries()),
      preferences: Array.from(this.userPreferences.entries())
    };
  }

  /**
   * Import data from backup
   */
  importData(data: any): void {
    try {
      if (data.audioFeatures) {
        this.audioFeaturesCache = new Map(data.audioFeatures);
      }
      if (data.tracks) {
        this.trackLibrary = new Map(data.tracks);
      }
      if (data.preferences) {
        this.userPreferences = new Map(data.preferences);
      }
      this.saveCachedData();
    } catch (error) {
      console.error('Failed to import recommendation engine data:', error);
    }
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine();