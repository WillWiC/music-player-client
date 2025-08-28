import React from 'react';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useNavigate } from 'react-router-dom';
import type { User, Playlist, RecentlyPlayedItem, Track, Album, Category } from '../types/spotify';
import '../index.css';

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying, deviceId } = usePlayer();
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = React.useState<User | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<RecentlyPlayedItem[]>([]);
  const [topTracks, setTopTracks] = React.useState<Track[]>([]);
  const [newReleases, setNewReleases] = React.useState<Album[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [greeting, setGreeting] = React.useState('Good evening');
  
  // Enhanced loading states
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [loadingRecently, setLoadingRecently] = React.useState(false);
  const [loadingTop, setLoadingTop] = React.useState(false);
  const [loadingReleases, setLoadingReleases] = React.useState(false);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  
  // Error states and UI enhancements
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  
  // Horizontal scroll state for top tracks
  const [topTracksStartIndex, setTopTracksStartIndex] = React.useState(0);
  const [recentlyStartIndex, setRecentlyStartIndex] = React.useState(0);
  const tracksPerView = 4;
  // Removed unused showProfileDropdown state after layout overhaul

  // Helper function to format display name
  const formatDisplayName = (displayName: string) => {
    if (!displayName) return 'User';
    
    // If the name contains multiple words, take the last word (usually the first name in "Last First" format)
    const words = displayName.trim().split(' ');
    if (words.length > 1) {
      // Check if it looks like "Last First" format (common in some regions)
      // If the first word is longer, it's likely the last name, so use the second word
      if (words[0].length > words[1].length) {
        return words[1]; // Use the shorter word (likely first name)
      }
      // Otherwise use the first word
      return words[0];
    }
    
    return displayName;
  };

  // Navigation functions for horizontal scrolling
  const handleNextTracks = () => {
    const maxStartIndex = Math.max(0, topTracks.length - tracksPerView);
    setTopTracksStartIndex(prev => Math.min(prev + tracksPerView, maxStartIndex));
  };

  const handlePrevTracks = () => {
    setTopTracksStartIndex(prev => Math.max(prev - tracksPerView, 0));
  };

  const handleNextRecently = () => {
    const maxStartIndex = Math.max(0, recentlyPlayed.length - tracksPerView);
    setRecentlyStartIndex(prev => Math.min(prev + tracksPerView, maxStartIndex));
  };

  const handlePrevRecently = () => {
    setRecentlyStartIndex(prev => Math.max(prev - tracksPerView, 0));
  };

  const canGoNext = topTracksStartIndex + tracksPerView < topTracks.length;
  const canGoPrev = topTracksStartIndex > 0;
  const canGoNextRecently = recentlyStartIndex + tracksPerView < recentlyPlayed.length;
  const canGoPrevRecently = recentlyStartIndex > 0;

  React.useEffect(() => {
    console.log('Dashboard loaded, token:', !!token);
    
    // Redirect to login if no token
    if (!token) {
      console.log('No token found, redirecting to login...');
      navigate('/');
      return;
    }

    // Set dynamic greeting based on time with emoji
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('Late night vibes');
    else if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else if (hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');

    // Enhanced error handling function
    const handleApiError = (error: unknown, section: string) => {
      console.error(`Failed to load ${section}:`, error);
      setErrors(prev => ({ ...prev, [section]: `Failed to load ${section}. Please try again.` }));
    };

    // Fetch user profile
    fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('User profile loaded:', data.display_name);
        setUser(data);
        setErrors(prev => ({ ...prev, profile: '' }));
      })
      .catch((error) => handleApiError(error, 'profile'));

    // Fetch user's playlists
    setLoadingPlaylists(true);
    fetch('https://api.spotify.com/v1/me/playlists?limit=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          return fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=12', {
            headers: { Authorization: `Bearer ${token}` },
          }).then(fallbackRes => {
            if (!fallbackRes.ok) throw new Error(`Featured playlists also failed: HTTP ${fallbackRes.status}`);
            return fallbackRes.json();
          }).then(fallbackData => ({
            items: fallbackData.playlists?.items || []
          }));
        }
        return res.json();
      })
      .then(data => {
        setPlaylists(data.items ?? []);
        setErrors(prev => ({ ...prev, playlists: '' }));
      })
      .catch((error) => handleApiError(error, 'playlists'))
      .finally(() => setLoadingPlaylists(false));

    // Fetch recently played tracks
    setLoadingRecently(true);
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const uniqueTracks = [];
        const seenTrackIds = new Set();
        
        if (data.items) {
          for (const item of data.items) {
            if (!seenTrackIds.has(item.track.id)) {
              seenTrackIds.add(item.track.id);
              uniqueTracks.push(item);
              if (uniqueTracks.length >= 12) break;
            }
          }
        }
        
        setRecentlyPlayed(uniqueTracks);
        setErrors(prev => ({ ...prev, recently: '' }));
      })
      .catch((error) => handleApiError(error, 'recently played'))
      .finally(() => setLoadingRecently(false));

    // Fetch user's top tracks
    setLoadingTop(true);
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=8&time_range=short_term', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setTopTracks(data.items ?? []);
        setErrors(prev => ({ ...prev, top: '' }));
      })
      .catch((error) => handleApiError(error, 'top tracks'))
      .finally(() => setLoadingTop(false));

    // Fetch new releases
    setLoadingReleases(true);
    fetch('https://api.spotify.com/v1/browse/new-releases?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setNewReleases(data.albums?.items ?? []);
        setErrors(prev => ({ ...prev, releases: '' }));
      })
      .catch((error) => handleApiError(error, 'new releases'))
      .finally(() => setLoadingReleases(false));

    // Fetch browse categories
    setLoadingCategories(true);
    fetch('https://api.spotify.com/v1/browse/categories?limit=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCategories(data.categories?.items ?? []);
        setErrors(prev => ({ ...prev, categories: '' }));
      })
      .catch((error) => handleApiError(error, 'categories'))
      .finally(() => setLoadingCategories(false));
  }, [token, navigate]);

  // Click-outside handling
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-trigger') && !target.closest('.profile-dropdown')) {

      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced loading skeleton component
  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg ${className}`} />
  );

  // Error state component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6 text-center backdrop-blur-sm">
      <div className="flex items-center justify-center gap-3 mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-red-300 font-medium">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col pb-24">
      {/* Sidebar space for desktop */}
      <div className="flex-1 w-full">
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12 space-y-16">
          {/* Debug Device Status */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 text-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${deviceId ? 'bg-green-400 animate-pulse' : 'bg-red-400'} shadow-lg`}></div>
                <span className="text-amber-200 font-medium">
                  Device Status: {deviceId ? `Connected (${deviceId.slice(0, 8)}...)` : 'No device connected'}
                </span>
              </div>
              {!deviceId && (
                <p className="text-amber-300/80 text-xs mt-2 ml-6">
                  Tip: Open Spotify app and start playing a song to enable remote control
                </p>
              )}
            </div>

            )}
            
{/* Modern Welcome Header */}
<div className="relative overflow-hidden mb-8">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10"></div>
            <div className="relative p-8 lg:p-12 space-y-8">
              {/* Top Status Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-green-300 text-sm font-semibold">Live Dashboard</span>
                  </div>
                  <div className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                {/* Enhanced Profile Section */}
                {user && (
                  <div className="flex items-center gap-4">
                    <img src={user.images?.[0]?.url || '/default-avatar.png'} alt="Profile" className="w-16 h-16 rounded-full border-2 border-spotify-green shadow-lg" />
                    <div>
                      <div className="text-white text-xl font-bold">{formatDisplayName(user.display_name || user.id)}</div>
                      <div className="text-green-400 text-sm font-medium">Premium Member</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Main Greeting Section */}
              <div className="text-center lg:text-left max-w-4xl mx-auto lg:mx-0">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
                  <span className="bg-gradient-to-r from-white via-green-300 to-green-500 bg-clip-text text-transparent">
                    {greeting}
                  </span>
                </h1>
                {user?.display_name && (
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-200 mb-4">
                      Welcome back, <span className="text-white">{formatDisplayName(user.display_name)}</span>! 
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto lg:mx-0">
                      Ready to discover your next favorite song? Let's dive into your personalized music universe.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-green-400">♪</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{recentlyPlayed.length}</div>
                      <div className="text-xs text-gray-400 font-medium">Recent Plays</div>
                    </div>
                  </div>
                </div>
                <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">♫</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{playlists.length}</div>
                      <div className="text-xs text-gray-400 font-medium">Playlists</div>
                    </div>
                  </div>
                </div>
                <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-yellow-400">★</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{topTracks.length}</div>
                      <div className="text-xs text-gray-400 font-medium">Top Tracks</div>
                    </div>
                  </div>
                </div>
                <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-400">◆</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{newReleases.length}</div>
                      <div className="text-xs text-gray-400 font-medium">New Releases</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <button 
                  onClick={() => navigate('/search')} 
                  className="flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25 group"
                >
                  <span className="text-lg">Search</span>
                  <span>Discover Music</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm group"
                >
                  <span className="text-lg">Actions</span>
                  <span>Quick Actions</span>
                  <svg className={`w-5 h-5 transition-transform duration-300 ${showQuickActions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Quick Actions Panel */}
              {showQuickActions && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 animate-slideDown">
                  <a href="#recently" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-green-400">Recent</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Recent</div>
                        <div className="text-xs text-gray-400">{recentlyPlayed.length} tracks</div>
                      </div>
                    </div>
                  </a>
                  <a href="#playlists" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-purple-400">Lists</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Playlists</div>
                        <div className="text-xs text-gray-400">{playlists.length} collections</div>
                      </div>
                    </div>
                  </a>
                  <a href="#top" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-yellow-400">Top</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Top Hits</div>
                        <div className="text-xs text-gray-400">{topTracks.length} favorites</div>
                      </div>
                    </div>
                  </a>
                  <a href="#releases" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-blue-400">New</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">New Releases</div>
                        <div className="text-xs text-gray-400">{newReleases.length} albums</div>
                      </div>
                    </div>
                  </a>
                  <a href="#categories" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-pink-400">Genre</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Genres</div>
                        <div className="text-xs text-gray-400">{categories.length} categories</div>
                      </div>
                    </div>
                  </a>
                  <button 
                    onClick={() => navigate('/search')}
                    className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 text-center backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform text-green-400">Find</span>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Search</div>
                        <div className="text-xs text-gray-400">Find anything</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Continue Listening Section */}
          <section id="recently" className="space-y-8">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Continue Listening</h2>
                <p className="text-gray-400">Pick up where you left off</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                  <span className="text-green-400 text-sm font-medium">{recentlyPlayed.length} tracks</span>
                </div>
                {/* Navigation Arrows */}
                {recentlyPlayed.length > tracksPerView && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevRecently}
                      disabled={!canGoPrevRecently}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        canGoPrevRecently 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Previous tracks"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextRecently}
                      disabled={!canGoNextRecently}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        canGoNextRecently 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Next tracks"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recently Played Section */}
            {loadingRecently ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: tracksPerView }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <LoadingSkeleton className="aspect-square rounded-md" />
                    <LoadingSkeleton className="h-3 w-full" />
                    <LoadingSkeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : errors.recently ? (
              <ErrorMessage message={errors.recently} />
            ) : recentlyPlayed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recentlyPlayed.slice(recentlyStartIndex, recentlyStartIndex + tracksPerView).map((item, index) => (
                  <div key={`${item.track.id}-${index}`} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-white/5 to-white/2 border border-white/5 hover:border-green-500/20 transition-all duration-300 hover:scale-101 backdrop-blur-sm">
                      <div className="aspect-square relative">
                        <img 
                          src={item.track.album?.images?.[0]?.url} 
                          alt={`${item.track.name} cover`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (currentTrack?.id === item.track.id && isPlaying) {
                                  await pause();
                                } else {
                                  await play(item.track);
                                }
                              } catch (error) {
                                console.error('Play/Pause error:', error);
                                alert('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.');
                              }
                            }}
                            className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            {currentTrack?.id === item.track.id && isPlaying ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" className="text-black"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-medium text-sm truncate group-hover:text-green-400 transition-colors leading-tight mb-1">
                          {item.track.name}
                        </h4>
                        <p className="text-gray-400 text-xs truncate leading-tight">
                          {item.track.artists?.[0]?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4 font-medium">No recent plays yet</p>
                <p className="text-gray-500 text-sm mb-6">Start listening to see your recently played tracks here</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Discover Music
                </button>
              </div>
            )}
          </section>
          {/* Top Tracks Section */}
          <section id="top" className="space-y-8">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Your Top Tracks</h2>
                <p className="text-gray-400">Your most played songs this month</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                  <span className="text-yellow-400 text-sm font-medium">{topTracks.length} favorites</span>
                </div>
                {/* Navigation Arrows */}
                {topTracks.length > tracksPerView && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevTracks}
                      disabled={!canGoPrev}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        canGoPrev 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Previous tracks"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextTracks}
                      disabled={!canGoNext}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        canGoNext 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Next tracks"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Top Tracks Section */}
            {loadingTop ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: tracksPerView }).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-4">
                      <LoadingSkeleton className="w-5 h-5" />
                      <LoadingSkeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <LoadingSkeleton className="h-3 w-full" />
                        <LoadingSkeleton className="h-2 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : errors.top ? (
              <ErrorMessage message={errors.top} />
            ) : topTracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {topTracks.slice(topTracksStartIndex, topTracksStartIndex + tracksPerView).map((track, index) => {
                  const globalIndex = topTracksStartIndex + index;
                  return (
                    <div key={track.id} className="group cursor-pointer bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all duration-300 backdrop-blur-sm">
                      <div className="p-4 space-y-4">
                        {/* Rank and Album Cover */}
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-lg">
                            {globalIndex + 1}
                          </div>
                          <img 
                            src={track.album?.images?.[0]?.url} 
                            alt={`${track.name} cover`} 
                            className="w-16 h-16 rounded-lg object-cover shadow-lg"
                          />
                        </div>
                        
                        {/* Track Info */}
                        <div className="space-y-2">
                          <h4 className="text-white font-semibold text-sm truncate group-hover:text-yellow-400 transition-colors">
                            {track.name}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {track.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">
                              {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                            </span>
                            <button 
                              onClick={async () => {
                                try {
                                  if (currentTrack?.id === track.id && isPlaying) {
                                    await pause();
                                  } else {
                                    await play(track);
                                  }
                                } catch (error) {
                                  console.error('Play/Pause error:', error);
                                  alert('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.');
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-semibold rounded-lg"
                            >
                              {currentTrack?.id === track.id && isPlaying ? 'Pause' : 'Play'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4 font-medium">No top tracks yet</p>
                <p className="text-gray-500 text-sm mb-6">Play more music to see your personalized stats</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Start Listening
                </button>
              </div>
            )}
          </section>
          {/* Your Playlists Section */}
          <section id="playlists" className="space-y-8">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Your Playlists</h2>
                <p className="text-gray-400">Your personal music collections</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                <span className="text-purple-400 text-sm font-medium">{playlists.length} collections</span>
              </div>
            </div>
            
            {/* Playlists Section */}
            {loadingPlaylists ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <LoadingSkeleton className="aspect-square rounded-md" />
                    <LoadingSkeleton className="h-2 w-full" />
                    <LoadingSkeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : errors.playlists ? (
              <ErrorMessage message={errors.playlists} />
            ) : playlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-6">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-white/5 to-white/2 border border-white/5 hover:border-purple-500/20 transition-all duration-300 hover:scale-101 backdrop-blur-sm">
                      <div className="aspect-square relative">
                        <img 
                          src={playlist.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} 
                          alt={`${playlist.name} cover`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            className="w-6 h-6 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-1">
                        <h3 className="text-white font-medium text-xs truncate group-hover:text-purple-400 transition-colors leading-tight">
                          {playlist.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5 leading-tight">
                          {playlist.description || `${playlist.tracks.total} tracks`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4 font-medium">No playlists found</p>
                <p className="text-gray-500 text-sm mb-6">Create your first playlist on Spotify to see it here</p>
                <button 
                  onClick={() => window.open('https://open.spotify.com', '_blank')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Open Spotify
                </button>
              </div>
            )}
          </section>
          {/* New Releases Section */}
          <section className="space-y-8">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">New Releases</h2>
                <p className="text-gray-400">Fresh music from your favorite artists</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                <span className="text-blue-400 text-sm font-medium">{newReleases.length} albums</span>
              </div>
            </div>
            
            {/* New Releases Section */}
            {loadingReleases ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-6">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <LoadingSkeleton className="aspect-square rounded-md" />
                    <LoadingSkeleton className="h-2 w-full" />
                    <LoadingSkeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : errors.releases ? (
              <ErrorMessage message={errors.releases} />
            ) : newReleases.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-6">
                {newReleases.map((album) => (
                  <div key={album.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-white/5 to-white/2 border border-white/5 hover:border-blue-500/20 transition-all duration-300 hover:scale-101 backdrop-blur-sm">
                      <div className="aspect-square relative">
                        <img 
                          src={album.images?.[0]?.url} 
                          alt={`${album.name} cover`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            className="w-6 h-6 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-1">
                        <h4 className="text-white font-medium text-xs truncate group-hover:text-blue-400 transition-colors leading-tight">
                          {album.name}
                        </h4>
                        <p className="text-gray-400 text-xs truncate mt-0.5 leading-tight">
                          {album.artists[0]?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197a1 1 0 001-1v-1m-1 1v1z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4 font-medium">No new releases available</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Explore Music
                </button>
              </div>
            )}
          </section>
          {/* Browse Categories Section */}
          <section id="browse" className="space-y-8">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Browse by Genre</h2>
                <p className="text-gray-400">Discover music by mood and genre</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-full border border-pink-500/20">
                <span className="text-pink-400 text-sm font-medium">{categories.length} categories</span>
              </div>
            </div>
            
            {/* Categories Section */}
            {loadingCategories ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-16 rounded-md" />
                ))}
              </div>
            ) : errors.categories ? (
              <ErrorMessage message={errors.categories} />
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4">
                {categories.map((category, index) => {
                  const gradients = [
                    'from-purple-500 to-pink-500',
                    'from-blue-500 to-cyan-500',
                    'from-green-500 to-teal-500',
                    'from-orange-500 to-red-500',
                    'from-indigo-500 to-purple-500',
                    'from-pink-500 to-rose-500',
                    'from-cyan-500 to-blue-500',
                    'from-teal-500 to-green-500'
                  ];
                  const gradient = gradients[index % gradients.length];
                  return (
                    <div 
                      key={category.id} 
                      className={`relative h-16 rounded-md overflow-hidden cursor-pointer group hover:scale-101 transition-all duration-300 bg-gradient-to-br ${gradient} shadow-lg`}
                    >
                      <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
                        <h4 className="font-bold text-white text-xs leading-tight drop-shadow-lg">
                          {category.name}
                        </h4>
                        {category.icons?.[0] && (
                          <img 
                            src={category.icons[0].url} 
                            alt={category.name}
                            className="absolute bottom-0.5 right-0.5 w-5 h-5 object-cover rounded-sm transform rotate-12 opacity-80 group-hover:rotate-6 group-hover:scale-110 transition-all shadow-lg"
                          />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg mb-4 font-medium">No categories available</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-colors"
                >
                  Start Exploring
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
