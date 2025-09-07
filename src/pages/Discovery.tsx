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
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-8">
              {/* Header Section */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Discover Music</h1>
                      <p className="text-lg text-gray-300">
                        AI-powered recommendations and curated playlists just for you
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-green-400 text-lg font-bold">{recommendations.length}</div>
                      <div className="text-gray-400 text-sm">Recommendations</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-purple-400 text-lg font-bold">{featuredPlaylists.length}</div>
                      <div className="text-gray-400 text-sm">Curated Playlists</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-yellow-400 text-lg font-bold">{selectedGenres.length}/5</div>
                      <div className="text-gray-400 text-sm">Genres Selected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Range & Genre Selection */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Time Range Selector */}
                <div className="bg-white/4 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Range
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {(['short_term', 'medium_term', 'long_term'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedTimeRange(range)}
                        className={`p-3 rounded-xl text-left transition-all duration-300 ${
                          selectedTimeRange === range
                            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium">{formatTimeRange(range)}</div>
                        <div className="text-xs opacity-70">
                          {range === 'short_term' && 'Recent listening patterns'}
                          {range === 'medium_term' && 'Your seasonal favorites'}
                          {range === 'long_term' && 'All-time preferences'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genre Selection */}
                <div className="bg-white/4 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M9 10v8m6-8v8" />
                    </svg>
                    Genres ({selectedGenres.length}/5)
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">Select up to 5 genres to personalize your recommendations</p>
                  
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {availableGenres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          disabled={!selectedGenres.includes(genre) && selectedGenres.length >= 5}
                          className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                            selectedGenres.includes(genre)
                              ? 'bg-purple-500/30 border border-purple-500/50 text-purple-200'
                              : !selectedGenres.includes(genre) && selectedGenres.length >= 5
                              ? 'bg-gray-800/50 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedGenres.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Selected genres:</span>
                        <button
                          onClick={() => setSelectedGenres([])}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedGenres.map((genre) => (
                          <span
                            key={genre}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md"
                          >
                            {genre}
                            <button
                              onClick={() => toggleGenre(genre)}
                              className="hover:text-purple-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 text-xs rounded-full backdrop-blur-sm">
                      AI Generated
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {loadingRecommendations && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </div>
                    )}
                    {errors.recommendations && (
                      <button
                        onClick={() => {
                          setErrors(prev => ({ ...prev, recommendations: '' }));
                          fetchRecommendations();
                        }}
                        className="px-3 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-all duration-300"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => fetchRecommendations()}
                      disabled={loadingRecommendations}
                      className="px-3 py-2 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 text-green-300 text-sm rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  AI-powered suggestions based on your listening history and selected genres
                </p>
                
                {loadingRecommendations ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                        <LoadingSkeleton className="aspect-square mb-3 rounded-lg" />
                        <LoadingSkeleton className="h-4 mb-2 rounded" />
                        <LoadingSkeleton className="h-3 w-3/4 rounded" />
                      </div>
                    ))}
                  </div>
                ) : errors.recommendations ? (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-red-300 font-medium">{errors.recommendations}</p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {recommendations.slice(0, 15).map((track) => (
                      <div
                        key={track.id}
                        onClick={() => play(track)}
                        className="group bg-white/4 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-green-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-102"
                      >
                        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={track.album?.images?.[0]?.url || '/vite.svg'}
                            alt={track.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-white truncate text-sm mb-1 group-hover:text-green-300 transition-colors">
                          {track.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate">
                          {track.artists.map(artist => artist.name).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                    <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 font-medium mb-2">No recommendations yet</p>
                    <p className="text-gray-400 text-sm mb-4">Select some genres and listen to more music to get personalized recommendations</p>
                    <button
                      onClick={() => fetchRecommendations()}
                      className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                    >
                      Generate Recommendations
                    </button>
                  </div>
                )}
              </section>

              {/* Featured Playlists Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-white">Featured Playlists</h2>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-full backdrop-blur-sm">
                      Curated
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {errors.featured && (
                      <button
                        onClick={() => {
                          setErrors(prev => ({ ...prev, featured: '' }));
                          fetchFeaturedPlaylists();
                        }}
                        className="px-3 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-all duration-300"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => fetchFeaturedPlaylists()}
                      disabled={loadingFeatured}
                      className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 text-sm rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Smart playlists created from your music library and preferences
                </p>
                
                {loadingFeatured ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                        <LoadingSkeleton className="aspect-square mb-3 rounded-lg" />
                        <LoadingSkeleton className="h-4 mb-2 rounded" />
                        <LoadingSkeleton className="h-3 w-3/4 rounded" />
                      </div>
                    ))}
                  </div>
                ) : errors.featured ? (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-red-300 font-medium">{errors.featured}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredPlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                        className="group bg-white/4 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-purple-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-102"
                      >
                        <div className="aspect-square mb-3 relative overflow-hidden rounded-lg">
                          <img
                            src={playlist.images[0]?.url || '/api/placeholder/300/300'}
                            alt={playlist.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          {playlist.message && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/80 text-white text-xs rounded-md backdrop-blur-sm">
                              {playlist.message}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-white truncate text-sm mb-1 group-hover:text-purple-300 transition-colors">
                          {playlist.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate">{playlist.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* New Releases Section */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">New Releases</h2>
                {loadingReleases ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                        <LoadingSkeleton className="aspect-square mb-2 rounded-lg" />
                        <LoadingSkeleton className="h-3 mb-1 rounded" />
                        <LoadingSkeleton className="h-3 w-2/3 rounded" />
                      </div>
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
                        className="group bg-white/4 border border-white/10 rounded-xl p-3 hover:bg-white/8 hover:border-blue-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-102"
                      >
                        <div className="aspect-square mb-2 relative overflow-hidden rounded-lg">
                          <img
                            src={album.images[0]?.url || '/api/placeholder/300/300'}
                            alt={album.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-white truncate text-sm mb-1 group-hover:text-blue-300 transition-colors">
                          {album.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate">
                          {album.artists.map(artist => artist.name).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Top Artists Section */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Your Top Artists - {formatTimeRange(selectedTimeRange)}</h2>
                {loadingArtists ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm text-center">
                        <LoadingSkeleton className="aspect-square mb-3 rounded-full mx-auto" />
                        <LoadingSkeleton className="h-4 mb-2 rounded mx-auto w-3/4" />
                        <LoadingSkeleton className="h-3 rounded mx-auto w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : errors.artists ? (
                  <ErrorMessage message={errors.artists} />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {topArtists.map((artist, index) => (
                      <div
                        key={artist.id}
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="group bg-white/4 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-102 text-center"
                      >
                        <div className="aspect-square mb-3 relative">
                          <img
                            src={artist.images?.[0]?.url || '/api/placeholder/300/300'}
                            alt={artist.name}
                            className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold shadow-lg">
                            {index + 1}
                          </div>
                        </div>
                        <h3 className="font-semibold text-white truncate group-hover:text-yellow-300 transition-colors text-sm mb-1">
                          {artist.name}
                        </h3>
                        <p className="text-gray-400 text-xs capitalize">{artist.genres?.[0] || 'Artist'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Browse Categories Section */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
                {loadingCategories ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <LoadingSkeleton key={index} className="aspect-video rounded-lg" />
                    ))}
                  </div>
                ) : errors.categories ? (
                  <ErrorMessage message={errors.categories} />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category, index) => {
                      const gradients = [
                        'from-purple-500 to-pink-500',
                        'from-blue-500 to-cyan-500', 
                        'from-green-500 to-teal-500',
                        'from-orange-500 to-red-500',
                        'from-indigo-500 to-purple-500',
                        'from-pink-500 to-rose-500'
                      ];
                      const gradient = gradients[index % gradients.length];
                      
                      return (
                        <div
                          key={category.id}
                          onClick={() => navigate(`/category/${category.id}`)}
                          className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-300 bg-gradient-to-br ${gradient} p-4 flex items-end shadow-lg hover:shadow-xl`}
                        >
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                          <h3 className="relative text-white font-bold text-base z-10">
                            {category.name}
                          </h3>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>{/* End main content column */}

            {/* Right Sidebar */}
            <aside className="w-full xl:w-80 space-y-6 sticky top-24">
              {/* Now Playing Card */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Discovery Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Time Range:</span>
                    <span className="text-green-300 text-sm font-medium">{formatTimeRange(selectedTimeRange)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Genres:</span>
                    <span className="text-purple-300 text-sm font-medium">{selectedGenres.length}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Recommendations:</span>
                    <span className="text-yellow-300 text-sm font-medium">{recommendations.length}</span>
                  </div>
                </div>
              </div>

              {/* Top Artists Quick View */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white mb-3">Your Top Artists</h3>
                {loadingArtists ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <LoadingSkeleton className="w-10 h-10 rounded-full" />
                        <LoadingSkeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topArtists.slice(0, 3).map((artist, index) => (
                      <div 
                        key={artist.id} 
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <div className="relative">
                          <img
                            src={artist.images?.[0]?.url || '/api/placeholder/40/40'}
                            alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-black font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate group-hover:text-green-300">
                            {artist.name}
                          </div>
                          <div className="text-xs text-gray-400 capitalize truncate">
                            {artist.genres?.[0] || 'Artist'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => fetchRecommendations()}
                    disabled={loadingRecommendations}
                    className="w-full flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-green-300 font-medium disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Recommendations
                  </button>
                  <button
                    onClick={() => navigate('/search')}
                    className="w-full flex items-center gap-3 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors text-purple-300 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Music
                  </button>
                  <button
                    onClick={() => setSelectedGenres([])}
                    disabled={selectedGenres.length === 0}
                    className="w-full flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-red-300 font-medium disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Genres
                  </button>
                </div>
              </div>
            </aside>

          </div>{/* End flex container */}
        </div>
      </main>
    </div>
  );
};

export default Discovery;
