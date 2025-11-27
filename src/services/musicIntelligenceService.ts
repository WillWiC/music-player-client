/**
 * Music Intelligence Service
 * Provides smart playlist recommendations and music analysis
 * 
 * FOLLOWER COUNT CONSIDERATION:
 * The algorithm heavily considers follower counts as a quality indicator:
 * - Genre playlists: Up to 40 points from follower quality score + bonuses
 * - Artist playlists: Up to 35 points from follower quality score + bonuses  
 * - ML ranking: Additional multipliers based on user preference (mainstream/underground)
 * - Final sort: Uses follower count as tiebreaker for similar scores
 * - Quality scoring: Logarithmic scale from 0-100 based on follower count
 * 
 * Uses available Spotify APIs without deprecated endpoints
 */

import type { Track, Artist, Playlist, User } from '../types/spotify';

export interface PlaylistRecommendation {
  playlist: Playlist;
  score: number;
  reasons: string[];
  matchingGenres: string[];
  similarityType: 'genre' | 'artist' | 'popularity' | 'user_pattern';
}

export interface ArtistRecommendation {
  artist: Artist;
  score: number;
  reasons: string[];
  matchingGenres: string[];
  similarityType: 'genre' | 'similar_artists' | 'popularity' | 'user_pattern';
}

export interface MusicInsights {
  topGenres: { genre: string; count: number; percentage: number }[];
  artistDiversity: number;
  popularityBias: 'mainstream' | 'underground' | 'mixed';
  discoveryRate: number;
  listeningPatterns: {
    averageTrackLength: number;
    explicitContentRatio: number;
    recentVsOld: 'recent' | 'classic' | 'mixed';
  };
}

export interface UserMusicProfile {
  insights: MusicInsights;
  recommendations: PlaylistRecommendation[];
  artistRecommendations: ArtistRecommendation[];
  lastUpdated: string;
}

export class MusicIntelligenceService {
  private token: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Get cached data or fetch new data
   * OPTIMIZATION: Prevents redundant API calls
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`✓ Cache hit for: ${key}`);
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set cache data
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Build Spotify API URL with parameters
   */
  private buildSpotifyUrl(endpoint: string, params: Record<string, any> = {}): string {
    const baseUrl = 'https://api.spotify.com/v1/';
    const url = new URL(endpoint, baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return url.toString();
  }

  /**
   * Make authenticated request to Spotify API
   */
  private async makeSpotifyRequest<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<{ data: T | null; error: string | null }> {
    try {
      const url = this.buildSpotifyUrl(endpoint, params);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { data: null, error: 'Authentication failed. Please log in again.' };
        }
        if (response.status === 403) {
          return { data: null, error: 'Access forbidden. Premium account may be required.' };
        }
        if (response.status === 429) {
          return { data: null, error: 'Rate limit exceeded. Please try again later.' };
        }
        return { data: null, error: `API request failed: ${response.status}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Spotify API request failed:', error);
      return { data: null, error: 'Network error occurred' };
    }
  }

  /**
   * Generate comprehensive music profile with recommendations
   * OPTIMIZED: Added caching + parallel execution
   */
  async generateMusicProfile(_user: User): Promise<UserMusicProfile> {
    try {
      // OPTIMIZATION: Check cache first (version 3 includes language filtering)
      const cacheKey = 'music-profile-v3';
      const cached = this.getCachedData<UserMusicProfile>(cacheKey);
      if (cached) {
        console.log('✓ Returning cached music profile (v3)');
        return cached;
      }

      // Clear expired cache periodically
      this.clearExpiredCache();

      console.log('Generating fresh music profile...');
      const startTime = Date.now();

      // Gather user data in parallel - Phase 1: Get basic data + playlist/album lists
      const [topTracks, recentlyPlayed, savedTracks, userPlaylists, savedAlbums, followedArtists] = await Promise.all([
        this.getUserTopTracks(),
        this.getRecentlyPlayed(),
        this.getSavedTracks(),
        this.getUserPlaylists(),
        this.getSavedAlbums(),
        this.getFollowedArtists()
      ]);

      // Phase 2: Fetch tracks from all playlists and albums
      const [playlistTracks, albumTracks] = await Promise.all([
        this.getTracksFromPlaylists(userPlaylists),
        this.getTracksFromAlbums(savedAlbums)
      ]);

      // Generate insights from ALL user data sources
      const insights = this.analyzeUserMusic(topTracks, recentlyPlayed, savedTracks, playlistTracks, albumTracks);
      
      // Generate playlist recommendations
      const recommendations = await this.generatePlaylistRecommendations(
        insights,
        topTracks,
        savedTracks,
        followedArtists
      );

      // Generate artist recommendations
      const artistRecommendations = await this.generateArtistRecommendations(
        insights,
        topTracks,
        followedArtists
      );

      const profile: UserMusicProfile = {
        insights,
        recommendations,
        artistRecommendations,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.setCachedData(cacheKey, profile);

      const elapsedTime = Date.now() - startTime;
      console.log(`✓ Music profile generated in ${elapsedTime}ms (${(elapsedTime/1000).toFixed(2)}s)`);

      return profile;
    } catch (error) {
      console.error('Failed to generate music profile:', error);
      throw new Error('Unable to analyze your music preferences');
    }
  }

  /**
   * Get user's top tracksW
   */
  private async getUserTopTracks(): Promise<Track[]> {
    const { data, error } = await this.makeSpotifyRequest('me/top/tracks', { limit: 50, time_range: 'medium_term' });
    
    if (error) throw new Error('Failed to fetch top tracks');
    return data?.items || [];
  }

  /**
   * Get recently played tracks
   */
  private async getRecentlyPlayed(): Promise<Track[]> {
    const { data, error } = await this.makeSpotifyRequest('me/player/recently-played', { limit: 50 });
    
    if (error) return []; // Not critical if this fails
    return data?.items?.map((item: any) => item.track) || [];
  }

  /**
   * Get ALL user's saved tracks with pagination
   * Fetches all liked songs, not just the first 50
   */
  private async getSavedTracks(): Promise<Track[]> {
    const allTracks: Track[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.makeSpotifyRequest('me/tracks', { limit, offset });
      
      if (error || !data?.items) {
        hasMore = false;
        break;
      }

      const tracks = data.items.map((item: any) => item.track).filter(Boolean);
      allTracks.push(...tracks);
      
      hasMore = data.items.length === limit && allTracks.length < 1000; // Cap at 1000 tracks
      offset += limit;
    }

    console.log(`📚 Fetched ${allTracks.length} total saved tracks`);
    return allTracks;
  }

  /**
   * Get ALL user's playlists with pagination
   */
  private async getUserPlaylists(): Promise<Playlist[]> {
    const allPlaylists: Playlist[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.makeSpotifyRequest('me/playlists', { limit, offset });
      
      if (error || !data?.items) {
        hasMore = false;
        break;
      }

      allPlaylists.push(...data.items);
      hasMore = data.items.length === limit;
      offset += limit;
    }

    console.log(`📋 Fetched ${allPlaylists.length} user playlists`);
    return allPlaylists;
  }

  /**
   * Get ALL user's saved albums with pagination
   */
  private async getSavedAlbums(): Promise<any[]> {
    const allAlbums: any[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.makeSpotifyRequest('me/albums', { limit, offset });
      
      if (error || !data?.items) {
        hasMore = false;
        break;
      }

      const albums = data.items.map((item: any) => item.album).filter(Boolean);
      allAlbums.push(...albums);
      hasMore = data.items.length === limit;
      offset += limit;
    }

    console.log(`💿 Fetched ${allAlbums.length} saved albums`);
    return allAlbums;
  }

  /**
   * Get tracks from all user playlists with pagination
   * OPTIMIZED: Simple offset-based pagination, capped at 500 tracks per playlist
   */
  private async getTracksFromPlaylists(playlists: Playlist[]): Promise<Track[]> {
    const allTracks: Track[] = [];
    
    // Process playlists in batches to avoid rate limiting
    const batchSize = 5;
    const maxTracksPerPlaylist = 500; // Cap to avoid huge playlists slowing things down
    
    for (let i = 0; i < playlists.length; i += batchSize) {
      const batch = playlists.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (playlist) => {
          const tracks: Track[] = [];
          let offset = 0;
          const limit = 100;
          
          // Simple offset-based pagination
          while (offset < maxTracksPerPlaylist) {
            const { data, error } = await this.makeSpotifyRequest(
              `playlists/${playlist.id}/tracks`, 
              { limit, offset, fields: 'items(track(id,name,artists,album,duration_ms,explicit,popularity)),next' }
            );
            
            if (error || !data?.items || data.items.length === 0) break;
            
            const validTracks = data.items
              .map((item: any) => item.track)
              .filter((track: any) => track && track.id);
            
            tracks.push(...validTracks);
            
            // Stop if no more pages or we've hit the cap
            if (!data.next || data.items.length < limit) break;
            
            offset += limit;
          }
          
          return tracks;
        })
      );
      
      batchResults.forEach(tracks => allTracks.push(...tracks));
    }

    console.log(`🎵 Fetched ${allTracks.length} tracks from ${playlists.length} playlists`);
    return allTracks;
  }

  /**
   * Get tracks from all saved albums
   */
  private async getTracksFromAlbums(albums: any[]): Promise<Track[]> {
    const allTracks: Track[] = [];
    
    // Process albums in batches
    const batchSize = 5;
    for (let i = 0; i < albums.length; i += batchSize) {
      const batch = albums.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (album) => {
          const { data, error } = await this.makeSpotifyRequest(`albums/${album.id}/tracks`, { limit: 50 });
          
          if (error || !data?.items) return [];
          
          // Album tracks don't have full track info, so we need to enrich them
          return data.items.map((track: any) => ({
            ...track,
            album: {
              id: album.id,
              name: album.name,
              images: album.images
            }
          })).filter((track: any) => track && track.id);
        })
      );
      
      batchResults.forEach(tracks => allTracks.push(...tracks));
    }

    console.log(`💿 Fetched ${allTracks.length} tracks from ${albums.length} albums`);
    return allTracks;
  }

  /**
   * Get followed artists
   */
  private async getFollowedArtists(): Promise<Artist[]> {
    const { data, error } = await this.makeSpotifyRequest('me/following', { type: 'artist', limit: 50 });
    
    if (error) return [];
    return data?.artists?.items || [];
  }

  /**
   * Analyze user's music to generate insights from ALL sources
   */
  private analyzeUserMusic(
    topTracks: Track[], 
    recentlyPlayed: Track[], 
    savedTracks: Track[],
    playlistTracks: Track[] = [],
    albumTracks: Track[] = []
  ): MusicInsights {
    // IMPORTANT: Deduplicate tracks by ID to avoid counting the same track multiple times
    // A track can appear in multiple sources (liked songs, playlists, albums, etc.)
    const trackMap = new Map<string, Track>();
    
    // Add all tracks from all sources to map
    [...topTracks, ...recentlyPlayed, ...savedTracks, ...playlistTracks, ...albumTracks].forEach(track => {
      if (track && track.id) {
        trackMap.set(track.id, track);
      }
    });
    
    const allTracks = Array.from(trackMap.values());
    
    const totalBeforeDedup = topTracks.length + recentlyPlayed.length + savedTracks.length + playlistTracks.length + albumTracks.length;
    console.log(`🎵 Track sources: ${topTracks.length} top + ${recentlyPlayed.length} recent + ${savedTracks.length} saved + ${playlistTracks.length} playlist + ${albumTracks.length} album = ${totalBeforeDedup} total`);
    console.log(`✨ After deduplication: ${allTracks.length} unique tracks for genre analysis`);
    
    // Handle case when no tracks are available
    if (allTracks.length === 0) {
      console.log('No tracks available for analysis, returning default insights');
      return {
        topGenres: [],
        artistDiversity: 0,
        popularityBias: 'mixed',
        discoveryRate: 0,
        listeningPatterns: {
          averageTrackLength: 210000, // Default 3.5 minutes
          explicitContentRatio: 0,
          recentVsOld: 'mixed'
        }
      };
    }
    
    // Extract genres from artists (count once per track, not per genre appearance)
    const genreCounts = this.extractGenresPerTrack(allTracks);
    const totalTracks = allTracks.length;
    
    // Calculate top genres with percentages based on track count
    // Percentage = what % of tracks have this genre
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalTracks) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.log(`📊 Genre distribution from ${totalTracks} tracks`);

    // Calculate artist diversity
    const uniqueArtists = new Set(allTracks.flatMap(track => track.artists.map(artist => artist.id)));
    const artistDiversity = Math.min(uniqueArtists.size / Math.max(totalTracks, 1), 1);

    // Analyze popularity bias
    const popularityScores = allTracks
      .filter(track => track.popularity !== undefined)
      .map(track => track.popularity!);
    
    const avgPopularity = popularityScores.reduce((sum, pop) => sum + pop, 0) / popularityScores.length;
    let popularityBias: 'mainstream' | 'underground' | 'mixed' = 'mixed';
    
    if (avgPopularity > 70) popularityBias = 'mainstream';
    else if (avgPopularity < 40) popularityBias = 'underground';

    // Calculate discovery rate (unique artists vs total tracks)
    const discoveryRate = Math.round((uniqueArtists.size / Math.max(totalTracks, 1)) * 100);

    // Analyze listening patterns
    const explicitTracks = allTracks.filter(track => track.explicit).length;
    const explicitContentRatio = Math.round((explicitTracks / Math.max(totalTracks, 1)) * 100);
    
    const averageTrackLength = allTracks.reduce((sum, track) => sum + track.duration_ms, 0) / Math.max(totalTracks, 1);
    
    // Determine era preference (this is simplified - in reality you'd need release date data)
    const recentVsOld: 'recent' | 'classic' | 'mixed' = 'mixed'; // Simplified for now

    return {
      topGenres,
      artistDiversity: Math.round(artistDiversity * 100),
      popularityBias,
      discoveryRate,
      listeningPatterns: {
        averageTrackLength: Math.round(averageTrackLength),
        explicitContentRatio,
        recentVsOld
      }
    };
  }

  /**
   * Extract genres from tracks - counts only the PRIMARY genre per track
   * Each track contributes exactly 1 genre to the distribution (most relevant one)
   */
  private extractGenresPerTrack(tracks: Track[]): Record<string, number> {
    const genreCounts: Record<string, number> = {};
    
    // Genre priority order (higher = more specific/reliable)
    const genrePriority: Record<string, number> = {
      'k-pop': 100,      // Very specific
      'j-pop': 100,
      'latin': 90,
      'hip-hop': 85,
      'classical': 85,
      'jazz': 85,
      'country': 80,
      'r&b': 80,
      'gospel': 75,
      'electronic': 70,
      'rock': 65,
      'pop': 50,         // Very generic, lower priority
      'acoustic': 40,
      'live': 30,
      'instrumental': 30,
      'cover': 20,
      'ambient': 60,
      'vintage': 20,
      'retro': 20,
      'contemporary': 10
    };
    
    tracks.forEach(track => {
      // Collect genres from all detection methods
      const artistGenres = this.inferGenresFromArtistNames(track.artists);
      const trackGenres = this.inferGenresFromTrackName(track.name);
      const contextualGenres = this.inferGenresFromContext(track);
      
      // Combine all detected genres (skip audio features as they're unreliable without real data)
      const allGenres = [...new Set([
        ...artistGenres,
        ...trackGenres,
        ...contextualGenres
      ])];
      
      // Pick the TOP genre based on priority (most specific/reliable wins)
      if (allGenres.length > 0) {
        const topGenre = allGenres.reduce((best, current) => {
          const bestPriority = genrePriority[best] ?? 50;
          const currentPriority = genrePriority[current] ?? 50;
          return currentPriority > bestPriority ? current : best;
        }, allGenres[0]);
        
        genreCounts[topGenre] = (genreCounts[topGenre] || 0) + 1;
      }
    });

    return genreCounts;
  }

  /**
   * Enhanced genre inference from artist names using pattern matching
   */
  private inferGenresFromArtistNames(artists: Artist[]): string[] {
    const genres: string[] = [];
    
    artists.forEach(artist => {
      const name = artist.name.toLowerCase();
      
      // Electronic/EDM patterns
      if (name.match(/\b(dj\s|dj$|\sdj\b|skrillex|deadmau5|tiësto|armin|calvin harris)/)) genres.push('electronic');
      if (name.match(/\b(bass|step|trance|house|techno|dubstep)/)) genres.push('electronic');
      
      // Hip-hop patterns
      if (name.match(/\b(mc\s|mc$|\smc\b|lil\s|young\s|big\s|\$|rapper)/)) genres.push('hip-hop');
      if (name.match(/\b(gang|crew|mob|posse|squad)/)) genres.push('hip-hop');
      
      // Rock patterns
      if (name.match(/\b(band|group|boys|brothers|sisters|collective)/)) genres.push('rock');
      if (name.match(/\b(metal|punk|grunge|indie|alternative)/)) genres.push('rock');
      
      // Classical patterns
      if (name.match(/\b(orchestra|symphony|philharmonic|ensemble|quartet|trio)/)) genres.push('classical');
      if (name.match(/\b(bach|mozart|beethoven|chopin|classical)/)) genres.push('classical');
      
      // Jazz patterns
      if (name.match(/\b(jazz|swing|bebop|fusion|quintet|sextet)/)) genres.push('jazz');
      
      // Country patterns
      if (name.match(/\b(country|bluegrass|nashville|honky|outlaw)/)) genres.push('country');
      
      // Pop patterns
      if (name.match(/\b(pop|teen|idol|sensation|star)/)) genres.push('pop');
      
      // K-pop patterns
      if (name.match(/\b(bts|blackpink|twice|stray\s?kids|itzy|aespa|newjeans|ive|seventeen|txt|tomorrow\s?x\s?together)/i)) genres.push('k-pop');
      if (name.match(/\b(kpop|k-pop|korean|hallyu|idol)/i)) genres.push('k-pop');
      if (name.match(/\b(sm\s?entertainment|yg\s?entertainment|jyp\s?entertainment|hybe|cube)/i)) genres.push('k-pop');
      
      // R&B/Soul patterns
      if (name.match(/\b(soul|motown|rhythm|blues|r&b)/)) genres.push('r&b');
      
      // Latin patterns
      if (name.match(/\b(salsa|merengue|bachata|reggaeton|mariachi|banda)/)) genres.push('latin');
      
      // Gospel/Religious patterns
      if (name.match(/\b(choir|gospel|church|christian|praise|worship)/)) genres.push('gospel');
    });

    return [...new Set(genres)]; // Remove duplicates
  }

  /**
   * Infer genres from contextual information (album, release patterns, etc.)
   */
  private inferGenresFromContext(track: Track): string[] {
    const genres: string[] = [];
    
    // Album name analysis
    if (track.album?.name) {
      const albumName = track.album.name.toLowerCase();
      
      if (albumName.match(/\b(greatest hits|anthology|collection|best of)/)) {
        genres.push('compilation');
      }
      if (albumName.match(/\b(live|concert|acoustic|unplugged)/)) {
        genres.push('live');
      }
      if (albumName.match(/\b(remix|mixed|dj|dance)/)) {
        genres.push('electronic');
      }
      if (albumName.match(/\b(classical|symphony|concerto|sonata)/)) {
        genres.push('classical');
      }
    }
    
    // Release date patterns (simplified)
    const currentYear = new Date().getFullYear();
    if (track.album?.release_date) {
      const releaseYear = parseInt(track.album.release_date.split('-')[0]);
      
      if (releaseYear < 1970) genres.push('vintage');
      else if (releaseYear < 1990) genres.push('retro');
      else if (releaseYear > currentYear - 2) genres.push('contemporary');
    }
    
    return genres;
  }

  /**
   * Infer genres from track names
   */
  private inferGenresFromTrackName(trackName: string): string[] {
    const genres: string[] = [];
    const name = trackName.toLowerCase();
    
    // Genre hints from track titles
    if (name.includes('remix') || name.includes('mix')) genres.push('electronic');
    if (name.includes('acoustic')) genres.push('acoustic');
    if (name.includes('live') || name.includes('concert')) genres.push('live');
    if (name.includes('instrumental')) genres.push('instrumental');
    if (name.includes('cover')) genres.push('cover');
    
    // K-pop specific track patterns
    if (name.match(/\b(korean\s?ver|kor\s?ver|hangul)/i)) genres.push('k-pop');
    if (name.match(/\b(사랑|마음|꿈|별|하늘)/)) genres.push('k-pop'); // Common Korean words
    if (name.match(/\b(oppa|unnie|sunbae|hoobae|aegyo)/i)) genres.push('k-pop'); // K-pop specific terms
    
    return genres;
  }

  /**
   * Generate playlist recommendations based on user profile with enhanced algorithms
   * OPTIMIZED: Parallel execution + smart caching + better deduplication
   */
  private async generatePlaylistRecommendations(
    insights: MusicInsights,
    _topTracks: Track[],
    _savedTracks: Track[],
    followedArtists: Artist[]
  ): Promise<PlaylistRecommendation[]> {
    const startTime = Date.now();
    
    // Use ONLY the TOP 1 genre for focused recommendations
    const topGenre = insights.topGenres[0];
    if (!topGenre) {
      console.log('No user genres found, using default genre for recommendations');
    }
    const genreToSearch = topGenre?.genre || 'pop';
    
    console.log(`🎯 Focusing recommendations on TOP genre: "${genreToSearch}"`);
    
    // OPTIMIZATION 1: Parallel execution of recommendation types
    const [genreRecs, artistRecs] = await Promise.all([
      // Genre-based recommendations - ONLY TOP 1 GENRE
      this.searchPlaylistsByGenre(genreToSearch, insights),
      
      // Artist-based recommendations (parallel)
      Promise.all(
        (followedArtists.length > 0 
          ? followedArtists.slice(0, 4) // Reduced from 6 to 4
          : [
              { name: 'Taylor Swift', id: 'example1' },
              { name: 'The Weeknd', id: 'example2' }
            ]
        ).map(artist => this.searchPlaylistsByArtist(artist.name, insights))
      ).then(results => results.flat())
    ]);

    // OPTIMIZATION 2: Combine all recommendations
    const allRecommendations = [...genreRecs, ...artistRecs];
    
    console.log(`Raw recommendations: ${allRecommendations.length} (Genre: ${genreRecs.length}, Artist: ${artistRecs.length})`)

    // OPTIMIZATION 3: Fast deduplication using Map (O(n) instead of O(n²))
    const uniqueRecs = this.deduplicateRecommendations(allRecommendations);
    console.log(`After deduplication: ${uniqueRecs.length} recommendations`);

    // OPTIMIZATION 4: Apply ML ranking
    const rankedRecs = this.rankRecommendationsWithML(uniqueRecs, insights);
    
    // OPTIMIZATION 5: Add diversity recommendations only if we have < 15 unique recs
    let finalRecs = rankedRecs;
    if (finalRecs.length < 15) {
      console.log('Adding serendipity recommendations for diversity...');
      const diversityRecs = await this.getSerendipityRecommendations(insights, finalRecs);
      const combined = [...finalRecs, ...diversityRecs];
      const deduplicated = this.deduplicateRecommendations(combined);
      finalRecs = this.rankRecommendationsWithML(deduplicated, insights);
    }
    
    // OPTIMIZATION 6: Final sorting with follower count as tiebreaker
    finalRecs.sort((a, b) => {
      // Primary sort by score (5-point threshold)
      if (Math.abs(a.score - b.score) > 5) {
        return b.score - a.score;
      }
      // Secondary sort by follower count for similar scores
      const aFollowers = a.playlist.followers?.total ?? 0;
      const bFollowers = b.playlist.followers?.total ?? 0;
      return bFollowers - aFollowers;
    });
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✓ Generated ${finalRecs.length} recommendations in ${elapsedTime}ms (${(elapsedTime/1000).toFixed(2)}s)`);
    
    return finalRecs.slice(0, 24); // Increased from 20 to 24 for better variety
  }

  /**
   * Generate artist recommendations based on user's music taste
   * OPTIMIZED: Multiple search strategies with better accuracy
   * 
   * ALGORITHM:
   * 1. Extract user's top artists from their most-played tracks
   * 2. Search artists by top genres using multiple query strategies
   * 3. Search for similar artists using name/genre Search API queries
   * 4. Run smart search combining genre + popularity terms
   * 5. Combine all sources and deduplicate
   * 6. Filter out already-followed artists and user's top artists
   * 7. Sort by relevance score + genre match count + follower count
   * 8. Ensure diversity (max 3 artists per genre)
   * 9. Return top 12 diverse, relevant artist recommendations
   */
  private async generateArtistRecommendations(
    insights: MusicInsights,
    topTracks: Track[],
    followedArtists: Artist[]
  ): Promise<ArtistRecommendation[]> {
    const startTime = Date.now();
    
    try {
      // Get user's top artists from tracks with proper Artist type
      const artistCounts = new Map<string, { artist: Artist; count: number }>();
      
      topTracks.forEach(track => {
        track.artists.forEach(artist => {
          const existing = artistCounts.get(artist.id);
          if (existing) {
            existing.count++;
          } else {
            // Ensure we have the full Artist object
            artistCounts.set(artist.id, { 
              artist: artist as Artist, 
              count: 1 
            });
          }
        });
      });

      // Sort by count and get top artists (these are user's favorites)
      const userTopArtists = Array.from(artistCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => item.artist);

      console.log(`User's top ${userTopArtists.length} artists identified`);

      // Use ONLY the TOP 1 genre for focused recommendations
      const topGenre = insights.topGenres[0]?.genre || 'pop';
      
      console.log(`🎯 Focusing artist recommendations on TOP genre: "${topGenre}"`);

      // OPTIMIZED: Multiple parallel search strategies for better results (NO DEPRECATED APIs)
      const [genreArtists, similarArtists, searchArtists] = await Promise.all([
        // Strategy 1: Search artists by user's TOP genre only
        this.searchArtistsByGenre(topGenre, insights),
        
        // Strategy 2: Search for artists similar to user's favorites (using Search API, NOT deprecated related-artists)
        this.searchSimilarArtistsParallel(userTopArtists.slice(0, 3), insights),
        
        // Strategy 3: Smart search using TOP genre only
        this.smartArtistSearch([topGenre], insights)
      ]);

      console.log(`Found: ${genreArtists.length} genre artists, ${similarArtists.length} similar artists, ${searchArtists.length} smart search artists`);

      // Combine all artist recommendations
      const allArtistRecs = [...genreArtists, ...similarArtists, ...searchArtists];

      if (allArtistRecs.length === 0) {
        console.log('No artist recommendations found, using fallback');
        return this.getFallbackArtistRecommendations(insights);
      }

      // Deduplicate artists
      const uniqueArtists = this.deduplicateArtistRecommendations(allArtistRecs);

      // Filter out already followed artists AND user's top artists (they already know them!)
      const followedIds = new Set(followedArtists.map(a => a.id));
      const userTopIds = new Set(userTopArtists.map(a => a.id));
      const excludeIds = new Set([...followedIds, ...userTopIds]);
      
      const newArtists = uniqueArtists.filter(rec => !excludeIds.has(rec.artist.id));

      console.log(`After filtering: ${newArtists.length} unique new artists`);

      // OPTIMIZED: Better sorting algorithm considering multiple factors
      newArtists.sort((a, b) => {
        // Primary: Score (with larger threshold for significance)
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 10) return scoreDiff;
        
        // Secondary: Genre match count (more matches = better)
        const genreCountDiff = b.matchingGenres.length - a.matchingGenres.length;
        if (genreCountDiff !== 0) return genreCountDiff;
        
        // Tertiary: Followers (quality indicator)
        const aFollowers = a.artist.followers?.total ?? 0;
        const bFollowers = b.artist.followers?.total ?? 0;
        return bFollowers - aFollowers;
      });

      // OPTIMIZED: Ensure diversity in final results
      const diverseArtists = this.ensureArtistDiversity(newArtists, insights);

      const elapsedTime = Date.now() - startTime;
      console.log(`✓ Generated ${diverseArtists.length} artist recommendations in ${elapsedTime}ms`);

      return diverseArtists.slice(0, 12); // Return top 12 artist recommendations
    } catch (error) {
      console.error('Failed to generate artist recommendations:', error);
      return [];
    }
  }

  /**
   * Search for similar artists sequentially using Search API
   * Uses delays between requests to avoid rate limiting
   */
  private async searchSimilarArtistsParallel(seedArtists: Artist[], userInsights?: MusicInsights): Promise<ArtistRecommendation[]> {
    try {
      const allResults: ArtistRecommendation[] = [];
      
      // Process only top 2 seed artists to reduce API calls
      for (const artist of seedArtists.slice(0, 2)) {
        const results = await this.searchSimilarArtistsByName(artist, userInsights);
        allResults.push(...results);
        await new Promise(resolve => setTimeout(resolve, 150)); // Delay between requests
      }
      
      return allResults;
    } catch (error) {
      console.error('Error searching similar artists:', error);
      return [];
    }
  }

  /**
   * Smart artist search using multiple query strategies
   * STRATEGY: Combines genre keywords with context words for better results
   * 
   * QUERY COMBINATIONS (for each genre):
   * 1. "${genre} artist" - Natural language search for artists in that genre
   * 2. "popular ${genre}" - Finds trending/popular artists
   * 3. "best ${genre} music" - High quality/acclaimed artists
   * 
   * ALGORITHM:
   * 1. Generate 3 search queries per genre × 5 genres = 15 queries max (capped at 10)
   * 2. Run all queries in parallel via Promise.all
   * 3. Aggregate all returned artists
   * 4. Filter for minimum quality (5000+ followers)
   * 5. Score and rank each artist
   * 6. Return top results
   */
  private async smartArtistSearch(genres: string[], userInsights?: MusicInsights): Promise<ArtistRecommendation[]> {
    try {
      // Use simpler genre-only queries (1 per genre, max 5)
      // Avoid "popular", "best" prefixes which don't work well with Spotify Search
      const searchQueries = genres.slice(0, 5).map(genre => `genre:"${genre}"`);

      // Execute searches sequentially with delay to avoid rate limiting
      const allArtists: any[] = [];
      for (const query of searchQueries) {
        const result = await this.makeSpotifyRequest('search', {
          q: query,
          type: 'artist',
          limit: 15
        });
        
        if (result.data?.artists?.items) {
          allArtists.push(...result.data.artists.items);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Quality filter: Only include POPULAR artists (100K+ followers, 50+ popularity)\n      // This ensures recommendations are well-known artists people actually listen to
      const filtered = allArtists.filter((artist: any) =>
        artist && 
        artist.id && 
        artist.name && 
        (artist.followers?.total ?? 0) >= 100000 &&
        (artist.popularity ?? 0) >= 50
      );

      // Map to recommendation objects with scoring
      return filtered.map((artist: any) => {
        // Use smart genre matching to filter relevant genres
        const matchingGenres = artist.genres?.filter((artistGenre: string) =>
          this.isGenreMatch(artistGenre, userInsights?.topGenres || [])
        ) || [];

        // Calculate relevance score
        const score = this.calculateArtistRecommendationScore(artist, matchingGenres, userInsights);

        return {
          artist,
          score,
          reasons: [
            matchingGenres.length > 0 ? `Matches your ${matchingGenres[0]} taste` : 'Popular in your genres',
            `${artist.followers?.total ? `${(artist.followers.total / 1000).toFixed(0)}K` : '0'} followers`,
            artist.genres?.length > 0 ? `${artist.genres[0]}` : 'Recommended for you'
          ],
          matchingGenres,
          similarityType: 'genre' as const
        };
      });
    } catch (error) {
      console.error('Error in smart artist search:', error);
      return [];
    }
  }

  /**
   * Ensure diversity in artist recommendations
   */
  private ensureArtistDiversity(artists: ArtistRecommendation[], _insights: MusicInsights): ArtistRecommendation[]  {
    if (artists.length <= 12) return artists;

    const diverse: ArtistRecommendation[] = [];
    const genresSeen = new Map<string, number>();
    
    // First pass: Add high-scoring artists with genre diversity
    for (const artist of artists) {
      if (diverse.length >= 12) break;
      
      // Check genre diversity
      const primaryGenre = artist.matchingGenres[0] || 'other';
      const genreCount = genresSeen.get(primaryGenre) || 0;
      
      // Allow max 3 artists per genre for diversity
      if (genreCount < 3) {
        diverse.push(artist);
        genresSeen.set(primaryGenre, genreCount + 1);
      }
    }
    
    // Second pass: Fill remaining slots with best remaining artists
    for (const artist of artists) {
      if (diverse.length >= 12) break;
      if (!diverse.includes(artist)) {
        diverse.push(artist);
      }
    }
    
    return diverse;
  }

  /**
   * Fallback artist recommendations when no results found
   */
  private async getFallbackArtistRecommendations(_insights: MusicInsights): Promise<ArtistRecommendation[]> {
    try {
      // Use popular/trending artists as fallback
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: 'year:2024',
        type: 'artist',
        limit: 20
      });

      if (error || !data?.artists?.items) {
        return [];
      }

      return data.artists.items
        .filter((artist: any) => artist && artist.id && (artist.followers?.total ?? 0) >= 10000)
        .slice(0, 12)
        .map((artist: any) => ({
          artist,
          score: 50,
          reasons: ['Popular artist', 'Trending now', 'Recommended for you'],
          matchingGenres: [],
          similarityType: 'popularity' as const
        }));
    } catch (error) {
      console.error('Error in fallback recommendations:', error);
      return [];
    }
  }

  /**
   * Search for artists by genre (OPTIMIZED: Multiple search strategies)
   * 
   * PROBLEM SOLVED: Previous implementation used restrictive quote-wrapped genre search
   * which returned very limited results. New approach uses 3 strategies in parallel:
   * 
   * STRATEGIES:
   * 1. Simple name search: "${genre}" 
   *    - Broad query, catches general matches
   * 2. Genre tag search: "genre:${genre}"
   *    - Targets genre tag without quotes (less restrictive than original)
   * 3. Natural language: "${genre} music"
   *    - Human-readable search, catches conversational matches
   * 
   * OPTIMIZATION: All 3 queries run in parallel via Promise.all
   * - Total results: 10 × 3 strategies = up to 30 artists per genre
   * - Time: Same as single query (parallelized)
   * - Coverage: 3x better without time penalty
   */
  private async searchArtistsByGenre(genre: string, userInsights?: MusicInsights): Promise<ArtistRecommendation[]> {
    try {
      // Single query per genre to reduce API calls
      const result = await this.makeSpotifyRequest('search', {
        q: `genre:"${genre}"`,
        type: 'artist',
        limit: 20
      });

      const allArtists = result.data?.artists?.items || [];

      // Quality filter: 100K+ followers ensures POPULAR, well-known artists
      // Also require minimum popularity score of 50
      const artists = allArtists.filter((artist: any) =>
        artist && 
        artist.id && 
        artist.name && 
        (artist.followers?.total ?? 0) >= 100000 &&
        (artist.popularity ?? 0) >= 50
      );

      // Map to recommendation objects with smart genre matching
      return artists.map((artist: any) => {
        // Use intelligent genre matching that prevents false positives
        const matchingGenres = artist.genres?.filter((artistGenre: string) => 
          this.isGenreMatch(artistGenre, userInsights?.topGenres || [])
        ) || [];

        const score = this.calculateArtistRecommendationScore(artist, matchingGenres, userInsights);

        return {
          artist,
          score,
          reasons: [
            `Matches your ${genre} music taste`,
            `${artist.followers?.total ? `${(artist.followers.total / 1000).toFixed(0)}K` : '0'} followers`,
            matchingGenres.length > 0 ? `Genres: ${matchingGenres.slice(0, 2).join(', ')}` : 'Popular artist'
          ],
          matchingGenres,
          similarityType: 'genre' as const
        };
      });
    } catch (error) {
      console.error(`Error searching artists by genre ${genre}:`, error);
      return [];
    }
  }

  /**
   * Search for similar artists using Spotify Search API (NOT deprecated related-artists)
   * 
   * ALGORITHM:
   * 1. Build search queries using artist name + genres
   * 2. Search for artists matching those queries
   * 3. Filter for quality (5000+ followers)
   * 4. Score and return top matches
   * 
   * Uses Search API which is fully supported (unlike deprecated related-artists endpoint)
   */
  private async searchSimilarArtistsByName(seedArtist: Artist, userInsights?: MusicInsights): Promise<ArtistRecommendation[]> {
    try {
      // Use only genre-based search (1-2 queries max) to reduce API calls
      const artistGenres = (seedArtist as any).genres || [];
      let searchQuery: string;
      
      if (artistGenres.length > 0) {
        // Search by artist's primary genre
        searchQuery = `genre:"${artistGenres[0]}"`;
      } else if (userInsights?.topGenres?.length) {
        // Fallback to user's top genre
        searchQuery = `genre:"${userInsights.topGenres[0].genre}"`;
      } else {
        return [];
      }

      // Single request per seed artist
      const result = await this.makeSpotifyRequest('search', {
        q: searchQuery,
        type: 'artist',
        limit: 20
      });

      const allArtists = result.data?.artists?.items || [];

      // Filter: exclude seed artist, require POPULAR artists (100K+ followers, 50+ popularity)
      const filteredArtists = allArtists.filter((artist: any) =>
        artist &&
        artist.id &&
        artist.id !== seedArtist.id &&
        artist.name !== seedArtist.name &&
        (artist.followers?.total ?? 0) >= 100000 &&
        (artist.popularity ?? 0) >= 50
      );

      // Deduplicate by ID
      const uniqueArtists = Array.from(
        new Map(filteredArtists.map((a: any) => [a.id, a])).values()
      ).slice(0, 20);

      return uniqueArtists.map((artist: any) => {
        const matchingGenres = artist.genres?.filter((artistGenre: string) =>
          this.isGenreMatch(artistGenre, userInsights?.topGenres || [])
        ) || [];

        const score = this.calculateArtistRecommendationScore(artist, matchingGenres, userInsights);

        return {
          artist,
          score,
          reasons: [
            `Similar to ${seedArtist.name}`,
            `${artist.followers?.total ? `${(artist.followers.total / 1000).toFixed(0)}K` : '0'} followers`,
            matchingGenres.length > 0 ? `Matches: ${matchingGenres.slice(0, 2).join(', ')}` : 'Recommended for you'
          ],
          matchingGenres,
          similarityType: 'similar_artists' as const
        };
      });
    } catch (error) {
      console.error(`Error searching similar artists for ${seedArtist.name}:`, error);
      return [];
    }
  }

  /**
   * Calculate artist recommendation score - HEAVILY WEIGHTED BY POPULARITY
   */
  private calculateArtistRecommendationScore(artist: any, matchingGenres: string[], userInsights?: MusicInsights): number {
    let score = 30; // Base score

    // Genre match bonus (up to 20 points)
    if (matchingGenres.length > 0) {
      score += Math.min(matchingGenres.length * 10, 20);
    }

    // POPULARITY SCORE - Most important factor (up to 30 points)
    // Spotify popularity is 0-100, we use it directly
    const popularity = artist.popularity ?? 0;
    score += Math.round(popularity * 0.3); // 0-30 points based on popularity

    // Follower bonus (up to 20 points) - rewards well-known artists
    const followers = artist.followers?.total ?? 0;
    if (followers > 10000000) score += 20;      // 10M+ (superstar)
    else if (followers > 5000000) score += 18;  // 5M+
    else if (followers > 1000000) score += 15;  // 1M+
    else if (followers > 500000) score += 12;   // 500K+
    else if (followers > 100000) score += 8;    // 100K+

    // Popularity bias adjustment based on user preference
    if (userInsights) {
      if (userInsights.popularityBias === 'mainstream' && popularity > 70) {
        score += 10;
      } else if (userInsights.popularityBias === 'underground' && popularity < 50) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check if a genre should be filtered based on language restrictions
   * For certain genres like hip hop, only allow major languages (English, Spanish, Japanese, Korean, Chinese)
   * to avoid recommending small-audience language artists (e.g., Tamil hip hop)
   */
  private shouldFilterByLanguage(artistGenreLower: string, userTopGenres: { genre: string; percentage: number; count: number }[]): boolean {
    // Define genres that should have language restrictions
    const restrictedGenres = ['hip hop', 'rap', 'trap', 'drill', 'hiphop'];
    
    // Check if any user genre matches restricted genres
    const userHasRestrictedGenre = userTopGenres.some(ug => {
      const userGenreLower = ug.genre.toLowerCase();
      return restrictedGenres.some(rg => 
        userGenreLower.includes(rg) || rg.includes(userGenreLower)
      );
    });
    
    console.log(`[Language Filter] User has restricted genre: ${userHasRestrictedGenre}, User genres: [${userTopGenres.map(g => g.genre).join(', ')}]`);
    
    // Only apply filter if user likes restricted genres AND artist genre contains restricted genre
    if (!userHasRestrictedGenre) return false;
    
    const artistHasRestrictedGenre = restrictedGenres.some(rg => 
      artistGenreLower.includes(rg)
    );
    
    console.log(`[Language Filter] Artist genre "${artistGenreLower}" has restricted genre: ${artistHasRestrictedGenre}`);
    
    if (!artistHasRestrictedGenre) return false;
    
    // Small-audience languages to BLOCK from hip hop/rap recommendations
    const blockedLanguages = [
      'tamil', 'telugu', 'malayalam', 'kannada',     // Indian languages
      'bengali', 'punjabi', 'marathi', 'gujarati',
      'indonesian', 'malay', 'tagalog', 'filipino',  // Southeast Asian
      'thai', 'vietnamese', 'burmese',
      'arabic', 'farsi', 'persian', 'urdu',          // Middle Eastern
      'turkish', 'hebrew',
      'swahili', 'amharic', 'yoruba',                // African
      'polish', 'czech', 'romanian', 'hungarian'     // Eastern European (smaller hip hop scenes)
    ];
    
    // NOTE: Allowed languages (English, Spanish, Japanese, Korean, Chinese, French, German)
    // are implicitly allowed - we only block specific small-audience languages
    
    // Check if artist genre contains any blocked language
    const hasBlockedLanguage = blockedLanguages.some(lang => 
      artistGenreLower.includes(lang)
    );
    
    console.log(`[Language Filter] Artist genre "${artistGenreLower}" has blocked language: ${hasBlockedLanguage}`);
    
    if (hasBlockedLanguage) {
      console.warn(`🚫 BLOCKING artist with genre: "${artistGenreLower}" (contains blocked language)`);
      return true; // Filter out this artist
    }
    
    // If genre mentions a restricted type (hip hop/rap) but has no language marker,
    // assume it's English (mainstream) and allow it
    // Only block if explicitly marked with a blocked language
    return false;
  }

  /**
   * STRICT genre matching - only exact or near-exact matches
   * 
   * STRICT RULES:
   * 1. Exact match only: "k-pop" === "k-pop"
   * 2. Allow minor variations: "kpop" ≈ "k-pop" (hyphen difference)
   * 
   * DOES NOT MATCH:
   * ✗ "k-pop boy group" - sub-genre, too specific
   * ✗ "korean pop" - different name
   * ✗ "pop" - too generic
   */
  private isGenreMatch(artistGenre: string, userTopGenres: { genre: string; percentage: number; count: number }[]): boolean {
    const artistGenreLower = artistGenre.toLowerCase().trim();
    
    // LANGUAGE FILTER: For certain genres, only allow major languages
    if (this.shouldFilterByLanguage(artistGenreLower, userTopGenres)) {
      return false;
    }
    
    for (const userGenre of userTopGenres) {
      const userGenreLower = userGenre.genre.toLowerCase().trim();
      
      // STRICT: Exact match only
      if (artistGenreLower === userGenreLower) {
        return true;
      }
      
      // STRICT: Allow hyphen/space variations (e.g., "k-pop" ≈ "kpop" ≈ "k pop")
      const normalizedArtist = artistGenreLower.replace(/[-\s]/g, '');
      const normalizedUser = userGenreLower.replace(/[-\s]/g, '');
      
      if (normalizedArtist === normalizedUser) {
        return true;
      }
    }
    
    // No match - reject all sub-genres and variations
    return false;
  }

  /**
   * Deduplicate artist recommendations
   */
  private deduplicateArtistRecommendations(recommendations: ArtistRecommendation[]): ArtistRecommendation[] {
    const seen = new Map<string, ArtistRecommendation>();
    
    recommendations.forEach(rec => {
      const existing = seen.get(rec.artist.id);
      if (!existing || rec.score > existing.score) {
        seen.set(rec.artist.id, rec);
      }
    });
    
    return Array.from(seen.values());
  }

  /**
   * Fetch full playlist details including follower count
   * The Search API doesn't return follower counts, so we need to fetch each playlist individually
   */
  private async enrichPlaylistsWithFollowers(playlists: Playlist[]): Promise<Playlist[]> {
    if (playlists.length === 0) return playlists;

    // Fetch playlist details in parallel (max 10 to avoid rate limits)
    const toFetch = playlists.slice(0, 10);
    const enriched = await Promise.all(
      toFetch.map(async (playlist) => {
        try {
          const { data, error } = await this.makeSpotifyRequest(`playlists/${playlist.id}`, {
            fields: 'id,name,description,followers,images,owner,tracks(total),uri,external_urls'
          });
          
          if (error || !data) return playlist;
          
          return {
            ...playlist,
            followers: data.followers ?? playlist.followers,
            description: data.description ?? playlist.description
          };
        } catch {
          return playlist;
        }
      })
    );

    return enriched;
  }

  /**
   * SIMPLIFIED PLAYLIST SEARCH - Score-based ranking without complex rules
   * 
   * Algorithm: Simple weighted scoring
   * - 40% Text relevance (how well playlist matches search term)
   * - 35% Quality signal (log-scaled follower count)
   * - 25% Content depth (track count in optimal range)
   */
  private async searchPlaylistsByGenre(genre: string, _userInsights?: MusicInsights): Promise<PlaylistRecommendation[]> {
    try {
      // Simple search queries - let Spotify's algorithm do the heavy lifting
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${genre} playlist`,
        type: 'playlist',
        limit: 50
      });
      
      if (error || !data?.playlists?.items) {
        console.log(`No playlists found for genre: ${genre}`);
        return [];
      }

      // Pre-filter candidates and normalize
      const candidates = data.playlists.items
        .filter((p: any) => p && p.id && p.name)
        .map((p: any) => this.normalizePlaylistData(p))
        .slice(0, 20); // Top 20 candidates for enrichment

      // Fetch actual follower counts (Search API doesn't return them)
      const enrichedPlaylists = await this.enrichPlaylistsWithFollowers(candidates);

      // Score with real follower data
      const scored = enrichedPlaylists
        .map((playlist) => {
          const score = this.calculatePlaylistScore(playlist, genre);
          return {
            playlist,
            score,
            reasons: this.generateReasons(playlist, genre, score),
            matchingGenres: [genre],
            similarityType: 'genre' as const
          };
        })
        .filter((rec: PlaylistRecommendation) => rec.score >= 30 && (rec.playlist.followers?.total ?? 0) >= 100)
        .sort((a: PlaylistRecommendation, b: PlaylistRecommendation) => b.score - a.score);

      console.log(`Found ${scored.length} playlists for "${genre}"`);
      return scored.slice(0, 10);
      
    } catch (err) {
      console.error(`Error searching for genre ${genre}:`, err);
      return [];
    }
  }

  /**
   * SIMPLIFIED ARTIST-BASED SEARCH
   */
  private async searchPlaylistsByArtist(artistName: string, _userInsights?: MusicInsights): Promise<PlaylistRecommendation[]> {
    try {
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${artistName}`,
        type: 'playlist',
        limit: 20
      });
      
      if (error || !data?.playlists?.items) return [];

      // Pre-filter and normalize
      const candidates = data.playlists.items
        .filter((p: any) => p && p.id && p.name)
        .map((p: any) => this.normalizePlaylistData(p))
        .slice(0, 10);

      // Fetch actual follower counts
      const enrichedPlaylists = await this.enrichPlaylistsWithFollowers(candidates);

      return enrichedPlaylists
        .map((playlist) => {
          const score = this.calculatePlaylistScore(playlist, artistName);
          return {
            playlist,
            score,
            reasons: [`Features ${artistName}`, ...this.generateReasons(playlist, artistName, score).slice(1)],
            matchingGenres: [],
            similarityType: 'artist' as const
          };
        })
        .filter((rec: PlaylistRecommendation) => rec.score >= 30 && (rec.playlist.followers?.total ?? 0) >= 100)
        .sort((a: PlaylistRecommendation, b: PlaylistRecommendation) => b.score - a.score)
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  /**
   * UNIFIED PLAYLIST SCORING - Simple weighted formula
   * No complex rules, just math
   */
  private calculatePlaylistScore(playlist: Playlist, searchTerm: string): number {
    const text = `${playlist.name} ${playlist.description || ''}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    // 1. Text relevance (0-100) - 40% weight
    let textScore = 0;
    if (playlist.name.toLowerCase().includes(term)) textScore = 100;
    else if (text.includes(term)) textScore = 70;
    else {
      // Partial word matching
      const words = term.split(/[\s-]+/);
      const matches = words.filter(w => w.length > 2 && text.includes(w)).length;
      textScore = (matches / words.length) * 50;
    }
    
    // 2. Quality signal (0-100) - 35% weight
    // Logarithmic scaling: log10(followers + 1) / log10(10M) * 100
    const followers = playlist.followers?.total ?? 0;
    const qualityScore = followers > 0 
      ? Math.min(100, (Math.log10(followers + 1) / 7) * 100)
      : 0;
    
    // 3. Content depth (0-100) - 25% weight
    // Optimal range: 20-100 tracks
    const tracks = playlist.tracks?.total ?? 0;
    let contentScore = 0;
    if (tracks >= 20 && tracks <= 100) contentScore = 100;
    else if (tracks >= 10 && tracks <= 150) contentScore = 70;
    else if (tracks >= 5) contentScore = 40;
    
    // Weighted sum
    const finalScore = (textScore * 0.40) + (qualityScore * 0.35) + (contentScore * 0.25);
    
    return Math.round(finalScore);
  }

  /**
   * Generate human-readable reasons based on score components
   */
  private generateReasons(playlist: Playlist, term: string, score: number): string[] {
    const reasons: string[] = [];
    const followers = playlist.followers?.total ?? 0;
    const tracks = playlist.tracks?.total ?? 0;
    
    // Primary reason
    if (playlist.name.toLowerCase().includes(term.toLowerCase())) {
      reasons.push(`Matches "${term}"`);
    } else {
      reasons.push(`Related to ${term}`);
    }
    
    // Quality indicator
    if (followers >= 1000000) reasons.push(`${(followers/1000000).toFixed(1)}M followers`);
    else if (followers >= 1000) reasons.push(`${(followers/1000).toFixed(0)}K followers`);
    else if (followers > 0) reasons.push(`${followers} followers`);
    
    // Score indicator
    if (score >= 70) reasons.push('Highly recommended');
    else if (score >= 50) reasons.push('Good match');
    
    // Track count
    if (tracks > 0) reasons.push(`${tracks} tracks`);
    
    return reasons.slice(0, 3);
  }

  /**
   * SIMPLIFIED SERENDIPITY - Discover new genres
   */
  private async getSerendipityRecommendations(
    insights: MusicInsights, 
    existingRecommendations: PlaylistRecommendation[]
  ): Promise<PlaylistRecommendation[]> {
    const explorationGenres = ['jazz', 'classical', 'world', 'folk', 'reggae', 'blues', 'ambient', 'electronic'];
    const userGenres = new Set(insights.topGenres.map(g => g.genre.toLowerCase()));
    const existingGenres = new Set(existingRecommendations.flatMap(r => r.matchingGenres.map(g => g.toLowerCase())));
    
    // Find unexplored genres
    const newGenres = explorationGenres.filter(g => !userGenres.has(g) && !existingGenres.has(g));
    if (newGenres.length === 0) return [];
    
    try {
      const genre = newGenres[0];
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${genre} playlist`,
        type: 'playlist',
        limit: 15
      });
      
      if (error || !data?.playlists?.items) return [];

      // Pre-filter and normalize
      const candidates = data.playlists.items
        .filter((p: any) => p && p.id && p.name)
        .map((p: any) => this.normalizePlaylistData(p))
        .slice(0, 8);

      // Fetch actual follower counts
      const enrichedPlaylists = await this.enrichPlaylistsWithFollowers(candidates);

      return enrichedPlaylists
        .map((playlist) => {
          const score = this.calculatePlaylistScore(playlist, genre) * 0.8; // Slight discount for discovery
          return {
            playlist,
            score,
            reasons: [`Discover ${genre} music`, ...this.generateReasons(playlist, genre, score).slice(1)],
            matchingGenres: [genre],
            similarityType: 'user_pattern' as const
          };
        })
        .filter((rec: PlaylistRecommendation) => rec.score >= 25 && (rec.playlist.followers?.total ?? 0) >= 100)
        .sort((a: PlaylistRecommendation, b: PlaylistRecommendation) => b.score - a.score)
        .slice(0, 3);
    } catch {
      return [];
    }
  }

  /**
   * SIMPLIFIED ML Ranking - Just apply diversity penalty
   */
  private rankRecommendationsWithML(
    recommendations: PlaylistRecommendation[], 
    _insights: MusicInsights
  ): PlaylistRecommendation[] {
    // Count recommendations per genre for diversity
    const genreCounts = new Map<string, number>();
    
    return recommendations
      .map(rec => {
        let adjustedScore = rec.score;
        
        // Apply diversity penalty if too many from same genre
        for (const genre of rec.matchingGenres) {
          const count = genreCounts.get(genre) || 0;
          if (count >= 3) {
            adjustedScore *= 0.9; // 10% penalty for over-representation
          }
          genreCounts.set(genre, count + 1);
        }
        
        return { ...rec, score: Math.round(adjustedScore) };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Remove duplicate recommendations
   */
  private deduplicateRecommendations(recommendations: PlaylistRecommendation[]): PlaylistRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.playlist.id)) return false;
      seen.add(rec.playlist.id);
      return true;
    });
  }

  /**
   * Normalize playlist data structure
   */
  private normalizePlaylistData(playlist: any): Playlist {
    if (!playlist || typeof playlist !== 'object') {
      playlist = {};
    }

    return {
      collaborative: playlist.collaborative ?? false,
      description: playlist.description ?? null,
      external_urls: playlist.external_urls ?? {},
      followers: playlist.followers ?? { href: null, total: 0 },
      href: playlist.href ?? '',
      id: playlist.id ?? '',
      images: Array.isArray(playlist.images) ? playlist.images : [],
      name: playlist.name ?? 'Unknown Playlist',
      owner: playlist.owner ?? {
        external_urls: {},
        href: '',
        id: '',
        type: 'user' as const,
        uri: '',
        display_name: 'Unknown User'
      },
      public: playlist.public ?? true,
      snapshot_id: playlist.snapshot_id ?? '',
      tracks: playlist.tracks ?? {
        href: '',
        limit: 0,
        next: null,
        offset: 0,
        previous: null,
        total: 0,
        items: []
      },
      type: 'playlist' as const,
      uri: playlist.uri ?? ''
    };
  }
}