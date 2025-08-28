import React from 'react';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, current, playing, deviceId } = usePlayer();
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = React.useState<any | null>(null);
  const [playlists, setPlaylists] = React.useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<any[]>([]);
  const [topTracks, setTopTracks] = React.useState<any[]>([]);
  const [newReleases, setNewReleases] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
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
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

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
    const handleApiError = (error: any, section: string) => {
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
        setShowProfileDropdown(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
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
                💡 Open Spotify app and start playing a song to enable remote control
              </p>
            )}
          </div>
        )}
        
        {/* Modern Welcome Header */}
        <div className="relative overflow-hidden">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10"></div>
          
          <div className="relative p-8 lg:p-12">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between mb-8">
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
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="profile-trigger flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 group border border-white/20 hover:border-green-500/50 backdrop-blur-sm shadow-lg"
                  >
                    <div className="relative">
                      <img 
                        src={user.images?.[0]?.url || '/default-avatar.png'} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-400/50 group-hover:border-green-400 transition-all duration-300 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 shadow-lg shadow-green-500/50"></div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-white text-sm font-semibold">{user.display_name || user.id}</div>
                      <div className="text-green-400 text-xs font-medium">Premium Member</div>
                    </div>
                    <svg className={`w-5 h-5 text-white/70 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="profile-dropdown absolute top-full right-0 mt-3 w-80 overflow-hidden z-50 animate-slideDown">
                      <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                        <div className="p-6 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 border-b border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img 
                                src={user.images?.[0]?.url || '/default-avatar.png'} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover border-3 border-green-400/50 shadow-lg"
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-800 shadow-lg"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-lg truncate">{user.display_name || user.id}</h3>
                              <p className="text-gray-300 text-sm">{user.email || user.id}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-green-400 text-sm font-medium bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Premium</span>
                                <span className="text-gray-400 text-sm">{user.followers?.total || 0} followers</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border-b border-white/10">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-green-400 font-bold text-xl">{recentlyPlayed.length}</div>
                              <div className="text-gray-400 text-xs">Recent Tracks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-400 font-bold text-xl">{topTracks.length}</div>
                              <div className="text-gray-400 text-xs">Top Tracks</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <button 
                            onClick={() => {
                              localStorage.removeItem('spotify_token');
                              navigate('/');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm group"
                          >
                            <span className="text-lg">👋</span>
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Greeting Section */}
            <div className="mb-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-4">
                <span className="bg-gradient-to-r from-white via-green-300 to-green-500 bg-clip-text text-transparent">
                  {greeting}
                </span>
              </h1>
              
              {user?.display_name && (
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-200 mb-2">
                    Welcome back, <span className="text-white">{user.display_name}</span>! 
                  </h2>
                  <p className="text-lg text-gray-400 max-w-2xl">
                    Ready to discover your next favorite song? Let's dive into your personalized music universe.
                  </p>
                </div>
              )}
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🎵</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{recentlyPlayed.length}</div>
                    <div className="text-xs text-gray-400 font-medium">Recent Plays</div>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{playlists.length}</div>
                    <div className="text-xs text-gray-400 font-medium">Playlists</div>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">⭐</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{topTracks.length}</div>
                    <div className="text-xs text-gray-400 font-medium">Top Tracks</div>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🆕</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{newReleases.length}</div>
                    <div className="text-xs text-gray-400 font-medium">New Releases</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button 
                onClick={() => navigate('/search')} 
                className="flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25 group"
              >
                <span className="text-lg">🔍</span>
                <span>Discover Music</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm group"
              >
                <span className="text-lg">⚡</span>
                <span>Quick Actions</span>
                <svg className={`w-5 h-5 transition-transform duration-300 ${showQuickActions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Quick Actions Panel */}
            {showQuickActions && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-slideDown">
                <a href="#recently" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🕒</span>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Recent</div>
                      <div className="text-xs text-gray-400">{recentlyPlayed.length} tracks</div>
                    </div>
                  </div>
                </a>
                
                <a href="#playlists" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🎵</span>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Playlists</div>
                      <div className="text-xs text-gray-400">{playlists.length} collections</div>
                    </div>
                  </div>
                </a>
                
                <a href="#top" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">⭐</span>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">Top Hits</div>
                      <div className="text-xs text-gray-400">{topTracks.length} favorites</div>
                    </div>
                  </div>
                </a>
                
                <a href="#releases" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🆕</span>
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">New Releases</div>
                      <div className="text-xs text-gray-400">{newReleases.length} albums</div>
                    </div>
                  </div>
                </a>
                
                <a href="#categories" className="group p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🎭</span>
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
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
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
        <section id="recently" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎵</span>
              </div>
              Continue listening
            </h3>
            <button className="text-gray-400 hover:text-white text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 hover:border-green-500/30">
              View all
            </button>
          </div>
          
          {loadingRecently ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <LoadingSkeleton className="aspect-square rounded-2xl" />
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : errors.recently ? (
            <ErrorMessage message={errors.recently} />
          ) : recentlyPlayed.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {recentlyPlayed.slice(0, 12).map((item, index) => (
                <div key={`${item.track.id}-${index}`} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                    <div className="aspect-square relative">
                      <img 
                        src={item.track.album?.images?.[0]?.url} 
                        alt={`${item.track.name} cover`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (current?.id === item.track.id && playing) {
                                await pause();
                              } else {
                                await play(item.track);
                              }
                            } catch (error) {
                              console.error('Play/Pause error:', error);
                              alert('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.');
                            }
                          }}
                          className="w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                        >
                          {current?.id === item.track.id && playing ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" className="text-black"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-white font-semibold text-sm truncate group-hover:text-green-400 transition-colors">
                        {item.track.name}
                      </h4>
                      <p className="text-gray-400 text-xs truncate mt-1">
                        {item.track.artists[0]?.name}
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

        {/* Bottom spacing for player */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default Dashboard;
