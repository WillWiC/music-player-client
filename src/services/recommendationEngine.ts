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
  // Temporal context
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: 'weekday' | 'weekend';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

export interface TemporalPreference {
  timeContext: string;
  preferences: Map<string, number>;
  lastUpdated: number;
  weight: number;
}

class RecommendationEngine {
  private audioFeaturesCache: Map<string, AudioFeatures> = new Map();
  private trackLibrary: Map<string, TrackWithFeatures> = new Map();
  private userPreferences: Map<string, number> = new Map();
  private temporalPreferences: Map<string, TemporalPreference> = new Map();
  private listeningHistory: Array<{ trackId: string; timestamp: number; context: string }> = [];

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

      const cachedTemporalPreferences = localStorage.getItem('recommendation-engine-temporal-preferences');
      if (cachedTemporalPreferences) {
        const temporalData = JSON.parse(cachedTemporalPreferences);
        this.temporalPreferences = new Map(
          temporalData.map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              preferences: new Map(value.preferences)
            }
          ])
        );
      }

      const cachedHistory = localStorage.getItem('recommendation-engine-history');
      if (cachedHistory) {
        this.listeningHistory = JSON.parse(cachedHistory);
        // Keep only recent history (last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.listeningHistory = this.listeningHistory.filter(entry => entry.timestamp > thirtyDaysAgo);
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

      const temporalData = Array.from(this.temporalPreferences.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          preferences: Array.from(value.preferences.entries())
        }
      ]);
      localStorage.setItem('recommendation-engine-temporal-preferences', JSON.stringify(temporalData));

      localStorage.setItem('recommendation-engine-history', JSON.stringify(this.listeningHistory));
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
   * Calculate similarity between two sets of audio features with enhanced algorithm
   */
  calculateSimilarity(features1: AudioFeatures, features2: AudioFeatures): number {
    // Enhanced weights based on music information retrieval research
    const weights = {
      // Core musical characteristics (high importance)
      valence: 0.20,        // Emotional positivity/negativity
      energy: 0.18,         // Intensity and power
      danceability: 0.15,   // Rhythmic characteristics
      
      // Acoustic properties (medium importance)
      acousticness: 0.12,   // Acoustic vs electronic
      tempo: 0.10,          // Speed and rhythm
      loudness: 0.08,       // Volume characteristics
      
      // Musical structure (medium-low importance)
      mode: 0.07,           // Major vs minor scale
      key: 0.05,            // Musical key
      
      // Specialized characteristics (low importance)
      instrumentalness: 0.03, // Vocal vs instrumental
      speechiness: 0.02,      // Speech-like content
      liveness: 0.01          // Live performance characteristics
    };

    let weightedSimilarity = 0;
    let totalWeight = 0;

    // Calculate feature-specific similarities with enhanced algorithms
    for (const [feature, weight] of Object.entries(weights)) {
      if (feature in features1 && feature in features2) {
        const val1 = features1[feature as keyof AudioFeatures] as number;
        const val2 = features2[feature as keyof AudioFeatures] as number;
        
        let similarity: number;
        
        // Use feature-specific similarity calculations
        switch (feature) {
          case 'tempo':
            // Tempo similarity with BPM clustering
            similarity = this.calculateTempoSimilarity(val1, val2);
            break;
          case 'key':
            // Musical key similarity using circle of fifths
            similarity = this.calculateKeySimilarity(val1, val2);
            break;
          case 'mode':
            // Binary mode similarity (major/minor)
            similarity = val1 === val2 ? 1 : 0.3; // Some cross-mode compatibility
            break;
          case 'valence':
          case 'energy':
          case 'danceability':
            // Emotional/energy features with non-linear similarity
            similarity = this.calculateEmotionalSimilarity(val1, val2);
            break;
          default:
            // Standard normalized similarity for other features
            similarity = 1 - Math.abs(val1 - val2);
        }
        
        weightedSimilarity += weight * similarity;
        totalWeight += weight;
      }
    }

    // Add mood coherence bonus
    const moodCoherence = this.calculateMoodCoherence(features1, features2);
    weightedSimilarity += 0.1 * moodCoherence;
    totalWeight += 0.1;

    return totalWeight > 0 ? Math.max(0, Math.min(1, weightedSimilarity / totalWeight)) : 0;
  }

  /**
   * Calculate tempo similarity using BPM clustering and harmonic relationships
   */
  private calculateTempoSimilarity(tempo1: number, tempo2: number): number {
    const diff = Math.abs(tempo1 - tempo2);
    
    // Check for harmonic relationships (double/half time)
    const ratio = Math.max(tempo1, tempo2) / Math.min(tempo1, tempo2);
    if (Math.abs(ratio - 2) < 0.1 || Math.abs(ratio - 0.5) < 0.1) {
      return 0.8; // High similarity for harmonic relationships
    }
    
    // Normal tempo similarity with exponential decay
    if (diff <= 5) return 1.0;
    if (diff <= 15) return 0.9;
    if (diff <= 30) return 0.7;
    if (diff <= 50) return 0.5;
    return Math.max(0, 1 - diff / 100);
  }

  /**
   * Calculate key similarity using circle of fifths
   */
  private calculateKeySimilarity(key1: number, key2: number): number {
    if (key1 === key2) return 1.0;
    
    // Circle of fifths relationships
    const circleOfFifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    const pos1 = circleOfFifths.indexOf(key1);
    const pos2 = circleOfFifths.indexOf(key2);
    
    if (pos1 !== -1 && pos2 !== -1) {
      const distance = Math.min(
        Math.abs(pos1 - pos2),
        12 - Math.abs(pos1 - pos2)
      );
      return Math.max(0, 1 - distance / 6);
    }
    
    return 0.5; // Default similarity for unknown keys
  }

  /**
   * Calculate emotional similarity with non-linear curves
   */
  private calculateEmotionalSimilarity(val1: number, val2: number): number {
    const diff = Math.abs(val1 - val2);
    
    // Non-linear similarity curve for emotional features
    if (diff <= 0.1) return 1.0;
    if (diff <= 0.2) return 0.9;
    if (diff <= 0.3) return 0.7;
    if (diff <= 0.5) return 0.5;
    return Math.max(0, 1 - (diff * diff)); // Quadratic decay
  }

  /**
   * Calculate mood coherence between two tracks
   */
  private calculateMoodCoherence(features1: AudioFeatures, features2: AudioFeatures): number {
    // Define mood dimensions
    const mood1 = this.extractMoodVector(features1);
    const mood2 = this.extractMoodVector(features2);
    
    // Calculate cosine similarity between mood vectors
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < mood1.length; i++) {
      dotProduct += mood1[i] * mood2[i];
      norm1 += mood1[i] * mood1[i];
      norm2 += mood2[i] * mood2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Extract mood vector from audio features
   */
  private extractMoodVector(features: AudioFeatures): number[] {
    return [
      features.valence * features.energy,           // Happy/energetic
      features.valence * (1 - features.energy),    // Happy/calm
      (1 - features.valence) * features.energy,    // Sad/intense
      (1 - features.valence) * (1 - features.energy), // Sad/calm
      features.danceability,                        // Danceable
      features.acousticness,                        // Organic/natural
      1 - features.acousticness                     // Electronic/synthetic
    ];
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
   * Record listening activity for temporal learning
   */
  recordListeningActivity(trackId: string, features?: AudioFeatures): void {
    const now = Date.now();
    const timeContext = this.getTimeContext(now);
    
    // Add to listening history
    this.listeningHistory.push({
      trackId,
      timestamp: now,
      context: timeContext
    });
    
    // Keep only recent history (last 30 days)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    this.listeningHistory = this.listeningHistory.filter(entry => entry.timestamp > thirtyDaysAgo);
    
    // Update temporal preferences if features are available
    if (features) {
      this.updateTemporalPreferences(timeContext, features);
    }
    
    this.saveCachedData();
  }

  /**
   * Get time context for temporal analysis
   */
  private getTimeContext(timestamp: number): string {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    let timeOfDay: string;
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    const weekType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';
    
    let season: string;
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';
    
    return `${timeOfDay}_${weekType}_${season}`;
  }

  /**
   * Update temporal preferences based on listening activity
   */
  private updateTemporalPreferences(timeContext: string, features: AudioFeatures): void {
    let temporalPref = this.temporalPreferences.get(timeContext);
    
    if (!temporalPref) {
      temporalPref = {
        timeContext,
        preferences: new Map(),
        lastUpdated: Date.now(),
        weight: 1.0
      };
      this.temporalPreferences.set(timeContext, temporalPref);
    }
    
    // Update preferences with exponential moving average
    const decay = 0.1;
    const features_keys = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'liveness', 'speechiness', 'tempo', 'valence'];
    
    features_keys.forEach(key => {
      const currentValue = temporalPref!.preferences.get(key) || 0.5;
      const newValue = features[key as keyof AudioFeatures] as number;
      const updatedValue = (1 - decay) * currentValue + decay * newValue;
      temporalPref!.preferences.set(key, updatedValue);
    });
    
    temporalPref.lastUpdated = Date.now();
    temporalPref.weight = Math.min(temporalPref.weight + 0.1, 2.0); // Increase confidence over time
  }

  /**
   * Get context-aware recommendations
   */
  getContextualRecommendations(options: RecommendationOptions = {}, limit: number = 20): TrackWithFeatures[] {
    const timeContext = this.getTimeContext(Date.now());
    const temporalPref = this.temporalPreferences.get(timeContext);
    
    // Adjust options based on temporal preferences
    if (temporalPref && temporalPref.weight > 0.5) {
      const contextualOptions = { ...options };
      
      // Apply temporal preferences with weighted influence
      const influence = Math.min(temporalPref.weight / 2.0, 0.7);
      
      if (!contextualOptions.target_energy && temporalPref.preferences.has('energy')) {
        contextualOptions.target_energy = temporalPref.preferences.get('energy')! * influence + (options.target_energy || 0.5) * (1 - influence);
      }
      
      if (!contextualOptions.target_valence && temporalPref.preferences.has('valence')) {
        contextualOptions.target_valence = temporalPref.preferences.get('valence')! * influence + (options.target_valence || 0.5) * (1 - influence);
      }
      
      if (!contextualOptions.target_danceability && temporalPref.preferences.has('danceability')) {
        contextualOptions.target_danceability = temporalPref.preferences.get('danceability')! * influence + (options.target_danceability || 0.5) * (1 - influence);
      }
      
      return this.generateRecommendations([], contextualOptions, limit);
    }
    
    return this.generateRecommendations([], options, limit);
  }

  /**
   * Get temporal insights about listening patterns
   */
  getTemporalInsights(): any {
    const insights: any = {
      totalSessions: this.listeningHistory.length,
      contexts: {},
      patterns: {
        mostActiveTime: '',
        preferredWeekType: '',
        seasonalTrends: {}
      }
    };
    
    // Analyze listening patterns by context
    const contextCounts: Record<string, number> = {};
    this.listeningHistory.forEach(entry => {
      contextCounts[entry.context] = (contextCounts[entry.context] || 0) + 1;
    });
    
    insights.contexts = contextCounts;
    
    // Find most active time
    const maxContext = Object.entries(contextCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
    insights.patterns.mostActiveTime = maxContext[0];
    
    // Analyze temporal preferences
    const temporalPrefs: any = {};
    this.temporalPreferences.forEach((pref, context) => {
      temporalPrefs[context] = {
        weight: pref.weight,
        lastUpdated: pref.lastUpdated,
        preferences: Object.fromEntries(pref.preferences.entries())
      };
    });
    
    insights.temporalPreferences = temporalPrefs;
    
    return insights;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      audioFeaturesCount: this.audioFeaturesCache.size,
      trackLibraryCount: this.trackLibrary.size,
      userPreferencesCount: this.userPreferences.size,
      temporalPreferencesCount: this.temporalPreferences.size,
      listeningHistoryCount: this.listeningHistory.length
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