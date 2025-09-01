import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress } from '@mui/material';
import type { Playlist, Category } from '../types/spotify';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { token, isLoading: authLoading } = useAuth();
  const { play } = usePlayer();
  const navigate = useNavigate();
  const toast = useToast();

  // State management
  const [category, setCategory] = React.useState<Category | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [tracks, setTracks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'playlists' | 'tracks'>('playlists');
  const [searchInfo, setSearchInfo] = React.useState<string>('');

  

  // Function to handle opening playlist page
  const openPlaylist = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  // Fetch category details and playlists
  React.useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!token || !categoryId) {
      navigate('/dashboard');
      return;
    }

    const fetchCategoryData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch category details
        const categoryResponse = await fetch(`https://api.spotify.com/v1/browse/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!categoryResponse.ok) {
          throw new Error(`Failed to fetch category: HTTP ${categoryResponse.status}`);
        }

        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Fetch category playlists
        const playlistsResponse = await fetch(
          `https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (playlistsResponse.ok) {
          const playlistsData = await playlistsResponse.json();
          const fetchedPlaylists = playlistsData.playlists?.items || [];
          setPlaylists(fetchedPlaylists);
          
          // If no playlists found, try to search for tracks in this genre
          if (fetchedPlaylists.length === 0) {
            console.log(`No playlists found for category ${categoryData.name}, searching for tracks...`);
            await searchTracksForGenre(categoryData.name);
          }
        } else {
          console.log(`Failed to fetch playlists for category ${categoryData.name}, searching for tracks...`);
          await searchTracksForGenre(categoryData.name);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
        setError('Failed to load category. Please try again.');
        toast.showToast('Failed to load category data', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Function to search for tracks in a genre as fallback
    const searchTracksForGenre = async (genreName: string) => {
      try {
        let foundTracks: any[] = [];
        let foundPlaylists: any[] = [];

        // Strategy 1: Search for genre-specific playlists and tracks
        const genreSearchResponse = await fetch(
          `https://api.spotify.com/v1/search?q="${encodeURIComponent(genreName)}"&type=track,playlist&limit=30`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (genreSearchResponse.ok) {
          const genreSearchData = await genreSearchResponse.json();
          foundTracks = genreSearchData.tracks?.items || [];
          foundPlaylists = genreSearchData.playlists?.items || [];
        }

        // Update state with found content
        setTracks(foundTracks);
        if (foundPlaylists.length > 0) {
          setPlaylists(prevPlaylists => [...prevPlaylists, ...foundPlaylists]);
        }

        // Set search info for user feedback
        if (foundTracks.length > 0 || foundPlaylists.length > 0) {
          setSearchInfo(`Found ${foundTracks.length} tracks and ${foundPlaylists.length} playlists`);
        } else {
          setSearchInfo(`No content found for this genre`);
        }
      } catch (error) {
        console.error('Error searching for genre tracks:', error);
      }
    };

    fetchCategoryData();
  }, [token, categoryId, navigate, toast, authLoading]);

  // Helper function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Loading skeleton component
  const LoadingSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg ${className}`} />
  );

  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center">
        <CircularProgress style={{ color: '#1db954' }} />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">Please log in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-black to-gray-900 text-white flex">
  {/* category content */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
  <div className={`flex-1 transition-all duration-300 ml-0 lg:ml-72`}>
        <Header onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="p-6 pb-32 overflow-y-auto">
          {/* category header and content below */}
          {/* Category Header */}
          {loading ? (
            <div className="mb-8">
              <LoadingSkeleton className="w-64 h-8 mb-4" />
              <LoadingSkeleton className="w-96 h-6" />
            </div>
          ) : category ? (
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-green-400">
                {decodeHtmlEntities(category.name)}
              </h1>
              {searchInfo && (
                <p className="text-gray-300 text-sm mb-2">{searchInfo}</p>
              )}
            </div>
          ) : null}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'playlists'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Playlists ({playlists.length})
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'tracks'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tracks ({tracks.length})
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-100">{error}</p>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <LoadingSkeleton className="aspect-square w-full" />
                  <LoadingSkeleton className="w-3/4 h-4" />
                  <LoadingSkeleton className="w-1/2 h-3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Playlists Tab */}
              {activeTab === 'playlists' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {playlists.length > 0 ? (
                    playlists.filter(p => !!p).map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => openPlaylist(playlist.id)}
                        className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-700">
                          {playlist.images?.[0]?.url ? (
                            <img
                              src={playlist.images[0].url}
                              alt={playlist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                              <span className="text-gray-400 text-2xl">♪</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                          {decodeHtmlEntities(playlist.name)}
                        </h3>
                        <p className="text-gray-400 text-xs line-clamp-2">
                          {decodeHtmlEntities(playlist.description || '') || 'No description'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-400 text-lg mb-2">No playlists found</p>
                      <p className="text-gray-500 text-sm">Try switching to the Tracks tab to see individual songs</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tracks Tab */}
              {activeTab === 'tracks' && (
                <div className="space-y-2">
                  {tracks.length > 0 ? (
                    tracks.filter(t => !!t).map((track: any, index: number) => (
                      <div
                        key={track.id || `t-${index}`}
                        onClick={() => track?.uri && play(track.uri)}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer group"
                      >
                        <span className="text-gray-400 text-sm w-6 text-center group-hover:text-white">
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                          {track.album?.images?.[0]?.url ? (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">♪</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate group-hover:text-green-400">
                            {decodeHtmlEntities(track.name)}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {track.artists?.map((artist: any) => artist.name).join(', ')}
                          </p>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}` : ''}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg mb-2">No tracks found</p>
                      <p className="text-gray-500 text-sm">Try switching to the Playlists tab to see curated collections</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
