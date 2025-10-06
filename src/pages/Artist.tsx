import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import { useSpotifyApi, buildSpotifyUrl } from '../hooks/useSpotifyApi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress, IconButton, Tooltip, Fade, Grow, Skeleton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
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
  const [relatedArtists, setRelatedArtists] = React.useState<ArtistType[]>([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
  
  // Loading states
  const [loading, setLoading] = React.useState(true);
  const [loadingTracks, setLoadingTracks] = React.useState(false);
  const [loadingAlbums, setLoadingAlbums] = React.useState(false);
  const [loadingRelated, setLoadingRelated] = React.useState(false);
  const [loadingFollow, setLoadingFollow] = React.useState(false);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showAllTracks, setShowAllTracks] = React.useState(false);
  const [showAllAlbums, setShowAllAlbums] = React.useState(false);
  
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

        // Parallel API calls for better performance
        const [followResult, tracksResult, albumsResult, relatedResult] = await Promise.allSettled([
          // Check if user is following this artist
          makeRequest(buildSpotifyUrl('me/following/contains', { 
            type: 'artist', 
            ids: id 
          })),
          // Fetch top tracks
          makeRequest(buildSpotifyUrl(`artists/${id}/top-tracks`, { market: 'US' })),
          // Fetch albums
          makeRequest(buildSpotifyUrl(`artists/${id}/albums`, {
            include_groups: 'album,single',
            market: 'US',
            limit: 20
          })),
          // Fetch related artists
          makeRequest(buildSpotifyUrl(`artists/${id}/related-artists`))
        ]);

        // Process follow status
        if (followResult.status === 'fulfilled' && followResult.value.data && !followResult.value.error) {
          setIsFollowing(followResult.value.data[0] || false);
        }

        // Process top tracks
        if (tracksResult.status === 'fulfilled' && tracksResult.value.data && !tracksResult.value.error) {
          setTopTracks(tracksResult.value.data.tracks || []);
        } else {
          console.warn('Failed to fetch top tracks');
        }

        // Process albums
        if (albumsResult.status === 'fulfilled' && albumsResult.value.data && !albumsResult.value.error) {
          setAlbums(albumsResult.value.data.items || []);
        } else {
          console.warn('Failed to fetch albums');
        }

        // Process related artists
        if (relatedResult.status === 'fulfilled' && relatedResult.value.data && !relatedResult.value.error) {
          setRelatedArtists(relatedResult.value.data.artists || []);
        } else {
          console.warn('Failed to fetch related artists');
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
        setLoadingRelated(false);
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
    <div className="flex min-h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Artist Header */}
          <Fade in timeout={600}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/10 backdrop-blur-sm p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-end">
              
              {/* Artist Image */}
              <div className="relative flex-shrink-0">
                <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden bg-gray-800 shadow-2xl">
                  {artist.images?.[0] ? (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                  </button>
                </div>
                <div className="mb-2">
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm rounded-full backdrop-blur-sm">
                    Artist
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {artist.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-gray-300">
                  {artist.followers && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{formatCount(artist.followers.total)} followers</span>
                    </div>
                  )}
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M9 10v8m6-8v8" />
                      </svg>
                      <span className="capitalize">{artist.genres[0]}</span>
                    </div>
                  )}
                  {artist.popularity && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>{artist.popularity}% popularity</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center lg:justify-start gap-4 mt-6">
                  {topTrack && (
                    <Tooltip title={isTopTrackPlaying ? 'Pause' : 'Play'}>
                      <IconButton
                        onClick={() => handleTrackPlay(topTrack)}
                        aria-pressed={isTopTrackPlaying}
                        aria-label={isTopTrackPlaying ? 'Pause top track' : 'Play top track'}
                        size="large"
                        sx={{
                          bgcolor: isTopTrackPlaying ? 'rgba(29,185,84,0.12)' : '#1DB954',
                          color: 'white',
                          '&:hover': {
                            bgcolor: isTopTrackPlaying ? 'rgba(29,185,84,0.18)' : '#1ed760'
                          }
                        }}
                      >
                        {isTopTrackPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {token && token !== 'GUEST' && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={loadingFollow}
                      className={`px-6 py-3 border-2 font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                        isFollowing
                          ? 'border-white text-white hover:border-red-400 hover:text-red-400 hover:bg-red-400/10'
                          : 'border-white text-white hover:border-green-400 hover:text-green-400 hover:bg-green-400/10'
                      }`}
                    >
                      {loadingFollow ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        isFollowing ? 'Following' : 'Follow'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </Fade>

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
                    <div className="flex-shrink-0 w-8 text-gray-400 text-sm font-medium group-hover:hidden">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 w-8 hidden group-hover:flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg className="w-5 h-5 text-[#1DB954] transition-transform duration-200 hover:scale-125" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white transition-transform duration-200 hover:scale-125" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
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
                          <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                        {album.name}
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

          {/* Related Artists */}
          <section>
            <Fade in timeout={600}>
              <h2 className="text-2xl font-bold text-white mb-6">Related Artists</h2>
            </Fade>
            
            {loadingRelated ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="circular" 
                    animation="wave"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      width: '100%',
                      paddingTop: '100%'
                    }} 
                  />
                ))}
              </div>
            ) : relatedArtists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relatedArtists.slice(0, 12).map((relatedArtist, index) => (
                  <Grow key={relatedArtist.id} in timeout={400 + (index * 50)}>
                    <div
                      onClick={() => navigate(`/artist/${relatedArtist.id}`)}
                      className="group cursor-pointer space-y-3 hover:bg-white/5 p-3 rounded-lg transition-colors text-center"
                    >
                    <div className="aspect-square relative overflow-hidden rounded-full bg-gray-800 mx-auto">
                      {relatedArtist.images?.[0] ? (
                        <img
                          src={relatedArtist.images[0].url}
                          alt={relatedArtist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                        {relatedArtist.name}
                      </div>
                      <div className="text-sm text-gray-400 capitalize truncate">
                        {relatedArtist.genres?.[0] || 'Artist'}
                      </div>
                    </div>
                  </div>
                  </Grow>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No related artists available</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default Artist;
