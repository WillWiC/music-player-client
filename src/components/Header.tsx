import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import type { Track } from '../types/spotify';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onMobileMenuToggle?: () => void;
  onTrackPlayed?: (track: Track) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  searchPlaceholder = "Search for songs, artists, or albums...",
  onMobileMenuToggle,
  onTrackPlayed
}) => {
  const navigate = useNavigate();
  const { user, token, isLoading, clearAll, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Track[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('Header auth state:', { user: !!user, token: !!token, isLoading });
  }, [user, token, isLoading]);

  // Search for tracks using Spotify API
  const searchTracks = async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tracks.items);
        setShowSearchDropdown(data.tracks.items.length > 0);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTracks(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setShowSearchDropdown(false);
    }
  };

  const handleTrackPlay = async (track: Track) => {
    if (!token || !track.uri) {
      console.error('No token or track URI available');
      return;
    }

    try {
      // First, get available devices
      const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        const activeDevice = devicesData.devices.find((device: any) => device.is_active);
        
        if (!activeDevice && devicesData.devices.length === 0) {
          alert('No Spotify device found. Please open Spotify on a device and try again.');
          return;
        }

        const deviceId = activeDevice?.id || devicesData.devices[0]?.id;

        // Play the track
        const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [track.uri],
          }),
        });

        if (playResponse.ok || playResponse.status === 204) {
          console.log('Track started playing:', track.name);
          setShowSearchDropdown(false);
          setSearchQuery('');
          // Notify parent component that a track was played
          onTrackPlayed?.(track);
        } else {
          console.error('Failed to play track:', playResponse.status);
          if (playResponse.status === 403) {
            alert('Premium account required to play full tracks.');
          } else if (playResponse.status === 404) {
            alert('No active device found. Please open Spotify and try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleLogout = () => {
    // Show logout notification
    setShowLogoutNotification(true);
    
    // Call the auth context logout function
    logout();
    
    // Hide notification after 2 seconds and redirect
    setTimeout(() => {
      setShowLogoutNotification(false);
      navigate('/');
    }, 2000);
  };

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-trigger') && !target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
      if (!target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  // Format display name helper function
  const formatDisplayName = (name: string) => {
    if (!name) return 'User';
    
    // If the name looks like an email, extract the part before @
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    
    // If it's all lowercase or has weird formatting, capitalize properly
    if (name === name.toLowerCase() || name.includes('_') || name.includes('.')) {
      return name
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return name;
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      {/* Logout Notification */}
      {showLogoutNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-black px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Successfully logged out!</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile Menu Button + Home Button */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-green-500/30 transition-all duration-300"
            title="Open Menu"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Home/Dashboard Button */}
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-300 group"
            title="Go to Dashboard"
          >
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
            </div>
            <span className="text-white font-medium text-sm hidden sm:block">Home</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-3 sm:mx-6 search-container">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-green-500 rounded-full animate-spin"></div>
                ) : (
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/30 transition-all duration-300 backdrop-blur-sm text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-gray-400 text-xs font-medium px-3 py-2 border-b border-white/10">
                    Search Results
                  </div>
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleTrackPlay(track)}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/10 rounded-xl transition-colors text-left group"
                    >
                      <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {track.album?.images?.[0]?.url ? (
                          <img 
                            src={track.album.images[0].url} 
                            alt={track.album?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                          {track.name}
                        </div>
                        <div className="text-gray-400 text-sm truncate">
                          {track.artists.map(artist => artist.name).join(', ')}
                        </div>
                        {track.album && (
                          <div className="text-gray-500 text-xs truncate">
                            {track.album.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <span>{formatDuration(track.duration_ms)}</span>
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right side - User Profile or Login */}
        <div className="flex items-center gap-3">
          {/* Debug button - remove after testing */}
          <button
            onClick={clearAll}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded"
            title="Clear Auth (Debug)"
          >
            Clear
          </button>
          
          {!isLoading && user && token ? (
            <div className="relative">
              <button 
                onClick={handleProfileClick}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer profile-trigger"
                title="Profile"
              >
                <img 
                  src={user.images?.[0]?.url || '/default-avatar.png'} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block min-w-0">
                  <p className="text-white text-sm font-medium truncate max-w-32">{formatDisplayName(user.display_name || user.id)}</p>
                  <p className="text-gray-400 text-xs">Premium</p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 profile-dropdown">
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        // Add theme toggle functionality here
                        console.log('Theme clicked');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Theme</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        // Add settings functionality here
                        console.log('Settings clicked');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        // Add account functionality here
                        console.log('Account clicked');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Account</span>
                    </button>
                    
                    <div className="border-t border-white/10 my-2"></div>
                    
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
              <span className="hidden sm:block text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-500/25"
              title="Login to Spotify"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:block">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
