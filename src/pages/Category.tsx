import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress, IconButton } from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';
import { usePlayer } from '../context/player';
import { getCategoryById, mapGenresToCategories, type CustomCategory } from '../utils/categoryMapping';

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  external_urls: { spotify: string };
}

const Category: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { play } = usePlayer();
  
  const [category, setCategory] = React.useState<CustomCategory | null>(null);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Load category on mount
  React.useEffect(() => {
    if (categoryId) {
      const foundCategory = getCategoryById(categoryId);
      setCategory(foundCategory);
    }
  }, [categoryId]);

  // Fetch artists and playlists for the category
  const fetchCategoryContent = React.useCallback(async () => {
    if (!token || !category || loadingPlaylists) return;
    
    setLoadingPlaylists(true);
    setError('');
    
    try {
      // Search for artists in this category's genres
      const genreSearches = category.spotifyGenres.slice(0, 3); // Limit to avoid too many requests
      let allArtists: Artist[] = [];
      let allPlaylists: Playlist[] = [];
      
      for (const genre of genreSearches) {
        try {
          // Search for artists of this genre
          const artistResponse = await fetch(
            `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre)}"&type=artist&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            const artists = artistData.artists?.items || [];
            allArtists = [...allArtists, ...artists];
          }
          
          // Search for playlists of this genre
          const playlistResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(genre)}&type=playlist&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (playlistResponse.ok) {
            const playlistData = await playlistResponse.json();
            const playlists = playlistData.playlists?.items || [];
            allPlaylists = [...allPlaylists, ...playlists];
          }
          
        } catch (err) {
          console.error(`Failed to search for genre: ${genre}`, err);
        }
      }
      
      // Filter and deduplicate artists by genre matching
      const relevantArtists = allArtists.filter(artist => {
        const artistGenres = artist.genres || [];
        return mapGenresToCategories(artistGenres).includes(categoryId!);
      });
      
      // Remove duplicates
      const uniqueArtists = relevantArtists.filter((artist, index, self) =>
        index === self.findIndex(a => a.id === artist.id)
      ).slice(0, 20); // Limit results
      
      const uniquePlaylists = allPlaylists.filter((playlist, index, self) =>
        index === self.findIndex(p => p.id === playlist.id)
      ).slice(0, 20); // Limit results
      
      setArtists(uniqueArtists);
      setPlaylists(uniquePlaylists);
      
    } catch (err) {
      console.error('Failed to fetch category content:', err);
      setError('Failed to load content. Please try again.');
      toast.showToast('Unable to load category content', 'error');
    } finally {
      setLoadingPlaylists(false);
    }
  }, [token, category, categoryId, toast]);

  // Load content after category is loaded
  React.useEffect(() => {
    if (category && token && !isLoading) {
      fetchCategoryContent();
    }
  }, [category, token, isLoading, fetchCategoryContent]);

  // Handle playlist play
  const handlePlaylistPlay = async (playlist: Playlist) => {
    try {
      const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        const firstTrack = tracksData.items?.[0]?.track;
        if (firstTrack) {
          await play(firstTrack);
        } else {
          toast.showToast('This playlist appears to be empty', 'error');
        }
      } else {
        toast.showToast('Unable to play playlist', 'error');
      }
    } catch (err) {
      console.error('Play playlist error:', err);
      toast.showToast('Unable to play playlist. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  // Handle artist play (play their top track)
  const handleArtistPlay = async (artist: Artist) => {
    try {
      const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        const topTrack = tracksData.tracks?.[0];
        if (topTrack) {
          await play(topTrack);
        } else {
          toast.showToast('No tracks found for this artist', 'error');
        }
      } else {
        toast.showToast('Unable to play artist', 'error');
      }
    } catch (err) {
      console.error('Play artist error:', err);
      toast.showToast('Unable to play artist. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  // Guest experience
  if (!token && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

        <main className="flex-1 lg:ml-72 pb-24 pt-20">
          <div className="relative max-w-6xl mx-auto py-20 px-6 sm:px-8 lg:px-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Music Category</h1>
              <p className="text-gray-400 mb-8">Sign in to explore this music category</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
              >
                Sign In to Browse
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      
      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-6 sm:px-8 lg:px-12">
          
          {/* Back Button */}
          <div className="mb-6">
            <IconButton 
              onClick={() => navigate('/browse')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <ArrowBack />
            </IconButton>
          </div>

          {/* Category Header */}
          {category && (
            <div className="mb-8 flex items-center gap-6">
              <div 
                className="w-32 h-32 rounded-xl flex items-center justify-center text-6xl"
                style={{ background: `linear-gradient(135deg, ${category.color}40, ${category.color}20)` }}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
                <p className="text-gray-400">Discover artists and playlists in this category</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingPlaylists && (
            <div className="flex items-center justify-center py-20">
              <CircularProgress size={60} sx={{ color: '#22c55e' }} />
            </div>
          )}

          {/* Error State */}
          {error && !loadingPlaylists && (
            <div className="text-center py-20">
              <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
                <h3 className="text-red-400 font-semibold mb-2">Unable to Load Category</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button 
                  onClick={() => {
                    fetchCategoryContent();
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Artists Section */}
          {!loadingPlaylists && !error && artists.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Popular Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <div 
                    key={artist.id}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-full aspect-square mb-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                      <img 
                        src={artist.images?.[0]?.url || '/vite.svg'} 
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArtistPlay(artist);
                          }}
                          sx={{
                            bgcolor: '#22c55e',
                            color: 'black',
                            '&:hover': { bgcolor: '#16a34a', transform: 'scale(1.1)' },
                            width: 48,
                            height: 48
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 24 }} />
                        </IconButton>
                      </div>
                    </div>
                    
                    {/* Artist Info */}
                    <div className="text-center px-1">
                      <h3 className="text-white font-semibold text-sm truncate group-hover:text-green-400 transition-colors">
                        {artist.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                        Artist
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Section */}
          {!loadingPlaylists && !error && playlists.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Related Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id}
                    className="group cursor-pointer relative"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                      
                      {/* Playlist Image */}
                      <div className="aspect-square">
                        <img 
                          src={playlist.images?.[0]?.url || '/vite.svg'} 
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaylistPlay(playlist);
                          }}
                          sx={{
                            bgcolor: '#22c55e',
                            color: 'black',
                            '&:hover': { bgcolor: '#16a34a', transform: 'scale(1.1)' },
                            width: 56,
                            height: 56
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 28 }} />
                        </IconButton>
                      </div>
                    </div>
                    
                    {/* Playlist Info */}
                    <div className="mt-3 px-1">
                      <h3 className="text-white font-semibold text-sm truncate group-hover:text-green-400 transition-colors">
                        {playlist.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate mt-1">
                        {playlist.description || `By ${playlist.owner?.display_name}`}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {playlist.tracks?.total} tracks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Content State */}
          {!loadingPlaylists && !error && playlists.length === 0 && artists.length === 0 && category && (
            <div className="text-center py-20">
              <div className="bg-white/5 rounded-2xl p-8 max-w-md mx-auto">
                <h3 className="text-gray-400 font-semibold mb-2">No Content Found</h3>
                <p className="text-gray-500 mb-4">No artists or playlists found for this category</p>
                <button 
                  onClick={fetchCategoryContent}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Category;
