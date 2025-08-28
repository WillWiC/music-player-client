import React from 'react';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, current, playing } = usePlayer();
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
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [loadingRecently, setLoadingRecently] = React.useState(false);
  const [loadingTop, setLoadingTop] = React.useState(false);
  const [loadingReleases, setLoadingReleases] = React.useState(false);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  
  // Error states and UI enhancements
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});
  const [showQuickActions, setShowQuickActions] = React.useState(false);

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
    if (hour < 6) setGreeting('Late night vibes 🌙');
    else if (hour < 12) setGreeting('Good morning ☀️');
    else if (hour < 17) setGreeting('Good afternoon 🌞');
    else if (hour < 21) setGreeting('Good evening 🌅');
    else setGreeting('Good night 🌟');

    // Enhanced error handling function
    const handleApiError = (error: any, section: string) => {
      console.error(`Failed to load ${section}:`, error);
      setErrors(prev => ({ ...prev, [section]: `Failed to load ${section}. Please try again.` }));
    };

    // Fetch user profile with enhanced error handling
    setLoadingProfile(true);
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
      .catch((error) => handleApiError(error, 'profile'))
      .finally(() => setLoadingProfile(false));

    // Fetch user's playlists (more reliable than featured playlists)
    setLoadingPlaylists(true);
    fetch('https://api.spotify.com/v1/me/playlists?limit=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        console.log('User playlists response status:', res.status);
        if (!res.ok) {
          // Fallback to featured playlists if user playlists fail
          console.log('User playlists failed, trying featured playlists...');
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
        console.log('Playlists data:', data);
        console.log('Playlists items:', data.items);
        setPlaylists(data.items ?? []);
        setErrors(prev => ({ ...prev, playlists: '' }));
      })
      .catch((error) => {
        console.error('Playlists error:', error);
        handleApiError(error, 'playlists');
      })
      .finally(() => setLoadingPlaylists(false));

    // Fetch recently played tracks with duplicate elimination
    setLoadingRecently(true);
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // Remove duplicates based on track ID
        const uniqueTracks = [];
        const seenTrackIds = new Set();
        
        if (data.items) {
          for (const item of data.items) {
            if (!seenTrackIds.has(item.track.id)) {
              seenTrackIds.add(item.track.id);
              uniqueTracks.push(item);
              if (uniqueTracks.length >= 12) break; // Limit to 12 unique tracks
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

  // Enhanced loading skeleton component
  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg ${className}`} />
  );

  // Error state component
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="music-card border-red-500/20 bg-red-900/10">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-300 flex-1">{message}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-compact max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Enhanced Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-spotify-green/20 via-green-900/20 to-emerald-900/20 border border-spotify-green/20">
        <div className="absolute inset-0 pattern-bg opacity-30"></div>
        <div className="relative p-6 sm:p-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 bg-gradient-to-r from-white via-green-100 to-spotify-green bg-clip-text text-transparent">
            {greeting}
            {user?.display_name && (
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/90 mt-2">
                Welcome back, {user.display_name}!
              </span>
            )}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-6 max-w-2xl">
            Ready to discover your next favorite song? Let's dive into your personalized music journey.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => navigate('/search')} 
              className="main-action-btn btn-spotify flex items-center gap-1.5 text-sm px-3 py-2 group"
            >
              <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Music
            </button>
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="main-action-btn btn-ghost-dark flex items-center gap-1.5 text-sm px-3 py-2"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Quick Actions
            </button>
          </div>

          {/* Expandable Quick Actions */}
          {showQuickActions && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fadeIn">
              <a href="#recently" className="quick-action-compact quick-action-card group text-xs py-2 px-3">
                <svg className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Recent</span>
              </a>
              <a href="#playlists" className="quick-action-compact quick-action-card group text-xs py-2 px-3">
                <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Playlists</span>
              </a>
              <a href="#top" className="quick-action-compact quick-action-card group text-xs py-2 px-3">
                <svg className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>Top Tracks</span>
              </a>
              <a href="#browse" className="quick-action-compact quick-action-card group text-xs py-2 px-3">
                <svg className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Browse</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced User Profile Stats Card */}
      {loadingProfile ? (
        <div className="music-card">
          <div className="flex items-center space-x-6">
            <LoadingSkeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <LoadingSkeleton className="h-6 w-48" />
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-8 w-16" />
              <LoadingSkeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ) : errors.profile ? (
        <ErrorMessage message={errors.profile} />
      ) : user ? (
        <div className="music-card hover-lift group">
          <div className="profile-content flex items-center space-x-4">
            <div className="relative shrink-0">
              <img 
                src={user.images?.[0]?.url || '/default-avatar.png'} 
                alt="Profile" 
                className="profile-img w-14 h-14 rounded-full object-cover border-2 border-spotify-green/50 group-hover:border-spotify-green transition-all"
              />
              <div className="verification-badge absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-spotify-green rounded-full border-2 border-dark-bg flex items-center justify-center">
                <svg className="verification-icon w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="profile-title text-xl font-bold text-white mb-1">{user.display_name || user.id}</h2>
              <p className="text-muted-dark text-sm mb-2">{user.email}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="status-dot w-1.5 h-1.5 bg-spotify-green rounded-full animate-pulse"></div>
                  <span className="status-text text-xs text-spotify-green font-medium">Premium Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-dark">
                  <svg className="status-icon w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2m5-8a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                  <span>{user.followers?.total || 0} followers</span>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="follower-stats text-2xl font-bold text-spotify-green">{user.followers?.total || 0}</div>
              <div className="follower-label text-xs text-muted-dark">Followers</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Continue Listening Section */}
      <section id="recently" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Continue listening</h3>
          <button className="text-muted-dark hover:text-white text-sm font-medium transition-colors">
            View all
          </button>
        </div>
        
        {loadingRecently ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <LoadingSkeleton className="aspect-square rounded-lg" />
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : errors.recently ? (
          <ErrorMessage message={errors.recently} />
        ) : recentlyPlayed.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-start">
            {recentlyPlayed.slice(0, 12).map((item, index) => (
              <div key={`${item.track.id}-${index}`} className="song-card group cursor-pointer flex-shrink-0 interactive-element">
                <div className="song-image-container relative">
                  <img 
                    src={item.track.album?.images?.[0]?.url} 
                    alt={`${item.track.name} cover`} 
                    className="cover-img rounded-lg block"
                  />
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (current?.id === item.track.id && playing) {
                          pause();
                        } else {
                          play(item.track);
                        }
                      }}
                      className="song-play-button w-12 h-12 rounded-full flex items-center justify-center transform transition-all duration-200 z-20"
                      aria-label={current?.id === item.track.id && playing ? `Pause ${item.track.name}` : `Play ${item.track.name}`}
                    >
                      {current?.id === item.track.id && playing ? (
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
                <h4 className="song-title text-white truncate group-hover:text-spotify-green transition-colors">
                  {item.track.name}
                </h4>
                <p className="song-artist text-muted-dark truncate">
                  {item.track.artists[0]?.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-muted-dark mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-muted-dark text-lg mb-4">No recent plays yet</p>
            <button 
              onClick={() => navigate('/search')}
              className="btn-spotify"
            >
              Discover Music
            </button>
          </div>
        )}
      </section>

      {/* Top Tracks Section */}
      <section id="top" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Your top tracks this month</h3>
          <button className="text-muted-dark hover:text-white text-sm font-medium transition-colors">
            View all
          </button>
        </div>

        {loadingTop ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="music-card">
                <div className="flex items-center gap-4">
                  <LoadingSkeleton className="w-6 h-6" />
                  <LoadingSkeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <LoadingSkeleton className="h-4 w-48" />
                    <LoadingSkeleton className="h-3 w-32" />
                  </div>
                  <LoadingSkeleton className="w-20 h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : errors.top ? (
          <ErrorMessage message={errors.top} />
        ) : topTracks.length > 0 ? (
          <div className="space-y-3">
            {topTracks.slice(0, 8).map((track, index) => (
              <div key={track.id} className="top-track-card group cursor-pointer interactive-element">
                <div className="track-row flex items-center gap-4">
                  <div className="track-ranking-number">
                    {index + 1}
                  </div>
                  <img 
                    src={track.album?.images?.[0]?.url} 
                    alt={`${track.name} cover`} 
                    className="album-img-small w-12 h-12 rounded-lg object-cover shadow-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="song-title text-white truncate group-hover:text-spotify-green transition-colors">
                      {track.name}
                    </h4>
                    <p className="song-artist text-muted-dark truncate">
                      {track.artists.map((artist: any) => artist.name).join(', ')}
                    </p>
                  </div>
                  <div className="track-actions flex items-center gap-3">
                    <button 
                      className="action-btn-small opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full"
                      aria-label="Like track"
                    >
                      <svg className="w-4 h-4 text-muted-dark hover:text-spotify-green transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <span className="duration-text text-xs text-muted-dark min-w-0 font-mono">
                      {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                    </span>
                    <button 
                      onClick={() => {
                        if (current?.id === track.id && playing) {
                          pause();
                        } else {
                          play(track);
                        }
                      }}
                      className="play-btn-text opacity-0 group-hover:opacity-100 transition-opacity btn-spotify text-xs px-4 py-2 font-semibold"
                    >
                      {current?.id === track.id && playing ? 'Pause' : 'Play'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-muted-dark mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-muted-dark text-lg mb-4">No top tracks yet</p>
            <p className="text-muted-dark mb-6">Play more music to see your personalized stats</p>
            <button 
              onClick={() => navigate('/search')}
              className="btn-spotify"
            >
              Start Listening
            </button>
          </div>
        )}
      </section>

      {/* Your Playlists Section */}
      <section id="playlists" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Your playlists</h3>
          <button className="text-muted-dark hover:text-white text-sm font-medium transition-colors">
            View all
          </button>
        </div>

        {loadingPlaylists ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <LoadingSkeleton className="aspect-square rounded-lg" />
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : errors.playlists ? (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-400 text-lg mb-4">Failed to load playlists</p>
            <p className="text-muted-dark mb-4">{errors.playlists}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-spotify"
            >
              Try Again
            </button>
          </div>
        ) : playlists.length > 0 ? (
          <div className="flex flex-wrap gap-6 justify-start">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="playlist-card-enhanced group cursor-pointer block"
              >
                <div className="playlist-image-container">
                  <img 
                    src={playlist.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} 
                    alt={`${playlist.name} cover`} 
                    className="playlist-img w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==') {
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }
                    }}
                  />
                  <div className="playlist-overlay">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Play playlist clicked:', playlist.name, playlist.id);
                      }}
                      className="playlist-play-btn"
                      aria-label={`Play ${playlist.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="playlist-content">
                  <h3 className="playlist-title">
                    {playlist.name}
                  </h3>
                  <p className="playlist-description">
                    {playlist.description || `${playlist.tracks.total} tracks`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-muted-dark mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-muted-dark text-lg mb-4">No playlists found</p>
            <p className="text-muted-dark mb-6">Create your first playlist on Spotify to see it here</p>
            <button 
              onClick={() => window.open('https://open.spotify.com', '_blank')}
              className="btn-spotify"
            >
              Open Spotify
            </button>
          </div>
        )}
      </section>

      {/* New Releases Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">New releases for you</h3>
          <button className="text-muted-dark hover:text-white text-sm font-medium transition-colors">
            View all
          </button>
        </div>

        {loadingReleases ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <LoadingSkeleton className="aspect-square rounded-lg" />
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : errors.releases ? (
          <ErrorMessage message={errors.releases} />
        ) : newReleases.length > 0 ? (
          <div className="flex flex-wrap gap-6 justify-start">
            {newReleases.map((album) => (
              <div key={album.id} className="playlist-card-enhanced group cursor-pointer">
                <div className="playlist-image-container">
                  <img 
                    src={album.images?.[0]?.url} 
                    alt={`${album.name} cover`} 
                    className="playlist-img w-full h-full object-cover rounded-lg"
                  />
                  <div className="playlist-overlay">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Play album:', album.name);
                      }}
                      className="playlist-play-btn"
                      aria-label={`Play ${album.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="playlist-content">
                  <h4 className="playlist-title">
                    {album.name}
                  </h4>
                  <p className="playlist-description">
                    {album.artists[0]?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-muted-dark mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197a1 1 0 001-1v-1m-1 1v1z" />
            </svg>
            <p className="text-muted-dark text-lg mb-4">No new releases available</p>
            <button 
              onClick={() => navigate('/search')}
              className="btn-spotify"
            >
              Explore Music
            </button>
          </div>
        )}
      </section>

      {/* Browse Categories Section */}
      <section id="browse" className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Browse all</h3>
          <button className="text-muted-dark hover:text-white text-sm font-medium transition-colors">
            View all
          </button>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : errors.categories ? (
          <ErrorMessage message={errors.categories} />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  className={`relative h-32 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-300 bg-gradient-to-br ${gradient}`}
                >
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <h4 className="font-bold text-white text-lg leading-tight">
                      {category.name}
                    </h4>
                    {category.icons?.[0] && (
                      <img 
                        src={category.icons[0].url} 
                        alt={category.name}
                        className="category-img absolute bottom-2 right-2 w-12 h-12 object-cover rounded-lg transform rotate-12 opacity-80 group-hover:rotate-6 group-hover:scale-110 transition-all"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="music-card text-center py-12">
            <svg className="w-16 h-16 text-muted-dark mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-muted-dark text-lg mb-4">No categories available</p>
            <button 
              onClick={() => navigate('/search')}
              className="btn-spotify"
            >
              Start Exploring
            </button>
          </div>
        )}
      </section>

      {/* Bottom spacing for player */}
      <div className="h-24"></div>
    </div>
  );
};

export default Dashboard;
