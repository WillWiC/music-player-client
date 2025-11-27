import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import { useSpotifyApi, buildSpotifyUrl } from '../hooks/useSpotifyApi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TrackMenu from '../components/TrackMenu';
import AlbumMenu from '../components/AlbumMenu';
import { CircularProgress, IconButton, Fade, Grow, Skeleton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlayArrow from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VerifiedIcon from '@mui/icons-material/Verified';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Artist as ArtistType, Album, Track } from '../types/spotify';
import { formatCount } from '../utils/numberFormat';

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isLoading: authLoading } = useAuth();
  const { makeRequest } = useSpotifyApi();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const toast = useToast();
  
  // State
  const [artist, setArtist] = React.useState<ArtistType | null>(null);
  const [topTracks, setTopTracks] = React.useState<Track[]>([]);
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
  
  // Loading states
  const [loading, setLoading] = React.useState(true);
  const [loadingTracks, setLoadingTracks] = React.useState(false);
  const [loadingAlbums, setLoadingAlbums] = React.useState(false);
  const [loadingFollow, setLoadingFollow] = React.useState(false);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showAllTracks, setShowAllTracks] = React.useState(false);
  const [showAllAlbums, setShowAllAlbums] = React.useState(false);
  
  // Track menu state
  const [trackMenuAnchor, setTrackMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<Track | null>(null);

  // Album menu state
  const [albumMenuAnchor, setAlbumMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(null);

  const handleTrackMenuOpen = (event: React.MouseEvent<HTMLElement>, track: Track) => {
    event.stopPropagation();
    setTrackMenuAnchor(event.currentTarget);
    setSelectedTrack(track);
  };

  const handleTrackMenuClose = () => {
    setTrackMenuAnchor(null);
    setSelectedTrack(null);
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
  
  // Error handling
  const [error, setError] = React.useState<string>('');

  // Fetch artist data using the new Spotify API hook
  React.useEffect(() => {
    if (!id || authLoading) return;

    const fetchArtistData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch artist info
        const artistUrl = buildSpotifyUrl(`artists/${id}`);
        const { data: artistData, error: artistError } = await makeRequest(artistUrl);
        
        if (artistError || !artistData) {
          throw new Error('Failed to fetch artist data');
        }
        
        setArtist(artistData);

        // Helper to fetch all albums
        const fetchAllAlbums = async () => {
          let allAlbums: Album[] = [];
          let nextUrl = buildSpotifyUrl(`artists/${id}/albums`, {
            include_groups: 'album,single',
            market: 'US',
            limit: 50
          });

          while (nextUrl) {
            const { data, error } = await makeRequest(nextUrl);
            if (error || !data) break;
            
            allAlbums = [...allAlbums, ...(data.items || [])];
            nextUrl = data.next;
          }
          return allAlbums;
        };

        // Parallel API calls
        const [followResult, tracksResult] = await Promise.all([
          makeRequest(buildSpotifyUrl('me/following/contains', { type: 'artist', ids: id })),
          makeRequest(buildSpotifyUrl(`artists/${id}/top-tracks`, { market: 'US' }))
        ]);
        
        const albumsData = await fetchAllAlbums();

        // Process follow status
        if (followResult.data && !followResult.error) {
          setIsFollowing(followResult.data[0] || false);
        }

        // Process top tracks
        if (tracksResult.data && !tracksResult.error) {
          setTopTracks(tracksResult.data.tracks || []);
        } else {
          console.warn('Failed to fetch top tracks');
        }

        // Process albums
        if (albumsData && albumsData.length > 0) {
          // Filter out duplicates based on name and release date
          const uniqueAlbums = albumsData.filter((album, index, self) => 
            index === self.findIndex((t) => (
              t.name === album.name && t.release_date === album.release_date
            ))
          );
          // Sort by release date (newest first)
          uniqueAlbums.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
          
          setAlbums(uniqueAlbums);
        } else {
          console.warn('Failed to fetch albums');
        }

      } catch (error) {
        console.error('Failed to fetch artist data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load artist';
        setError(errorMessage);
        toast.showToast('Failed to load artist data', 'error');
      } finally {
        setLoading(false);
        setLoadingTracks(false);
        setLoadingAlbums(false);
      }
    };

    fetchArtistData();
  }, [id, authLoading, makeRequest, toast]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!id || loadingFollow) return;
    
    setLoadingFollow(true);
    try {
      const method = isFollowing ? 'DELETE' : 'PUT';
      const url = buildSpotifyUrl('me/following', { type: 'artist', ids: id });
      
      const { error } = await makeRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!error) {
        setIsFollowing(!isFollowing);
        toast.showToast(
          isFollowing ? 'Unfollowed artist' : 'Following artist', 
          'success'
        );
      } else {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} artist`);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.showToast(
        `Failed to ${isFollowing ? 'unfollow' : 'follow'} artist`, 
        'error'
      );
    } finally {
      setLoadingFollow(false);
    }
  };

  // Handle track play
  const handleTrackPlay = async (track: Track) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        await play(track);
      }
    } catch (error) {
      console.error('Play error:', error);
      toast.showToast('Unable to play track. Make sure you have Spotify Premium and the app is open.', 'error');
    }
  };

  // ... use formatCount helper for follower formatting

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center">
        <CircularProgress size={60} sx={{ color: '#22c55e' }} />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
          <p className="text-gray-300 mb-6">{error || 'The artist you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg"
          >
            Search for Artists
          </button>
        </div>
      </div>
    );
  }

  const displayedTracks = showAllTracks ? topTracks : topTracks.slice(0, 5);
  const displayedAlbums = showAllAlbums ? albums : albums.slice(0, 6);
  // Top track and playing state for the main Play button
  const topTrack = topTracks[0];
  const isTopTrackPlaying = !!(topTrack && currentTrack?.id === topTrack.id && isPlaying);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />

      <main className="flex-1 lg:ml-72 relative z-0">
        {/* Dynamic Background Gradient Overlay */}
        <div 
          className="absolute top-0 left-0 w-full h-[50vh] opacity-20 pointer-events-none z-0"
          style={{ 
            background: `linear-gradient(to bottom, ${artist.images?.[0]?.url ? 'var(--dominant-color, #7c3aed)' : '#7c3aed'}, transparent)` 
          }}
        />

        <div className="relative z-10 pb-24 pt-32 px-8 lg:px-12">
          
          {/* Artist Header */}
          <Fade in timeout={600}>
            <div className="flex flex-col md:flex-row items-end gap-8 mb-10">
              
              {/* Artist Image */}
              <div className="relative flex-shrink-0">
                <div className="w-52 h-52 lg:w-60 lg:h-60 rounded-full overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] border-4 border-white/10">
                  {artist.images?.[0] ? (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <svg className="w-24 h-24 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-center md:text-left mb-2">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    Artist
                  </span>
                  {(artist.popularity ?? 0) >= 50 && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/20">
                      <VerifiedIcon sx={{ fontSize: 14 }} />
                      Verified Artist
                    </span>
                  )}
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-none">
                  {artist.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-300 font-medium">
                  {artist.followers && (
                    <span>{formatCount(artist.followers.total)} followers</span>
                  )}
                  {artist.genres && artist.genres.length > 0 && (
                    <>
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span className="capitalize">{artist.genres.slice(0, 3).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Fade>

          {/* Action Bar */}
          <div className="flex items-center gap-6 mb-10">
            {topTrack && (
              <button
                onClick={() => handleTrackPlay(topTrack)}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-whie hover:scale-105 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
              >
                {isTopTrackPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
              </button>
            )}
            
            {token && token !== 'GUEST' && (
            <button
              onClick={handleFollowToggle}
              className={`
                px-8 py-2 rounded-full text-sm font-bold border transition-all uppercase tracking-wider
                ${isFollowing 
                  ? 'bg-transparent border-white/30 text-white hover:border-white' 
                  : 'bg-transparent border-white/30 text-white hover:border-white'}
              `}
            >
              {loadingFollow ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
            )}
            
            <IconButton className="text-gray-400 hover:text-white">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </IconButton>
          </div>

          {/* Popular Tracks */}
          <section className="mb-8">
            <Fade in timeout={600}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Popular</h2>
                {topTracks.length > 5 && (
                  <button
                    onClick={() => setShowAllTracks(!showAllTracks)}
                    className="text-gray-400 hover:text-white text-sm font-medium"
                  >
                    {showAllTracks ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            </Fade>
            
            {loadingTracks ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    animation="wave"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: '0.5rem',
                      height: '72px'
                    }} 
                  />
                ))}
              </div>
            ) : displayedTracks.length > 0 ? (
              <div className="space-y-2">
                {displayedTracks.map((track, index) => (
                  <Grow key={track.id} in timeout={300 + (index * 30)}>
                    <div
                      className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleTrackPlay(track)}
                    >
                    <div className="flex-shrink-0 w-10 text-center flex justify-center items-center text-gray-400 font-medium">
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
                        {currentTrack?.id === track.id && isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                      </button>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <img
                        src={track.album?.images?.[0]?.url || '/vite.svg'}
                        alt={track.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0"> 
                      <div className={`font-medium truncate ${
                        currentTrack?.id === track.id ? 'text-green-400' : 'text-white'
                      }`}>
                        {track.name}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {track.album?.name}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-sm text-gray-400">
                      {track.duration_ms ? 
                        `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` 
                        : '--:--'
                      }
                    </div>
                    
                    {/* More Options Button */}
                    <button
                      onClick={(e) => handleTrackMenuOpen(e, track)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                    >
                      <MoreVertIcon sx={{ fontSize: 20 }} />
                    </button>
                  </div>  
                  </Grow>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No popular tracks available</p>
              </div>
            )}
          </section>

          {/* Albums */}
          <section className="mb-8">
            <Fade in timeout={600}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Albums</h2>
                {albums.length > 6 && (
                  <button
                    onClick={() => setShowAllAlbums(!showAllAlbums)}
                    className="text-gray-400 hover:text-white text-sm font-medium"
                  >
                    {showAllAlbums ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            </Fade>
            
            {loadingAlbums ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="rectangular" 
                    animation="wave"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: '0.5rem',
                      paddingTop: '100%'
                    }} 
                  />
                ))}
              </div>
            ) : displayedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {displayedAlbums.map((album, index) => (
                  <Grow key={album.id} in timeout={400 + (index * 50)}>
                    <div
                      onClick={() => navigate(`/album/${album.id}`)}
                      className="group cursor-pointer space-y-3 hover:bg-white/5 p-3 rounded-lg transition-colors"
                    >
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-800">
                      <img
                        src={album.images?.[0]?.url || '/vite.svg'}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                                <PlayArrow sx={{ fontSize: 28, color: 'white' }} />
                          </div>  
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-white font-medium truncate group-hover:text-green-400 transition-colors flex-1">
                          {album.name}
                        </div>
                        <button
                          onClick={(e) => handleAlbumMenuOpen(e, album)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all flex-shrink-0"
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {album.release_date?.split('-')[0]} • {album.album_type}
                      </div>
                    </div>
                  </div>
                  </Grow>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No albums available</p>
              </div>
            )}
          </section>



        </div>
      </main>

      {/* Track Menu */}
      <TrackMenu
        anchorEl={trackMenuAnchor}
        open={Boolean(trackMenuAnchor)}
        onClose={handleTrackMenuClose}
        track={selectedTrack}
      />

      {/* Album Menu */}
      <AlbumMenu
        anchorEl={albumMenuAnchor}
        open={Boolean(albumMenuAnchor)}
        onClose={handleAlbumMenuClose}
        album={selectedAlbum}
      />
    </div>
  );
};

export default Artist;
