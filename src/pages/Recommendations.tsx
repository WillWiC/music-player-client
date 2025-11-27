/**
 * Dedicated Recommendations Page
 * Full-featured page for displaying AI-powered music recommendations
 * with comprehensive music profile analysis and local algorithm-based similar songs
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import { useMusicIntelligence } from '../hooks/useMusicIntelligence';
import { useLocalAnalysis } from '../hooks/useLocalAnalysis';
import type { PlaylistRecommendation } from '../services/musicIntelligenceService';
import { formatCount } from '../utils/numberFormat';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PlaylistMenu from '../components/PlaylistMenu';
import TrackMenu from '../components/TrackMenu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { IconButton, Tooltip, Fade, Grow, Skeleton, LinearProgress, Chip } from '@mui/material';
import type { Playlist, Track } from '../types/spotify';

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { play } = usePlayer();
  const toast = useToast();
  const { recommendations, insights, isLoading, error, refreshRecommendations, clearError } = useMusicIntelligence();
  const { 
    analysis, 
    isAnalyzing,
    progress, 
    analyzeLibrary,
    clearAnalysis 
  } = useLocalAnalysis();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showAllGenres, setShowAllGenres] = React.useState(false);
  const [showAllClusters, setShowAllClusters] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'playlists' | 'similar'>('playlists');
  const [discoveryFilter, setDiscoveryFilter] = React.useState<'all' | 'hidden-gem' | 'mood-shift' | 'genre-explorer' | 'perfect-match'>('all');
  const [showAllDiscoveries, setShowAllDiscoveries] = React.useState(false);

  // Playlist menu state
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<Playlist | null>(null);

  // Track menu state
  const [trackMenuAnchor, setTrackMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<Track | null>(null);

  const handleTrackMenuOpen = (event: React.MouseEvent<HTMLElement>, track: Track) => {
    event.stopPropagation();
    setTrackMenuAnchor(event.currentTarget);
    setSelectedTrack(track);
  };

  const handleTrackMenuClose = () => {
    setTrackMenuAnchor(null);
    setSelectedTrack(null);
  };

  const handlePlaylistMenuOpen = (event: React.MouseEvent<HTMLElement>, playlist: Playlist) => {
    event.stopPropagation();
    setPlaylistMenuAnchor(event.currentTarget);
    setSelectedPlaylist(playlist);
  };

  const handlePlaylistMenuClose = () => {
    setPlaylistMenuAnchor(null);
    setSelectedPlaylist(null);
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Fetch saved tracks for local analysis (includes liked songs, saved playlists, and saved albums)
  const fetchSavedTracksForAnalysis = React.useCallback(async (forceRefresh: boolean = false) => {
    if (!token) return;
    
    try {
      const allTracks: Track[] = [];
      const trackIds = new Set<string>(); // Avoid duplicates

      // Helper to add tracks without duplicates
      const addTracks = (tracks: Track[]) => {
        tracks.forEach(track => {
          if (track?.id && !trackIds.has(track.id)) {
            trackIds.add(track.id);
            allTracks.push(track);
          }
        });
      };

      // 1. Fetch ALL liked songs (paginated)
      console.log('📚 Fetching liked songs...');
      let likedUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';
      let hasMoreLiked = true;
      while (hasMoreLiked) {
        const likedResponse = await fetch(likedUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!likedResponse.ok) break;
        const likedData = await likedResponse.json();
        const tracks = likedData.items?.map((item: { track: Track }) => item.track).filter(Boolean) || [];
        addTracks(tracks);
        if (likedData.next) {
          likedUrl = likedData.next;
        } else {
          hasMoreLiked = false;
        }
      }
      console.log(`✓ Found ${allTracks.length} liked songs`);

      // 2. Fetch saved playlists and their tracks
      console.log('📚 Fetching saved playlists...');
      let playlistUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';
      let hasMorePlaylists = true;
      const playlistIds: string[] = [];
      while (hasMorePlaylists) {
        const playlistResponse = await fetch(playlistUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!playlistResponse.ok) break;
        const playlistData = await playlistResponse.json();
        playlistData.items?.forEach((playlist: { id: string }) => {
          if (playlist?.id) playlistIds.push(playlist.id);
        });
        if (playlistData.next) {
          playlistUrl = playlistData.next;
        } else {
          hasMorePlaylists = false;
        }
      }
      console.log(`✓ Found ${playlistIds.length} playlists`);

      // Fetch ALL tracks from ALL playlists (with pagination)
      for (const playlistId of playlistIds) { // Removed limit - fetch from ALL playlists
        try {
          let playlistTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists,album,duration_ms,popularity,explicit,uri)),next`;
          let hasMorePlaylistTracks = true;
          
          while (hasMorePlaylistTracks && playlistTracksUrl) {
            const plTracksResponse: Response = await fetch(playlistTracksUrl, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!plTracksResponse.ok) break;
            
            const plTracksData: { items?: { track: Track }[]; next?: string } = await plTracksResponse.json();
            const tracks = plTracksData.items?.map((item) => item.track).filter(Boolean) || [];
            addTracks(tracks);
            
            if (plTracksData.next) {
              playlistTracksUrl = plTracksData.next;
            } else {
              hasMorePlaylistTracks = false;
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch playlist ${playlistId}:`, e);
        }
      }
      console.log(`✓ Total after playlists: ${allTracks.length} tracks`);

      // 3. Fetch saved albums and their tracks
      console.log('📚 Fetching saved albums...');
      let albumUrl = 'https://api.spotify.com/v1/me/albums?limit=50';
      let hasMoreAlbums = true;
      const albumIds: string[] = [];
      while (hasMoreAlbums) {
        const albumResponse = await fetch(albumUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!albumResponse.ok) break;
        const albumData = await albumResponse.json();
        albumData.items?.forEach((item: { album: { id: string } }) => {
          if (item?.album?.id) albumIds.push(item.album.id);
        });
        if (albumData.next) {
          albumUrl = albumData.next;
        } else {
          hasMoreAlbums = false;
        }
      }
      console.log(`✓ Found ${albumIds.length} saved albums`);

      // Fetch tracks from albums (batch request - up to 20 albums at a time)
      for (let i = 0; i < albumIds.length; i += 20) {
        const batch = albumIds.slice(i, i + 20);
        try {
          const albumBatchResponse = await fetch(
            `https://api.spotify.com/v1/albums?ids=${batch.join(',')}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (albumBatchResponse.ok) {
            const albumBatchData = await albumBatchResponse.json();
            albumBatchData.albums?.forEach((album: { 
              tracks?: { items: Array<{ id: string; name: string; artists: Array<{ id: string; name: string }>; duration_ms: number; popularity?: number; explicit?: boolean }> }, 
              images?: { url: string }[], 
              name?: string,
              artists?: Array<{ id: string; name: string }>
            }) => {
              // Album tracks include artist info from the API
              const albumTracks = album?.tracks?.items?.map(track => ({
                ...track,
                album: { images: album.images, name: album.name },
                // Ensure artists have id - use album artists as fallback
                artists: track.artists?.length > 0 ? track.artists : album.artists || []
              })) || [];
              addTracks(albumTracks as Track[]);
            });
          }
        } catch (e) {
          console.warn('Failed to fetch album batch:', e);
        }
      }
      
      console.log(`✅ Total unique tracks for analysis: ${allTracks.length}`);
      
      if (allTracks.length > 0) {
        await analyzeLibrary(allTracks, forceRefresh);
      } else {
        toast.showToast('No tracks found in your library', 'warning');
      }
    } catch (err) {
      console.error('Failed to fetch tracks for analysis:', err);
      toast.showToast('Failed to analyze your music library', 'error');
    }
  }, [token, analyzeLibrary, toast]);

  // Auto-trigger local analysis when switching to similar tab
  React.useEffect(() => {
    if (activeTab === 'similar' && !analysis && !isAnalyzing && token) {
      fetchSavedTracksForAnalysis();
    }
  }, [activeTab, analysis, isAnalyzing, token, fetchSavedTracksForAnalysis]);

  const handlePlaylistPlay = async (recommendation: PlaylistRecommendation) => {
    try {
      navigate(`/playlist/${recommendation.playlist.id}`);
      toast.showToast(`Opening ${recommendation.playlist.name}`, 'success');
    } catch (error) {
      console.error('Play playlist error:', error);
      toast.showToast('Unable to open playlist', 'error');
    }
  };

  const handleRefresh = () => {
    clearError();
    refreshRecommendations();
  };

  const handleLocalAnalysisRefresh = () => {
    clearAnalysis();
    fetchSavedTracksForAnalysis(true);
  };

  const handleTrackPlay = async (track: Track) => {
    try {
      await play(track);
      toast.showToast(`Playing ${track.name}`, 'success');
    } catch (error) {
      console.error('Play track error:', error);
      toast.showToast('Unable to play track', 'error');
    }
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-violet-500 to-purple-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getSimilarityIcon = (type: string): string => {
    switch (type) {
      case 'genre': return '🎵';
      case 'artist': return '🎤';
      case 'popularity': return '⭐';
      case 'user_pattern': return '🎯';
      default: return '💡';
    }
  };

  const getSimilarityTypeLabel = (type: string): string => {
    switch (type) {
      case 'genre': return 'Genre Match';
      case 'artist': return 'Artist Similarity';
      case 'popularity': return 'Popularity Based';
      case 'user_pattern': return 'Personal Pattern';
      default: return 'AI Recommendation';
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      <Header 
        onSearch={(query) => console.log('Search:', query)}
        onMobileMenuToggle={() => setSidebarOpen(true)}
      />
      
      <div className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative w-full py-10 px-2 sm:px-8 lg:px-12 space-y-8">
          {/* Header */}
          <Fade in timeout={600}>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-violet-500/30 transition-all"
              >
                <ArrowBackIcon className="text-white" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  Smart Recommendations
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  AI-powered analysis and personalized playlist suggestions
                </p>
              </div>
              <Tooltip title="Refresh recommendations">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30"
                  sx={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    '&:hover': { color: 'white' },
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '0.75rem',
                  }}
                >
                  <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
                </IconButton>
              </Tooltip>
            </div>
          </Fade>

          {/* Tab Switcher */}
          <Fade in timeout={700}>
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab('playlists')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'playlists'
                    ? 'bg-violet-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🎯</span>
                AI Playlists
              </button>
              <button
                onClick={() => setActiveTab('similar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'similar'
                    ? 'bg-violet-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <AnalyticsIcon sx={{ fontSize: 18 }} />
                Music Profile
                {analysis && (
                  <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {analysis.analyzedCount}
                  </span>
                )}
              </button>
            </div>
          </Fade>

          {/* Comprehensive Music Profile Analysis */}
          {insights && !isLoading && (
            <Fade in timeout={800}>
              <div className="space-y-6">
                {/* Profile Overview */}
                <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎵</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Your Music DNA</h2>
                      <p className="text-gray-400 text-sm">Analysis of your listening patterns</p>
                    </div>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 border border-violet-500/20 hover:border-violet-500/40 transition-colors">
                      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-lg">🎵</span>
                      </div>
                      <div className="text-violet-400 font-semibold text-lg mb-0.5 truncate">
                        {insights.topGenres[0]?.genre || 'Mixed'}
                      </div>
                      <div className="text-gray-500 text-xs">Top Genre</div>
                      {insights.topGenres[0] && (
                        <div className="mt-2 text-xs text-violet-300/80">
                          {insights.topGenres[0].percentage}% of your music
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-lg">🎨</span>
                      </div>
                      <div className="text-blue-400 font-semibold text-lg mb-0.5">
                        {insights.artistDiversity}%
                      </div>
                      <div className="text-gray-500 text-xs">Artist Diversity</div>
                      <div className="mt-2 text-xs text-blue-300/80">
                        {insights.artistDiversity > 70 ? 'Very diverse' : insights.artistDiversity > 40 ? 'Moderate' : 'Focused'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-lg">🔍</span>
                      </div>
                      <div className="text-purple-400 font-semibold text-lg mb-0.5">
                        {insights.discoveryRate}%
                      </div>
                      <div className="text-gray-500 text-xs">Discovery Rate</div>
                      <div className="mt-2 text-xs text-purple-300/80">
                        {insights.discoveryRate > 70 ? 'Explorer' : insights.discoveryRate > 40 ? 'Balanced' : 'Loyalist'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-lg">⭐</span>
                      </div>
                      <div className="text-amber-400 font-semibold text-lg mb-0.5 capitalize">
                        {insights.popularityBias}
                      </div>
                      <div className="text-gray-500 text-xs">Music Style</div>
                      <div className="mt-2 text-xs text-amber-300/80">
                        {insights.popularityBias === 'mainstream' ? 'Chart hits' : insights.popularityBias === 'underground' ? 'Hidden gems' : 'Best of both'}
                      </div>
                    </div>
                  </div>

                  {/* Listening Patterns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-gray-500 text-xs mb-1">Avg Track Length</div>
                      <div className="text-white font-semibold text-base">
                        {formatDuration(insights.listeningPatterns.averageTrackLength)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.averageTrackLength > 240000 ? 'Long tracks' : insights.listeningPatterns.averageTrackLength > 180000 ? 'Standard' : 'Short & sweet'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-gray-500 text-xs mb-1">Explicit Content</div>
                      <div className="text-white font-semibold text-base">
                        {insights.listeningPatterns.explicitContentRatio}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.explicitContentRatio > 50 ? 'High' : insights.listeningPatterns.explicitContentRatio > 20 ? 'Moderate' : 'Low'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-gray-500 text-xs mb-1">Era Preference</div>
                      <div className="text-white font-semibold text-base capitalize">
                        {insights.listeningPatterns.recentVsOld}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {insights.listeningPatterns.recentVsOld === 'recent' ? 'New releases' : insights.listeningPatterns.recentVsOld === 'classic' ? 'Timeless hits' : 'All eras'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genre Breakdown */}
                <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🎼</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Genre Distribution</h3>
                        <p className="text-gray-500 text-xs">Your top {showAllGenres ? insights.topGenres.length : 5} music genres</p>
                      </div>
                    </div>
                    {insights.topGenres.length > 5 && (
                      <button
                        onClick={() => setShowAllGenres(!showAllGenres)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors border border-white/10 hover:border-violet-500/30 flex items-center gap-2"
                      >
                        {showAllGenres ? (
                          <>
                            <span>Show Less</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View All ({insights.topGenres.length})</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {insights.topGenres.slice(0, showAllGenres ? insights.topGenres.length : 5).map((genreData, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-md flex items-center justify-center text-white font-medium text-xs">
                              {index + 1}
                            </div>
                            <span className="text-white font-medium text-sm capitalize">{genreData.genre}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-xs">{Math.round(genreData.count)} tracks</span>
                            <span className="text-violet-400 font-mono text-xs min-w-[2.5rem] text-right">
                              {genreData.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${genreData.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Fade>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <Skeleton 
                variant="rectangular" 
                animation="wave"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.05)', 
                  borderRadius: '1rem',
                  height: '320px'
                }} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    animation="wave"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: '0.75rem',
                      height: '280px'
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-red-400 text-base mb-4">{error}</div>
              <button
                onClick={handleRefresh}
                className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Recommendations Section - AI Playlists Tab */}
          {activeTab === 'playlists' && !isLoading && !error && recommendations.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Personalized Playlists</h2>
                  <p className="text-gray-500 text-xs">{recommendations.length} playlists matched to your taste</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((recommendation, index) => (
                  <Grow key={recommendation.playlist.id} in timeout={400 + (index * 50)}>
                    <div
                      className="group bg-white/5 rounded-xl p-4 border border-white/10 hover:border-violet-500/30 hover:bg-white/8 transition-all cursor-pointer relative"
                      onClick={() => navigate(`/playlist/${recommendation.playlist.id}`)}
                    >
                      {/* More Options Button */}
                      <button
                        onClick={(e) => handlePlaylistMenuOpen(e, recommendation.playlist as Playlist)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all z-10"
                      >
                        <MoreVertIcon sx={{ fontSize: 20 }} />
                      </button>

                      {/* Playlist Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={recommendation.playlist.images[0]?.url || '/vite.svg'}
                            alt={recommendation.playlist.name}
                            className="w-16 h-16 rounded-lg object-cover shadow-md"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaylistPlay(recommendation);
                            }}
                            className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 28 }} />
                          </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate mb-0.5 group-hover:text-violet-300 transition-colors">
                            {recommendation.playlist.name}
                          </h3>
                          <p className="text-gray-500 text-xs mb-2">
                            {formatCount(recommendation.playlist.followers?.total ?? 0)} followers
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm">{getSimilarityIcon(recommendation.similarityType)}</span>
                            <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                              {getSimilarityTypeLabel(recommendation.similarityType)}
                            </span>
                            {/* Match Score Badge */}
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-gradient-to-r ${getScoreGradient(recommendation.score)} text-white`}>
                              {recommendation.score}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation Reasons */}
                      <div className="space-y-1.5 mb-3">
                        <h4 className="text-gray-400 font-medium text-xs">Why you'll love this:</h4>
                        {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                            <span className="text-violet-400">•</span>
                            <span className="flex-1 leading-relaxed">{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Matching Genres */}
                      {recommendation.matchingGenres.length > 0 && (
                        <div className="pt-3 border-t border-white/5">
                          <div className="flex flex-wrap gap-1">
                            {recommendation.matchingGenres.slice(0, 4).map((genre, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20"
                              >
                                {genre}
                              </span>
                            ))}
                            {recommendation.matchingGenres.length > 4 && (
                              <span className="text-xs text-gray-500 px-1">
                                +{recommendation.matchingGenres.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Grow>
                ))}
              </div>
            </div>
          )}



          {/* Empty State */}
          {activeTab === 'playlists' && !isLoading && !error && recommendations.length === 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-10 text-center">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎵</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Recommendations Yet</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Listen to more music on Spotify to get personalized playlist recommendations
              </p>
              <button
                onClick={handleRefresh}
                className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Generate Recommendations
              </button>
            </div>
          )}

          {/* Similar Songs Tab Content */}
          {activeTab === 'similar' && (
            <div className="space-y-8">
              {/* Local Analysis Loading State */}
              {isAnalyzing && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
                    <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AutoAwesomeIcon className="text-violet-400 animate-pulse" sx={{ fontSize: 32 }} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Analyzing Your Music</h2>
                    <p className="text-gray-400 text-sm mb-4">
                      Analyzing your music library and organizing tracks...
                    </p>
                    <div className="max-w-xs mx-auto">
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #8b5cf6, #a855f7)'
                          }
                        }}
                      />
                      <p className="text-gray-500 text-xs mt-2">{progress}% complete</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Analysis Results */}
              {!isAnalyzing && analysis && (
                <Fade in timeout={600}>
                  <div className="space-y-6">
                    {/* Music Profile Summary */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                            <AnalyticsIcon sx={{ color: 'white', fontSize: 24 }} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Local Analysis Profile</h2>
                            <p className="text-gray-400 text-sm">{analysis.analyzedCount} tracks analyzed using algorithms</p>
                          </div>
                        </div>
                        <Tooltip title="Refresh analysis">
                          <IconButton
                            onClick={handleLocalAnalysisRefresh}
                            disabled={isAnalyzing}
                            sx={{ 
                              color: 'rgba(255,255,255,0.6)', 
                              '&:hover': { color: 'white' },
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderRadius: '0.75rem',
                            }}
                          >
                            <RefreshIcon className={isAnalyzing ? 'animate-spin' : ''} />
                          </IconButton>
                        </Tooltip>
                      </div>

                      {/* Profile Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white/5 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">⚡</span>
                          </div>
                          <div className="text-emerald-400 font-semibold text-lg capitalize mb-0.5">
                            {analysis.musicProfile.energyProfile}
                          </div>
                          <div className="text-gray-500 text-xs">Energy Profile</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">🎹</span>
                          </div>
                          <div className="text-cyan-400 font-semibold text-lg capitalize mb-0.5">
                            {analysis.musicProfile.acousticProfile}
                          </div>
                          <div className="text-gray-500 text-xs">Sound Type</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-violet-500/20 hover:border-violet-500/40 transition-colors">
                          <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">🎼</span>
                          </div>
                          <div className="text-violet-400 font-semibold text-lg mb-0.5">
                            {analysis.clusters.length}
                          </div>
                          <div className="text-gray-500 text-xs">Music Clusters</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-lg">💎</span>
                          </div>
                          <div className="text-purple-400 font-semibold text-lg mb-0.5">
                            {analysis.localDiscoveries?.length || 0}
                          </div>
                          <div className="text-gray-500 text-xs">Library Discoveries</div>
                        </div>
                      </div>

                      {/* Mood Distribution */}
                      {analysis.musicProfile.moodDistribution.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-3">Mood Distribution</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysis.musicProfile.moodDistribution.slice(0, 6).map((mood, idx) => (
                              <Chip
                                key={idx}
                                label={`${mood.mood} (${mood.percentage}%)`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(139, 92, 246, 0.15)',
                                  color: '#c4b5fd',
                                  border: '1px solid rgba(139, 92, 246, 0.3)',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Music Clusters - Your Library Organized by Style */}
                    {analysis.clusters.length > 0 && (
                      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                              <span className="text-xl">🎼</span>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">Music Clusters</h2>
                              <p className="text-gray-400 text-sm">
                                Your library organized into {analysis.clusters.length} distinct styles
                              </p>
                            </div>
                          </div>
                          {analysis.clusters.length > 5 && (
                            <button
                              onClick={() => setShowAllClusters(!showAllClusters)}
                              className="px-4 py-2 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
                            >
                              {showAllClusters ? (
                                <span className="flex items-center gap-1">Show Less <span className="text-xs">▲</span></span>
                              ) : (
                                <span className="flex items-center gap-1">View All ({analysis.clusters.length}) <span className="text-xs">▼</span></span>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Clusters Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysis.clusters.slice(0, showAllClusters ? analysis.clusters.length : 5).map((cluster, idx) => (
                            <Grow key={cluster.name} in timeout={300 + (idx * 50)}>
                              <div className="group bg-white/5 rounded-xl p-4 border border-white/10 hover:border-violet-500/30 hover:bg-white/8 transition-all">
                                {/* Cluster Header */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">
                                      {cluster.name.includes('Energy') ? '⚡' :
                                       cluster.name.includes('Dance') ? '💃' :
                                       cluster.name.includes('Uplifting') ? '☀️' :
                                       cluster.name.includes('Electronic') ? '🎹' :
                                       cluster.name.includes('Chill') ? '🌙' :
                                       cluster.name.includes('Acoustic') ? '🎸' :
                                       cluster.name.includes('Moody') ? '🌧️' :
                                       cluster.name.includes('Intense') ? '🔥' : '🎵'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate group-hover:text-violet-300 transition-colors">
                                      {cluster.name}
                                    </h3>
                                    <p className="text-gray-500 text-xs">
                                      {(cluster as any)._fullTrackCount || cluster.tracks.length} tracks • {cluster.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Dominant Genres */}
                                {cluster.dominantGenres.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3">
                                    {cluster.dominantGenres.slice(0, 3).map((genre, gIdx) => (
                                      <span key={gIdx} className="text-xs text-gray-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                        {genre}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Sample Tracks */}
                                <div className="space-y-2">
                                  <h4 className="text-gray-400 font-medium text-xs">Top tracks:</h4>
                                  {cluster.tracks.slice(0, 3).map((item) => (
                                    <div 
                                      key={item.track.id}
                                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                      onClick={() => handleTrackPlay(item.track)}
                                    >
                                      <img
                                        src={item.track.album?.images?.[0]?.url || '/vite.svg'}
                                        alt={item.track.name}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs truncate">{item.track.name}</p>
                                        <p className="text-gray-500 text-xs truncate">
                                          {item.track.artists?.map((a: { name: string }) => a.name).join(', ')}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => handleTrackMenuOpen(e, item.track)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all"
                                      >
                                        <MoreVertIcon sx={{ fontSize: 16 }} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Track Count Badge */}
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {((cluster as any)._fullTrackCount || cluster.tracks.length) > 3 
                                      ? `+${((cluster as any)._fullTrackCount || cluster.tracks.length) - 3} more tracks` 
                                      : ''}
                                  </span>
                                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                                    {Math.round((((cluster as any)._fullTrackCount || cluster.tracks.length) / analysis.analyzedCount) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Discoveries - Hidden Gems, Mood Shifters, Genre Explorers */}
                    {analysis.localDiscoveries && analysis.localDiscoveries.length > 0 && (
                      <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                              <span className="text-xl">💎</span>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">Library Discoveries</h2>
                              <p className="text-gray-400 text-sm">
                                {discoveryFilter === 'all' 
                                  ? `${analysis.localDiscoveries.length} unique finds from your collection`
                                  : `${analysis.localDiscoveries.filter(d => d.category === discoveryFilter).length} ${discoveryFilter.replace('-', ' ')}s`
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Category Filter Buttons */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          <button
                            onClick={() => setDiscoveryFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              discoveryFilter === 'all'
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            ✨ All
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                              {analysis.localDiscoveries.length}
                            </span>
                          </button>
                          <button
                            onClick={() => setDiscoveryFilter('hidden-gem')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              discoveryFilter === 'hidden-gem'
                                ? 'bg-violet-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            💎 Hidden Gems
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                              {analysis.localDiscoveries.filter(d => d.category === 'hidden-gem').length}
                            </span>
                          </button>
                          <button
                            onClick={() => setDiscoveryFilter('mood-shift')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              discoveryFilter === 'mood-shift'
                                ? 'bg-pink-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            🌈 Mood Shifters
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                              {analysis.localDiscoveries.filter(d => d.category === 'mood-shift').length}
                            </span>
                          </button>
                          <button
                            onClick={() => setDiscoveryFilter('genre-explorer')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              discoveryFilter === 'genre-explorer'
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            🧭 Genre Explorers
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                              {analysis.localDiscoveries.filter(d => d.category === 'genre-explorer').length}
                            </span>
                          </button>
                          <button
                            onClick={() => setDiscoveryFilter('perfect-match')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                              discoveryFilter === 'perfect-match'
                                ? 'bg-yellow-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            ⭐ Perfect Match
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                              {analysis.localDiscoveries.filter(d => d.category === 'perfect-match').length}
                            </span>
                          </button>
                        </div>

                        {/* Discovery Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysis.localDiscoveries
                            .filter(d => discoveryFilter === 'all' || d.category === discoveryFilter)
                            .slice(0, showAllDiscoveries ? undefined : 12)
                            .map((discovery, idx) => (
                            <Grow key={discovery.track.id} in timeout={300 + (idx * 50)}>
                              <div 
                                className="group bg-white/5 rounded-xl p-4 border border-white/10 hover:border-amber-500/30 hover:bg-white/8 transition-all cursor-pointer relative"
                                onClick={() => handleTrackPlay(discovery.track)}
                              >
                                {/* More Options Button */}
                                <button
                                  onClick={(e) => handleTrackMenuOpen(e, discovery.track)}
                                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all z-10"
                                >
                                  <MoreVertIcon sx={{ fontSize: 20 }} />
                                </button>

                                {/* Track Header */}
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={discovery.track.album?.images?.[0]?.url || '/vite.svg'}
                                      alt={discovery.track.name}
                                      className="w-16 h-16 rounded-lg object-cover shadow-md"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTrackPlay(discovery.track);
                                      }}
                                      className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <PlayArrowIcon sx={{ color: 'white', fontSize: 28 }} />
                                    </button>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate mb-0.5 group-hover:text-amber-300 transition-colors">
                                      {discovery.track.name}
                                    </h3>
                                    <p className="text-gray-500 text-xs mb-2 truncate">
                                      {discovery.track.artists?.map((a: { name: string }) => a.name).join(', ')}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-sm">
                                        {discovery.category === 'hidden-gem' ? '💎' :
                                         discovery.category === 'mood-shift' ? '🌈' :
                                         discovery.category === 'genre-explorer' ? '🧭' :
                                         discovery.category === 'perfect-match' ? '⭐' : '✨'}
                                      </span>
                                      <span className="text-xs text-gray-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 capitalize">
                                        {discovery.category.replace('-', ' ')}
                                      </span>
                                      {/* Discovery Score Badge */}
                                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                        {Math.round(discovery.discoveryScore * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Discovery Reasons */}
                                {discovery.reasons.length > 0 && (
                                  <div className="space-y-1.5">
                                    {discovery.reasons.slice(0, 2).map((reason: string, rIdx: number) => (
                                      <div key={rIdx} className="text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                                        <span className="text-amber-400">•</span>
                                        <span className="flex-1 leading-relaxed">{reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Grow>
                          ))}
                        </div>

                        {/* Show more/less button */}
                        {analysis.localDiscoveries.filter(d => discoveryFilter === 'all' || d.category === discoveryFilter).length > 12 && (
                          <div className="mt-6 text-center">
                            <button
                              onClick={() => setShowAllDiscoveries(!showAllDiscoveries)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                            >
                              {showAllDiscoveries 
                                ? `Show Less` 
                                : `Show All ${analysis.localDiscoveries.filter(d => discoveryFilter === 'all' || d.category === discoveryFilter).length} Discoveries`
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Fade>
              )}

              {/* Empty State for Local Analysis */}
              {!isAnalyzing && !analysis && (
                <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AnalyticsIcon sx={{ color: '#34d399', fontSize: 32 }} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Local Music Analysis</h2>
                  <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                    Analyze your saved tracks using local algorithms to find similar songs and discover patterns in your music taste
                  </p>
                  <button
                    onClick={() => fetchSavedTracksForAnalysis(true)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Analysis
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Menu */}
      <PlaylistMenu
        anchorEl={playlistMenuAnchor}
        open={Boolean(playlistMenuAnchor)}
        onClose={handlePlaylistMenuClose}
        playlist={selectedPlaylist}
      />

      {/* Track Menu */}
      <TrackMenu
        anchorEl={trackMenuAnchor}
        open={Boolean(trackMenuAnchor)}
        onClose={handleTrackMenuClose}
        track={selectedTrack}
      />
    </div>
  );
};

export default Recommendations;