import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { useSpotifyApi, buildSpotifyUrl } from '../hooks/useSpotifyApi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TrackMenu from '../components/TrackMenu';
import PlaylistMenu from '../components/PlaylistMenu';
import { IconButton, Fade, Typography, Skeleton, Grow } from '@mui/material';
import { PlayArrow, Pause, ChevronLeft, ChevronRight, AccessTime, MoreVert } from '@mui/icons-material';
import { usePlayer } from '../context/player';
import { getCategoryById, mapGenresToCategories, getCategorySearchTerms, type CustomCategory } from '../utils/categoryMapping';
import type { Track as TrackType, Playlist as PlaylistType } from '../types/spotify';

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  followers?: { total: number };
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    release_date?: string;
  };
  duration_ms: number;
  external_urls: { spotify: string };
  uri: string;
  preview_url?: string;
  popularity?: number;
}

const Category: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { token, isLoading } = useAuth();
  const { makeRequest } = useSpotifyApi();
  const navigate = useNavigate();
  const toast = useToast();
  const { play, currentTrack, isPlaying } = usePlayer();
  
  const [category, setCategory] = React.useState<CustomCategory | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [artistStart, setArtistStart] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(5);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const isLoadingRef = React.useRef(false);

  // Track menu state
  const [trackMenuAnchor, setTrackMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<TrackType | null>(null);
  
  // Playlist menu state
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<PlaylistType | null>(null);

  const handleTrackMenuOpen = (event: React.MouseEvent<HTMLElement>, track: Track) => {
    event.stopPropagation();
    setTrackMenuAnchor(event.currentTarget);
    setSelectedTrack(track as unknown as TrackType);
  };

  const handleTrackMenuClose = () => {
    setTrackMenuAnchor(null);
    setSelectedTrack(null);
  };

  const handlePlaylistMenuOpen = (event: React.MouseEvent<HTMLElement>, playlist: Playlist) => {
    event.stopPropagation();
    setPlaylistMenuAnchor(event.currentTarget);
    setSelectedPlaylist(playlist as unknown as PlaylistType);
  };

  const handlePlaylistMenuClose = () => {
    setPlaylistMenuAnchor(null);
    setSelectedPlaylist(null);
  };

  // Load category on mount
  React.useEffect(() => {
    if (categoryId) {
      const foundCategory = getCategoryById(categoryId);
      setCategory(foundCategory);
    }
  }, [categoryId]);

  // Update visibleCount based on viewport
  React.useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      if (width >= 1536) setVisibleCount(7); // 2xl
      else if (width >= 1280) setVisibleCount(6); // xl
      else if (width >= 1024) setVisibleCount(5); // lg
      else if (width >= 768) setVisibleCount(4); // md
      else setVisibleCount(3); // sm
      
      setArtistStart(prev => Math.min(prev, Math.max(0, artists.length - visibleCount)));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [artists.length]);

  const maxArtistStart = React.useMemo(() => {
    return Math.max(0, artists.length - visibleCount);
  }, [artists.length, visibleCount]);

  // Fetch artists and playlists for the category using the new Spotify API hook
  const fetchCategoryContent = React.useCallback(async () => {
    if (!category) return;
    
    // Prevent multiple concurrent requests using ref
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoadingPlaylists(true);
    setError('');
    
    try {
      // Use optimized search terms for better API results
      let genreSearches: string[] = [];
      
      // Default behavior
      const searchTerms = getCategorySearchTerms(categoryId!);
      genreSearches = searchTerms.slice(0, 6); // Use optimized terms
      
      // Pre-allocate Sets for efficient deduplication
      const artistIds = new Set<string>();
      const playlistIds = new Set<string>();
      const trackIds = new Set<string>();
      
      const allArtists: Artist[] = [];
      const allPlaylists: Playlist[] = [];
      const allTracks: Track[] = [];
      
      // Determine search strategy based on category
      const useGenreQualifier = !(categoryId === 'kpop' || categoryId === 'chinese-pop');
      
      // Parallel API requests using the new hook
      const searchPromises = genreSearches.map(async (genre) => {
        const results = { artists: [] as Artist[], playlists: [] as Playlist[], tracks: [] as Track[] };
        
        try {
          // Create search queries
          const artistQuery = useGenreQualifier ? `genre:"${genre}"` : genre;
          const trackQuery = useGenreQualifier ? `genre:"${genre}"` : genre;
          
          // Build URLs using the utility function
          const artistUrl = buildSpotifyUrl('search', {
            q: artistQuery,
            type: 'artist',
            limit: 50
          });
          
          const playlistUrl = buildSpotifyUrl('search', {
            q: genre,
            type: 'playlist', 
            limit: 50
          });
          
          const trackUrl = buildSpotifyUrl('search', {
            q: trackQuery,
            type: 'track',
            limit: 50
          });
          
          // Execute all requests in parallel using the hook
          const [artistResult, playlistResult, trackResult] = await Promise.allSettled([
            makeRequest(artistUrl),
            makeRequest(playlistUrl),
            makeRequest(trackUrl)
          ]);
          
          // Process artist results
          if (artistResult.status === 'fulfilled' && artistResult.value.data && !artistResult.value.error) {
            const artists = artistResult.value.data.artists?.items || [];
            results.artists = artists.filter((a: Artist) => a && a.id && !artistIds.has(a.id));
            results.artists.forEach((a: Artist) => artistIds.add(a.id));
          }
          
          // Process playlist results
          if (playlistResult.status === 'fulfilled' && playlistResult.value.data && !playlistResult.value.error) {
            const playlists = playlistResult.value.data.playlists?.items || [];
            results.playlists = playlists.filter((p: Playlist) => p && p.id && !playlistIds.has(p.id));
            results.playlists.forEach((p: Playlist) => playlistIds.add(p.id));
          }
          
          // Process track results with fallback for genre qualifier
          if (trackResult.status === 'fulfilled' && trackResult.value.data && !trackResult.value.error) {
            let tracks = trackResult.value.data.tracks?.items || [];
            
            // Fallback search if genre qualifier didn't work well
            if (useGenreQualifier && tracks.length < 5) {
              const fallbackUrl = buildSpotifyUrl('search', {
                q: genre,
                type: 'track',
                limit: 18
              });
              
              const fallbackResult = await makeRequest(fallbackUrl);
              if (fallbackResult.data && !fallbackResult.error) {
                tracks = fallbackResult.data.tracks?.items || tracks;
              }
            }
            
            results.tracks = tracks.filter((t: Track) => t && t.id && !trackIds.has(t.id));
            results.tracks.forEach((t: Track) => trackIds.add(t.id));
          }
          
        } catch (err) {
          console.error(`Failed to search for genre: ${genre}`, err);
        }
        
        return results;
      });
      
      // Wait for all searches to complete
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Combine results efficiently
      searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allArtists.push(...result.value.artists);
          allPlaylists.push(...result.value.playlists);
          allTracks.push(...result.value.tracks);
        }
      });
      
      // Enhanced artist processing algorithm with category-specific strict filtering
      const processArtists = (artists: Artist[]) => {
        if (artists.length === 0) return [];
        
        // Pre-compile regex patterns for better performance
        const hangulRegex = /[\uAC00-\uD7AF]/;
        const cjkRegex = /[\u4E00-\u9FFF\u3040-\u30FF]/;
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
        
        // Category-specific configuration for intelligent filtering
        const categoryConfig: Record<string, {
          minPopularity: number;
          minFollowers: number;
          namePatterns?: RegExp[];
          excludePatterns?: string[];
          qualityThreshold: number;
        }> = {
          'kpop': {
            minPopularity: 35,
            minFollowers: 80000,
            namePatterns: [hangulRegex],
            excludePatterns: ['j-pop', 'japanese', 'mandopop', 'cantopop'],
            qualityThreshold: 120
          },
          'chinese-pop': {
            minPopularity: 30,
            minFollowers: 40000,
            namePatterns: [cjkRegex],
            excludePatterns: ['k-pop', 'j-pop', 'japanese', 'korean'],
            qualityThreshold: 120
          },
          'pop': {
            minPopularity: 40,
            minFollowers: 150000,
            excludePatterns: ['k-pop', 'mandopop', 'cantopop', 'hip hop', 'rap', 'rock', 'metal', 'country'],
            qualityThreshold: 180
          },
          'hiphop': {
            minPopularity: 32,
            minFollowers: 80000,
            excludePatterns: ['k-rap', 'pop rap'],
            qualityThreshold: 140
          },
          'edm': {
            minPopularity: 28,
            minFollowers: 40000,
            excludePatterns: [],
            qualityThreshold: 120
          },
          'rock': {
            minPopularity: 30,
            minFollowers: 60000,
            excludePatterns: ['pop rock'],
            qualityThreshold: 130
          },
          'indie': {
            minPopularity: 22,
            minFollowers: 20000,
            excludePatterns: [],
            qualityThreshold: 100
          },
          'jazz': {
            minPopularity: 18,
            minFollowers: 10000,
            excludePatterns: [],
            qualityThreshold: 90
          },
          'rnb': {
            minPopularity: 32,
            minFollowers: 70000,
            excludePatterns: [],
            qualityThreshold: 130
          },
          'latin': {
            minPopularity: 32,
            minFollowers: 80000,
            excludePatterns: [],
            qualityThreshold: 130
          },
          'country': {
            minPopularity: 28,
            minFollowers: 40000,
            excludePatterns: [],
            qualityThreshold: 110
          },
          'classical': {
            minPopularity: 15,
            minFollowers: 5000,
            excludePatterns: [],
            qualityThreshold: 80
          }
        };
        
        const config = categoryConfig[categoryId!] || {
          minPopularity: 25,
          minFollowers: 30000,
          qualityThreshold: 100
        };

        // Determine active genre patterns based on selection or category defaults
        let activeGenrePatterns: string[] = [];
        let isSubGenreMode = false;

        // Use the category's defined genres as the base patterns
        activeGenrePatterns = category?.spotifyGenres || [];
        
        const scoreArtist = (artist: Artist) => {
          let score = 0;
          const genres = (artist.genres || []).map(g => g.toLowerCase());
          const popularity = artist.popularity || 0;
          const followers = artist.followers?.total || 0;
          
          // STRICT CATEGORY RELEVANCE CHECK
          let hasRelevantGenre = false;
          let hasRelevantName = false;
          let hasExcludedGenre = false;
          
          // Check genre patterns against ACTIVE patterns
          for (const pattern of activeGenrePatterns) {
            const p = pattern.toLowerCase();
            if (genres.some(g => g.includes(p))) {
              hasRelevantGenre = true;
              break;
            }
          }
          
          // Check name patterns for language-specific categories
          if (config.namePatterns) {
            for (const pattern of config.namePatterns) {
              if (pattern.test(artist.name)) {
                hasRelevantName = true;
                break;
              }
            }
          }
          
          // Check excluded genres
          if (config.excludePatterns) {
            for (const pattern of config.excludePatterns) {
              if (genres.some(g => g.includes(pattern))) {
                hasExcludedGenre = true;
                break;
              }
            }
          }
          
          // REJECTION RULES
          // If in sub-genre mode, we require a genre match (name match is not enough)
          if (isSubGenreMode) {
            if (!hasRelevantGenre) return 0;
          } else {
            // For language-specific categories, require either genre or name match
            if (categoryId === 'kpop' || categoryId === 'chinese-pop') {
              if (!hasRelevantGenre && !hasRelevantName) return 0;
              if (hasExcludedGenre) return 0;
            } else {
              // For other categories, require genre match
              if (!hasRelevantGenre) return 0;
              // Reject if has excluded genre and low popularity
              if (hasExcludedGenre && popularity < 60) return 0;
            }
          }
          
          // Quality gates
          if (popularity < config.minPopularity && followers < config.minFollowers) return 0;
          if (popularity === 0 && followers === 0) return 0;
          
          // INTELLIGENT POPULARITY SCORING (non-linear with diminishing returns)
          if (popularity >= 85) {
            score += 200 + (popularity - 85) * 5; // Premium for mega-stars
          } else if (popularity >= 70) {
            score += 150 + (popularity - 70) * 3;
          } else if (popularity >= 50) {
            score += 100 + (popularity - 50) * 2.5;
          } else if (popularity >= 35) {
            score += 60 + (popularity - 35) * 2;
          } else {
            score += popularity * 1.5;
          }
          
          // FOLLOWER-BASED SCORING (logarithmic scaling for fairness)
          if (followers > 0) {
            const followerScore = Math.min(Math.log10(followers + 1) * 25, 150);
            score += followerScore;
            
            // Bonus for mega-followings
            if (followers > 10000000) score += 100;
            else if (followers > 5000000) score += 60;
            else if (followers > 1000000) score += 30;
          }
          
          // PROFILE COMPLETENESS BONUS
          if ((artist.images?.length || 0) > 0) score += 25;
          if (artist.genres && artist.genres.length > 0) score += 20;
          if (artist.genres && artist.genres.length >= 3) score += 15; // Rich genre info
          
          // CATEGORY-SPECIFIC INTELLIGENT BONUSES
          let categoryBonus = 0;
          
          // Count exact and partial genre matches
          let exactMatches = 0;
          let partialMatches = 0;
          
          for (const pattern of activeGenrePatterns) {
            const p = pattern.toLowerCase();
            for (const genre of genres) {
              if (genre === p) {
                exactMatches++;
              } else if (genre.includes(p)) {
                partialMatches++;
              }
            }
          }
          
          // Award bonuses for genre depth
          categoryBonus += exactMatches * 80;
          categoryBonus += partialMatches * 40;
          
          // Language/cultural match bonuses
          if (categoryId === 'kpop') {
            if (hangulRegex.test(artist.name)) categoryBonus += 100;
            if (genres.includes('k-pop')) categoryBonus += 120;
            if (followers > 5000000 && hasRelevantGenre) categoryBonus += 150; // K-pop superstar
            
          } else if (categoryId === 'chinese-pop') {
            if (cjkRegex.test(artist.name) && !japaneseRegex.test(artist.name)) categoryBonus += 100;
            if (genres.some(g => g === 'mandopop' || g === 'cantopop')) categoryBonus += 120;
            
          } else if (categoryId === 'pop') {
            // Mainstream appeal metrics
            if (popularity >= 70 && followers > 1000000) categoryBonus += 120;
            if (genres.includes('pop') || genres.includes('dance pop')) {
              categoryBonus += popularity >= 60 ? 100 : 60;
            }
            
          } else if (categoryId === 'hiphop') {
            if (genres.some(g => g === 'hip hop' || g === 'rap')) categoryBonus += 100;
            if (genres.some(g => g.includes('trap') || g.includes('drill'))) categoryBonus += 80;
            if (popularity >= 65 && followers > 2000000) categoryBonus += 100; // Hip-hop star
            
          } else if (categoryId === 'edm') {
            if (genres.some(g => g === 'edm' || g === 'electronic')) categoryBonus += 100;
            if (genres.some(g => g.includes('house') || g.includes('techno') || g.includes('trance'))) categoryBonus += 80;
            
          } else if (categoryId === 'rock') {
            if (genres.some(g => g === 'rock')) categoryBonus += 100;
            if (genres.some(g => g.includes('metal') || g.includes('punk'))) categoryBonus += 80;
            if (followers > 2000000) categoryBonus += 70; // Rock legend
            
          } else if (categoryId === 'indie') {
            if (genres.some(g => g === 'indie' || g === 'indie rock' || g === 'indie pop')) categoryBonus += 100;
            if (genres.some(g => g.includes('lo-fi') || g.includes('bedroom pop'))) categoryBonus += 70;
            // Indie shouldn't overly favor mainstream
            if (popularity > 60 && followers > 1000000) categoryBonus -= 20;
            
          } else if (categoryId === 'jazz') {
            if (genres.some(g => g === 'jazz')) categoryBonus += 100;
            if (genres.some(g => g.includes('bebop') || g.includes('swing'))) categoryBonus += 80;
            
          } else if (categoryId === 'rnb') {
            if (genres.some(g => g === 'r&b' || g === 'rnb')) categoryBonus += 100;
            if (genres.some(g => g.includes('soul') || g.includes('neo soul'))) categoryBonus += 85;
            
          } else if (categoryId === 'latin') {
            if (genres.some(g => g === 'latin' || g === 'reggaeton')) categoryBonus += 100;
            if (genres.some(g => g.includes('salsa') || g.includes('bachata'))) categoryBonus += 85;
            
          } else if (categoryId === 'country') {
            if (genres.some(g => g === 'country')) categoryBonus += 100;
            if (genres.some(g => g.includes('americana') || g.includes('folk'))) categoryBonus += 75;
            
          } else if (categoryId === 'classical') {
            if (genres.some(g => g === 'classical')) categoryBonus += 100;
            if (genres.some(g => g.includes('orchestral') || g.includes('symphony'))) categoryBonus += 80;
          }
          
          score += categoryBonus;
          
          // Cross-category genre mapping bonus
          const mappedCategories = mapGenresToCategories(artist.genres || []);
          if (mappedCategories.includes(categoryId!)) {
            score += 60;
          }
          
          // Diversity penalty for artists with too many conflicting genres
          if (genres.length > 8) score -= 15;
          
          return Math.round(score);
        };
        
        // Apply enhanced filtering and scoring
        const scoredArtists = artists
          .filter(a => a && a.id && a.name && typeof a.name === 'string') // Basic validation
          .map(artist => ({ artist, score: scoreArtist(artist) }))
          .filter(({ score, artist }) => {
            // Reject zero-score artists (failed category relevance check)
            if (score <= 0) return false;
            
            // Quality threshold based on category configuration
            if (score < config.qualityThreshold) return false;
            
            const popularity = artist.popularity || 0;
            const followers = artist.followers?.total || 0;
            const genres = (artist.genres || []).map(g => g.toLowerCase());
            
            // Additional validation for specific categories
            if (categoryId === 'kpop') {
              // Block list for commonly misclassified Western artists
              const westernArtists = ['bruno mars', 'katy perry', 'taylor swift', 'ariana grande', 
                                     'justin bieber', 'ed sheeran', 'drake', 'the weeknd'];
              if (westernArtists.some(name => artist.name.toLowerCase().includes(name))) {
                return false;
              }
              
            } else if (categoryId === 'chinese-pop') {
              // Ensure not Japanese artists
              if (japaneseRegex.test(artist.name) && !cjkRegex.test(artist.name)) {
                return false;
              }
              
            } else if (categoryId === 'pop') {
              // For pop category, ensure they're actually mainstream
              if (popularity < 50 && followers < 500000) return false;
              
            } else if (categoryId === 'indie') {
              // Indie shouldn't include mega-mainstream artists unless they started indie
              if (popularity > 85 && followers > 5000000) {
                // Unless they have strong indie genre indicators
                if (!genres.some(g => g.includes('indie'))) return false;
              }
            }
            
            return true;
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 50) // Top 50 artists
          .map(({ artist }) => artist);
        
        return scoredArtists;
      };
      
      // Process tracks with intelligent relevance scoring
      const processTracks = (tracks: Track[]) => {
        if (tracks.length === 0) return [];
        
        const scoreTrack = (track: Track) => {
          let score = 0;
          const popularity = track.popularity || 0;
          
          // Popularity-based scoring
          if (popularity >= 80) score += 150;
          else if (popularity >= 60) score += 100;
          else if (popularity >= 40) score += 60;
          else score += popularity;
          
          // Recency bonus (if release date available)
          if (track.album?.release_date) {
            const releaseYear = new Date(track.album.release_date).getFullYear();
            const currentYear = new Date().getFullYear();
            const yearsDiff = currentYear - releaseYear;
            
            if (yearsDiff === 0) score += 60; // This year
            else if (yearsDiff <= 1) score += 40; // Last year
            else if (yearsDiff <= 3) score += 20; // Last 3 years
            else if (yearsDiff > 10) score -= 20; // Old tracks penalized
          }
          
          // Name relevance (for language-specific categories)
          if (categoryId === 'kpop') {
            if (/[\uAC00-\uD7AF]/.test(track.name)) score += 80;
          } else if (categoryId === 'chinese-pop') {
            if (/[\u4E00-\u9FFF]/.test(track.name)) score += 80;
          }
          
          return score;
        };
        
        return tracks
          .filter(t => t && t.id && t.name)
          .map(track => ({ track, score: scoreTrack(track) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 30)
          .map(({ track }) => track);
      };
      
      // Process playlists with relevance scoring
      const processPlaylists = (playlists: Playlist[]) => {
        if (playlists.length === 0) return [];
        
        const scorePlaylist = (playlist: Playlist) => {
          let score = 0;
          const name = playlist.name.toLowerCase();
          const description = (playlist.description || '').toLowerCase();
          const trackCount = playlist.tracks?.total || 0;
          
          // Track count scoring (prefer substantial playlists)
          if (trackCount > 100) score += 80;
          else if (trackCount > 50) score += 60;
          else if (trackCount > 20) score += 40;
          else if (trackCount < 5) return 0; // Too small
          
          // Name/description relevance
          const categoryKeywords = category?.keywords || [];
          const categoryName = category?.name.toLowerCase() || '';
          
          if (name.includes(categoryName)) score += 100;
          if (description.includes(categoryName)) score += 60;
          
          categoryKeywords.forEach(keyword => {
            if (name.includes(keyword)) score += 50;
            if (description.includes(keyword)) score += 30;
          });
          
          // Boost official/curated playlists
          if (name.includes('official') || name.includes('best of') || name.includes('top')) {
            score += 40;
          }
          
          return score;
        };
        
        return playlists
          .filter(p => p && p.id && p.name)
          .map(playlist => ({ playlist, score: scorePlaylist(playlist) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 40)
          .map(({ playlist }) => playlist);
      };
      
      // Apply processing to collected data
      const processedArtists = processArtists(allArtists);
      const processedTracks = processTracks(allTracks);
      const processedPlaylists = processPlaylists(allPlaylists);
      
      setArtists(processedArtists);
      setTracks(processedTracks);
      setPlaylists(processedPlaylists);
      
      // Log statistics for debugging
      console.log(`Category ${categoryId}: ${processedArtists.length} artists, ${processedTracks.length} tracks, ${processedPlaylists.length} playlists`);
      
    } catch (err) {
      console.error('Failed to fetch category content:', err);
      toast.showToast('Failed to load category content', 'error');
    } finally {
      setLoadingPlaylists(false);
      isLoadingRef.current = false;
    }
  }, [category, categoryId, makeRequest, toast]);

  // Load content after category is loaded
  React.useEffect(() => {
    if (category && !isLoading) {
      fetchCategoryContent();
    }
  }, [category, isLoading, fetchCategoryContent]);

  // Handle playlist play
  const handlePlaylistPlay = async (playlist: Playlist) => {
    try {
      const url = buildSpotifyUrl(`playlists/${playlist.id}/tracks`, { limit: 1 });
      const { data, error } = await makeRequest(url);
      
      if (error) {
        toast.showToast('Unable to play playlist', 'error');
        return;
      }
      
      const firstTrack = data?.items?.[0]?.track;
      if (firstTrack) {
        await play(firstTrack);
      } else {
        toast.showToast('This playlist appears to be empty', 'error');
      }
    } catch (err) {
      console.error('Play playlist error:', err);
      toast.showToast('Unable to play playlist. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  // Handle artist play (play their top track)
  const handleArtistPlay = async (artist: Artist) => {
    try {
      const url = buildSpotifyUrl(`artists/${artist.id}/top-tracks`, { market: 'US' });
      const { data, error } = await makeRequest(url);
      
      if (error) {
        toast.showToast('Unable to play artist', 'error');
        return;
      }
      
      const topTrack = data?.tracks?.[0];
      if (topTrack) {
        await play(topTrack);
      } else {
        toast.showToast('No tracks found for this artist', 'error');
      }
    } catch (err) {
      console.error('Play artist error:', err);
      toast.showToast('Unable to play artist. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  // Handle track play
  const handleTrackPlay = async (track: Track) => {
    try {
      await play(track as any);
    } catch (err) {
      console.error('Play track error:', err);
      toast.showToast('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  // Guest experience
  if (!token && !isLoading) {
    return (
      <div className="min-h-screen bg-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-6">Music Category</h1>
              <p className="text-gray-400 mb-8 text-lg">Sign in to explore this music category</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-transform hover:scale-105"
              >
                Sign In to Browse
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex font-sans text-white">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 lg:ml-72 relative z-0">
        {/* Dynamic Background Gradient Overlay */}
        {category && (
          <div 
            className="absolute top-0 left-0 w-full h-[50vh] opacity-20 pointer-events-none z-0"
            style={{ 
              background: `linear-gradient(to bottom, ${category.color}, transparent)` 
            }}
          />
        )}

        <div className="relative z-10 pb-24">
          {/* Header Section */}
          <div className="pt-24 px-10 md:px-12 pb-8">
            {category ? (
              <Fade in timeout={600}>
                <div className="flex flex-col md:flex-row items-end gap-8">
                  <div 
                    className="w-32 h-32 md:w-40 md:h-40 shadow-2xl flex items-center justify-center text-6xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-lg border border-white/10"
                    style={{ boxShadow: `0 20px 50px -12px ${category.color}50` }}
                  >
                    <span className="filter drop-shadow-lg transform scale-110">
                      {category.icon}
                    </span>
                  </div>
                  <div className="flex-1 mb-2">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                      {category.name}
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mb-6 font-medium">
                      {category.description || `Discover the best music in ${category.name}`}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm font-semibold text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"/>
                        {loadingPlaylists ? '...' : artists.length} Artists
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"/>
                        {loadingPlaylists ? '...' : tracks.length} Songs
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"/>
                        {loadingPlaylists ? '...' : playlists.length} Playlists
                      </div>
                    </div>
                  </div>
                </div>
              </Fade>
            ) : (
                <div className="flex flex-col md:flex-row items-end gap-8">
                    <Skeleton variant="rectangular" width={160} height={160} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                    <div className="flex-1">
                        <Skeleton width="20%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <Skeleton width="60%" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <Skeleton width="40%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    </div>
                </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="px-10 md:px-12 space-y-16">
            
            {/* Loading & Error States */}
            {loadingPlaylists && (
              <div className="space-y-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} variant="circular" width="100%" height="auto" sx={{ aspectRatio: '1/1', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    ))}
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                    ))}
                </div>
              </div>
            )}

            {error && !loadingPlaylists && (
              <div className="text-center py-20 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                <Typography variant="h6" fontWeight="bold">{error}</Typography>
                <button onClick={fetchCategoryContent} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">Try Again</button>
              </div>
            )}

            {!loadingPlaylists && !error && (
              <>
                {/* Artists Section */}
                {artists.length > 0 && (
                  <section className="relative group/section">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Popular Artists</h2>
                      <div className="flex gap-2">
                        <IconButton 
                            disabled={artistStart <= 0}
                            onClick={() => setArtistStart(s => Math.max(0, s - visibleCount))}
                            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:disabled': { opacity: 0.3 } }}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton 
                            disabled={artistStart >= maxArtistStart}
                            onClick={() => setArtistStart(s => Math.min(s + visibleCount, maxArtistStart))}
                            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)', '&:disabled': { opacity: 0.3 } }}
                        >
                            <ChevronRight />
                        </IconButton>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                        {artists.slice(artistStart, artistStart + visibleCount).map((artist, index) => (
                            <Grow in timeout={300 + index * 50} key={artist.id}>
                                <div 
                                    className="group/card flex flex-col items-center cursor-pointer"
                                    onClick={() => handleArtistPlay(artist)}
                                >
                                    <div className="relative w-full aspect-square mb-4 rounded-full overflow-hidden shadow-lg group-hover/card:shadow-2xl transition-all duration-300">
                                        <img 
                                            src={artist.images?.[0]?.url || '/vite.svg'} 
                                            alt={artist.name}
                                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover/card:scale-100 transition-transform duration-300">
                                                <PlayArrow sx={{ fontSize: 28, color: 'white  ' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 
                                        className="text-white font-bold text-center truncate w-full hover:text-green-400 hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] transition-all cursor-pointer z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/artist/${artist.id}`);
                                        }}
                                    >
                                        {artist.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm">Artist</p>
                                </div>
                            </Grow>
                        ))}
                    </div>
                  </section>
                )}

                {/* Songs Section */}
                {tracks.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Popular Songs</h2>
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                      {/* Table Header */}
                      <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-4 border-b border-white/10 text-sm font-medium text-gray-400 uppercase tracking-wider bg-white/5">
                        <div className="w-8 text-center">#</div>
                        <div>Title</div>
                        <div className="hidden md:block">Album</div>
                        <div className="text-right"><AccessTime fontSize="small" /></div>
                        <div className="w-8"></div>
                      </div>
                      
                      {/* Rows */}
                      {tracks.map((track, index) => (
                        <div 
                          key={track.id}
                          className="group grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-3 hover:bg-white/10 items-center transition-colors cursor-pointer border-b border-white/5 last:border-0"
                          onClick={() => handleTrackPlay(track)}
                        >
                          <div className="w-8 text-center flex justify-center items-center text-gray-400 font-medium">
                            <span className="group-hover:hidden">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <img 
                                  src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" 
                                  alt="playing" 
                                  className="w-3 h-3"
                                />
                              ) : (
                                <span className={currentTrack?.id === track.id ? 'text-green-500' : ''}>{index + 1}</span>
                              )}
                            </span>
                            <button className="hidden group-hover:block text-white">
                              {currentTrack?.id === track.id && isPlaying ? <Pause sx={{ fontSize: 16 }} /> : <PlayArrow sx={{ fontSize: 16 }} />}
                            </button>
                          </div>
                          <div className="flex items-center gap-4 overflow-hidden">
                            <img 
                              src={track.album?.images?.[0]?.url} 
                              alt="" 
                              className="w-12 h-12 rounded shadow-md group-hover:shadow-lg transition-shadow"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate group-hover:text-green-400 transition-colors text-base">
                                {track.name}
                              </div>
                              <div className="text-sm text-gray-400 truncate group-hover:text-gray-300">
                                {track.artists.map(a => a.name).join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:block text-sm text-gray-400 truncate group-hover:text-gray-300">
                            {track.album.name}
                          </div>
                          <div className="text-sm text-gray-400 font-mono text-right group-hover:text-gray-300">
                            {Math.floor(track.duration_ms / 60000)}:
                            {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                          </div>
                          <button
                            onClick={(e) => handleTrackMenuOpen(e, track)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all w-8"
                          >
                            <MoreVert sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Playlists Section */}
                {playlists.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Related Playlists</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {playlists.map((playlist, index) => (
                        <Grow in timeout={300 + (index % 10) * 50} key={playlist.id}>
                            <div 
                            className="group p-4 rounded-xl bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl relative"
                            onClick={() => handlePlaylistPlay(playlist)}
                            >
                            <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
                                <img 
                                src={playlist.images?.[0]?.url || '/vite.svg'} 
                                alt={playlist.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 translate-y-2 group-hover:translate-y-0 duration-300">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                                        <PlayArrow sx={{ fontSize: 28, color: 'white' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-white truncate mb-1 group-hover:text-green-400 transition-colors flex-1">
                                  {playlist.name}
                              </h3>
                              <button
                                onClick={(e) => handlePlaylistMenuOpen(e, playlist)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                              >
                                <MoreVert sx={{ fontSize: 18 }} />
                              </button>
                            </div>
                            <p className="text-sm text-gray-400 truncate line-clamp-2">
                                By {playlist.owner.display_name}
                            </p>
                            </div>
                        </Grow>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Track Menu */}
      <TrackMenu
        anchorEl={trackMenuAnchor}
        open={Boolean(trackMenuAnchor)}
        onClose={handleTrackMenuClose}
        track={selectedTrack}
      />

      {/* Playlist Menu */}
      <PlaylistMenu
        anchorEl={playlistMenuAnchor}
        open={Boolean(playlistMenuAnchor)}
        onClose={handlePlaylistMenuClose}
        playlist={selectedPlaylist}
      />
    </div>
  );
};

export default Category;
