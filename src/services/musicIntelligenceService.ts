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
      console.log('Starting music profile generation...');
      
      // Gather user data in parallel
      const [topTracks, recentlyPlayed, savedTracks, _userPlaylists, followedArtists] = await Promise.all([
        this.getUserTopTracks(),
        this.getRecentlyPlayed(),
        this.getSavedTracks(),
        this.getUserPlaylists(),
        this.getFollowedArtists()
      ]);

      console.log('Gathered user data:', {
        topTracks: topTracks.length,
        recentlyPlayed: recentlyPlayed.length,
        savedTracks: savedTracks.length,
        followedArtists: followedArtists.length
      });

      // Generate insights from user data
      const insights = this.analyzeUserMusic(topTracks, recentlyPlayed, savedTracks);
      console.log('Generated insights:', insights);
      
      // Generate playlist recommendations
      console.log('Generating playlist recommendations...');
      const recommendations = await this.generatePlaylistRecommendations(
        insights,
        topTracks,
        savedTracks,
        followedArtists
      );
      
      console.log('Generated recommendations:', recommendations.length);
      console.log('Sample recommendations:', recommendations.slice(0, 3));

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
    console.log(`Analyzing ${allTracks.length} total tracks`);
    
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
    
    console.log('Genre counts:', genreCounts);
    
    // Calculate top genres with percentages
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalTracks) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log('Top genres calculated:', topGenres);

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
    
    console.log('Starting playlist recommendations with insights:', insights);
    console.log('Top genres for recommendations:', insights.topGenres.slice(0, 4));
    
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
      console.log(`Searching playlists for genre: ${genreData.genre}`);
      const genreRecs = await this.searchPlaylistsByGenre(genreData.genre, insights);
      console.log(`Found ${genreRecs.length} genre recommendations for ${genreData.genre}`);
      recommendations.push(...genreRecs);
    }

    // Artist-based recommendations with improved scoring
    console.log('Searching for artist-based recommendations...');
    console.log('Followed artists:', followedArtists.length);
    
    const artistsToSearch = followedArtists.length > 0 
      ? followedArtists.slice(0, 6)
      : [
          { name: 'Taylor Swift', id: 'example1' },
          { name: 'The Weeknd', id: 'example2' },
          { name: 'Dua Lipa', id: 'example3' }
        ];
    
    for (const artist of artistsToSearch) {
      console.log(`Searching playlists for artist: ${artist.name}`);
      const artistRecs = await this.searchPlaylistsByArtist(artist.name, insights);
      console.log(`Found ${artistRecs.length} artist recommendations for ${artist.name}`);
      recommendations.push(...artistRecs);
    }

    // Enhanced mood-based recommendations
    console.log('Getting mood-based recommendations...');
    const moodRecs = await this.getMoodBasedRecommendations(insights);
    console.log(`Found ${moodRecs.length} mood recommendations`);
    recommendations.push(...moodRecs);

    // Add diversity and serendipity recommendations
    console.log('Adding serendipity recommendations...');
    const diversityRecs = await this.getSerendipityRecommendations(insights, recommendations);
    console.log(`Found ${diversityRecs.length} serendipity recommendations`);
    recommendations.push(...diversityRecs);

    console.log(`Total recommendations before deduplication: ${recommendations.length}`);

    // Advanced deduplication and ranking
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    console.log(`Recommendations after deduplication: ${uniqueRecs.length}`);
    
    const rankedRecs = this.rankRecommendationsWithML(uniqueRecs, insights);
    console.log(`Final ranked recommendations: ${rankedRecs.length}`);
    
    return rankedRecs.slice(0, 20); // Return top 20 recommendations
  }

  /**
   * Enhanced search for playlists by genre with user context
   */
  private async searchPlaylistsByGenre(genre: string, userInsights?: MusicInsights): Promise<PlaylistRecommendation[]> {
    try {
      console.log(`Searching for genre: ${genre}`);
      
      // Try multiple search strategies
      const searchQueries = [
        `genre:"${genre}"`,
        `${genre} music`,
        `${genre} hits`,
        `best ${genre}`
      ];
      
      for (const query of searchQueries) {
        const { data, error } = await this.makeSpotifyRequest('search', {
          q: query,
          type: 'playlist',
          limit: 12
        });
        
        if (error) {
          console.error(`Error searching with query "${query}":`, error);
          continue;
        }
        
        if (data?.playlists?.items && data.playlists.items.length > 0) {
          console.log(`Found ${data.playlists.items.length} playlists for query: ${query}`);

          const recommendations = data.playlists.items
            .filter((playlist: any) => playlist && playlist.id && playlist.name)
            .map((playlist: any) => ({
              playlist: this.normalizePlaylistData(playlist),
              score: this.calculateGenreScore(playlist, genre, userInsights),
              reasons: [`Matches your ${genre} music taste`],
              matchingGenres: [genre],
              similarityType: 'genre' as const
            }));
          
          if (recommendations.length > 0) {
            return recommendations;
          }
        }
      }
      
      console.log(`No playlists found for any query variant of genre: ${genre}`);
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
        
        // Popularity alignment
        const followerCount = rec.playlist.followers.total;
        if (insights.popularityBias === 'mainstream' && followerCount > 50000) {
          adjustedScore *= 1.1;
        } else if (insights.popularityBias === 'underground' && followerCount < 10000) {
          adjustedScore *= 1.1;
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
   * Enhanced scoring for genre-based recommendations with ML-inspired approach
   */
  private calculateGenreScore(playlist: Playlist, genre: string, userInsights?: MusicInsights): number {
    let score = 40; // Base score
    
    // Follower count scoring with logarithmic scale
    const followerCount = playlist.followers.total;
    if (followerCount > 100000) score += 25;
    else if (followerCount > 50000) score += 20;
    else if (followerCount > 10000) score += 15;
    else if (followerCount > 1000) score += 10;
    else if (followerCount > 100) score += 5;
    
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
    const trackCount = playlist.tracks.total;
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
    
    // Follower count influence
    const followerCount = playlist.followers.total;
    if (followerCount > 20000) score += 20;
    else if (followerCount > 5000) score += 15;
    else if (followerCount > 1000) score += 10;
    
    // Track count preference for artist playlists
    const trackCount = playlist.tracks.total;
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
    
    // Follower count for mood playlists
    const followerCount = playlist.followers.total;
    if (followerCount > 15000) score += 15;
    else if (followerCount > 3000) score += 10;
    
    // Track count optimization for mood playlists
    const trackCount = playlist.tracks.total;
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
   * Normalize playlist data to ensure required properties exist
   */
  private normalizePlaylistData(playlist: any): Playlist {
    return {
      collaborative: playlist.collaborative ?? false,
      description: playlist.description ?? null,
      external_urls: playlist.external_urls ?? {},
      followers: playlist.followers ?? { href: null, total: 0 },
      href: playlist.href ?? '',
      id: playlist.id ?? '',
      images: playlist.images ?? [],
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