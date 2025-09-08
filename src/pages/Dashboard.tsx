import React from 'react';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useNavigate } from 'react-router-dom';
import type { User, Playlist, RecentlyPlayedItem, Track } from '../types/spotify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, CircularProgress } from '@mui/material';
import { useToast } from '../context/toast';
import '../index.css';

const Dashboard: React.FC = () => {
  const { token, isLoading } = useAuth();
  const { play, pause, currentTrack, isPlaying, deviceId } = usePlayer();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State management
  const [user, setUser] = React.useState<User | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);

  // Local UI state & refs (restored to ensure variables referenced below exist)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showScrollToTop] = React.useState(false);
  const [greeting, setGreeting] = React.useState('Welcome');
  const lastAddedRef = React.useRef<{ trackId?: string; timestamp?: number } | null>(null);

  // Recently played
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<RecentlyPlayedItem[]>([]);
  const [recentlyStartIndex, setRecentlyStartIndex] = React.useState(0);
  const recentlyPerView = 6;
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadingRecently, setLoadingRecently] = React.useState(false);

  // Top tracks
  const [topTracks, setTopTracks] = React.useState<Track[]>([]);
  const [topTracksStartIndex, setTopTracksStartIndex] = React.useState(0);
  const tracksPerView = 5;
  const [loadingTop, setLoadingTop] = React.useState(false);

  // (Hit Songs section removed)

  // Playlists loading
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);

  // Animation flags used for subtle transitions
  const [isAnimatingRecently, setIsAnimatingRecently] = React.useState(false);
  const [isAnimatingTracks, setIsAnimatingTracks] = React.useState(false);

  // Generic errors map for sections
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Small helpers
  const formatDisplayName = (name?: string) => (name ? name : '');
  const decodeHtmlEntities = (str?: string) => (str ? str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : str || '');

  // Navigation/scroll helpers for paginated sections
  const handlePrevRecently = () => {
    if (isAnimatingRecently) return;
    setIsAnimatingRecently(true);
    setRecentlyStartIndex(prev => Math.max(0, prev - recentlyPerView));
    setTimeout(() => setIsAnimatingRecently(false), 260);
  };
  const handleNextRecently = () => {
    if (isAnimatingRecently) return;
    if (recentlyStartIndex + recentlyPerView >= recentlyPlayed.length) return;
    setIsAnimatingRecently(true);
    setRecentlyStartIndex(prev => Math.min(prev + recentlyPerView, Math.max(0, recentlyPlayed.length - recentlyPerView)));
    setTimeout(() => setIsAnimatingRecently(false), 260);
  };

  const handlePrevTracks = () => {
    if (isAnimatingTracks) return;
    setIsAnimatingTracks(true);
    setTopTracksStartIndex(prev => Math.max(0, prev - tracksPerView));
    setTimeout(() => setIsAnimatingTracks(false), 260);
  };
  const handleNextTracks = () => {
    if (isAnimatingTracks) return;
    if (topTracksStartIndex + tracksPerView >= topTracks.length) return;
    setIsAnimatingTracks(true);
    setTopTracksStartIndex(prev => Math.min(prev + tracksPerView, Math.max(0, topTracks.length - tracksPerView)));
    setTimeout(() => setIsAnimatingTracks(false), 260);
  };

  // (Releases navigation removed)

  const canGoNext = topTracksStartIndex + tracksPerView < topTracks.length;
  const canGoPrev = topTracksStartIndex > 0;
  const canGoNextRecently = recentlyStartIndex + recentlyPerView < recentlyPlayed.length;
  const canGoPrevRecently = recentlyStartIndex > 0;
  // (releases pagination flags removed)

  // Scroll to top functionality
  // Browse by genre removed

  // Function to add a track to recently played tracks immediately
  const addToLocallyPlayed = React.useCallback((track: any, source?: string) => {
    const trackId = track?.id || track?.track?.id;
    const trackName = track?.name || track?.track?.name || 'Unknown';
    const now = Date.now();

    if (!trackId) {
      console.warn('Track has no ID, skipping:', track);
      return;
    }

    const normalizedTrack = track.track ? track.track : track;

    // More aggressive duplicate prevention - check multiple criteria
    // But allow re-adding if it's a replay from recently-played section
    const isReplay = source === 'recently-played-replay';

    // Check rapid-duplicate prevention using ref
    const isAllowedSource = isReplay || source === 'current track change';
    if (lastAddedRef.current && lastAddedRef.current.trackId === trackId && typeof lastAddedRef.current.timestamp === 'number' && now - lastAddedRef.current.timestamp < 2000 && !isAllowedSource) {
      const lastDelta = typeof lastAddedRef.current.timestamp === 'number' ? now - lastAddedRef.current.timestamp : 'unknown';
      console.log(`❌ Preventing rapid duplicate addition of track: ${trackName} (ID: ${trackId}) from source: ${source || 'unknown'} (last added ${lastDelta}ms ago)`);
      return;
    }

    // Update the last added tracker
    lastAddedRef.current = { trackId, timestamp: now };

    if (isReplay) {
      console.log(`🔄 Replaying track: ${trackName} (ID: ${trackId}) from source: ${source || 'unknown'} - moving to top of recently played`);
    } else {
      console.log(`✅ Adding track: ${trackName} (ID: ${trackId}) from source: ${source || 'unknown'}`);
    }

    const playedItem = {
      track: normalizedTrack,
      played_at: new Date().toISOString(),
      context: null
    };

    // Use functional updater to avoid external dependency on recentlyPlayed
    setRecentlyPlayed(prev => {
      console.log(`📋 Before adding: recentlyPlayed has ${prev.length} tracks`);

      // If duplicate by name+artist exists and not a replay, skip
      const existsByNameArtist = prev.some(item => {
        const existingTrack = item.track;
        const existingArtist = existingTrack.artists?.[0]?.name || '';
        const newArtist = normalizedTrack.artists?.[0]?.name || '';
        const existingName = existingTrack.name?.toLowerCase() || '';
        const newName = normalizedTrack.name?.toLowerCase() || '';
        return existingName === newName && existingArtist === newArtist;
      });

      if (existsByNameArtist && !isReplay) {
        console.log(`❌ Track ${trackName} by ${normalizedTrack.artists?.[0]?.name} already exists (different ID but same name/artist), skipping addition from source: ${source || 'unknown'}`);
        return prev;
      }

      // Also check if this exact track ID is already at the top
      const isAlreadyMostRecent = prev.length > 0 && prev[0]?.track?.id === trackId;
      if (isAlreadyMostRecent && !isReplay) {
        console.log(`❌ Track ${trackName} (ID: ${trackId}) is already the most recent track, skipping addition from source: ${source || 'unknown'}`);
        return prev;
      }

      // Remove any existing instances of this track first (check both ID and name+artist)
      const withoutCurrent = prev.filter(item => {
        const itemId = item.track?.id;
        const itemName = item.track?.name?.toLowerCase() || '';
        const itemArtist = item.track?.artists?.[0]?.name || '';
        const newName = normalizedTrack.name?.toLowerCase() || '';
        const newArtist = normalizedTrack.artists?.[0]?.name || '';

        const isDuplicateById = itemId === trackId;
        const isDuplicateByName = itemName === newName && itemArtist === newArtist;
        const isDuplicate = isDuplicateById || isDuplicateByName;

        if (isDuplicate) {
          console.log(`🗑️ Removing existing instance of track: ${item.track?.name} (ID: ${itemId}) - ${isDuplicateById ? 'same ID' : 'same name+artist'}`);
        }
        return !isDuplicate;
      });

      // Add the new item at the beginning
      const newList = [playedItem, ...withoutCurrent];

      // Final deduplication pass - use ID, name, and artist for comprehensive checking
      const seen = new Set<string>();
      const seenNameArtist = new Set<string>();
      const deduped = newList.filter((item) => {
        const id = item.track?.id;
        const name = item.track?.name?.toLowerCase() || '';
        const artist = item.track?.artists?.[0]?.name || '';
        const uniqueKeyById = id || '';
        const uniqueKeyByNameArtist = `${name}-${artist}`;

        if (!id || seen.has(uniqueKeyById) || seenNameArtist.has(uniqueKeyByNameArtist)) {
          if (id && (seen.has(uniqueKeyById) || seenNameArtist.has(uniqueKeyByNameArtist))) {
            console.log(`🔄 Final deduplication: removing duplicate ${item.track?.name} by ${artist}`);
          }
          return false;
        }
        seen.add(uniqueKeyById);
        seenNameArtist.add(uniqueKeyByNameArtist);
        return true;
      });

      const result = deduped.slice(0, 12); // Only keep the latest 12 songs
      console.log(`📋 After adding: recentlyPlayed now has ${result.length} tracks`);

      return result;
    });

    console.log(`✨ Track processed successfully: ${trackName} (ID: ${trackId})`);
  }, []);

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smooth scroll to section functionality
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -100; // Add some offset for header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      const clickedButton = document.activeElement as HTMLElement | null;
      if (clickedButton) {
        clickedButton.classList.add('animate-pulse');
        setTimeout(() => clickedButton.classList.remove('animate-pulse'), 300);
      }
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Navigation helpers
  const openArtist = (artistId: string) => navigate(`/artist/${artistId}`);
  const openAlbum = (albumId: string) => navigate(`/album/${albumId}`);
  const openPlaylist = (playlistId: string) => navigate(`/playlist/${playlistId}`);
  const handleTrackNameClick = (e: React.MouseEvent, albumId: string) => {
    e.stopPropagation();
    openAlbum(albumId);
  };

  // Function to refresh recently played tracks
  const refreshRecentlyPlayed = React.useCallback(async () => {
    if (!token || isRefreshing) return;
    
    console.log('Refreshing recently played tracks...');
    setIsRefreshing(true);
    setLoadingRecently(true);
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=30', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Get API tracks
      const apiTracks = data.items || [];
      
      // Only use API tracks for initial load - don't merge with locallyPlayedTracks
      // because addToLocallyPlayed already manages recentlyPlayed directly
      const uniqueTracks: RecentlyPlayedItem[] = [];
      const seenTrackIds = new Set();
      
      // Sort by played_at in descending order (most recent first)
      apiTracks.sort((a: RecentlyPlayedItem, b: RecentlyPlayedItem) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
      
      for (const item of apiTracks) {
        const trackId = item.track?.id;
        if (trackId && !seenTrackIds.has(trackId)) {
          seenTrackIds.add(trackId);
          uniqueTracks.push(item);
          if (uniqueTracks.length >= 20) break;
        }
      }
      
      // Only use API tracks if localStorage is empty, otherwise only add new API tracks not present locally
      setRecentlyPlayed(prev => {
        let localTracks = prev;
        // If localStorage is empty, use API tracks
        if (!localTracks || localTracks.length === 0) {
          console.log('No local recentlyPlayed, using API tracks');
          return uniqueTracks.slice(0, 12);
        }
        // Otherwise, add only new API tracks not present locally
        const seenIds = new Set(localTracks.map(item => item.track?.id));
        const seenNameArtist = new Set(localTracks.map(item => `${item.track?.name?.toLowerCase() || ''}-${item.track?.artists?.[0]?.name?.toLowerCase() || ''}`));
        const newApiTracks = uniqueTracks.filter(item => {
          const id = item.track?.id;
          const name = item.track?.name?.toLowerCase() || '';
          const artist = item.track?.artists?.[0]?.name?.toLowerCase() || '';
          const key = `${name}-${artist}`;
          return (!id || !seenIds.has(id)) && !seenNameArtist.has(key);
        });
        const merged = [...localTracks, ...newApiTracks];
        // Sort by played_at to maintain chronological order
        merged.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());
        const result = merged.slice(0, 12);
        console.log(`Refreshed recently played: ${result.length} tracks (${uniqueTracks.length} from API, ${result.length - uniqueTracks.length} local)`);
        return result;
      });
      
      setErrors(prev => ({ ...prev, recently: '' }));
    } catch (error) {
      console.error('Failed to refresh recently played:', error);
      setErrors(prev => ({ ...prev, recently: 'Failed to refresh recently played tracks' }));
    } finally {
      setIsRefreshing(false);
      setLoadingRecently(false);
    }
  }, [token, isRefreshing, recentlyPlayed.length]);

  React.useEffect(() => {
    console.log('Dashboard loaded, token:', !!token, 'isLoading:', isLoading);
    
    // Don't redirect if still loading (token exchange might be in progress)
    if (isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // If user is not authenticated and not loading, stay on Dashboard as a guest
    // Do not redirect to /login automatically; allow guest experience and skip
    // authenticated-only data fetching below.
    if (!token) {
      console.log('No token found and not loading, staying on Dashboard as guest');
      return;
    }

    // Set dynamic greeting based on time with emoji
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('Late night vibes');
    else if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else if (hour < 21) setGreeting('Good Evening');
    else setGreeting('Good Night');

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

    // Fetch recently played tracks using the refresh function
    refreshRecentlyPlayed();

    // Fetch user's top tracks
    setLoadingTop(true);
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term', {
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

  // (Hit Songs feature removed)

  // Browse by genre removed
  }, [token, isLoading, navigate]);

  // Periodic refresh for recently played tracks
  React.useEffect(() => {
    if (!token) return;

    // Set up interval to refresh recently played every 30 seconds
    const intervalId = setInterval(() => {
      refreshRecentlyPlayed();
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [token, refreshRecentlyPlayed]);

  // Watch for current track changes and add to recently played
  React.useEffect(() => {
    if (!currentTrack) return;

    console.log('🎵 Current track changed:', currentTrack.name, 'by', currentTrack.artists?.[0]?.name, 'isPlaying:', isPlaying);
    
    // Add a small delay to ensure the track is actually playing and to avoid race conditions
    const timeoutId = setTimeout(() => {
      console.log('🎵 Adding current track to recently played after delay');
      addToLocallyPlayed(currentTrack, 'current track change');
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [currentTrack, addToLocallyPlayed]);

  // Click-outside handling

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

  // Guest experience: if not authenticated, show a lightweight guest dashboard
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="w-full bg-white/4 border border-white/10 rounded-3xl p-8 backdrop-blur-md grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Left: Message & CTAs */}
              <div className="px-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-300 font-bold">♪</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome to Spotify Lite</h1>
                </div>

                <p className="text-gray-300 mb-6">You're browsing as a guest. Explore the catalog, preview playlists, and try the discovery tools. Sign in to enable playback controls, save playlists, and get personalized recommendations.</p>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <button
                    onClick={() => scrollToSection('browse')}
                    className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-2xl shadow-lg transition-transform transform hover:scale-105"
                  >
                    Explore as guest
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                    <span>Preview curated playlists and top tracks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                    <span>Use the discovery tools to find new music.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0" />
                    <span>Search and preview tracks without signing in.</span>
                  </li>
                </ul>
              </div>

              {/* Right: Sample previews */}
              <div className="px-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-24 bg-gradient-to-br from-green-500/30 to-green-700/30 rounded-lg flex items-end p-2 text-xs text-white">Top playlists</div>
                  <div className="h-24 bg-gradient-to-br from-purple-500/30 to-purple-700/30 rounded-lg flex items-end p-2 text-xs text-white">New releases</div>
                  <div className="h-24 bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 rounded-lg flex items-end p-2 text-xs text-white">Trending</div>
                </div>

                <div className="mt-3 text-gray-400 text-sm">No account required to explore. Sign in when you're ready to save favorites and control playback.</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      {/* Show loading screen while auth is in progress */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <CircularProgress size={60} sx={{ color: '#22c55e', mb: 2 }} />
            <div className="text-white text-xl">Connecting to Spotify...</div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Header 
        onSearch={(query) => {
          // TODO: Implement search functionality
          console.log('Search query:', query);
        }}
        onMobileMenuToggle={() => setSidebarOpen(true)}
        onTrackPlayed={(track: any) => {
          // Add track to recently played immediately
          addToLocallyPlayed(track, 'header-search');
          // Note: Don't call refreshRecentlyPlayed here as it can cause duplicates
        }}
      />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-72 pb-24 pt-20">
        
        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12 space-y-10">
          {/* Device Status moved to top status bar */}
            
{/* Modern Welcome Header */}
<div className="relative overflow-hidden mb-8 max-h-[90vh] min-h-[340px] flex items-center justify-center">
  {/* Glassmorphism background */}
  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-3xl border border-white/10"></div>
  <div className="relative p-4 sm:p-6 md:p-8 space-y-4 w-full overflow-y-auto max-h-[90vh]">
    {/* Top Status Bar */}
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30 backdrop-blur-sm text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <span className="text-green-300 font-semibold">Live Dashboard</span>
        </div>
        {/* Device Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm text-xs ${deviceId ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-red-400/10 border-red-400/30'}`}>
          <div className={`w-2 h-2 rounded-full ${deviceId ? 'bg-green-400 animate-pulse' : 'bg-red-400'} shadow-lg`}></div>
          <span className={`${deviceId ? 'text-yellow-200' : 'text-red-200'} font-semibold`}>
            Device: {deviceId ? `Connected (${deviceId.slice(0, 8)}...)` : 'No device'}
          </span>
        </div>
        <div className="text-xs font-semibold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
    {/* Main Greeting Section */}
    <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2">
        <span className="bg-gradient-to-r from-green-400 via-green-300 to-green-400 bg-clip-text text-transparent">
          {greeting}
        </span>
      </h1>
      {user?.display_name && (
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-200 mb-2">
            Welcome back, <span className="text-white">{formatDisplayName(user.display_name)}</span>!
          </h2>
          <p className="text-base text-gray-400 max-w-xl mx-auto lg:mx-0">
            Ready to discover your next favorite song? Let's dive into your personalized music universe.
          </p>
        </div>
      )}
    </div>
    {/* Quick Stats Grid */}
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
      <button
        onClick={() => scrollToSection('recently')}
        className="group p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-green-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors duration-300">
            <span className="text-xl font-bold text-green-400 leading-none group-hover:scale-110 transition-transform duration-300">♪</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium group-hover:text-green-300 transition-colors duration-300">Recent Plays</div>
          </div>
        </div>
      </button>
      <button
        onClick={() => scrollToSection('playlists')}
        className="group p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors duration-300">
            <span className="text-xl font-bold text-purple-400 leading-none group-hover:scale-110 transition-transform duration-300">♫</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium group-hover:text-purple-300 transition-colors duration-300">Playlists</div>
          </div>
        </div>
      </button>
      <button
        onClick={() => scrollToSection('top')}
        className="group p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-yellow-500/20"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/30 transition-colors duration-300">
            <span className="text-xl font-bold text-yellow-400 leading-none group-hover:scale-110 transition-transform duration-300">★</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium group-hover:text-yellow-300 transition-colors duration-300">Top Tracks</div>
          </div>
        </div>
      </button>
  {/* Removed: New Releases and Browse Genres quick-action buttons */}
    </div>
    {/* Action Buttons (Discover button removed) */}
    <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-2">
      {/* Discover Music button intentionally removed */}
    </div>
            </div>
          </div>
          {/* Continue Listening Section */}
          <section id="recently" className="space-y-4">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Continue Listening</h2>
                <p className="text-gray-400 text-sm">Pick up where you left off</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Navigation Arrows */}
                {recentlyPlayed.length > recentlyPerView && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevRecently}
                      disabled={!canGoPrevRecently || isAnimatingRecently}
                      className={`p-1.5 rounded-lg border transition-all duration-300 ${
                        canGoPrevRecently && !isAnimatingRecently
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Previous tracks"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextRecently}
                      disabled={!canGoNextRecently || isAnimatingRecently}
                      className={`p-1.5 rounded-lg border transition-all duration-300 ${
                        canGoNextRecently && !isAnimatingRecently
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Next tracks"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recently Played Section */}
            {loadingRecently ? (
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: recentlyPerView }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <LoadingSkeleton className="aspect-square rounded-lg" />
                    <LoadingSkeleton className="h-3 w-full" />
                    <LoadingSkeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : errors.recently ? (
              <ErrorMessage message={errors.recently} />
            ) : recentlyPlayed.length > 0 ? (
                <div className={`grid grid-cols-6 gap-4 transition-all duration-300 ease-in-out ${isAnimatingRecently ? 'opacity-75 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                {recentlyPlayed.slice(recentlyStartIndex, recentlyStartIndex + recentlyPerView).map((item, index) => (
                  <div 
                    key={`${item.track.id}-${recentlyStartIndex}`} 
                    className={`group cursor-pointer transition-all duration-300 ease-out ${isAnimatingRecently ? 'animate-pulse' : ''}`}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      transform: isAnimatingRecently ? 'translateY(10px)' : 'translateY(0px)'
                    }}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/5 hover:border-green-500/30 transition-all duration-300 hover:scale-102 backdrop-blur-sm">
                      <div className="aspect-square relative">
                        <img 
                          src={item.track.album?.images?.[0]?.url || '/vite.svg'} 
                          alt={`${item.track.name} cover`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log(`🎵 Continue Listening: Clicked play button for track: ${item.track.name} (ID: ${item.track.id})`);
                              console.log(`🎵 Current track: ${currentTrack?.name} (ID: ${currentTrack?.id}), isPlaying: ${isPlaying}`);
                              try {
                                if (currentTrack?.id === item.track.id && isPlaying) {
                                  console.log(`⏸️ Pausing current track`);
                                  await pause();
                                } else {
                                  console.log(`▶️ Playing track: ${item.track.name}`);
                                  await play(item.track);
                                  // Add to recently played to move it to the top (most recent position)
                                  addToLocallyPlayed(item.track, 'recently-played-replay');
                                }
                              } catch (error) {
                                console.error('❌ Play/Pause error:', error);
                                toast.showToast('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
                              }
                            }}
                            className="w-8 h-8 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            {currentTrack?.id === item.track.id && isPlaying ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" className="text-white"/>
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5v14l11-7z" fill="currentColor" className="text-white"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <h4 
                          className="text-white font-medium text-xs truncate group-hover:text-green-400 transition-colors leading-tight cursor-pointer hover:underline"
                          onClick={(e) => handleTrackNameClick(e, item.track.album?.id || '')}
                        >
                          {item.track.name}
                        </h4>
                        <p className="text-gray-400 text-xs truncate mt-0.5 leading-tight">
                          <Box
                            component="span"
                            tabIndex={0}
                            role="link"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openArtist(item.track.artists?.[0]?.id || ''); }}
                            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openArtist(item.track.artists?.[0]?.id || ''); } }}
                            sx={{
                              cursor: 'pointer',
                              color: 'inherit',
                              textDecoration: 'none',
                              transition: 'color 120ms ease, transform 120ms ease',
                              '&:hover': { color: '#1db954', transform: 'translateY(-1px)' },
                              '&:focus': { outline: 'none', textDecoration: 'underline' }
                            }}
                          >
                            {item.track.artists?.[0]?.name}
                          </Box>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-base mb-3 font-medium">No recent plays yet</p>
                <p className="text-gray-500 text-sm mb-4">Start listening to see your recently played tracks here</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Discover Music
                </button>
              </div>
            )}
          </section>
          {/* Top Tracks Section */}
          <section id="top" className="space-y-4">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Top 10 Tracks</h2>
                <p className="text-gray-400 text-sm">Your most played songs this month</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Navigation Arrows */}
                {topTracks.length > tracksPerView && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevTracks}
                      disabled={!canGoPrev || isAnimatingTracks}
                      className={`p-1.5 rounded-lg border transition-all duration-300 ${
                        canGoPrev && !isAnimatingTracks
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Previous tracks"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNextTracks}
                      disabled={!canGoNext || isAnimatingTracks}
                      className={`p-1.5 rounded-lg border transition-all duration-300 ${
                        canGoNext && !isAnimatingTracks
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40' 
                          : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Next tracks"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Top Tracks Section */}
            {loadingTop ? (
              <div className="space-y-3">
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
              <div className={`space-y-3 transition-all duration-300 ease-in-out ${isAnimatingTracks ? 'opacity-75 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                {topTracks.slice(topTracksStartIndex, topTracksStartIndex + tracksPerView).map((track, index) => {
                  const globalIndex = topTracksStartIndex + index;
                  return (
                    <div 
                      key={`${track.id}-${topTracksStartIndex}`} 
                      className={`group cursor-pointer bg-white/3 hover:bg-white/8 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all duration-300 backdrop-blur-sm overflow-hidden ${isAnimatingTracks ? 'animate-pulse' : ''}`}
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        transform: isAnimatingTracks ? 'translateX(10px)' : 'translateX(0px)'
                      }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-lg">
                            {globalIndex + 1}
                          </div>
                        </div>
                        
                        {/* Album Cover */}
                        <div className="flex-shrink-0 relative">
                          <img 
                            src={track.album?.images?.[0]?.url || '/vite.svg'} 
                            alt={`${track.name} cover`} 
                            className="w-14 h-14 rounded-xl object-cover shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                        </div>
                        
                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-white font-semibold text-sm truncate group-hover:text-yellow-400 transition-colors mb-1 cursor-pointer hover:underline"
                            onClick={(e) => handleTrackNameClick(e, track.album?.id || '')}
                          >
                            {track.name}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {track.artists?.map((artist, index) => (
                              <span key={artist.id}>
                                <Box
                                  component="span"
                                  tabIndex={0}
                                  role="link"
                                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); openArtist(artist.id); }}
                                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openArtist(artist.id); } }}
                                  sx={{
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    transition: 'color 120ms ease, transform 120ms ease',
                                    '&:hover': { color: '#1db954', transform: 'translateY(-1px)' },
                                    '&:focus': { outline: 'none', textDecoration: 'underline' }
                                  }}
                                >
                                  {artist.name}
                                </Box>
                                {index < (track.artists?.length || 0) - 1 && ', '}
                              </span>
                            )) || 'Unknown Artist'}
                          </p>
                        </div>
                        
                        {/* Duration & Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-400 font-mono hidden sm:block">
                            {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                          </span>
                          
                          {/* Play Button */}
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (currentTrack?.id === track.id && isPlaying) {
                                  await pause();
                                } else {
                                  await play(track);
                                  // Always move to top of recently played, even if already present
                                  addToLocallyPlayed(track, 'recently-played-replay');
                                }
                              } catch (error) {
                                console.error('Play/Pause error:', error);
                                toast.showToast('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
                              }
                            }}
                            className="w-10 h-10 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 border border-yellow-500/30 hover:border-yellow-500"
                          >
                            {currentTrack?.id === track.id && isPlaying ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5v14l11-7z" fill="currentColor"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-base mb-3 font-medium">No top tracks yet</p>
                <p className="text-gray-500 text-sm mb-4">Play more music to see your personalized stats</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Start Listening
                </button>
              </div>
            )}
          </section>
          {/* Your Playlists Section */}
          <section id="playlists" className="space-y-4">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Playlists</h2>
                <p className="text-gray-400 text-sm">Your personal music collections</p>
              </div>
            </div>
            
            {/* Playlists Section */}
            {loadingPlaylists ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <LoadingSkeleton className="aspect-square rounded-lg" />
                    <LoadingSkeleton className="h-3 w-full" />
                    <LoadingSkeleton className="h-2 w-3/4" />
                  </div>
                ))}
              </div>
            ) : errors.playlists ? (
              <ErrorMessage message={errors.playlists} />
            ) : playlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:scale-102 backdrop-blur-sm">
                      <div className="aspect-square relative">
                        <img 
                          src={playlist.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='} 
                          alt={`${playlist.name} cover`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                // Try to play playlist using context URI for better reliability
                                console.log('Playing playlist:', playlist.name, 'URI:', playlist.uri);
                                if (playlist.uri) {
                                  // Use context_uri to play the entire playlist
                                  await play({ context_uri: playlist.uri, offset: { position: 0 } });
                                  console.log('Playing playlist via context URI:', playlist.name);
                                } else {
                                  // Fallback to fetching first track if no URI
                                  const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=1`, {
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  
                                  if (tracksResponse.ok) {
                                    const tracksData = await tracksResponse.json();
                                    const firstTrack = tracksData.items?.[0]?.track;
                                    
                                    if (firstTrack) {
                                      await play(firstTrack);
                                      addToLocallyPlayed(firstTrack, 'playlist');
                                      console.log('Playing first track from playlist:', playlist.name);
                                    } else {
                                      toast.showToast('No tracks available in this playlist.', 'warning');
                                    }
                                  } else {
                                    throw new Error(`Failed to fetch playlist tracks: HTTP ${tracksResponse.status}`);
                                  }
                                }
                              } catch (error) {
                                console.error('Play error:', error);
                                toast.showToast('Unable to play playlist. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
                              }
                            }}
                            className="w-8 h-8 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="currentColor" className="text-white"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 
                          className="text-white font-medium text-xs truncate group-hover:text-purple-400 transition-colors leading-tight cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPlaylist(playlist.id);
                          }}
                        >
                          {playlist.name}
                        </h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5 leading-tight">
                          {playlist.description ? decodeHtmlEntities(playlist.description) : `${playlist.tracks.total} tracks`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-base mb-3 font-medium">No playlists found</p>
                <p className="text-gray-500 text-sm mb-4">Create your first playlist on Spotify to see it here</p>
                <button 
                  onClick={() => window.open('https://open.spotify.com', '_blank')}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Open Spotify
                </button>
              </div>
            )}
          </section>
          {/* New Releases / Hit Songs section removed */}
          {/* Browse by genre removed */}
        </div>
        
        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-32 right-6 z-[100] w-10 h-10 bg-green-500 hover:bg-green-400 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center group animate-slideIn backdrop-blur-sm border border-green-400/50 hover:border-green-300"
            title="Scroll to top"
            style={{ zIndex: 100 }}
          >
            <KeyboardArrowUpIcon 
              className="transform group-hover:-translate-y-0.5 transition-transform duration-200"
              style={{ fontSize: '20px' }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
