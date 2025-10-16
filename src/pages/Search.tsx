import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import { useSearch } from '../context/search';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Fade,
  Grow,
  Skeleton,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  History,
  Clear,
  MusicNote,
  Album as AlbumIcon,
  Person
} from '@mui/icons-material';
import type { Track } from '../types/spotify';

const SearchPage: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { 
    query, 
    setQuery, 
    results, 
    isSearching,
    isLoadingMore,
    hasMore,
    loadMore,
    recentSearches, 
    removeRecentSearch, 
    clearRecentSearches
  } = useSearch();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0); // 0: All, 1: Songs, 2: Artists, 3: Albums, 4: Playlists
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  React.useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || isLoadingMore || !query) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when user scrolls to 80% of the page
      if (scrollPercentage > 0.8) {
        // Determine which type to load based on active tab
        let typeToLoad: 'tracks' | 'albums' | 'artists' | 'playlists' | null = null;
        
        switch (activeTab) {
          case 0: // All tab - don't auto-load (would be complex to handle multiple types)
            break;
          case 1: // Songs
            if (hasMore.tracks) typeToLoad = 'tracks';
            break;
          case 2: // Artists
            if (hasMore.artists) typeToLoad = 'artists';
            break;
          case 3: // Albums
            if (hasMore.albums) typeToLoad = 'albums';
            break;
          case 4: // Playlists
            if (hasMore.playlists) typeToLoad = 'playlists';
            break;
        }

        if (typeToLoad) {
          loadMore(typeToLoad);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab, isLoadingMore, hasMore, query, loadMore]);

  React.useEffect(() => {
    // Don't auto-redirect to login; allow guest access to search UI but disable playback/searching when unauthenticated
    if (!token) {
      console.log('Search page loaded without token - guest mode');
    }
  }, [token]);

  // If the page is opened with a ?q=... param, populate the input and run the search immediately
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q.trim() && q !== query) {
      setQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleRunRecent = (q: string) => {
    setQuery(q);
  };

  const handlePlayClick = async (track: Track) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        await play(track);
      }
    } catch (err) {
      console.error('Play error', err);
      toast.showToast('Unable to play track. Ensure Spotify Premium and an active device.', 'error');
    }
  };

  // Get top result (most relevant = first result from Spotify API)
  const getTopResult = () => {
    if (results.tracks.length === 0) return null;
    // Spotify's API returns results in order of relevance, so the first track is the most relevant
    return results.tracks[0];
  };

  // Helper function to safely get image URL
  const getImageUrl = (images: any[] | null | undefined): string => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return '/vite.svg';
    }
    return images[0]?.url || '/vite.svg';
  };

  const topResult = getTopResult();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} onTrackPlayed={() => { /* no-op - header search handles it */ }} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main ref={scrollContainerRef} className="flex-1 lg:ml-72 pb-24 pt-20 overflow-y-auto">
        <div className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <Fade in timeout={600}>
            <div className="mb-8">
              {query ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/20">
                      <SearchIcon sx={{ fontSize: 28, color: 'white' }} />
                    </div>
                    <div>
                      <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Search Results
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        for "{query}"
                      </Typography>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl mb-4">
                    <SearchIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                  </div>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
                    Find Your Music
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
                    Search for your favorite songs, albums, and artists. Start typing in the search bar above.
                  </Typography>
                </div>
              )}
            </div>
          </Fade>

          {/* Recent searches - only show when no query */}
          {!query && recentSearches.length > 0 && (
            <Fade in timeout={800}>
              <Card sx={{ mb: 6, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ p: 3 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <History sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Recent Searches
                      </Typography>
                    </div>
                    <IconButton 
                      onClick={clearRecentSearches} 
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.1)' }
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentSearches.map((s, index) => (
                      <Grow in key={s} timeout={300 + index * 50}>
                        <Chip
                          label={s}
                          onClick={() => handleRunRecent(s)}
                          onDelete={() => removeRecentSearch(s)}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: 'rgba(34,197,94,0.15)',
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(34,197,94,0.2)'
                            },
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255,255,255,0.5)',
                              '&:hover': { color: 'error.main' }
                            }
                          }}
                        />
                      </Grow>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Loading State */}
          {isSearching && query && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Grow in key={i} timeout={300 + i * 100}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <div className="flex items-center gap-4">
                        <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <div className="flex-1 space-y-2">
                          <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                          <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grow>
              ))}
            </div>
          )}

          {/* Results Section */}
          {query && !isSearching && (
            <Box>
              <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)} 
                textColor="inherit" 
                indicatorColor="primary" 
                sx={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  mb: 4,
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    minHeight: 56,
                    '&.Mui-selected': {
                      color: 'primary.main'
                    }
                  }
                }}
              >
                <Tab label="All" />
                <Tab label={`Songs`} />
                <Tab label={`Artists`} />
                <Tab label={`Albums`} />
                <Tab label={`Playlists`} />
              </Tabs>

              <div className="mt-6">
                {/* ALL TAB - Spotify-style layout with sections */}
                {activeTab === 0 && (
                  <div className="space-y-8">
                    {/* Top Result + Top Songs Grid */}
                    {(topResult || results.tracks.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Result Card */}
                        {topResult && (
                          <div>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                              Top result
                            </Typography>
                            <Grow in timeout={400}>
                              <Card 
                                sx={{ 
                                  bgcolor: 'rgba(255,255,255,0.05)', 
                                  border: '1px solid rgba(255,255,255,0.08)', 
                                  borderRadius: 3,
                                  p: 3,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  minHeight: 280,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    transform: 'scale(1.02)',
                                  }
                                }}
                                onClick={() => handlePlayClick(topResult)}
                              >
                                <div>
                                  <img 
                                    src={getImageUrl(topResult.album?.images)} 
                                    alt={topResult.name}
                                    className="w-28 h-28 rounded-lg shadow-2xl mb-6"
                                  />
                                  <Typography 
                                    variant="h4" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 700, 
                                      mb: 2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical'
                                    }}
                                  >
                                    {topResult.name}
                                  </Typography>
                                  <div className="flex items-center gap-2">
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                      Song • {topResult.artists.map(a => a.name).join(', ')}
                                    </Typography>
                                  </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                  <IconButton
                                    sx={{
                                      bgcolor: 'primary.main',
                                      color: 'black',
                                      width: 56,
                                      height: 56,
                                      '&:hover': {
                                        bgcolor: 'primary.light',
                                        transform: 'scale(1.05)'
                                      }
                                    }}
                                  >
                                    <MusicNote sx={{ fontSize: 28 }} />
                                  </IconButton>
                                </div>
                              </Card>
                            </Grow>
                          </div>
                        )}

                        {/* Songs Section */}
                        <div>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                            Songs
                          </Typography>
                          <div className="space-y-2">
                            {results.tracks.filter(t => t != null).slice(0, 5).map((track, index) => (
                              <Grow in key={track.id} timeout={300 + index * 50}>
                                <div
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                                  onClick={() => handlePlayClick(track)}
                                >
                                  <img 
                                    src={getImageUrl(track.album?.images)} 
                                    alt={track.name}
                                    className="w-12 h-12 rounded"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        color: 'white', 
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {track.name}
                                    </Typography>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: 'text.secondary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'block'
                                      }}
                                    >
                                      {track.artists.map(a => a.name).join(', ')}
                                    </Typography>
                                  </div>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                  </Typography>
                                </div>
                              </Grow>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Artists Section */}
                    {results.artists.length > 0 && (
                      <div>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                          Artists
                        </Typography>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                          {results.artists.filter(a => a != null).slice(0, 8).map((artist, index) => (
                            <Grow in key={artist.id} timeout={300 + index * 50}>
                              <Card 
                                sx={{ 
                                  bgcolor: 'rgba(255,255,255,0.02)', 
                                  border: '1px solid rgba(255,255,255,0.05)', 
                                  borderRadius: 2,
                                  p: 1.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                  }
                                }}
                                onClick={() => navigate(`/artist/${artist.id}`)}
                              >
                                <img 
                                  src={getImageUrl(artist.images)} 
                                  alt={artist.name}
                                  className="w-full aspect-square object-cover rounded-full mb-2 shadow-lg"
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'white', 
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {artist.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                  Artist
                                </Typography>
                              </Card>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums Section */}
                    {results.albums.length > 0 && (
                      <div>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                          Albums
                        </Typography>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                          {results.albums.filter(a => a != null).slice(0, 8).map((album, index) => (
                            <Grow in key={album.id} timeout={300 + index * 50}>
                              <Card 
                                sx={{ 
                                  bgcolor: 'rgba(255,255,255,0.02)', 
                                  border: '1px solid rgba(255,255,255,0.05)', 
                                  borderRadius: 2,
                                  p: 1.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                  }
                                }}
                                onClick={() => navigate(`/album/${album.id}`)}
                              >
                                <img 
                                  src={getImageUrl(album.images)} 
                                  alt={album.name}
                                  className="w-full aspect-square object-cover rounded-lg mb-2 shadow-lg"
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'white', 
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {album.name}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {album.artists.map((a: any) => a.name).join(', ')}
                                </Typography>
                              </Card>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Playlists Section */}
                    {results.playlists.length > 0 && (
                      <div>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                          Playlists
                        </Typography>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                          {results.playlists.filter(p => p != null).slice(0, 8).map((playlist: any, index: number) => (
                            <Grow in key={playlist.id} timeout={300 + index * 50}>
                              <Card 
                                sx={{ 
                                  bgcolor: 'rgba(255,255,255,0.02)', 
                                  border: '1px solid rgba(255,255,255,0.05)', 
                                  borderRadius: 2,
                                  p: 1.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                  }
                                }}
                                onClick={() => window.open(playlist.external_urls?.spotify, '_blank')}
                              >
                                <img 
                                  src={getImageUrl(playlist.images)} 
                                  alt={playlist.name}
                                  className="w-full aspect-square object-cover rounded-lg mb-2 shadow-lg"
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'white', 
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {playlist.name}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {playlist.owner?.display_name || 'Playlist'}
                                </Typography>
                              </Card>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State for All Tab */}
                    {!topResult && results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && results.playlists.length === 0 && (
                      <Fade in timeout={600}>
                        <div className="text-center py-16">
                          <div className="inline-block p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl mb-4">
                            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                          </div>
                          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                            No results found
                          </Typography>
                        </div>
                      </Fade>
                    )}
                  </div>
                )}

                {/* SONGS TAB - All tracks */}
                {activeTab === 1 && (
                  <div className="space-y-3">
                    {results.tracks.length > 0 ? (
                      results.tracks.filter(t => t != null).map((track, index) => (
                        <Grow in key={track.id} timeout={300 + index * 50}>
                          <Card 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderColor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(34,197,94,0.15)'
                              }
                            }}
                            onClick={() => handlePlayClick(track)}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <div className="flex items-center gap-4">
                                <div className="relative group">
                                  <img 
                                    src={getImageUrl(track.album?.images)} 
                                    alt={track.name} 
                                    className="w-14 h-14 rounded-lg shadow-lg"
                                  />
                                  <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <MusicNote sx={{ color: 'primary.main', fontSize: 24 }} />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 600, 
                                      mb: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {track.name}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {track.artists.map(a => a.name).join(', ')}
                                  </Typography>
                                </div>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                </Typography>
                              </div>
                            </CardContent>
                          </Card>
                        </Grow>
                      ))
                    ) : (
                      <Fade in timeout={600}>
                        <div className="text-center py-16">
                          <div className="inline-block p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl mb-4">
                            <MusicNote sx={{ fontSize: 48, color: 'text.secondary' }} />
                          </div>
                          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                            No songs found
                          </Typography>
                        </div>
                      </Fade>
                    )}
                    
                    {/* Loading indicator for Songs tab */}
                    {isLoadingMore && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <CircularProgress size={32} sx={{ color: '#1DB954' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                          Loading more songs...
                        </Typography>
                      </div>
                    )}
                  </div>
                )}

                {/* ARTISTS TAB - All artists */}
                {activeTab === 2 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {results.artists.length > 0 ? (
                      results.artists.filter(a => a != null).map((artist, index) => (
                        <Grow in key={artist.id} timeout={300 + index * 50}>
                          <Card 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              p: 1.5,
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderColor: '#a78bfa',
                              }
                            }}
                            onClick={() => navigate(`/artist/${artist.id}`)}
                          >
                            <div className="relative aspect-square mb-2">
                              <img 
                                src={getImageUrl(artist.images)} 
                                alt={artist.name} 
                                className="w-full h-full object-cover rounded-full shadow-lg"
                              />
                            </div>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.75rem',
                                mb: 0.25
                              }}
                            >
                              {artist.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              Artist
                            </Typography>
                          </Card>
                        </Grow>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <Fade in timeout={600}>
                          <div className="text-center py-16">
                            <div className="inline-block p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl mb-4">
                              <Person sx={{ fontSize: 48, color: 'text.secondary' }} />
                            </div>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                              No artists found
                            </Typography>
                          </div>
                        </Fade>
                      </div>
                    )}
                    
                    {/* Loading indicator for Artists tab */}
                    {isLoadingMore && (
                      <div className="flex flex-col items-center justify-center py-8 col-span-full">
                        <CircularProgress size={32} sx={{ color: '#1DB954' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                          Loading more artists...
                        </Typography>
                      </div>
                    )}
                  </div>
                )}

                {/* ALBUMS TAB - All albums */}
                {activeTab === 3 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {results.albums.length > 0 ? (
                      results.albums.filter(a => a != null).map((album, index) => (
                        <Grow in key={album.id} timeout={300 + index * 50}>
                          <Card 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              p: 1.5,
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderColor: '#60a5fa',
                              }
                            }}
                            onClick={() => navigate(`/album/${album.id}`)}
                          >
                            <div className="relative aspect-square mb-2">
                              <img 
                                src={getImageUrl(album.images)} 
                                alt={album.name} 
                                className="w-full h-full object-cover rounded-lg shadow-lg"
                              />
                            </div>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.75rem',
                                mb: 0.25
                              }}
                            >
                              {album.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.7rem'
                              }}
                            >
                              {album.artists?.map((a: any) => a.name).join(', ')}
                            </Typography>
                          </Card>
                        </Grow>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <Fade in timeout={600}>
                          <div className="text-center py-16">
                            <div className="inline-block p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl mb-4">
                              <AlbumIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                            </div>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                              No albums found
                            </Typography>
                          </div>
                        </Fade>
                      </div>
                    )}
                    
                    {/* Loading indicator for Albums tab */}
                    {isLoadingMore && (
                      <div className="flex flex-col items-center justify-center py-8 col-span-full">
                        <CircularProgress size={32} sx={{ color: '#1DB954' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                          Loading more albums...
                        </Typography>
                      </div>
                    )}
                  </div>
                )}

                {/* PLAYLISTS TAB - Community playlists */}
                {activeTab === 4 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                    {results.playlists.length > 0 ? (
                      results.playlists.filter(p => p != null).map((playlist: any, index: number) => (
                        <Grow in key={playlist.id} timeout={300 + index * 50}>
                          <Card 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              p: 1.5,
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                borderColor: '#a855f7',
                              }
                            }}
                            onClick={() => window.open(playlist.external_urls?.spotify, '_blank')}
                          >
                            <div className="relative aspect-square mb-2">
                              <img 
                                src={getImageUrl(playlist.images)} 
                                alt={playlist.name} 
                                className="w-full h-full object-cover rounded-lg shadow-lg"
                              />
                            </div>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.75rem',
                                mb: 0.25
                              }}
                            >
                              {playlist.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                fontSize: '0.7rem'
                              }}
                            >
                              {playlist.owner?.display_name || 'Playlist'}
                            </Typography>
                          </Card>
                        </Grow>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <Fade in timeout={600}>
                          <div className="text-center py-16">
                            <div className="inline-block p-4 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-2xl mb-4">
                              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                            </div>
                            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                              No playlists found
                            </Typography>
                          </div>
                        </Fade>
                      </div>
                    )}
                    
                    {/* Loading indicator for Playlists tab */}
                    {isLoadingMore && (
                      <div className="flex flex-col items-center justify-center py-8 col-span-full">
                        <CircularProgress size={32} sx={{ color: '#1DB954' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                          Loading more playlists...
                        </Typography>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Box>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
