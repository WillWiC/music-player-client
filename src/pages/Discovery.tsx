import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import type { Album, Playlist, Category, Track, Artist } from '../types/spotify';

interface FeaturedPlaylist extends Playlist {
  message?: string;
}

const Discovery: React.FC = () => {
  const navigate = useNavigate();
  const { token, isLoading: authLoading, isGuest } = useAuth();
  const { play } = usePlayer();
  const toast = useToast();
  
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Data states
  const [featuredPlaylists, setFeaturedPlaylists] = React.useState<FeaturedPlaylist[]>([]);
  const [newReleases, setNewReleases] = React.useState<Album[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [recommendations, setRecommendations] = React.useState<Track[]>([]);
  const [topArtists, setTopArtists] = React.useState<Artist[]>([]);
  const [userPlaylists, setUserPlaylists] = React.useState<Playlist[]>([]);
  const [userTopTracks, setUserTopTracks] = React.useState<Track[]>([]);
  
  // Loading states
  const [loadingFeatured, setLoadingFeatured] = React.useState(false);
  const [loadingReleases, setLoadingReleases] = React.useState(false);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = React.useState(false);
  const [loadingArtists, setLoadingArtists] = React.useState(false);
  
  // Error states
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});
  
  // UI states
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<'short_term' | 'medium_term' | 'long_term'>('short_term');
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);

  // Available genres for recommendations
  const availableGenres = [
    'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues', 'bossanova', 'brazil', 
    'breakbeat', 'british', 'chill', 'classical', 'club', 'country', 'dance', 'dancehall', 
    'deep-house', 'disco', 'drum-and-bass', 'dub', 'dubstep', 'edm', 'electronic', 'folk', 
    'funk', 'garage', 'gospel', 'groove', 'grunge', 'hip-hop', 'house', 'indie', 'jazz', 
    'latin', 'metal', 'pop', 'punk', 'r-n-b', 'reggae', 'rock', 'soul', 'techno', 'trance'
  ];

  // Local algorithm to generate recommendations based on user data
  const generateLocalRecommendations = React.useCallback((topTracks: Track[], topArtists: Artist[], selectedGenres: string[]) => {
    console.log('Generating local recommendations...');
    const recommendations: Track[] = [];
    
    // Algorithm 1: Tracks from top artists (artist similarity)
    topArtists.slice(0, 3).forEach(artist => {
      const artistTracks = topTracks.filter(track => 
        track.artists.some(trackArtist => trackArtist.id === artist.id)
      );
      recommendations.push(...artistTracks.slice(0, 2));
    });
    
    // Algorithm 2: Tracks with similar genres to selected genres
    if (selectedGenres.length > 0) {
      const genreMatches = topTracks.filter(track => {
        const trackGenres = track.artists.flatMap(artist => artist.genres || []);
        return selectedGenres.some(selectedGenre => 
          trackGenres.some(trackGenre => 
            trackGenre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
            selectedGenre.toLowerCase().includes(trackGenre.toLowerCase())
          )
        );
      });
      recommendations.push(...genreMatches.slice(0, 5));
    }
    
    // Algorithm 3: Random selection from top tracks (exploration)
    const shuffledTopTracks = [...topTracks].sort(() => Math.random() - 0.5);
    recommendations.push(...shuffledTopTracks.slice(0, 8));
    
    // Remove duplicates and return limited set
    const uniqueRecommendations = recommendations.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );
    
    console.log('Generated', uniqueRecommendations.length, 'local recommendations');
    return uniqueRecommendations.slice(0, 15);
  }, []);

  // Local algorithm to create featured playlists from user data
  const generateLocalFeaturedPlaylists = React.useCallback((userPlaylists: Playlist[], topArtists: Artist[]) => {
    console.log('Generating local featured playlists...');
    const featured: FeaturedPlaylist[] = [];
    
    // Algorithm 1: User's most listened playlists (by track count as proxy)
    const popularUserPlaylists = userPlaylists
      .filter(playlist => playlist.tracks?.total && playlist.tracks.total > 10)
      .sort((a, b) => (b.tracks?.total || 0) - (a.tracks?.total || 0))
      .slice(0, 3)
      .map(playlist => ({
        ...playlist,
        message: 'From your library'
      }));
    
    featured.push(...popularUserPlaylists);
    
    // Algorithm 2: Create genre-based virtual playlists
    const genrePlaylists = selectedGenres.slice(0, 2).map((genre, index) => ({
      id: `local-genre-${genre}-${index}`,
      name: `Best of ${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
      description: `Top ${genre} tracks curated for you`,
      images: [{ url: '/api/placeholder/300/300', height: 300, width: 300 }],
      tracks: { 
        total: 25,
        href: '',
        limit: 25,
        next: null,
        offset: 0,
        previous: null
      },
      owner: { 
        id: 'local', 
        display_name: 'Music Player',
        external_urls: { spotify: '' },
        href: '',
        type: 'user' as const,
        uri: ''
      },
      public: true,
      collaborative: false,
      message: 'AI Generated Playlist',
      external_urls: { spotify: '' },
      followers: { href: null, total: 0 },
      href: '',
      snapshot_id: '',
      type: 'playlist' as const,
      uri: ''
    }));
    
    featured.push(...genrePlaylists);
    
    // Algorithm 3: Create artist-based virtual playlists
    const artistPlaylists = topArtists.slice(0, 2).map((artist, index) => ({
      id: `local-artist-${artist.id}-${index}`,
      name: `${artist.name} & Similar Artists`,
      description: `Discover more music like ${artist.name}`,
      images: artist.images || [{ url: '/api/placeholder/300/300', height: 300, width: 300 }],
      tracks: { 
        total: 30,
        href: '',
        limit: 30,
        next: null,
        offset: 0,
        previous: null
      },
      owner: { 
        id: 'local', 
        display_name: 'Music Player',
        external_urls: { spotify: '' },
        href: '',
        type: 'user' as const,
        uri: ''
      },
      public: true,
      collaborative: false,
      message: 'Based on your top artists',
      external_urls: { spotify: '' },
      followers: { href: null, total: 0 },
      href: '',
      snapshot_id: '',
      type: 'playlist' as const,
      uri: ''
    }));
    
    featured.push(...artistPlaylists);
    
    console.log('Generated', featured.length, 'local featured playlists');
    return featured.slice(0, 8);
  }, [selectedGenres]);

  // Helper function to handle API errors
  const handleApiError = (error: unknown, section: string) => {
    console.error(`Failed to load ${section}:`, error);
    let errorMessage = `Failed to load ${section}. Please try again.`;
    
    if (error instanceof Error) {
      if (error.message.includes('HTTP 401')) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (error.message.includes('HTTP 403')) {
        errorMessage = 'Access denied. Please check your Spotify permissions.';
      } else if (error.message.includes('HTTP 429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Spotify server error. Please try again later.';
      }
    }
    
    setErrors(prev => ({ ...prev, [section]: errorMessage }));
    toast.showToast(errorMessage, 'error');
  };

  // Format time range for display
  const formatTimeRange = (range: string) => {
    switch (range) {
      case 'short_term': return 'Last Month';
      case 'medium_term': return 'Last 6 Months';
      case 'long_term': return 'All Time';
      default: return range;
    }
  };

  // Fetch user playlists for local algorithm
  const fetchUserPlaylists = React.useCallback(async () => {
    if (!token) return;
    
    try {
      console.log('Fetching user playlists...');
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPlaylists(data.items || []);
        console.log('Fetched', data.items?.length || 0, 'user playlists');
      }
    } catch (error) {
      console.error('Failed to fetch user playlists:', error);
    }
  }, [token]);

  // Fetch user top tracks for local algorithm
  const fetchUserTopTracks = React.useCallback(async () => {
    if (!token) return;
    
    try {
      console.log('Fetching user top tracks...');
      const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${selectedTimeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTopTracks(data.items || []);
        console.log('Fetched', data.items?.length || 0, 'user top tracks');
      }
    } catch (error) {
      console.error('Failed to fetch user top tracks:', error);
    }
  }, [token, selectedTimeRange]);

  // Replace Spotify API with local featured playlists algorithm
  const fetchFeaturedPlaylists = React.useCallback(async () => {
    if (!token || loadingFeatured) return;
    
    setLoadingFeatured(true);
    try {
      console.log('Generating local featured playlists...');
      
      // Wait for user data if not available yet
      if (userPlaylists.length === 0) {
        await fetchUserPlaylists();
      }
      
      const localFeatured = generateLocalFeaturedPlaylists(userPlaylists, topArtists);
      setFeaturedPlaylists(localFeatured);
      setErrors(prev => ({ ...prev, featured: '' }));
      
      console.log('Successfully generated', localFeatured.length, 'local featured playlists');
    } catch (error) {
      handleApiError(error, 'featured playlists');
    } finally {
      setLoadingFeatured(false);
    }
  }, [token, loadingFeatured, userPlaylists, topArtists, generateLocalFeaturedPlaylists, fetchUserPlaylists]);

  // Replace Spotify API with local recommendations algorithm  
  const fetchRecommendations = React.useCallback(async () => {
    if (!token || loadingRecommendations) return;
    
    setLoadingRecommendations(true);
    try {
      console.log('Generating local recommendations...');
      
      // Wait for user data if not available yet
      if (userTopTracks.length === 0) {
        await fetchUserTopTracks();
      }
      
      const localRecommendations = generateLocalRecommendations(userTopTracks, topArtists, selectedGenres);
      setRecommendations(localRecommendations);
      setErrors(prev => ({ ...prev, recommendations: '' }));
      
      console.log('Successfully generated', localRecommendations.length, 'local recommendations');
    } catch (error) {
      handleApiError(error, 'recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  }, [token, loadingRecommendations, userTopTracks, topArtists, selectedGenres, generateLocalRecommendations, fetchUserTopTracks]);

  // Fetch new releases
  const fetchNewReleases = React.useCallback(async () => {
    if (!token || loadingReleases) return;
    
    setLoadingReleases(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=12', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setNewReleases(data.albums?.items || []);
      setErrors(prev => ({ ...prev, releases: '' }));
    } catch (error) {
      handleApiError(error, 'new releases');
    } finally {
      setLoadingReleases(false);
    }
  }, [token, loadingReleases]);

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    if (!token || loadingCategories) return;
    
    setLoadingCategories(true);
    try {
      const response = await fetch('https://api.spotify.com/v1/browse/categories?limit=12', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setCategories(data.categories?.items || []);
      setErrors(prev => ({ ...prev, categories: '' }));
    } catch (error) {
      handleApiError(error, 'categories');
    } finally {
      setLoadingCategories(false);
    }
  }, [token, loadingCategories]);

  // Fetch top artists
  const fetchTopArtists = React.useCallback(async () => {
    if (!token || loadingArtists) return;
    
    setLoadingArtists(true);
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=8&time_range=${selectedTimeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setTopArtists(data.items || []);
      setErrors(prev => ({ ...prev, artists: '' }));
    } catch (error) {
      handleApiError(error, 'top artists');
    } finally {
      setLoadingArtists(false);
    }
  }, [token, selectedTimeRange, loadingArtists]);

  // Handle genre selection with optimized state update
  const toggleGenre = React.useCallback((genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else if (prev.length < 5) { // Spotify allows max 5 seeds total
        return [...prev, genre];
      }
      return prev;
    });
  }, []);

  // Memoized loading skeleton component
  const LoadingSkeleton = React.memo(({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg ${className}`} />
  ));

  // Memoized error message component
  const ErrorMessage = React.memo(({ message }: { message: string }) => (
    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-center">
      <p className="text-red-100">{message}</p>
    </div>
  ));

  // Fetch data on mount and when dependencies change - staggered loading
  React.useEffect(() => {
    if (authLoading) return;

    // If neither token nor guest, don't proceed with fetching user-specific data
    if (!token && !isGuest) {
      console.log('No token and not guest - Discovery will show sign-in CTA');
      return;
    }

    console.log('Token available, starting data fetch...');
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token starts with:', token.substring(0, 20) + '...');
    }

    // Load user data first (required for local algorithms)
    const loadInitialData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchTopArtists(),
        fetchUserPlaylists(),
        fetchUserTopTracks()
      ]);
      
      // Then load heavy data with slight delays
      setTimeout(() => fetchNewReleases(), 100);
      setTimeout(() => fetchFeaturedPlaylists(), 200);
    };

    loadInitialData();
  }, [token, authLoading, navigate]);

  // Fetch recommendations when user data or preferences change - with debouncing
  React.useEffect(() => {
    if (!token && !isGuest) return;
    
    const timeoutId = setTimeout(() => {
      if (topArtists.length > 0 || userTopTracks.length > 0 || selectedGenres.length > 0) {
        fetchRecommendations();
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [token, topArtists, userTopTracks, selectedGenres, fetchRecommendations]);

  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center">
        <CircularProgress style={{ color: '#1db954' }} />
      </div>
    );
  }

  // Allow guest users: show a lightweight prompt/cta when not authenticated
  if (!token && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center bg-white/3 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-3">Discover Music (Guest)</h1>
          <p className="text-gray-300 mb-6">Sign in to unlock personalized recommendations and your playlists — or continue exploring as a guest.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg"
            >
              Sign in
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-6 py-2 border border-white/10 text-white rounded-lg"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Discover Music</h1>
            <p className="text-xl text-gray-300">
              Fresh picks, curated playlists, and personalized recommendations just for you
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {(['short_term', 'medium_term', 'long_term'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {formatTimeRange(range)}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Customize Your Recommendations</h2>
            <p className="text-gray-300 mb-4">Select up to 5 genres to personalize your recommendations:</p>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <p className="text-green-400 mt-2">
                Selected: {selectedGenres.join(', ')} ({selectedGenres.length}/5)
              </p>
            )}
          </div>

          {/* Recommendations Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold">Recommended for You</h2>
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  AI Generated
                </span>
              </div>
              {errors.recommendations && (
                <button
                  onClick={() => {
                    setErrors(prev => ({ ...prev, recommendations: '' }));
                    fetchRecommendations();
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Personalized recommendations based on your listening history and selected genres
            </p>
            {loadingRecommendations ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="aspect-square" />
                ))}
              </div>
            ) : errors.recommendations ? (
              <ErrorMessage message={errors.recommendations} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recommendations.slice(0, 15).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => play(track)}
                    className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    <div className="aspect-square mb-2 relative">
                      <img
                        src={track.album?.images?.[0]?.url || '/vite.svg'}
                        alt={track.name}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate text-sm">{track.name}</h3>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Featured Playlists Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold">Featured Playlists</h2>
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  Curated
                </span>
              </div>
              {errors.featured && (
                <button
                  onClick={() => {
                    setErrors(prev => ({ ...prev, featured: '' }));
                    fetchFeaturedPlaylists();
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Smart playlists created from your music library and preferences
            </p>
            {loadingFeatured ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="aspect-square" />
                ))}
              </div>
            ) : errors.featured ? (
              <ErrorMessage message={errors.featured} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    <div className="aspect-square mb-2 relative">
                      <img
                        src={playlist.images[0]?.url || '/api/placeholder/300/300'}
                        alt={playlist.name}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate text-sm">{playlist.name}</h3>
                    <p className="text-gray-400 text-xs truncate">{playlist.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* New Releases Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">New Releases</h2>
            {loadingReleases ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="aspect-square" />
                ))}
              </div>
            ) : errors.releases ? (
              <ErrorMessage message={errors.releases} />
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {newReleases.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    <div className="aspect-square mb-2 relative">
                      <img
                        src={album.images[0]?.url || '/api/placeholder/300/300'}
                        alt={album.name}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate text-sm">{album.name}</h3>
                    <p className="text-gray-400 text-xs truncate">
                      {album.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Artists Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Top Artists - {formatTimeRange(selectedTimeRange)}</h2>
            {loadingArtists ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="aspect-square rounded-full" />
                ))}
              </div>
            ) : errors.artists ? (
              <ErrorMessage message={errors.artists} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {topArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="text-center cursor-pointer group"
                  >
                    <div className="aspect-square mb-2 relative">
                      <img
                        src={artist.images?.[0]?.url || '/api/placeholder/300/300'}
                        alt={artist.name}
                        className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-semibold text-white truncate group-hover:text-green-400 transition-colors text-sm">
                      {artist.name}
                    </h3>
                    <p className="text-gray-400 text-xs capitalize">{artist.genres?.[0] || 'Artist'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Browse Categories Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
            {loadingCategories ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <LoadingSkeleton key={index} className="aspect-video" />
                ))}
              </div>
            ) : errors.categories ? (
              <ErrorMessage message={errors.categories} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => navigate(`/category/${category.id}`)}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform"
                  >
                    <img
                      src={category.icons[0]?.url || '/api/placeholder/400/200'}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <h3 className="text-white font-bold text-base p-3 w-full text-center">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default Discovery;
