/**
 * Music Intelligence Service
 * Provides smart playlist recommendations and music analysis
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
  lastUpdated: string;
}

export class MusicIntelligenceService {
  private token: string;

  constructor(token: string) {
    this.token = token;
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
   */
  async generateMusicProfile(_user: User): Promise<UserMusicProfile> {
    try {
      // Gather user data in parallel
      const [topTracks, recentlyPlayed, savedTracks, _userPlaylists, followedArtists] = await Promise.all([
        this.getUserTopTracks(),
        this.getRecentlyPlayed(),
        this.getSavedTracks(),
        this.getUserPlaylists(),
        this.getFollowedArtists()
      ]);

      // Generate insights from user data
      const insights = this.analyzeUserMusic(topTracks, recentlyPlayed, savedTracks);
      
      // Generate playlist recommendations
      const recommendations = await this.generatePlaylistRecommendations(
        insights,
        topTracks,
        savedTracks,
        followedArtists
      );

      return {
        insights,
        recommendations,
        lastUpdated: new Date().toISOString()
      };
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
   * Get user's saved tracks
   */
  private async getSavedTracks(): Promise<Track[]> {
    const { data, error } = await this.makeSpotifyRequest('me/tracks', { limit: 50 });
    
    if (error) return [];
    return data?.items?.map((item: any) => item.track) || [];
  }

  /**
   * Get user's playlists
   */
  private async getUserPlaylists(): Promise<Playlist[]> {
    const { data, error } = await this.makeSpotifyRequest('me/playlists', { limit: 50 });
    
    if (error) return [];
    return data?.items || [];
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
   * Analyze user's music to generate insights
   */
  private analyzeUserMusic(topTracks: Track[], recentlyPlayed: Track[], savedTracks: Track[]): MusicInsights {
    const allTracks = [...topTracks, ...recentlyPlayed, ...savedTracks];
    
    // Extract genres from artists
    const genreCounts = this.extractGenres(allTracks);
    const totalTracks = allTracks.length;
    
    // Calculate top genres with percentages
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalTracks) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

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
   * Extract genres from tracks (using artist data and track names for genre hints)
   */
  private extractGenres(tracks: Track[]): Record<string, number> {
    const genreCounts: Record<string, number> = {};
    
    tracks.forEach(track => {
      // Extract genre hints from artist names and track names
      const artistGenres = this.inferGenresFromArtistNames(track.artists);
      const trackGenres = this.inferGenresFromTrackName(track.name);
      
      [...artistGenres, ...trackGenres].forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    return genreCounts;
  }

  /**
   * Infer genres from artist names (basic heuristics)
   */
  private inferGenresFromArtistNames(artists: Artist[]): string[] {
    const genres: string[] = [];
    
    artists.forEach(artist => {
      const name = artist.name.toLowerCase();
      
      // Simple genre inference based on artist name patterns
      if (name.includes('dj ') || name.includes(' dj')) genres.push('electronic');
      if (name.includes('mc ') || name.includes(' mc')) genres.push('hip-hop');
      if (name.includes('band') || name.includes('group')) genres.push('rock');
      if (name.includes('orchestra') || name.includes('symphony')) genres.push('classical');
      if (name.includes('choir') || name.includes('gospel')) genres.push('gospel');
    });

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
    
    return genres;
  }

  /**
   * Generate playlist recommendations based on user profile
   */
  private async generatePlaylistRecommendations(
    insights: MusicInsights,
    _topTracks: Track[],
    _savedTracks: Track[],
    followedArtists: Artist[]
  ): Promise<PlaylistRecommendation[]> {
    const recommendations: PlaylistRecommendation[] = [];
    
    // Get recommendations based on top genres
    for (const genreData of insights.topGenres.slice(0, 3)) {
      const genreRecs = await this.searchPlaylistsByGenre(genreData.genre);
      recommendations.push(...genreRecs);
    }

    // Get recommendations based on followed artists
    for (const artist of followedArtists.slice(0, 5)) {
      const artistRecs = await this.searchPlaylistsByArtist(artist.name);
      recommendations.push(...artistRecs);
    }

    // Get mood-based recommendations
    const moodRecs = await this.getMoodBasedRecommendations(insights);
    recommendations.push(...moodRecs);

    // Remove duplicates and sort by score
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    return uniqueRecs.sort((a, b) => b.score - a.score).slice(0, 15);
  }

  /**
   * Search for playlists by genre
   */
  private async searchPlaylistsByGenre(genre: string): Promise<PlaylistRecommendation[]> {
    try {
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${genre} genre:${genre}`,
        type: 'playlist',
        limit: 10
      });
      
      if (error || !data?.playlists?.items) return [];

      return data.playlists.items.map((playlist: Playlist) => ({
        playlist,
        score: this.calculateGenreScore(playlist, genre),
        reasons: [`Matches your interest in ${genre} music`],
        matchingGenres: [genre],
        similarityType: 'genre' as const
      }));
    } catch {
      return [];
    }
  }

  /**
   * Search for playlists by artist
   */
  private async searchPlaylistsByArtist(artistName: string): Promise<PlaylistRecommendation[]> {
    try {
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${artistName}`,
        type: 'playlist',
        limit: 8
      });
      
      if (error || !data?.playlists?.items) return [];

      return data.playlists.items.map((playlist: Playlist) => ({
        playlist,
        score: this.calculateArtistScore(playlist, artistName),
        reasons: [`Features music similar to ${artistName}`],
        matchingGenres: [],
        similarityType: 'artist' as const
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get mood-based recommendations
   */
  private async getMoodBasedRecommendations(insights: MusicInsights): Promise<PlaylistRecommendation[]> {
    const recommendations: PlaylistRecommendation[] = [];
    
    // Determine mood keywords based on user preferences
    const moodKeywords = this.getMoodKeywords(insights);
    
    for (const mood of moodKeywords) {
      try {
        const { data, error } = await this.makeSpotifyRequest('search', {
          q: `${mood} mood`,
          type: 'playlist',
          limit: 5
        });
        
        if (error || !data?.playlists?.items) continue;

        const moodRecs = data.playlists.items.map((playlist: Playlist) => ({
          playlist,
          score: this.calculateMoodScore(playlist, mood),
          reasons: [`Perfect for your ${mood} listening mood`],
          matchingGenres: [],
          similarityType: 'user_pattern' as const
        }));
        
        recommendations.push(...moodRecs);
      } catch {
        continue;
      }
    }

    return recommendations;
  }

  /**
   * Get mood keywords based on user insights
   */
  private getMoodKeywords(insights: MusicInsights): string[] {
    const moods: string[] = [];
    
    // Base moods on user preferences
    if (insights.popularityBias === 'mainstream') {
      moods.push('popular', 'hits', 'trending');
    } else if (insights.popularityBias === 'underground') {
      moods.push('indie', 'alternative', 'underground');
    }
    
    if (insights.discoveryRate > 70) {
      moods.push('discovery', 'new music', 'fresh');
    }
    
    if (insights.artistDiversity > 80) {
      moods.push('eclectic', 'diverse', 'variety');
    }
    
    // Default moods
    moods.push('chill', 'focus', 'workout', 'study');
    
    return moods.slice(0, 4);
  }

  /**
   * Calculate scoring for genre-based recommendations
   */
  private calculateGenreScore(playlist: Playlist, genre: string): number {
    let score = 50; // Base score
    
    // Boost score based on playlist followers
    if (playlist.followers.total > 10000) score += 20;
    else if (playlist.followers.total > 1000) score += 10;
    
    // Boost if genre appears in playlist name or description
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    if (text.includes(genre.toLowerCase())) score += 25;
    
    // Boost based on track count (sweet spot around 30-100 tracks)
    const trackCount = playlist.tracks.total;
    if (trackCount >= 20 && trackCount <= 100) score += 15;
    else if (trackCount > 100) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate scoring for artist-based recommendations
   */
  private calculateArtistScore(playlist: Playlist, artistName: string): number {
    let score = 40; // Base score
    
    // Boost if artist name appears in playlist title or description
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    if (text.includes(artistName.toLowerCase())) score += 30;
    
    // Boost based on followers
    if (playlist.followers.total > 5000) score += 15;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate scoring for mood-based recommendations
   */
  private calculateMoodScore(playlist: Playlist, mood: string): number {
    let score = 35; // Base score
    
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    if (text.includes(mood.toLowerCase())) score += 20;
    
    // Boost curated playlists (those with good descriptions)
    if (playlist.description && playlist.description.length > 50) score += 10;
    
    return Math.min(score, 100);
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
}