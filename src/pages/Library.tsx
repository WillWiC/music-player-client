import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import TrackMenu from '../components/TrackMenu';
import PlaylistMenu from '../components/PlaylistMenu';
import AlbumMenu from '../components/AlbumMenu';
import ArtistMenu from '../components/ArtistMenu';
import { formatCount } from '../utils/numberFormat';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import {
  Fade,
  Grow,
  Typography
} from '@mui/material';
import { PlayArrow, Pause, MoreVert } from '@mui/icons-material';
import { useToast } from '../context/toast';
import type { Track, Playlist, Album, Artist } from '../types/spotify';

const Library: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [tab, setTab] = React.useState(0);
  const [tabHighlight, setTabHighlight] = React.useState(false);

  // If navigated with state indicating liked songs, open that tab
  React.useEffect(() => {
    try {
      const state = (location && (location.state as any)) || {};
      const tabKey = state.initialTab || new URLSearchParams(location.search).get('tab');
      switch (tabKey) {
        case 'playlists':
          setTab(0);
          setTabHighlight(true);
          break;
        case 'liked':
          setTab(1);
          setTabHighlight(true);
          break;
        case 'albums':
          setTab(2);
          setTabHighlight(true);
          break;
        case 'artists':
          setTab(3);
          setTabHighlight(true);
          break;
        default:
          break;
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  // Clear temporary highlight after animation
  React.useEffect(() => {
    if (!tabHighlight) return;
    const id = setTimeout(() => setTabHighlight(false), 700);
    return () => clearTimeout(id);
  }, [tabHighlight]);

  const [playlists, setPlaylists] = React.useState<any[]>([]);
  const [albums, setAlbums] = React.useState<any[]>([]);
  const [tracks, setTracks] = React.useState<any[]>([]);
  const [artists, setArtists] = React.useState<any[]>([]);

  const [loading, setLoading] = React.useState(true);

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
  React.useEffect(() => {
    // If no token, show guest prompt and skip loading library data
    if (!token) {
      console.log('Library loaded without token - guest mode');
      setLoading(false);
      return;
    }

    /**
     * Fetches all items from a paginated Spotify endpoint
     * @param url - Initial API endpoint URL
     * @param dataKey - Key to extract items from response (e.g., 'items', 'artists')
     * @returns Array of all items across all pages
     */
    const fetchAllPages = async (url: string, dataKey: string = 'items'): Promise<any[]> => {
      const allItems: any[] = [];
      let nextUrl: string | null = url;

      while (nextUrl) {
        const res: Response = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) break;
        
        const data: any = await res.json();
        const items = dataKey === 'artists' ? data.artists?.items : data.items;
        if (items) allItems.push(...items);
        
        nextUrl = data.next || (dataKey === 'artists' ? data.artists?.next : null);
      }

      return allItems;
    };

    const loadAll = async () => {
      setLoading(true);
      try {
        // Load ALL data with pagination for complete library
        const [playlistItems, albumItems, trackItems, artistItems] = await Promise.all([
          fetchAllPages('https://api.spotify.com/v1/me/playlists?limit=50'),
          fetchAllPages('https://api.spotify.com/v1/me/albums?limit=50'),
          fetchAllPages('https://api.spotify.com/v1/me/tracks?limit=50'),
          fetchAllPages('https://api.spotify.com/v1/me/following?type=artist&limit=50', 'artists')
        ]);

        // Update all state at once
        setPlaylists(playlistItems);
        setAlbums(albumItems.map((i: any) => i.album));
        setTracks(trackItems.map((i: any) => i.track));
        setArtists(artistItems);
        
        console.log(`Loaded library: ${playlistItems.length} playlists, ${albumItems.length} albums, ${trackItems.length} tracks, ${artistItems.length} artists`);
      } catch (err) {
        console.error('Failed to load library:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [token, navigate]);

  const toast = useToast();

  const handlePlay = async (track: any) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        await play(track);
      }
    } catch (err) {
      console.error('Play error:', err);
      toast.showToast('Unable to play track. Ensure Spotify Premium and an active device.', 'error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black flex font-sans text-white" style={{ minHeight: '100dvh' }}>
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} onTrackPlayed={() => {}} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 ml-72 relative z-0">
        {/* Dynamic Background Gradient */}
        <div 
          className="absolute top-0 left-0 w-full h-[50vh] opacity-20 pointer-events-none z-0"
          style={{ 
            background: `linear-gradient(to bottom, #7c3aed, transparent)` 
          }}
        />

        <div className="relative z-10 pb-28 pt-20 px-4 lg:px-8 xl:px-12">
          {/* Header Section */}
          <Fade in timeout={600}>
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-8 mb-6 lg:mb-10 pt-4">
              <div 
                className="w-28 h-28 lg:w-36 lg:h-36 xl:w-40 xl:h-40 shadow-2xl flex items-center justify-center text-5xl lg:text-6xl xl:text-7xl bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg border border-white/10 flex-shrink-0"
              >
                <span className="filter drop-shadow-lg">📚</span>
              </div>
              <div className="flex-1 text-center sm:text-left mb-2">
                <Typography variant="overline" className="font-bold tracking-wider opacity-80 text-xs sm:text-sm">
                  Personal Collection
                </Typography>
                <Typography variant="h1" sx={{ 
                  fontWeight: 900, 
                  fontSize: { xs: '2rem', sm: '3rem', md: '5rem' },
                  lineHeight: 1,
                  mb: { xs: 1, sm: 2 },
                  textShadow: '0 4px 24px rgba(0,0,0,0.5)'
                }}>
                  Your Library
                </Typography>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"/>
                    {playlists.length} Playlists
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"/>
                    {tracks.length} Liked
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500"/>
                    {albums.length} Albums
                  </div>
                </div>
              </div>
            </div>
          </Fade>

          {/* Custom Tabs */}
          <div className="sticky top-[56px] sm:top-[64px] z-30 backdrop-blur-xl mb-4 sm:mb-8 -mx-3 sm:-mx-6 lg:-mx-12 px-3 sm:px-6 lg:px-12 py-3 sm:py-4">
            <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar hide-scrollbar pb-1">
              {[
                { label: 'Playlists', count: playlists.length },
                { label: 'Liked', count: tracks.length },
                { label: 'Albums', count: albums.length },
                { label: 'Artists', count: artists.length }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => setTab(index)}
                  className={`
                    px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 active:scale-95
                    ${tab === index 
                      ? 'bg-white text-black scale-105 shadow-lg shadow-white/10' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 animate-pulse">
                  <div className="aspect-square bg-white/10 rounded-md" />
                  <div className="h-3 sm:h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-2 sm:h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className={tabHighlight ? 'animate-fade-in' : ''}>
              
              {/* Playlists Tab */}
              {tab === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                  {playlists.map((pl, index) => (
                    <Grow in timeout={250 + index * 30} key={pl.id}>
                      <div 
                        className="group p-3 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => navigate(`/playlist/${pl.id}`)}
                      >
                        <div className="relative aspect-square mb-3 rounded-md overflow-hidden shadow-md">
                          <img 
                            src={pl.images?.[0]?.url || '/vite.svg'} 
                            alt={pl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PlayArrow sx={{ fontSize: 32, color: 'white' }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ fontSize: '0.9rem', flex: 1 }}>
                            {pl.name}
                          </Typography>
                          <button
                            onClick={(e) => handlePlaylistMenuOpen(e, pl)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                          >
                            <MoreVert sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                        <Typography variant="caption" display="block" color="gray" noWrap sx={{ fontSize: '0.75rem' }}>
                          By {pl.owner?.display_name}
                        </Typography>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}

              {/* Liked Songs Tab */}
              {tab === 1 && (
                <div className="bg-white/5 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-3 border-b border-white/10 text-sm text-gray-400 uppercase tracking-wider">
                    <div className="w-8 text-center">#</div>
                    <div>Title</div>
                    <div className="hidden md:block">Album</div>
                    <div className="text-right">Duration</div>
                    <div className="w-8"></div>
                  </div>
                  
                  {tracks.map((track, index) => (
                    <div 
                      key={track.id}
                      className="group grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-3 hover:bg-white/10 items-center transition-colors cursor-pointer"
                      onClick={() => handlePlay(track)}
                    >
                      <div className="w-8 text-center flex justify-center items-center text-gray-400 font-medium">
                        <span className="group-hover:hidden">
                          {currentTrack?.id === track.id && isPlaying ? (
                            <img 
                              src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" 
                              alt="playing" 
                              className="w-3 h-3"
                            />
                          ) : (
                            <span className={currentTrack?.id === track.id ? 'text-green-500' : ''}>{index + 1}</span>
                          )}
                        </span>
                        <button className="hidden group-hover:block text-white">
                          {currentTrack?.id === track.id && isPlaying ? <Pause sx={{ fontSize: 16 }} /> : <PlayArrow sx={{ fontSize: 16 }} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 overflow-hidden">
                        <img 
                          src={track.album?.images?.[0]?.url || '/vite.svg'} 
                          alt="" 
                          className="w-10 h-10 rounded shadow-sm"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate group-hover:text-green-400 transition-colors">
                            {track.name}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {track.artists?.map((a:any) => a.name).join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block text-sm text-gray-400 truncate">
                        {track.album?.name}
                      </div>
                      <div className="text-sm text-gray-400 font-mono text-right">
                        {Math.floor(track.duration_ms / 60000)}:
                        {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                      </div>
                      <button
                        onClick={(e) => handleTrackMenuOpen(e, track)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all w-8"
                      >
                        <MoreVert sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Albums Tab */}
              {tab === 2 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                  {albums.map((al, index) => (
                    <Grow in timeout={250 + index * 30} key={al.id}>
                      <div 
                        className="group p-3 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => navigate(`/album/${al.id}`)}
                      >
                        <div className="relative aspect-square mb-3 rounded-md overflow-hidden shadow-md">
                          <img 
                            src={al.images?.[0]?.url || '/vite.svg'} 
                            alt={al.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PlayArrow sx={{ fontSize: 32, color: 'white' }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ fontSize: '0.9rem', flex: 1 }}>
                            {al.name}
                          </Typography>
                          <button
                            onClick={(e) => handleAlbumMenuOpen(e, al)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                          >
                            <MoreVert sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                        <Typography variant="caption" display="block" color="gray" noWrap sx={{ fontSize: '0.75rem' }}>
                          {al.artists?.map((a:any) => a.name).join(', ')}
                        </Typography>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}

              {/* Artists Tab */}
              {tab === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                  {artists.map((artist, index) => (
                    <Grow in timeout={250 + index * 30} key={artist.id}>
                      <div 
                        className="group p-3 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => navigate(`/artist/${artist.id}`)}
                      >
                        <div className="relative aspect-square mb-3 rounded-full overflow-hidden shadow-md">
                          <img 
                            src={artist.images?.[0]?.url || '/vite.svg'} 
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Typography 
                            variant="subtitle2" 
                            fontWeight="bold" 
                            align="center" 
                            noWrap
                            sx={{ 
                              fontSize: '0.9rem',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                color: '#22c55e',
                                textShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                              }
                            }}
                          >
                            {artist.name}
                          </Typography>
                          <button
                            onClick={(e) => handleArtistMenuOpen(e, artist)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                          >
                            <MoreVert sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                        <Typography variant="caption" display="block" align="center" color="gray" sx={{ fontSize: '0.75rem' }}>
                          {artist.followers?.total ? `${formatCount(artist.followers.total)} followers` : 'Artist'}
                        </Typography>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}
            </div>
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

export default Library;
