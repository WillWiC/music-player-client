import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { useSpotifyApi, buildSpotifyUrl } from '../hooks/useSpotifyApi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress, IconButton, Fade, Grow, Typography } from '@mui/material';
import { PlayArrow, ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { usePlayer } from '../context/player';
import { getCategoryById, mapGenresToCategories, getCategorySearchTerms, type CustomCategory } from '../utils/categoryMapping';
import { formatCount } from '../utils/numberFormat';

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
  const { play } = usePlayer();
  
  const [category, setCategory] = React.useState<CustomCategory | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [artistStart, setArtistStart] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(5);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const isLoadingRef = React.useRef(false);

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.8s ease-out forwards;
      }
      .animate-fade-in > * {
        animation: fade-in 0.6s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      // Always show 5 artists per row as requested
      setVisibleCount(5);
      // Reset artist start if it's beyond valid range
      setArtistStart(prev => Math.min(prev, Math.max(0, artists.length - 5)));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [artists.length]);  // Compute per-item pixel width accounting for gap and padding when containerWidth is known
  const maxArtistStart = React.useMemo(() => {
    // Compute start index for the last page using non-overlapping pages.
    // This allows the final page to contain fewer than `visibleCount` items
    // instead of backfilling from the previous page.
    const pages = Math.ceil(artists.length / Math.max(1, visibleCount));
    return Math.max(0, (pages - 1) * visibleCount);
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
      const searchTerms = getCategorySearchTerms(categoryId!);
      const genreSearches = searchTerms.slice(0, 4); // Use optimized terms
      
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
            limit: 12
          });
          
          const playlistUrl = buildSpotifyUrl('search', {
            q: genre,
            type: 'playlist', 
            limit: 12
          });
          
          const trackUrl = buildSpotifyUrl('search', {
            q: trackQuery,
            type: 'track',
            limit: 18
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
          genrePatterns: string[];
          namePatterns?: RegExp[];
          excludePatterns?: string[];
          qualityThreshold: number;
        }> = {
          'kpop': {
            minPopularity: 35,
            minFollowers: 80000,
            genrePatterns: ['k-pop', 'k-rap', 'korean', 'k pop', 'kpop'],
            namePatterns: [hangulRegex],
            excludePatterns: ['j-pop', 'japanese', 'mandopop', 'cantopop'],
            qualityThreshold: 150
          },
          'chinese-pop': {
            minPopularity: 30,
            minFollowers: 40000,
            genrePatterns: ['mandopop', 'cantopop', 'chinese', 'cpop', 'mandarin', 'cantonese', 'taiwan'],
            namePatterns: [cjkRegex],
            excludePatterns: ['k-pop', 'j-pop', 'japanese', 'korean'],
            qualityThreshold: 120
          },
          'pop': {
            minPopularity: 40,
            minFollowers: 150000,
            genrePatterns: ['pop', 'dance pop', 'electropop', 'synth-pop', 'indie pop'],
            excludePatterns: ['k-pop', 'mandopop', 'cantopop', 'hip hop', 'rap', 'rock', 'metal', 'country'],
            qualityThreshold: 180
          },
          'hiphop': {
            minPopularity: 32,
            minFollowers: 80000,
            genrePatterns: ['hip hop', 'rap', 'trap', 'hip-hop', 'drill', 'grime'],
            excludePatterns: ['k-rap', 'pop rap'],
            qualityThreshold: 140
          },
          'edm': {
            minPopularity: 28,
            minFollowers: 40000,
            genrePatterns: ['edm', 'electronic', 'house', 'techno', 'trance', 'dubstep', 'electro', 'dance'],
            excludePatterns: [],
            qualityThreshold: 120
          },
          'rock': {
            minPopularity: 30,
            minFollowers: 60000,
            genrePatterns: ['rock', 'metal', 'punk', 'grunge', 'alternative rock'],
            excludePatterns: ['pop rock'],
            qualityThreshold: 130
          },
          'indie': {
            minPopularity: 22,
            minFollowers: 20000,
            genrePatterns: ['indie', 'alternative', 'lo-fi', 'bedroom pop', 'dream pop', 'shoegaze'],
            excludePatterns: [],
            qualityThreshold: 100
          },
          'jazz': {
            minPopularity: 18,
            minFollowers: 10000,
            genrePatterns: ['jazz', 'bebop', 'swing', 'fusion', 'blues', 'smooth jazz'],
            excludePatterns: [],
            qualityThreshold: 90
          },
          'rnb': {
            minPopularity: 32,
            minFollowers: 70000,
            genrePatterns: ['r&b', 'soul', 'neo soul', 'funk', 'motown', 'rnb'],
            excludePatterns: [],
            qualityThreshold: 130
          },
          'latin': {
            minPopularity: 32,
            minFollowers: 80000,
            genrePatterns: ['latin', 'reggaeton', 'salsa', 'bachata', 'merengue', 'cumbia', 'spanish'],
            excludePatterns: [],
            qualityThreshold: 130
          },
          'country': {
            minPopularity: 28,
            minFollowers: 40000,
            genrePatterns: ['country', 'folk', 'americana', 'bluegrass', 'western'],
            excludePatterns: [],
            qualityThreshold: 110
          },
          'classical': {
            minPopularity: 15,
            minFollowers: 5000,
            genrePatterns: ['classical', 'orchestral', 'opera', 'baroque', 'symphony', 'chamber'],
            excludePatterns: [],
            qualityThreshold: 80
          }
        };
        
        const config = categoryConfig[categoryId!] || {
          minPopularity: 25,
          minFollowers: 30000,
          genrePatterns: [],
          qualityThreshold: 100
        };
        
        const scoreArtist = (artist: Artist) => {
          let score = 0;
          const genres = (artist.genres || []).map(g => g.toLowerCase());
          const popularity = artist.popularity || 0;
          const followers = artist.followers?.total || 0;
          
          // STRICT CATEGORY RELEVANCE CHECK
          let hasRelevantGenre = false;
          let hasRelevantName = false;
          let hasExcludedGenre = false;
          
          // Check genre patterns
          for (const pattern of config.genrePatterns) {
            if (genres.some(g => g.includes(pattern))) {
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
          
          for (const pattern of config.genrePatterns) {
            for (const genre of genres) {
              if (genre === pattern) {
                exactMatches++;
              } else if (genre.includes(pattern)) {
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
                Music Category
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(156, 163, 175, 1)', mb: 4 }}>
                Sign in to explore this music category
              </Typography>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative w-full py-10 px-6 sm:px-8 lg:px-12">
          
          {/* Back Button */}
          <div className="mb-8">
            <IconButton 
              onClick={() => navigate('/browse')}
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'translateX(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                },
                transition: 'all 0.3s ease',
                width: 48,
                height: 48
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </div>

          {/* Category Header */}
          {category && (
            <Fade in timeout={600}>
              <div className="mb-12 flex items-center gap-8">
              <div 
                className="w-40 h-40 rounded-2xl flex items-center justify-center text-7xl shadow-2xl transition-transform duration-300 hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}, ${category.color}80)`,
                  boxShadow: `0 20px 40px ${category.color}20`
                }}
              >
                <div style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Segoe UI"' }}>
                  {category.icon}
                </div>
              </div>
              <div className="flex-1">
                <Typography variant="h2" sx={{ 
                  fontWeight: 900, 
                  color: 'white', 
                  mb: 1.5,
                  fontSize: '3rem',
                  background: 'linear-gradient(135deg, #fff 0%, rgba(156, 163, 175, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {category.name}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(209, 213, 219, 1)', mb: 2, fontSize: '1.25rem' }}>
                  Discover the best music in this category
                </Typography>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>🎵 Artists</span>
                  <span>•</span>
                  <span>🎧 Songs</span>
                  <span>•</span>
                  <span>📱 Playlists</span>
                </div>
              </div>
            </div>
            </Fade>
          )}

          {/* Loading State */}
          {loadingPlaylists && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <CircularProgress 
                  size={80} 
                  thickness={4}
                  sx={{ 
                    color: category?.color || '#22c55e',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }} 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl animate-pulse" style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Segoe UI"' }}>
                    {category?.icon || '🎵'}
                  </div>
                </div>
              </div>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'white', mt: 3, mb: 1 }}>
                Loading {category?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(156, 163, 175, 1)', textAlign: 'center', maxWidth: '28rem' }}>
                Discovering the best artists, songs, and playlists for you...
              </Typography>
            </div>
          )}

          {/* Error State */}
          {error && !loadingPlaylists && (
            <div className="text-center py-24">
              <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-500/30 rounded-3xl p-10 max-w-lg mx-auto backdrop-blur-sm">
                <div className="text-6xl mb-4">😔</div>
                <Typography variant="h5" sx={{ color: '#fca5a5', fontWeight: 700, mb: 1.5 }}>
                  Something went wrong
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(209, 213, 219, 1)', mb: 3, lineHeight: 1.75 }}>
                  {error}
                </Typography>
                <button 
                  onClick={() => {
                    fetchCategoryContent();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Content Sections - Always show all sections with content */}
          {!loadingPlaylists && !error && (
            <div className="space-y-16">
              
              {/* Popular Artists Section - carousel (no horizontal scroll) */}
              {artists.length > 0 && (
                <div className="animate-fade-in">
                  <Fade in timeout={600}>
                    <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 900, 
                          mb: 1,
                          fontSize: '2.5rem',
                          background: 'linear-gradient(135deg, #fff 0%, rgba(156, 163, 175, 1) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                          Recently Popular Artists
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(209, 213, 219, 1)', fontSize: '1.125rem' }}>
                          Top performers in {category?.name}
                        </Typography>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                        <div className="text-3xl opacity-60">{category?.icon}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-400 bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="text-green-400 font-semibold">{artists.length}</span> artists
                        {/* Debug info - remove in production */}
                        <span className="ml-2 text-xs opacity-60">
                          ({artistStart + 1}-{Math.min(artistStart + visibleCount, artists.length)} showing)
                        </span>
                      </div>
                      {/* keyboard hint removed as per design preference */}
                    </div>
                  </div>
                  </Fade>

                  <div 
                    className="relative"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setArtistStart(s => Math.min(s + visibleCount, maxArtistStart));
                      if (e.key === 'ArrowLeft') setArtistStart(s => Math.max(0, s - visibleCount));
                    }}
                  >
                    <div className="absolute left-0 top-0 h-full w-20 z-20 flex items-center justify-center pointer-events-auto">
                      <div className="w-full h-full flex items-center justify-center group">
                        <IconButton
                          aria-label="Previous Artists"
                          onClick={() => setArtistStart(s => Math.max(0, s - visibleCount))}
                          disabled={artistStart <= 0}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          sx={{
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            transition: 'all 0.25s ease',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.82), rgba(0,0,0,0.6))',
                              transform: 'translateX(-4px) scale(1.02)'
                            },
                            '&.Mui-disabled': {
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.15))',
                              color: 'rgba(255,255,255,0.3)'
                            }
                          }}
                        >
                          <ChevronLeft sx={{ color: artistStart <= 0 ? 'rgba(255,255,255,0.3)' : 'white', fontSize: 24 }} />
                        </IconButton>
                      </div>
                    </div>

                    <div className="overflow-hidden px-8 py-4 bg-gradient-to-r from-white/[0.02] to-white/[0.05] rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl" ref={viewportRef}>
                      <div className="grid grid-cols-5 gap-6">
                        {artists.slice(artistStart, artistStart + visibleCount).map((artist, index) => (
                          <Grow key={artist.id} in timeout={400 + (index * 50)}>
                            <div
                              className="group cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-105"
                              onClick={() => handleArtistPlay(artist)}
                            >
                            <div className="relative mb-4">
                              <div
                                className="relative overflow-hidden rounded-full bg-gradient-to-br from-white/20 via-white/10 to-white/5 border-2 border-white/20 transition-all duration-500 shadow-2xl group-hover:shadow-green-500/25 group-hover:border-green-400/50 group-hover:scale-110"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                }}
                              >
                                <img 
                                  src={artist.images?.[0]?.url || '/vite.svg'} 
                                  alt={artist.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                                  <div className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110">
                                    <PlayArrow sx={{ fontSize: '28px' }} />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Popularity indicator */}
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                {artist.popularity || 0}
                              </div>
                            </div>
                            
                            <div className="text-center max-w-full">
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: 'white',
                                  fontWeight: 700,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  cursor: 'pointer',
                                  transition: 'color 0.3s',
                                  '&:hover': {
                                    color: '#86efac'
                                  }
                                }}
                                role="link"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); navigate(`/artist/${artist.id}`); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); navigate(`/artist/${artist.id}`); } }}
                              >
                                {artist.name}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 1, 
                                color: 'rgba(156, 163, 175, 1)' 
                              }}>
                                <span>{artist.followers ? formatCount(artist.followers.total) : '0'} followers</span>
                                {artist.genres && artist.genres.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-20">{artist.genres[0]}</span>
                                  </>
                                )}
                              </Typography>
                            </div>
                          </div>
                          </Grow>
                        ))}
                      </div>
                    </div>

                    <div className="absolute right-0 top-0 h-full w-20 z-20 flex items-center justify-center pointer-events-auto">
                      <div className="w-full h-full flex items-center justify-center group">
                        <IconButton
                          aria-label="Next Artists"
                          onClick={() => setArtistStart(s => Math.min(s + visibleCount, maxArtistStart))}
                          disabled={artistStart >= maxArtistStart}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          sx={{
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            transition: 'all 0.25s ease',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0.82))',
                              transform: 'translateX(4px) scale(1.02)'
                            },
                            '&.Mui-disabled': {
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))',
                              color: 'rgba(255,255,255,0.3)'
                            }
                          }}
                        >
                          <ChevronRight sx={{ color: artistStart >= maxArtistStart ? 'rgba(255,255,255,0.3)' : 'white', fontSize: 24 }} />
                        </IconButton>
                      </div>
                    </div>
                    
                    {/* Page indicators */}
                    {Math.ceil(artists.length / visibleCount) > 1 && (
                      <div className="flex justify-center mt-6 gap-2">
                        {Array.from({ length: Math.ceil(artists.length / visibleCount) }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setArtistStart(i * visibleCount)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              Math.floor(artistStart / visibleCount) === i
                                ? 'bg-green-400 w-8 shadow-lg shadow-green-400/50'
                                : 'bg-white/30 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Popular Songs Section */}
              {tracks.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', mb: 1, fontSize: '2.25rem' }}>
                        Popular Songs
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(156, 163, 175, 1)' }}>
                        Trending tracks in {category?.name}
                      </Typography>
                    </div>
                    <div className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {tracks.length} songs
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
                    <div className="space-y-2">
                      {tracks.map((track, index) => (
                        <div 
                          key={track.id}
                          className="group cursor-pointer flex items-center gap-6 p-4 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                          onClick={() => handleTrackPlay(track)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Track Number */}
                          <div className="w-10 text-center">
                            <span className="text-gray-400 font-semibold group-hover:hidden">
                              {index + 1}
                            </span>
                            <IconButton
                              size="small"
                              className="hidden group-hover:flex transform transition-transform hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackPlay(track);
                              }}
                              sx={{ 
                                color: '#22c55e',
                                '&:hover': {
                                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                                }
                              }}
                            >
                              <PlayArrow sx={{ fontSize: 22 }} />
                            </IconButton>
                          </div>

                          {/* Album Art */}
                          <div className="relative">
                            <img 
                              src={track.album?.images?.[0]?.url || '/vite.svg'} 
                              alt={track.name}
                              className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                          </div>

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base truncate group-hover:text-green-400 transition-colors duration-300 mb-1">
                              {track.name}
                            </h3>
                            <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">
                              {track.artists?.map(artist => artist.name).join(', ')}
                            </p>
                          </div>

                          {/* Album Name */}
                          <div className="hidden lg:block flex-1 min-w-0">
                            <p className="text-gray-500 text-sm truncate group-hover:text-gray-400 transition-colors">
                              {track.album?.name}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="text-gray-500 text-sm font-mono group-hover:text-green-400 transition-colors">
                            {Math.floor(track.duration_ms / 60000)}:
                            {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                          </div>

                          {/* Track Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <IconButton
                              size="small"
                              sx={{ 
                                color: 'rgba(255,255,255,0.6)',
                                '&:hover': { color: '#22c55e' }
                              }}
                            >
                              <span className="text-xs">♡</span>
                            </IconButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Related Playlists Section */}
              {playlists.length > 0 && (
                <div className="animate-fade-in">
                  <Fade in timeout={600}>
                    <div className="flex items-center justify-between mb-8">
                    <div>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', mb: 1, fontSize: '2.25rem' }}>
                        Related Playlists
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(156, 163, 175, 1)' }}>
                        Curated collections for {category?.name} lovers
                      </Typography>
                    </div>
                    <div className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {playlists.length} playlists
                    </div>
                  </div>
                  </Fade>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {playlists.map((playlist, index) => (
                      <Grow key={playlist.id} in timeout={400 + (index * 50)}>
                        <div 
                          className="group cursor-pointer relative transform transition-all duration-300 hover:scale-105"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm">
                          
                          {/* Playlist Image */}
                          <div className="aspect-square relative">
                            <img 
                              src={playlist.images?.[0]?.url || '/vite.svg'} 
                              alt={playlist.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaylistPlay(playlist);
                              }}
                              sx={{
                                bgcolor: '#22c55e',
                                color: 'black',
                                '&:hover': { 
                                  bgcolor: '#16a34a', 
                                  transform: 'scale(1.2)',
                                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
                                },
                                width: 64,
                                height: 64,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <PlayArrow sx={{ fontSize: 32 }} />
                            </IconButton>
                          </div>

                          {/* Track Count Badge */}
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {playlist.tracks?.total} tracks
                          </div>
                        </div>
                        
                        {/* Playlist Info */}
                        <div className="mt-4 px-1">
                          <Typography variant="subtitle2" sx={{ 
                            color: 'white', 
                            fontWeight: 700, 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 1,
                            transition: 'color 0.3s',
                            '.group:hover &': {
                              color: '#86efac'
                            }
                          }}>
                            {playlist.name}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(107, 114, 128, 1)', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            lineHeight: 1.75,
                            mb: 0.5
                          }}>
                            {playlist.description || `Curated by ${playlist.owner?.display_name}`}
                          </Typography>
                          <div className="flex items-center justify-between">
                            <Typography variant="caption" sx={{ color: 'rgba(75, 85, 99, 1)' }}>
                              By {playlist.owner?.display_name}
                            </Typography>
                            {playlist.tracks?.total && playlist.tracks.total > 50 && (
                              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                MEGA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      </Grow>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}

          {/* No Content State */}
          {!loadingPlaylists && !error && playlists.length === 0 && artists.length === 0 && tracks.length === 0 && category && (
            <div className="text-center py-32">
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 max-w-lg mx-auto backdrop-blur-sm border border-white/10 shadow-2xl">
                <div className="text-8xl mb-6 opacity-50">
                  <span style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Segoe UI"' }}>
                    {category.icon}
                  </span>
                </div>
                <Typography variant="h5" sx={{ color: 'rgba(209, 213, 219, 1)', fontWeight: 700, mb: 1.5 }}>
                  No content available
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(107, 114, 128, 1)', mb: 4, lineHeight: 1.75 }}>
                  We couldn't find any artists, songs, or playlists for {category.name} right now.
                </Typography>
                <div className="space-y-3">
                  <button 
                    onClick={fetchCategoryContent}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => navigate('/browse')}
                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
                  >
                    Browse Other Categories
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Category;
