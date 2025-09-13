/*
 - Local Audio Features Service
 - Generates audio features locally since Spotify's Audio Features API is Deprecated 
 - Fetch artist genres to enrich tracks
*/

import type { AudioFeatures, TrackWithFeatures } from './recommendationEngine';
import { recommendationEngine } from './recommendationEngine';

export interface SpotifyTrack {
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
}

// Genre-based audio feature templates
const GENRE_TEMPLATES = {
  // Electronic/Dance
  'electronic': { energy: 0.8, danceability: 0.85, valence: 0.7, tempo: 128, acousticness: 0.1 },
  'house': { energy: 0.85, danceability: 0.9, valence: 0.75, tempo: 125, acousticness: 0.05 },
  'techno': { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 130, acousticness: 0.02 },
  'edm': { energy: 0.95, danceability: 0.85, valence: 0.8, tempo: 128, acousticness: 0.03 },
  'dubstep': { energy: 0.9, danceability: 0.7, valence: 0.6, tempo: 140, acousticness: 0.02 },
  
  // Rock/Metal
  'rock': { energy: 0.8, danceability: 0.5, valence: 0.6, tempo: 120, acousticness: 0.2 },
  'hard rock': { energy: 0.9, danceability: 0.4, valence: 0.65, tempo: 125, acousticness: 0.1 },
  'metal': { energy: 0.95, danceability: 0.3, valence: 0.4, tempo: 140, acousticness: 0.05 },
  'punk': { energy: 0.9, danceability: 0.6, valence: 0.7, tempo: 150, acousticness: 0.1 },
  'alternative': { energy: 0.7, danceability: 0.5, valence: 0.5, tempo: 115, acousticness: 0.25 },
  
  // Pop
  'pop': { energy: 0.7, danceability: 0.75, valence: 0.75, tempo: 120, acousticness: 0.15 },
  'indie pop': { energy: 0.6, danceability: 0.65, valence: 0.7, tempo: 110, acousticness: 0.3 },
  'electropop': { energy: 0.8, danceability: 0.8, valence: 0.8, tempo: 125, acousticness: 0.1 },
  
  // Hip-Hop/Rap
  'hip-hop': { energy: 0.75, danceability: 0.8, valence: 0.6, tempo: 95, acousticness: 0.1 },
  'rap': { energy: 0.8, danceability: 0.75, valence: 0.6, tempo: 100, acousticness: 0.05 },
  'trap': { energy: 0.85, danceability: 0.8, valence: 0.5, tempo: 140, acousticness: 0.02 },
  
  // R&B/Soul
  'r&b': { energy: 0.6, danceability: 0.7, valence: 0.6, tempo: 95, acousticness: 0.2 },
  'soul': { energy: 0.65, danceability: 0.65, valence: 0.7, tempo: 100, acousticness: 0.3 },
  'funk': { energy: 0.8, danceability: 0.85, valence: 0.8, tempo: 110, acousticness: 0.15 },
  
  // Jazz/Blues
  'jazz': { energy: 0.5, danceability: 0.4, valence: 0.6, tempo: 90, acousticness: 0.6 },
  'blues': { energy: 0.5, danceability: 0.4, valence: 0.4, tempo: 85, acousticness: 0.5 },
  
  // Folk/Country
  'folk': { energy: 0.4, danceability: 0.3, valence: 0.6, tempo: 100, acousticness: 0.8 },
  'country': { energy: 0.6, danceability: 0.5, valence: 0.7, tempo: 110, acousticness: 0.6 },
  'acoustic': { energy: 0.3, danceability: 0.3, valence: 0.6, tempo: 90, acousticness: 0.9 },
  
  // Classical
  'classical': { energy: 0.3, danceability: 0.1, valence: 0.5, tempo: 80, acousticness: 0.95 },
  
  // Ambient/Chill
  'ambient': { energy: 0.2, danceability: 0.2, valence: 0.5, tempo: 70, acousticness: 0.7 },
  'chillout': { energy: 0.3, danceability: 0.4, valence: 0.6, tempo: 85, acousticness: 0.4 },
  'lo-fi': { energy: 0.25, danceability: 0.3, valence: 0.6, tempo: 75, acousticness: 0.5 },
  
  // Latin
  'latin': { energy: 0.8, danceability: 0.9, valence: 0.85, tempo: 115, acousticness: 0.2 },
  'reggaeton': { energy: 0.85, danceability: 0.9, valence: 0.8, tempo: 95, acousticness: 0.1 },
  'salsa': { energy: 0.8, danceability: 0.95, valence: 0.9, tempo: 180, acousticness: 0.3 },
  
  // Default fallback
  'unknown': { energy: 0.5, danceability: 0.5, valence: 0.5, tempo: 120, acousticness: 0.5 }
};

export class AudioFeaturesService {
  private token: string | null = null;
  private fetchQueue: Set<string> = new Set();
  private genreCache: Map<string, string[]> = new Map();

  constructor() {
    this.loadCachedData();
  }

  /**
   * Set the Spotify access token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Load cached data from localStorage
   */
  private loadCachedData(): void {
    try {
      const cached = localStorage.getItem('audio-features-genre-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.genreCache = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load cached genre data:', error);
    }
  }

  /**
   * Save cached data to localStorage
   */
  private saveCachedData(): void {
    try {
      const data = Array.from(this.genreCache.entries());
      localStorage.setItem('audio-features-genre-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save genre cache:', error);
    }
  }

  /**
   * Generate audio features locally based on track metadata
   */
  async generateAudioFeatures(track: SpotifyTrack): Promise<AudioFeatures> {
    // Check cache first
    const cached = recommendationEngine.getCachedFeatures(track.id);
    if (cached) {
      return cached;
    }

    console.log(`🎵 Generating local audio features for: ${track.name} by ${track.artists[0]?.name}`);

    // Start with default features
    let features = {
      id: track.id,
      duration_ms: track.duration_ms,
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

    // Get artist genres to improve feature accuracy
    const artistGenres = await this.fetchArtistGenres(track.artists.map(a => a.id));
    const allGenres = Array.from(artistGenres.values()).flat();

    // Apply genre-based templates
    if (allGenres.length > 0) {
      features = this.applyGenreTemplate(features, allGenres);
    }

    // Apply track name analysis
    features = this.analyzeTrackName(features, track.name);

    // Apply duration-based adjustments
    features = this.applyDurationAdjustments(features, track.duration_ms);

    // Apply popularity-based adjustments
    features = this.applyPopularityAdjustments(features, track.popularity);

    // Add some randomness to avoid identical features
    features = this.addVariation(features);

    // Cache the generated features
    recommendationEngine.cacheAudioFeatures(track.id, features);

    console.log(`✅ Generated features for ${track.name}: energy=${features.energy.toFixed(2)}, danceability=${features.danceability.toFixed(2)}, valence=${features.valence.toFixed(2)}`);

    return features;
  }

  /**
   * Apply genre-based feature templates
   */
  private applyGenreTemplate(features: AudioFeatures, genres: string[]): AudioFeatures {
    let genreFeatures = { ...features };
    let matchCount = 0;

    genres.forEach(genre => {
      const normalizedGenre = genre.toLowerCase();
      
      // Find matching template
      let template = GENRE_TEMPLATES['unknown'];
      for (const [key, tmpl] of Object.entries(GENRE_TEMPLATES)) {
        if (normalizedGenre.includes(key) || key.includes(normalizedGenre)) {
          template = tmpl;
          matchCount++;
          break;
        }
      }

      // Blend template features
      genreFeatures.energy = (genreFeatures.energy + template.energy) / 2;
      genreFeatures.danceability = (genreFeatures.danceability + template.danceability) / 2;
      genreFeatures.valence = (genreFeatures.valence + template.valence) / 2;
      genreFeatures.tempo = (genreFeatures.tempo + template.tempo) / 2;
      genreFeatures.acousticness = (genreFeatures.acousticness + template.acousticness) / 2;
    });

    console.log(`🎭 Applied ${matchCount} genre templates for genres: ${genres.join(', ')}`);
    return genreFeatures;
  }

  /**
   * Analyze track name for feature hints
   */
  private analyzeTrackName(features: AudioFeatures, trackName: string): AudioFeatures {
    const name = trackName.toLowerCase();
    const newFeatures = { ...features };

    // High energy indicators
    if (name.includes('remix') || name.includes('club') || name.includes('dance')) {
      newFeatures.energy = Math.min(0.9, newFeatures.energy + 0.2);
      newFeatures.danceability = Math.min(0.9, newFeatures.danceability + 0.2);
    }

    // Acoustic indicators
    if (name.includes('acoustic') || name.includes('unplugged') || name.includes('stripped')) {
      newFeatures.acousticness = Math.min(0.95, newFeatures.acousticness + 0.4);
      newFeatures.energy = Math.max(0.1, newFeatures.energy - 0.3);
    }

    // Live recordings
    if (name.includes('live') || name.includes('concert')) {
      newFeatures.liveness = Math.min(0.9, newFeatures.liveness + 0.6);
    }

    // Instrumental versions
    if (name.includes('instrumental') || name.includes('karaoke')) {
      newFeatures.instrumentalness = Math.min(0.9, newFeatures.instrumentalness + 0.7);
      newFeatures.speechiness = Math.max(0.03, newFeatures.speechiness - 0.05);
    }

    // Sad/emotional indicators
    if (name.includes('sad') || name.includes('cry') || name.includes('alone') || name.includes('broken')) {
      newFeatures.valence = Math.max(0.1, newFeatures.valence - 0.3);
      newFeatures.energy = Math.max(0.2, newFeatures.energy - 0.2);
    }

    // Happy/upbeat indicators
    if (name.includes('happy') || name.includes('party') || name.includes('celebration') || name.includes('joy')) {
      newFeatures.valence = Math.min(0.9, newFeatures.valence + 0.3);
      newFeatures.energy = Math.min(0.9, newFeatures.energy + 0.2);
    }

    return newFeatures;
  }

  /**
   * Apply duration-based adjustments
   */
  private applyDurationAdjustments(features: AudioFeatures, durationMs: number): AudioFeatures {
    const newFeatures = { ...features };
    const durationMinutes = durationMs / 60000;

    // Very short tracks (< 2 min) - likely high energy
    if (durationMinutes < 2) {
      newFeatures.energy = Math.min(0.9, newFeatures.energy + 0.1);
      newFeatures.tempo = Math.min(180, newFeatures.tempo + 10);
    }
    
    // Long tracks (> 6 min) - possibly progressive or ambient
    else if (durationMinutes > 6) {
      newFeatures.energy = Math.max(0.2, newFeatures.energy - 0.1);
      newFeatures.valence = Math.max(0.2, newFeatures.valence - 0.1);
    }

    return newFeatures;
  }

  /**
   * Apply popularity-based adjustments
   */
  private applyPopularityAdjustments(features: AudioFeatures, popularity: number): AudioFeatures {
    const newFeatures = { ...features };

    // Very popular tracks tend to be more danceable and positive
    if (popularity > 80) {
      newFeatures.danceability = Math.min(0.9, newFeatures.danceability + 0.1);
      newFeatures.valence = Math.min(0.9, newFeatures.valence + 0.1);
    }
    
    // Less popular tracks might be more experimental
    else if (popularity < 30) {
      newFeatures.acousticness = Math.min(0.8, newFeatures.acousticness + 0.1);
      newFeatures.instrumentalness = Math.min(0.6, newFeatures.instrumentalness + 0.1);
    }

    return newFeatures;
  }

  /**
   * Add slight variation to avoid identical features
   */
  private addVariation(features: AudioFeatures): AudioFeatures {
    const newFeatures = { ...features };
    const variation = 0.05; // ±5% variation

    // Add random variation to key features
    newFeatures.energy = Math.max(0, Math.min(1, newFeatures.energy + (Math.random() - 0.5) * variation));
    newFeatures.danceability = Math.max(0, Math.min(1, newFeatures.danceability + (Math.random() - 0.5) * variation));
    newFeatures.valence = Math.max(0, Math.min(1, newFeatures.valence + (Math.random() - 0.5) * variation));
    newFeatures.tempo = Math.max(40, Math.min(200, newFeatures.tempo + (Math.random() - 0.5) * 20));

    return newFeatures;
  }

  /**
   * Generate audio features for multiple tracks
   */
  async getMultipleAudioFeatures(trackIds: string[]): Promise<Map<string, AudioFeatures>> {
    const results = new Map<string, AudioFeatures>();

    // Process each track individually since we're generating locally
    for (const trackId of trackIds) {
      const cached = recommendationEngine.getCachedFeatures(trackId);
      if (cached) {
        results.set(trackId, cached);
      } else {
        // We need track metadata to generate features, so we'll generate basic defaults
        const defaultFeatures: AudioFeatures = {
          id: trackId,
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
        
        recommendationEngine.cacheAudioFeatures(trackId, defaultFeatures);
        results.set(trackId, defaultFeatures);
      }
    }

    return results;
  }

  /**
   * Enrich a track with audio features
   */
  async enrichTrackWithFeatures(track: SpotifyTrack): Promise<TrackWithFeatures> {
    const features = await this.generateAudioFeatures(track);
    
    const enrichedTrack: TrackWithFeatures = {
      ...track,
      audio_features: features
    };

    // Add to recommendation engine library
    recommendationEngine.addTrack(enrichedTrack);

    return enrichedTrack;
  }

  /**
   * Enrich multiple tracks with audio features
   */
  async enrichTracksWithFeatures(tracks: SpotifyTrack[]): Promise<TrackWithFeatures[]> {
    const enrichedTracks: TrackWithFeatures[] = [];

    for (const track of tracks) {
      const enrichedTrack = await this.enrichTrackWithFeatures(track);
      enrichedTracks.push(enrichedTrack);
    }

    return enrichedTracks;
  }

  /**
   * Fetch artist genres to enrich tracks
   */
  async fetchArtistGenres(artistIds: string[]): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    if (!this.token || artistIds.length === 0) {
      return results;
    }

    // Check cache first
    const uncachedIds: string[] = [];
    artistIds.forEach(id => {
      const cached = this.genreCache.get(id);
      if (cached) {
        results.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    });

    if (uncachedIds.length === 0) {
      return results;
    }

    try {
      // Process in batches of 50 (Spotify's limit for artists endpoint)
      for (let i = 0; i < uncachedIds.length; i += 50) {
        const batch = uncachedIds.slice(i, i + 50);
        const ids = batch.join(',');
        
        const response = await fetch(`https://api.spotify.com/v1/artists?ids=${ids}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.artists && Array.isArray(data.artists)) {
            data.artists.forEach((artist: any) => {
              if (artist && artist.id && artist.genres) {
                results.set(artist.id, artist.genres);
                this.genreCache.set(artist.id, artist.genres);
              }
            });
          }
        }

        // Add delay between batches
        if (i + 50 < uncachedIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Save updated cache
      this.saveCachedData();
    } catch (error) {
      console.error('Failed to fetch artist genres:', error);
    }

    return results;
  }

  /**
   * Fully enrich tracks with both audio features and genre information
   */
  async fullyEnrichTracks(tracks: SpotifyTrack[]): Promise<TrackWithFeatures[]> {
    // Get unique artist IDs
    const artistIds = [...new Set(tracks.flatMap(t => t.artists.map(a => a.id)))];
    
    // Fetch artist genres first
    const artistGenres = await this.fetchArtistGenres(artistIds);
    
    // Enrich tracks with genres and then generate features
    const enrichedTracks: TrackWithFeatures[] = [];
    
    for (const track of tracks) {
      // Add genres to track
      const trackGenres = track.artists.flatMap(artist => artistGenres.get(artist.id) || []);
      const trackWithGenres = { ...track, genres: trackGenres };
      
      // Generate audio features (which will use the genres)
      const enrichedTrack = await this.enrichTrackWithFeatures(trackWithGenres);
      enrichedTracks.push(enrichedTrack);
    }
    
    return enrichedTracks;
  }

  /**
   * Queue track for background feature generation
   */
  queueForFeatureFetch(trackId: string): void {
    if (!recommendationEngine.getCachedFeatures(trackId)) {
      this.fetchQueue.add(trackId);
    }
  }

  /**
   * Process queued tracks for feature generation
   */
  async processQueue(): Promise<void> {
    if (this.fetchQueue.size === 0) return;

    const trackIds = Array.from(this.fetchQueue);
    this.fetchQueue.clear();

    console.log(`🎵 Processing ${trackIds.length} tracks for local audio feature generation...`);
    
    // Generate basic features for queued tracks
    for (const trackId of trackIds) {
      if (!recommendationEngine.getCachedFeatures(trackId)) {
        const defaultTrack: SpotifyTrack = {
          id: trackId,
          name: 'Unknown Track',
          artists: [{ id: 'unknown', name: 'Unknown Artist' }],
          album: { id: 'unknown', name: 'Unknown Album', images: [] },
          popularity: 50,
          uri: `spotify:track:${trackId}`,
          duration_ms: 200000,
          genres: []
        };
        
        await this.generateAudioFeatures(defaultTrack);
      }
    }
  }

  /**
   * Start background processing of queued tracks
   */
  startBackgroundProcessing(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process queue every 5 seconds
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...recommendationEngine.getCacheStats(),
      queueSize: this.fetchQueue.size
    };
  }
}

// Singleton instance
export const audioFeaturesService = new AudioFeaturesService();