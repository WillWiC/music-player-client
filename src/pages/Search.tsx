import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import TrackMenu from '../components/TrackMenu';
import PlaylistMenu from '../components/PlaylistMenu';
import AlbumMenu from '../components/AlbumMenu';
import ArtistMenu from '../components/ArtistMenu';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import { useSearch } from '../context/search';
import {
  Box,
  Typography,
  IconButton,
  Fade,
  Grow,
  Skeleton,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear,
  MusicNote,
  Album as AlbumIcon,
  Person,
  PlayArrow,
  MoreVert
} from '@mui/icons-material';
import type { Track, Playlist, Album, Artist } from '../types/spotify';

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

  // Track menu state
  const [trackMenuAnchor, setTrackMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<Track | null>(null);
  
  // Playlist menu state
  const [playlistMenuAnchor, setPlaylistMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<Playlist | null>(null);

  // Album menu state
  const [albumMenuAnchor, setAlbumMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(null);

  // Artist menu state
  const [artistMenuAnchor, setArtistMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null);

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

  const handleAlbumMenuOpen = (event: React.MouseEvent<HTMLElement>, album: Album) => {
    event.stopPropagation();
    setAlbumMenuAnchor(event.currentTarget);
    setSelectedAlbum(album);
  };

  const handleAlbumMenuClose = () => {
    setAlbumMenuAnchor(null);
    setSelectedAlbum(null);
  };

  const handleArtistMenuOpen = (event: React.MouseEvent<HTMLElement>, artist: Artist) => {
    event.stopPropagation();
    setArtistMenuAnchor(event.currentTarget);
    setSelectedArtist(artist);
  };

  const handleArtistMenuClose = () => {
    setArtistMenuAnchor(null);
    setSelectedArtist(null);
  };

  // Infinite scroll handler
  React.useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || isLoadingMore || !query) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when user scrolls to 70% of the page
      if (scrollPercentage > 0.7) {
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
        <div className="relative w-full py-8 px-6 sm:px-8 lg:px-12">
          
          {/* Search Header (Only when searching) */}
          {query && (
            <Fade in timeout={600}>
              <div className="flex items-end gap-6 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/20 flex items-center justify-center">
                  <SearchIcon sx={{ fontSize: 32, color: 'white' }} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
                    {query}
                  </h2>
                  <p className="text-gray-400 font-medium">
                    Search results
                  </p>
                </div>
              </div>
            </Fade>
          )}

          {/* Browse View (When not searching) */}
          {!query && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full mb-6">
                  <SearchIcon sx={{ fontSize: 40, color: '#22c55e' }} />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                  Find Your Music
                </h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Search for artists, songs, albums, and playlists.
                </p>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                      Recent Searches
                    </Typography>
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
                  <div className="flex items-center gap-3 flex-wrap">
                    {recentSearches.map((s, index) => (
                      <Grow in key={s} timeout={300 + index * 50}>
                        <div 
                          className="group flex items-center gap-2 bg-[#181818] hover:bg-[#282828] border border-white/5 rounded-full pl-4 pr-2 py-2 transition-all duration-200 cursor-pointer"
                          onClick={() => handleRunRecent(s)}
                        >
                          <span className="text-sm font-medium text-white">{s}</span>
                          <div 
                            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(s);
                            }}
                          >
                            <Clear sx={{ fontSize: 16 }} />
                          </div>
                        </div>
                      </Grow>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Loading State */}
          {isSearching && query && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Grow in key={i} timeout={300 + i * 100}>
                  <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                      </div>
                    </div>
                  </div>
                </Grow>
              ))}
            </div>
          )}

          {/* Results Section */}
          {query && !isSearching && (
            <Box>
              <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Songs', 'Artists', 'Albums', 'Playlists'].map((label, index) => (
                  <button
                    key={label}
                    onClick={() => setActiveTab(index)}
                    className={`
                      px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap
                      ${activeTab === index 
                        ? 'bg-white text-black scale-105' 
                        : 'bg-white/10 text-white hover:bg-white/20'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {/* ALL TAB - Spotify-style layout with sections */}
                {activeTab === 0 && (
                  <div className="space-y-8">
                    {/* Top Result + Top Songs Grid */}
                    {(topResult || results.tracks.length > 0) && (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Top Result Card - Takes up 2 columns on large screens */}
                        {topResult && (
                          <div className="lg:col-span-2">
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                              Top result
                            </Typography>
                            <Grow in timeout={400}>
                              <div 
                                className="group relative bg-transparent hover:bg-[#282828] p-6 rounded-lg transition-all duration-300 cursor-pointer h-[280px] flex flex-col gap-4"
                                onClick={() => handlePlayClick(topResult)}
                              >
                                <div className="relative">
                                  <img 
                                    src={getImageUrl(topResult.album?.images)} 
                                    alt={topResult.name}
                                    className="w-28 h-28 rounded shadow-xl mb-2"
                                  />
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-end">
                                  <Typography 
                                    variant="h4" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 700, 
                                      mb: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {topResult.name}
                                  </Typography>
                                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                    <span className="text-white">Song</span>
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    <span className="truncate">
                                      {topResult.artists.map((artist, i) => (
                                        <React.Fragment key={artist.id || i}>
                                          <span 
                                            className="hover:underline hover:text-white cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/artist/${artist.id}`);
                                            }}
                                          >
                                            {artist.name}
                                          </span>
                                          {i < topResult.artists.length - 1 && ', '}
                                        </React.Fragment>
                                      ))}
                                    </span>
                                  </div>
                                </div>

                                {/* Play Button - Visible on hover */}
                                <div className="absolute bottom-6 right-6 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl rounded-full">
                                  <IconButton
                                    sx={{
                                      bgcolor: '#1ed760',
                                      color: 'white',
                                      width: 48,
                                      height: 48,
                                      '&:hover': {
                                        bgcolor: '#1fdf64',
                                        transform: 'scale(1.05)'
                                      }
                                    }}
                                  >
                                    <PlayArrow sx={{ fontSize: 28 }} />
                                  </IconButton>
                                </div>
                              </div>
                            </Grow>
                          </div>
                        )}

                        {/* Songs Section - Takes up 3 columns on large screens */}
                        <div className="lg:col-span-3">
                          <div className="flex items-center justify-between mb-4">
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                              Songs
                            </Typography>
                            <button 
                              onClick={() => setActiveTab(1)}
                              className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors uppercase tracking-wider"
                            >
                              Show all
                            </button>
                          </div>
                          <div className="space-y-1">
                            {results.tracks.filter(t => t != null).slice(0, 4).map((track, index) => (
                              <Grow in key={track.id} timeout={300 + index * 50}>
                                <div
                                  className="group flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                  onClick={() => handlePlayClick(track)}
                                >
                                  <div className="relative w-10 h-10 flex-shrink-0">
                                    <img 
                                      src={getImageUrl(track.album?.images)} 
                                      alt={track.name}
                                      className="w-full h-full rounded object-cover group-hover:opacity-50 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <PlayArrow sx={{ color: 'white', fontSize: 24 }} />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className={`font-medium truncate text-sm ${currentTrack?.id === track.id ? 'text-green-500' : 'text-white'}`}>
                                      {track.name}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate group-hover:text-white transition-colors">
                                      {track.artists.map((artist, i) => (
                                        <React.Fragment key={artist.id || i}>
                                          <span 
                                            className="hover:underline cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/artist/${artist.id}`);
                                            }}
                                          >
                                            {artist.name}
                                          </span>
                                          {i < track.artists.length - 1 && ', '}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-400 font-medium tabular-nums mr-2">
                                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                  </div>
                                  
                                  {/* More Options Button */}
                                  <button
                                    onClick={(e) => handleTrackMenuOpen(e, track)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all"
                                  >
                                    <MoreVert sx={{ fontSize: 20 }} />
                                  </button>
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
                        <div className="flex items-center justify-between mb-4">
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                            Artists
                          </Typography>
                          <button 
                            onClick={() => setActiveTab(2)}
                            className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors uppercase tracking-wider"
                          >
                            Show all
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                          {results.artists.filter(a => a != null).slice(0, 7).map((artist, index) => (
                            <Grow in key={artist.id} timeout={300 + index * 50}>
                              <div 
                                className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                                onClick={() => navigate(`/artist/${artist.id}`)}
                              >
                                <div className="relative w-full aspect-square mb-4 shadow-lg rounded-full overflow-hidden">
                                  <img 
                                    src={getImageUrl(artist.images)} 
                                    alt={artist.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="w-full">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="text-white font-bold truncate mb-1">
                                      {artist.name}
                                    </div>
                                    <button
                                      onClick={(e) => handleArtistMenuOpen(e, artist)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                    >
                                      <MoreVert sx={{ fontSize: 18 }} />
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    Artist
                                  </div>
                                </div>
                              </div>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums Section */}
                    {results.albums.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                            Albums
                          </Typography>
                          <button 
                            onClick={() => setActiveTab(3)}
                            className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors uppercase tracking-wider"
                          >
                            Show all
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                          {results.albums.filter(a => a != null).slice(0, 7).map((album, index) => (
                            <Grow in key={album.id} timeout={300 + index * 50}>
                              <div 
                                className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer"
                                onClick={() => navigate(`/album/${album.id}`)}
                              >
                                <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                                  <img 
                                    src={getImageUrl(album.images)} 
                                    alt={album.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="w-full">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-white font-bold truncate mb-1 flex-1">
                                      {album.name}
                                    </div>
                                    <button
                                      onClick={(e) => handleAlbumMenuOpen(e, album)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                    >
                                      <MoreVert sx={{ fontSize: 18 }} />
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-400 truncate">
                                    {album.release_date?.split('-')[0]} • {album.artists.map((a: any) => a.name).join(', ')}
                                  </div>
                                </div>
                              </div>
                            </Grow>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Playlists Section */}
                    {results.playlists.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                            Playlists
                          </Typography>
                          <button 
                            onClick={() => setActiveTab(4)}
                            className="text-sm font-bold text-gray-400 hover:text-white hover:underline transition-colors uppercase tracking-wider"
                          >
                            Show all
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                          {results.playlists.filter(p => p != null).slice(0, 7).map((playlist: any, index: number) => (
                            <Grow in key={playlist.id} timeout={300 + index * 50}>
                              <div 
                                className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer relative"
                                onClick={() => navigate(`/playlist/${playlist.id}`)}
                              >
                                <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                                  <img 
                                    src={getImageUrl(playlist.images)} 
                                    alt={playlist.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="w-full">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-white font-bold truncate mb-1 flex-1">
                                      {playlist.name}
                                    </div>
                                    <button
                                      onClick={(e) => handlePlaylistMenuOpen(e, playlist)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                    >
                                      <MoreVert sx={{ fontSize: 20 }} />
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-400 truncate">
                                    By {playlist.owner?.display_name || 'Playlist'}
                                  </div>
                                </div>
                              </div>
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
                  <div className="space-y-2">
                    {results.tracks.length > 0 ? (
                      results.tracks.filter(t => t != null).map((track, index) => (
                        <Grow in key={track.id} timeout={300 + index * 50}>
                          <div 
                            className="group flex items-center gap-4 p-2 rounded-md hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                            onClick={() => handlePlayClick(track)}
                          >
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <img 
                                src={getImageUrl(track.album?.images)} 
                                alt={track.name} 
                                className="w-full h-full object-cover rounded"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                <PlayArrow sx={{ color: 'white', fontSize: 20 }} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-green-500' : 'text-white'}`}>
                                {track.name}
                              </div>
                              <div className="text-sm text-gray-400 truncate">
                                {track.artists.map((artist, i) => (
                                  <React.Fragment key={artist.id || i}>
                                    <span 
                                      className="hover:underline hover:text-white cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/artist/${artist.id}`);
                                      }}
                                    >
                                      {artist.name}
                                    </span>
                                    {i < track.artists.length - 1 && ', '}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                            
                            {/* Album Column */}
                            <div className="hidden md:block flex-1 min-w-0 px-4">
                              <span 
                                className="text-sm text-gray-400 truncate hover:underline hover:text-white cursor-pointer block"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (track.album?.id) navigate(`/album/${track.album.id}`);
                                }}
                              >
                                {track.album?.name}
                              </span>
                            </div>

                            <div className="text-sm text-gray-400 tabular-nums">
                              {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                            </div>
                            
                            {/* More Options Button */}
                            <button
                              onClick={(e) => handleTrackMenuOpen(e, track)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all ml-2"
                            >
                              <MoreVert sx={{ fontSize: 20 }} />
                            </button>
                          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                    {results.artists.length > 0 ? (
                      results.artists.filter(a => a != null).map((artist, index) => (
                        <Grow in key={artist.id} timeout={300 + index * 50}>
                          <div 
                            className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/artist/${artist.id}`)}
                          >
                            <div className="relative w-full aspect-square mb-4 shadow-lg rounded-full overflow-hidden">
                              <img 
                                src={getImageUrl(artist.images)} 
                                alt={artist.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="w-full text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="text-white font-bold truncate mb-1">
                                  {artist.name}
                                </div>
                                <button
                                  onClick={(e) => handleArtistMenuOpen(e, artist)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                >
                                  <MoreVert sx={{ fontSize: 18 }} />
                                </button>
                              </div>
                              <div className="text-sm text-gray-400">
                                Artist
                              </div>
                            </div>
                          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                    {results.albums.length > 0 ? (
                      results.albums.filter(a => a != null).map((album, index) => (
                        <Grow in key={album.id} timeout={300 + index * 50}>
                          <div 
                            className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/album/${album.id}`)}
                          >
                            <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                              <img 
                                src={getImageUrl(album.images)} 
                                alt={album.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-white font-bold truncate mb-1 flex-1">
                                  {album.name}
                                </div>
                                <button
                                  onClick={(e) => handleAlbumMenuOpen(e, album)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                >
                                  <MoreVert sx={{ fontSize: 18 }} />
                                </button>
                              </div>
                              <div className="text-sm text-gray-400 truncate">
                                {album.release_date?.split('-')[0]} • {album.artists?.map((a: any) => a.name).join(', ')}
                              </div>
                            </div>
                          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-6">
                    {results.playlists.length > 0 ? (
                      results.playlists.filter(p => p != null).map((playlist: any, index: number) => (
                        <Grow in key={playlist.id} timeout={300 + index * 50}>
                          <div 
                            className="group bg-transparent hover:bg-[#282828] p-4 rounded-lg transition-all duration-300 cursor-pointer relative"
                            onClick={() => navigate(`/playlist/${playlist.id}`)}
                          >
                            <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                              <img 
                                src={getImageUrl(playlist.images)} 
                                alt={playlist.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-white font-bold truncate mb-1 flex-1">
                                  {playlist.name}
                                </div>
                                <button
                                  onClick={(e) => handlePlaylistMenuOpen(e, playlist)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                                >
                                  <MoreVert sx={{ fontSize: 20 }} />
                                </button>
                              </div>
                              <div className="text-sm text-gray-400 truncate">
                                By {playlist.owner?.display_name || 'Playlist'}
                              </div>
                            </div>
                          </div>
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

      {/* Track Menu */}
      <TrackMenu
        anchorEl={trackMenuAnchor}
        open={Boolean(trackMenuAnchor)}
        onClose={handleTrackMenuClose}
        track={selectedTrack}
      />

      {/* Playlist Menu */}
      <PlaylistMenu
        anchorEl={playlistMenuAnchor}
        open={Boolean(playlistMenuAnchor)}
        onClose={handlePlaylistMenuClose}
        playlist={selectedPlaylist}
      />

      {/* Album Menu */}
      <AlbumMenu
        anchorEl={albumMenuAnchor}
        open={Boolean(albumMenuAnchor)}
        onClose={handleAlbumMenuClose}
        album={selectedAlbum}
      />

      {/* Artist Menu */}
      <ArtistMenu
        anchorEl={artistMenuAnchor}
        open={Boolean(artistMenuAnchor)}
        onClose={handleArtistMenuClose}
        artist={selectedArtist}
      />
    </div>
  );
};

export default SearchPage;
