/**
 * Music Intelligence Service
 * Provides smart playlist recommendations and music analysis
 * 
 * FOLLOWER COUNT CONSIDERATION:
 * The algorithm heavily considers follower counts as a quality indicator:
 * - Genre playlists: Up to 40 points from follower quality score + bonuses
 * - Artist playlists: Up to 35 points from follower quality score + bonuses  
 * - Mood playlists: Up to 30 points from follower quality score + bonuses
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
   * Extract genres from tracks using advanced classification
   */
  private extractGenres(tracks: Track[]): Record<string, number> {
    const genreCounts: Record<string, number> = {};
    
    tracks.forEach(track => {
      // Enhanced genre detection combining multiple methods
      const artistGenres = this.inferGenresFromArtistNames(track.artists);
      const trackGenres = this.inferGenresFromTrackName(track.name);
      const audioGenres = this.inferGenresFromAudioFeatures(track);
      const contextualGenres = this.inferGenresFromContext(track);
      
      // Combine all genre sources with weights
      const allGenres = [
        ...artistGenres.map(g => ({ genre: g, weight: 0.4 })),
        ...trackGenres.map(g => ({ genre: g, weight: 0.2 })),
        ...audioGenres.map(g => ({ genre: g, weight: 0.3 })),
        ...contextualGenres.map(g => ({ genre: g, weight: 0.1 }))
      ];
      
      // Aggregate weighted genre scores
      allGenres.forEach(({ genre, weight }) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + weight;
      });
    });

    // Manual preference: Boost K-pop to be the top genre
    if (genreCounts['k-pop']) {
      genreCounts['k-pop'] *= 3; // Triple the K-pop score to make it dominant
    } else {
      // If no K-pop detected but user prefers it, add it as top genre
      genreCounts['k-pop'] = Math.max(...Object.values(genreCounts)) * 1.5 || 10;
    }

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
   * Infer genres from audio features using ML-inspired classification
   */
  private inferGenresFromAudioFeatures(track: Track): string[] {
    const genres: string[] = [];
    
    // Mock audio features analysis (in real implementation, you'd use actual features from Spotify API)
    // For now, we'll use track characteristics to estimate features
    const trackName = track.name.toLowerCase();
    const features = {
      energy: trackName.includes('energy') || trackName.includes('power') ? 0.8 : Math.random(),
      danceability: trackName.includes('dance') || trackName.includes('party') ? 0.8 : Math.random(),
      acousticness: trackName.includes('acoustic') || trackName.includes('unplugged') ? 0.9 : Math.random(),
      valence: trackName.includes('happy') || trackName.includes('joy') ? 0.8 : Math.random(),
      tempo: track.duration_ms > 240000 ? 90 : 120 + Math.random() * 60, // Longer tracks tend to be slower
      instrumentalness: trackName.includes('instrumental') ? 0.9 : Math.random(),
      speechiness: trackName.includes('rap') || trackName.includes('spoken') ? 0.8 : Math.random()
    };
    
    // Electronic/EDM classification
    if (features.energy > 0.7 && features.danceability > 0.6 && features.acousticness < 0.3) {
      genres.push('electronic');
    }
    
    // Classical classification
    if (features.acousticness > 0.8 && features.instrumentalness > 0.7 && features.speechiness < 0.1) {
      genres.push('classical');
    }
    
    // Hip-hop classification
    if (features.speechiness > 0.4 && features.danceability > 0.5) {
      genres.push('hip-hop');
    }
    
    // Jazz classification
    if (features.acousticness > 0.5 && features.instrumentalness > 0.3 && features.tempo > 80 && features.tempo < 140) {
      genres.push('jazz');
    }
    
    // Pop classification
    if (features.danceability > 0.5 && features.valence > 0.5 && features.energy > 0.4 && features.energy < 0.8) {
      genres.push('pop');
    }
    
    // Rock classification
    if (features.energy > 0.6 && features.acousticness < 0.5 && features.valence > 0.3) {
      genres.push('rock');
    }
    
    // Ambient/Chill classification
    if (features.energy < 0.4 && features.valence < 0.6 && features.acousticness > 0.4) {
      genres.push('ambient');
    }
    
    return genres;
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
   */
  private async generatePlaylistRecommendations(
    insights: MusicInsights,
    _topTracks: Track[],
    _savedTracks: Track[],
    followedArtists: Artist[]
  ): Promise<PlaylistRecommendation[]> {
    const recommendations: PlaylistRecommendation[] = [];
    
    // If no genres found, add some popular/default genres to search
    let genresToSearch = insights.topGenres.slice(0, 4);
    if (genresToSearch.length === 0) {
      console.log('No user genres found, using default genres for recommendations');
      genresToSearch = [
        { genre: 'pop', count: 1, percentage: 25 },
        { genre: 'rock', count: 1, percentage: 25 },
        { genre: 'hip-hop', count: 1, percentage: 25 },
        { genre: 'electronic', count: 1, percentage: 25 }
      ];
    }
    
    // Enhanced genre-based recommendations with user context
    for (const genreData of genresToSearch) {
      const genreRecs = await this.searchPlaylistsByGenre(genreData.genre, insights);
      recommendations.push(...genreRecs);
    }

    // Artist-based recommendations with improved scoring
    const artistsToSearch = followedArtists.length > 0 
      ? followedArtists.slice(0, 6)
      : [
          { name: 'Taylor Swift', id: 'example1' },
          { name: 'The Weeknd', id: 'example2' },
          { name: 'Dua Lipa', id: 'example3' }
        ];
    
    for (const artist of artistsToSearch) {
      const artistRecs = await this.searchPlaylistsByArtist(artist.name, insights);
      recommendations.push(...artistRecs);
    }

    // Enhanced mood-based recommendations
    const moodRecs = await this.getMoodBasedRecommendations(insights);
    recommendations.push(...moodRecs);

    // Add diversity and serendipity recommendations
    const diversityRecs = await this.getSerendipityRecommendations(insights, recommendations);
    recommendations.push(...diversityRecs);

    // Advanced deduplication and ranking
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    const rankedRecs = this.rankRecommendationsWithML(uniqueRecs, insights);
    
    // Final sorting with follower count as a tiebreaker for similar scores
    const finalRecs = rankedRecs.sort((a, b) => {
      // Primary sort by score
      if (Math.abs(a.score - b.score) > 5) {
        return b.score - a.score;
      }
      // Secondary sort by follower count for similar scores
      const aFollowers = a.playlist.followers?.total ?? 0;
      const bFollowers = b.playlist.followers?.total ?? 0;
      return bFollowers - aFollowers;
    });
    
    console.log(`Generated ${finalRecs.length} final recommendations (sorted by score + follower count)`);
    return finalRecs.slice(0, 20); // Return top 20 recommendations
  }

  /**
   * Enhanced search for playlists by genre with user context
   */
  private async searchPlaylistsByGenre(genre: string, userInsights?: MusicInsights): Promise<PlaylistRecommendation[]> {
    try {
      // Focus on search queries that return popular/mainstream playlists
      const searchQueries = [
        `"${genre}" hits charts`,        // Chart hits
        `popular ${genre} playlist`,     // Popular playlists
        `"${genre}" top 100`,           // Top playlists
        `best ${genre} 2024`,           // Best/recent playlists
        `"${genre}" greatest hits`,     // Greatest hits collections
        `"${genre}" mainstream hits`,    // Mainstream hits
        `"${genre}" radio hits`          // Radio hits
      ];
      
      for (const query of searchQueries) {
        const { data, error } = await this.makeSpotifyRequest('search', {
          q: query,
          type: 'playlist',
          limit: 50 // Increased limit to find more popular playlists
        });
        
        if (error) {
          console.error(`Error searching with query "${query}":`, error);
          continue;
        }
        
        if (data?.playlists?.items && data.playlists.items.length > 0) {
          console.log(`Found ${data.playlists.items.length} playlists for query: ${query}`);
          
          // Debug: Log the first playlist to see the actual structure
          if (data.playlists.items[0]) {
            console.log('Sample playlist structure:', {
              name: data.playlists.items[0].name,
              followers: data.playlists.items[0].followers,
              tracks: data.playlists.items[0].tracks,
              owner: data.playlists.items[0].owner
            });
          }

          const allPlaylists = data.playlists.items
            .filter((playlist: any) => {
              // More robust filtering
              if (!playlist || typeof playlist !== 'object') return false;
              if (!playlist.id || !playlist.name) return false;
              return true;
            });
            
          // Only show playlists with significant follower counts (popular playlists)
          const popularPlaylists = allPlaylists.filter((p: any) => {
            const followerCount = p.followers?.total ?? 0;
            
            // If we have actual follower data, use it
            if (followerCount > 0) {
              return followerCount >= 1000; // Only playlists with 1000+ followers
            }
            
            // If no follower data, estimate and only include if estimated 5000+
            const normalizedPlaylist = this.normalizePlaylistData(p);
            const estimatedFollowers = this.estimateFollowerCount(normalizedPlaylist);
            return estimatedFollowers >= 5000; // Higher threshold for estimated followers
          });
          
          // Sort by follower count (descending) to get most popular first
          popularPlaylists.sort((a: any, b: any) => {
            const aFollowers = a.followers?.total ?? 0;
            const bFollowers = b.followers?.total ?? 0;
            
            // If both have actual follower data, sort by that
            if (aFollowers > 0 && bFollowers > 0) {
              return bFollowers - aFollowers;
            }
            
            // If one has data and other doesn't, prioritize the one with data
            if (aFollowers > 0 && bFollowers === 0) return -1;
            if (bFollowers > 0 && aFollowers === 0) return 1;
            
            // If neither has data, sort by estimated followers
            const aNormalized = this.normalizePlaylistData(a);
            const bNormalized = this.normalizePlaylistData(b);
            const aEstimated = this.estimateFollowerCount(aNormalized);
            const bEstimated = this.estimateFollowerCount(bNormalized);
            return bEstimated - aEstimated;
          });
          
          console.log(`Found ${popularPlaylists.length} popular playlists (${allPlaylists.length} total) for query: ${query}`);

          const recommendationPromises = popularPlaylists
            .slice(0, 8) // Limit to top 8 to avoid too many API calls
            .map(async (playlist: any) => {
              let normalizedPlaylist = this.normalizePlaylistData(playlist);
              
              // If follower count is missing or zero, estimate it
              if ((normalizedPlaylist.followers?.total ?? 0) === 0) {
                const estimatedFollowers = this.estimateFollowerCount(normalizedPlaylist);
                if (estimatedFollowers > 0) {
                  normalizedPlaylist.followers = { href: null, total: estimatedFollowers };
                  console.log(`Estimated ${estimatedFollowers} followers for ${playlist.name}`);
                }
              }
              
              let score = 0;
              try {
                score = this.calculateGenreScore(normalizedPlaylist, genre, userInsights);
              } catch (error) {
                console.error('Error calculating genre score for playlist:', normalizedPlaylist.name, error);
                score = 40; // Default score if calculation fails
              }
              return {
                playlist: normalizedPlaylist,
                score,
                reasons: [`Matches your ${genre} music taste`],
                matchingGenres: [genre],
                similarityType: 'genre' as const
              };
            });
            
          const recommendations = (await Promise.all(recommendationPromises))
            .filter((rec: PlaylistRecommendation) => rec.score > 0); // Filter out any recommendations with invalid scores
          
          if (recommendations.length > 0) {
            return recommendations;
          }
        }
      }
      
      return [];
      
    } catch (err) {
      console.error(`Exception searching for genre ${genre}:`, err);
      return [];
    }
  }

  /**
   * Enhanced search for playlists by artist with user context
   */
  private async searchPlaylistsByArtist(artistName: string, userInsights?: MusicInsights): Promise<PlaylistRecommendation[]> {
    try {
      const { data, error } = await this.makeSpotifyRequest('search', {
        q: `${artistName}`,
        type: 'playlist',
        limit: 10
      });
      
      if (error || !data?.playlists?.items) return [];

      return data.playlists.items
        .filter((playlist: any) => playlist && playlist.id && playlist.name)
        .map((playlist: any) => ({
          playlist: this.normalizePlaylistData(playlist),
          score: this.calculateArtistScore(playlist, artistName, userInsights),
          reasons: [`Similar to ${artistName}`],
          matchingGenres: [],
          similarityType: 'artist' as const
        }));
    } catch {
      return [];
    }
  }

  /**
   * Get serendipity recommendations to introduce musical diversity
   */
  private async getSerendipityRecommendations(
    insights: MusicInsights, 
    existingRecommendations: PlaylistRecommendation[]
  ): Promise<PlaylistRecommendation[]> {
    const recommendations: PlaylistRecommendation[] = [];
    
    // Get genres the user hasn't explored much
    const allGenres = ['jazz', 'classical', 'world', 'folk', 'reggae', 'blues', 'ambient', 'experimental'];
    const userGenres = insights.topGenres.map(g => g.genre.toLowerCase());
    const existingGenres = existingRecommendations.flatMap(r => r.matchingGenres);
    const unexploredGenres = allGenres.filter(genre => 
      !userGenres.includes(genre) && !existingGenres.includes(genre)
    );
    
    // Add some unexplored genres for discovery
    for (const genre of unexploredGenres.slice(0, 2)) {
      try {
        const { data, error } = await this.makeSpotifyRequest('search', {
          q: `${genre} discover new`,
          type: 'playlist',
          limit: 3
        });
        
        if (error || !data?.playlists?.items) continue;

        const serendipityRecs = data.playlists.items
          .filter((playlist: any) => playlist && playlist.id && playlist.name)
          .map((playlist: any) => ({
            playlist: this.normalizePlaylistData(playlist),
            score: this.calculateGenreScore(playlist, genre) * 0.7, // Slightly lower score for discovery
            reasons: [`Discover new ${genre} music`],
            matchingGenres: [genre],
            similarityType: 'user_pattern' as const
          }));
        
        recommendations.push(...serendipityRecs);
      } catch {
        continue;
      }
    }
    
    return recommendations;
  }

  /**
   * Rank recommendations using ML-inspired scoring
   */
  private rankRecommendationsWithML(
    recommendations: PlaylistRecommendation[], 
    insights: MusicInsights
  ): PlaylistRecommendation[] {
    return recommendations
      .map(rec => {
        // Apply additional ML-inspired ranking factors
        let adjustedScore = rec.score;
        
        // Diversity bonus (avoid too many similar recommendations)
        const similarRecommendations = recommendations.filter(r => 
          r.similarityType === rec.similarityType && 
          r.matchingGenres.some(g => rec.matchingGenres.includes(g))
        );
        
        if (similarRecommendations.length > 3) {
          adjustedScore *= 0.85; // Penalty for over-representation
        }
        
        // Enhanced popularity alignment with more granular follower consideration
        const followerCount = rec.playlist.followers?.total ?? 0;
        
        // Universal quality boost for highly followed playlists (indicates good curation)
        if (followerCount >= 1000000) {
          adjustedScore *= 1.25; // Major playlists get significant boost
        } else if (followerCount >= 500000) {
          adjustedScore *= 1.20; // Very popular playlists
        } else if (followerCount >= 100000) {
          adjustedScore *= 1.15; // Popular playlists
        } else if (followerCount >= 50000) {
          adjustedScore *= 1.10; // Well-established playlists
        }
        
        // User preference alignment
        if (insights.popularityBias === 'mainstream') {
          if (followerCount > 100000) {
            adjustedScore *= 1.2; // Strong boost for mainstream users
          } else if (followerCount > 50000) {
            adjustedScore *= 1.15;
          } else if (followerCount > 10000) {
            adjustedScore *= 1.1;
          } else if (followerCount < 5000) {
            adjustedScore *= 0.9; // Slight penalty for very small playlists
          }
        } else if (insights.popularityBias === 'underground') {
          if (followerCount < 10000) {
            adjustedScore *= 1.15; // Boost for underground users preferring smaller playlists
          } else if (followerCount < 50000) {
            adjustedScore *= 1.1;
          } else if (followerCount > 500000) {
            adjustedScore *= 0.9; // Slight penalty for very mainstream playlists
          }
        } else { // mixed preference
          // Balanced approach - moderate boost for quality indicators
          if (followerCount > 250000) {
            adjustedScore *= 1.1; // Moderate boost for very popular playlists
          } else if (followerCount > 50000) {
            adjustedScore *= 1.05; // Small boost for popular playlists
          }
        }
        
        // Discovery rate alignment
        if (insights.discoveryRate > 70 && rec.similarityType === 'user_pattern') {
          adjustedScore *= 1.15; // Boost discovery for explorers
        }
        
        return { ...rec, score: adjustedScore };
      })
      .sort((a, b) => b.score - a.score);
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

        const moodRecs = data.playlists.items
          .filter((playlist: any) => playlist && playlist.id && playlist.name)
          .map((playlist: any) => ({
            playlist: this.normalizePlaylistData(playlist),
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
   * Calculate a quality score based on follower count using logarithmic scaling
   * Returns a score between 0-100 where higher followers = higher quality indication
   */
  private calculateFollowerQualityScore(followerCount: number): number {
    if (followerCount <= 0) return 0;
    
    // Logarithmic scaling to prevent extremely popular playlists from dominating
    // but still give significant weight to follower count
    if (followerCount >= 10000000) return 100; // 10M+ followers = perfect score
    if (followerCount >= 5000000) return 95;   // 5M+ followers
    if (followerCount >= 1000000) return 90;   // 1M+ followers
    if (followerCount >= 500000) return 85;    // 500K+ followers
    if (followerCount >= 250000) return 80;    // 250K+ followers
    if (followerCount >= 100000) return 75;    // 100K+ followers
    if (followerCount >= 50000) return 70;     // 50K+ followers
    if (followerCount >= 25000) return 65;     // 25K+ followers
    if (followerCount >= 10000) return 60;     // 10K+ followers
    if (followerCount >= 5000) return 55;      // 5K+ followers
    if (followerCount >= 2500) return 50;      // 2.5K+ followers
    if (followerCount >= 1000) return 45;      // 1K+ followers
    if (followerCount >= 500) return 40;       // 500+ followers
    if (followerCount >= 250) return 35;       // 250+ followers
    if (followerCount >= 100) return 30;       // 100+ followers
    if (followerCount >= 50) return 25;        // 50+ followers
    if (followerCount >= 25) return 20;        // 25+ followers
    if (followerCount >= 10) return 15;        // 10+ followers
    if (followerCount >= 5) return 10;         // 5+ followers
    return 5; // Less than 5 followers = minimal score
  }

  /**
   * Enhanced scoring for genre-based recommendations with ML-inspired approach
   */
  private calculateGenreScore(playlist: Playlist, genre: string, userInsights?: MusicInsights): number {
    let score = 30; // Reduced base score to give more weight to other factors
    
    // Use the enhanced follower quality scoring system
    const followerCount = playlist.followers?.total ?? 0;
    const followerQualityScore = this.calculateFollowerQualityScore(followerCount);
    
    // Add follower quality score with appropriate weight (up to 40 points from followers)
    score += (followerQualityScore * 0.4);
    
    // Quality assurance: Very high follower count suggests exceptional curation
    if (followerCount > 1000000) {
      score += 15; // Extra bonus for exceptional popularity
    } else if (followerCount > 250000) {
      score += 10; // Bonus for very high popularity
    }
    
    // Text relevance with weighted matching
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    const genreLower = genre.toLowerCase();
    
    // Exact genre match in title gets highest boost
    if (playlist.name.toLowerCase().includes(genreLower)) score += 30;
    else if (text.includes(genreLower)) score += 20;
    
    // Keyword variations and synonyms
    const genreSynonyms = this.getGenreSynonyms(genre);
    for (const synonym of genreSynonyms) {
      if (text.includes(synonym.toLowerCase())) {
        score += 15;
        break;
      }
    }
    
    // Track count optimization (sweet spot algorithm)
    const trackCount = playlist.tracks?.total ?? 0;
    if (trackCount >= 30 && trackCount <= 80) score += 20; // Optimal range
    else if (trackCount >= 15 && trackCount < 30) score += 15;
    else if (trackCount > 80 && trackCount <= 150) score += 15;
    else if (trackCount > 150) score += 5; // Too long
    else if (trackCount < 15) score -= 10; // Too short
    
    // User preference alignment
    if (userInsights) {
      const userGenrePreference = userInsights.topGenres.find(g => g.genre === genre);
      if (userGenrePreference) {
        // Boost based on user's affinity for this genre
        score += Math.min(userGenrePreference.percentage / 2, 15);
      }
      
      // Adjust based on user's discovery rate
      if (userInsights.discoveryRate > 70 && followerCount < 10000) {
        score += 10; // Boost underground playlists for explorers
      } else if (userInsights.discoveryRate < 30 && followerCount > 50000) {
        score += 10; // Boost popular playlists for mainstream listeners
      }
    }
    
    // Recency and activity indicators
    if (playlist.description && playlist.description.includes('updated')) score += 5;
    if (playlist.description && playlist.description.includes('curated')) score += 8;
    
    // Penalty for potentially low-quality indicators
    if (playlist.name.match(/^\d+/) || playlist.name.includes('test')) score -= 15;
    if (playlist.description && playlist.description.length < 20) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get genre synonyms and related terms
   */
  private getGenreSynonyms(genre: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'electronic': ['edm', 'dance', 'techno', 'house', 'trance', 'dubstep', 'electro'],
      'hip-hop': ['rap', 'hiphop', 'urban', 'trap', 'drill'],
      'rock': ['alternative', 'indie rock', 'classic rock', 'hard rock', 'metal'],
      'pop': ['mainstream', 'top 40', 'popular', 'chart'],
      'jazz': ['smooth jazz', 'bebop', 'fusion', 'swing'],
      'classical': ['orchestral', 'symphony', 'baroque', 'romantic'],
      'country': ['folk', 'americana', 'bluegrass', 'western'],
      'r&b': ['soul', 'rnb', 'rhythm and blues', 'neo-soul'],
      'latin': ['latino', 'hispanic', 'spanish', 'reggaeton'],
      'ambient': ['chill', 'downtempo', 'atmospheric', 'meditation']
    };
    
    return synonymMap[genre.toLowerCase()] || [];
  }

  /**
   * Enhanced scoring for artist-based recommendations
   */
  private calculateArtistScore(playlist: Playlist, artistName: string, userInsights?: MusicInsights): number {
    let score = 35; // Base score
    
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    const artistLower = artistName.toLowerCase();
    
    // Artist name matching with fuzzy logic
    if (playlist.name.toLowerCase().includes(artistLower)) score += 35;
    else if (text.includes(artistLower)) score += 25;
    
    // Similar artist detection (simplified)
    const artistTokens = artistLower.split(' ');
    for (const token of artistTokens) {
      if (token.length > 3 && text.includes(token)) {
        score += 10;
        break;
      }
    }
    
    // Enhanced follower count influence using quality scoring
    const followerCount = playlist.followers?.total ?? 0;
    const followerQualityScore = this.calculateFollowerQualityScore(followerCount);
    
    // Artist playlists benefit significantly from high follower counts (indicates good curation)
    // Weight follower quality more heavily for artist playlists (up to 35 points)
    score += (followerQualityScore * 0.35);
    
    // Extra bonus for exceptionally popular artist playlists
    if (followerCount >= 500000) {
      score += 15; // Major artist compilations/official playlists
    } else if (followerCount >= 100000) {
      score += 10; // Very popular artist playlists
    }
    
    // Track count preference for artist playlists
    const trackCount = playlist.tracks?.total ?? 0;
    if (trackCount >= 20 && trackCount <= 60) score += 15;
    else if (trackCount > 60) score += 5;
    
    // User preference alignment
    if (userInsights) {
      // Boost if user has diverse taste (more likely to enjoy artist-focused playlists)
      if (userInsights.artistDiversity > 70) score += 8;
      
      // Adjust based on popularity bias
      if (userInsights.popularityBias === 'mainstream' && followerCount > 10000) score += 8;
      else if (userInsights.popularityBias === 'underground' && followerCount < 5000) score += 8;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enhanced scoring for mood-based recommendations with emotion analysis
   */
  private calculateMoodScore(playlist: Playlist, mood: string, userInsights?: MusicInsights): number {
    let score = 30; // Base score
    
    const text = (playlist.name + ' ' + (playlist.description || '')).toLowerCase();
    const moodLower = mood.toLowerCase();
    
    // Direct mood matching
    if (text.includes(moodLower)) score += 25;
    
    // Mood synonym matching
    const moodSynonyms = this.getMoodSynonyms(mood);
    for (const synonym of moodSynonyms) {
      if (text.includes(synonym.toLowerCase())) {
        score += 15;
        break;
      }
    }
    
    // Quality indicators for mood playlists
    if (playlist.description && playlist.description.length > 50) score += 12;
    if (playlist.description && playlist.description.includes('carefully')) score += 8;
    if (playlist.description && playlist.description.includes('perfect for')) score += 6;
    
    // Enhanced follower count using quality scoring system
    const followerCount = playlist.followers?.total ?? 0;
    const followerQualityScore = this.calculateFollowerQualityScore(followerCount);
    
    // Mood playlists with high followers indicate excellent mood curation
    // Weight follower quality moderately for mood playlists (up to 30 points)
    score += (followerQualityScore * 0.3);
    
    // Extra bonus for exceptionally popular mood playlists
    if (followerCount >= 250000) {
      score += 12; // Major mood playlists (e.g., Spotify's official mood playlists)
    } else if (followerCount >= 100000) {
      score += 8; // Very popular mood playlists
    }
    
    // Track count optimization for mood playlists
    const trackCount = playlist.tracks?.total ?? 0;
    if (trackCount >= 25 && trackCount <= 100) score += 12;
    else if (trackCount > 100) score += 6;
    
    // User mood preference alignment
    if (userInsights) {
      // Adjust based on user's typical listening patterns
      const avgValence = this.estimateUserValence(userInsights);
      
      if (mood === 'happy' || mood === 'energetic') {
        if (avgValence > 0.6) score += 10;
      } else if (mood === 'sad' || mood === 'melancholy') {
        if (avgValence < 0.4) score += 10;
      } else if (mood === 'chill' || mood === 'relaxed') {
        if (avgValence >= 0.4 && avgValence <= 0.7) score += 10;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get mood synonyms and related emotional terms
   */
  private getMoodSynonyms(mood: string): string[] {
    const moodMap: Record<string, string[]> = {
      'happy': ['upbeat', 'cheerful', 'joyful', 'positive', 'uplifting', 'feel good'],
      'sad': ['melancholy', 'emotional', 'heartbreak', 'blues', 'sorrow', 'tears'],
      'energetic': ['workout', 'pump up', 'high energy', 'motivation', 'intense', 'power'],
      'chill': ['relaxed', 'laid back', 'mellow', 'easy', 'calm', 'peaceful'],
      'romantic': ['love', 'intimate', 'date night', 'romance', 'heart', 'passion'],
      'party': ['celebration', 'dance', 'nightlife', 'club', 'party time', 'festivities'],
      'focus': ['concentration', 'study', 'work', 'productivity', 'instrumental', 'background'],
      'nostalgic': ['throwback', 'memories', 'vintage', 'classic', 'retro', 'old school']
    };
    
    return moodMap[mood.toLowerCase()] || [];
  }

  /**
   * Estimate user's average valence from insights
   */
  private estimateUserValence(insights: MusicInsights): number {
    // This is a simplified estimation - in a real implementation,
    // you'd analyze actual audio features from user's listening history
    let valenceEstimate = 0.5; // Neutral baseline
    
    // Adjust based on genre preferences
    const highValenceGenres = ['pop', 'dance', 'electronic', 'funk'];
    const lowValenceGenres = ['blues', 'classical', 'ambient', 'folk'];
    
    let totalWeight = 0;
    insights.topGenres.forEach(genre => {
      if (highValenceGenres.includes(genre.genre)) {
        valenceEstimate += 0.3 * (genre.percentage / 100);
        totalWeight += genre.percentage / 100;
      } else if (lowValenceGenres.includes(genre.genre)) {
        valenceEstimate -= 0.2 * (genre.percentage / 100);
        totalWeight += genre.percentage / 100;
      }
    });
    
    return Math.max(0, Math.min(1, valenceEstimate));
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
   * Estimate follower count based on playlist characteristics when actual data is unavailable
   * Focused on identifying popular/mainstream playlists
   */
  private estimateFollowerCount(playlist: Playlist): number {
    let estimatedFollowers = 0;
    
    // Track count influences estimated popularity (popular playlists tend to be longer)
    const trackCount = playlist.tracks?.total ?? 0;
    if (trackCount > 200) estimatedFollowers += 15000;  // Very comprehensive playlists
    else if (trackCount > 100) estimatedFollowers += 10000;
    else if (trackCount > 50) estimatedFollowers += 5000;
    else if (trackCount > 25) estimatedFollowers += 2000;
    else if (trackCount > 10) estimatedFollowers += 1000;
    
    // Playlist name patterns that strongly suggest popularity
    const name = playlist.name.toLowerCase();
    
    // Chart/Popular indicators (high confidence)
    if (name.includes('chart') || name.includes('billboard')) {
      estimatedFollowers += 25000;
    }
    if (name.includes('hits') || name.includes('best') || name.includes('top')) {
      estimatedFollowers += 15000;
    }
    if (name.includes('popular') || name.includes('greatest')) {
      estimatedFollowers += 10000;
    }
    if (name.includes('official')) {
      estimatedFollowers += 8000;  // Reduced from 50k since not Spotify-specific
    }
    
    // Radio/Mainstream indicators
    if (name.includes('radio') || name.includes('mainstream')) {
      estimatedFollowers += 8000;
    }
    
    // Year indicators (recent compilations tend to be popular)
    if (name.includes('2024') || name.includes('2023')) {
      estimatedFollowers += 5000;
    }
    
    // Numbers suggesting rankings/charts
    if (name.match(/\btop\s*\d+\b/) || name.match(/\bbest\s*\d+\b/)) {
      estimatedFollowers += 8000;
    }
    
    // Description quality indicates professional curation
    if (playlist.description && playlist.description.length > 100) {
      estimatedFollowers += 3000;
    }
    
    // Owner patterns (check for verified/community curators)
    const ownerName = playlist.owner?.display_name?.toLowerCase() ?? '';
    if (ownerName.includes('official') || ownerName.includes('music') || ownerName.includes('records')) {
      estimatedFollowers += 15000;  // Reduced from 20k, removed Spotify-specific check
    }
    
    return Math.min(estimatedFollowers, 100000); // Cap at reasonable estimate
  }

  /**
   * Enhanced playlist normalization with follower data fetching
   */
  private normalizePlaylistData(playlist: any): Playlist {
    // Ensure playlist is an object
    if (!playlist || typeof playlist !== 'object') {
      console.warn('Invalid playlist data received:', playlist);
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