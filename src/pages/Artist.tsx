import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress } from '@mui/material';
import type { Artist as ArtistType, Album, Track } from '../types/spotify';
import { formatCount } from '../utils/numberFormat';

const Artist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isLoading: authLoading } = useAuth();
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

  // Fetch artist data
  React.useEffect(() => {
    if (!token || !id || authLoading) return;

    const fetchArtistData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch artist info
        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!artistResponse.ok) {
          throw new Error(`Failed to fetch artist: ${artistResponse.status}`);
        }
        
        const artistData = await artistResponse.json();
        setArtist(artistData);

        // Fetch if user is following this artist
        if (token) {
          try {
            const followResponse = await fetch(`https://api.spotify.com/v1/me/following/contains?type=artist&ids=${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (followResponse.ok) {
              const followData = await followResponse.json();
              setIsFollowing(followData[0] || false);
            }
          } catch (error) {
            console.warn('Failed to check following status:', error);
          }
        }

        // Fetch top tracks
        setLoadingTracks(true);
        try {
          const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            setTopTracks(tracksData.tracks || []);
          }
        } catch (error) {
          console.error('Failed to fetch top tracks:', error);
        } finally {
          setLoadingTracks(false);
        }

        // Fetch albums
        setLoadingAlbums(true);
        try {
          const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&market=US&limit=20`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (albumsResponse.ok) {
            const albumsData = await albumsResponse.json();
            setAlbums(albumsData.items || []);
          }
        } catch (error) {
          console.error('Failed to fetch albums:', error);
        } finally {
          setLoadingAlbums(false);
        }

        // Fetch related artists
        setLoadingRelated(true);
        try {
          const relatedResponse = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedArtists(relatedData.artists || []);
          }
        } catch (error) {
          console.error('Failed to fetch related artists:', error);
        } finally {
          setLoadingRelated(false);
        }

      } catch (error) {
        console.error('Failed to fetch artist data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load artist');
        toast.showToast('Failed to load artist data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [token, id, authLoading, toast]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!token || !id || loadingFollow) return;
    
    setLoadingFollow(true);
    try {
      const method = isFollowing ? 'DELETE' : 'PUT';
      const response = await fetch(`https://api.spotify.com/v1/me/following?type=artist&ids=${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
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

  // Loading skeleton component
  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg ${className}`} />
  );

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
                  {topTracks.length > 0 && (
                    <button
                      onClick={() => handleTrackPlay(topTracks[0])}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Play
                    </button>
                  )}
                  
                  {token && (
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

          {/* Popular Tracks */}
          <section className="mb-8">
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
            
            {loadingTracks ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <LoadingSkeleton className="w-12 h-12" />
                    <div className="flex-1 space-y-1">
                      <LoadingSkeleton className="h-4 w-3/4" />
                      <LoadingSkeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedTracks.length > 0 ? (
              <div className="space-y-2">
                {displayedTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleTrackPlay(track)}
                  >
                    <div className="flex-shrink-0 w-6 text-gray-400 text-sm font-medium group-hover:hidden">
                      {index + 1}
                    </div>
                    <div className="flex-shrink-0 w-6 hidden group-hover:flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
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
            
            {loadingAlbums ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <LoadingSkeleton className="aspect-square rounded-lg" />
                    <LoadingSkeleton className="h-4 w-full" />
                    <LoadingSkeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : displayedAlbums.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {displayedAlbums.map((album) => (
                  <div
                    key={album.id}
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
            <h2 className="text-2xl font-bold text-white mb-6">Related Artists</h2>
            
            {loadingRelated ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3 text-center">
                    <LoadingSkeleton className="aspect-square rounded-full mx-auto" />
                    <LoadingSkeleton className="h-4 w-3/4 mx-auto" />
                    <LoadingSkeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : relatedArtists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relatedArtists.slice(0, 12).map((relatedArtist) => (
                  <div
                    key={relatedArtist.id}
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
