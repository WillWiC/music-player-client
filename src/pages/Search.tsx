import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { useToast } from '../context/toast';
import {
  Box,
  
  Typography,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, PlayArrow, Pause } from '@mui/icons-material';
import type { Track } from '../types/spotify';

const SearchPage: React.FC = () => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [albums, setAlbums] = React.useState<any[]>([]);
  const [artists, setArtists] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState(0);

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const runSearch = React.useCallback(async (q: string) => {
    if (!token || !q.trim()) {
      setTracks([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,album,artist&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTracks(data.tracks?.items || []);
      setAlbums(data.albums?.items || []);
      setArtists(data.artists?.items || []);
    } catch (err) {
      console.error('Search failed', err);
      setTracks([]);
      setAlbums([]);
      setArtists([]);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Debounce the query
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (query.trim()) runSearch(query);
      else setTracks([]);
    }, 350);
    return () => clearTimeout(id);
  }, [query, runSearch]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} onTrackPlayed={() => { /* no-op - header search handles it */ }} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12">
          <div className="mb-6">
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, or albums..."
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isSearching ? <CircularProgress size={18} sx={{ color: 'primary.main' }} /> : <SearchIcon sx={{ color: 'text.secondary' }} />}
                  </InputAdornment>
                )
              }}
            />
          </div>

          <Box>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="inherit" indicatorColor="primary">
              <Tab label={`Tracks (${tracks.length})`} />
              <Tab label="Albums" />
              <Tab label="Artists" />
            </Tabs>

            <div className="mt-6">
              {activeTab === 0 && (
                <div>
                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <CircularProgress sx={{ color: 'primary.main' }} />
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-gray-400 text-center py-12 bg-white/5 rounded-2xl border border-white/10">Try searching for an artist, song, or album above.</div>
                  ) : (
                    <div className="space-y-2">
                      {tracks.map(track => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors duration-150"
                        >
                          <img
                            src={track.album?.images?.[0]?.url}
                            alt={track.name}
                            className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }} noWrap className="truncate">{track.name}</Typography>
                            <div className="text-xs text-gray-400 truncate">
                              <span className="truncate block">{track.album?.name}</span>
                              <span className="truncate">{track.artists?.map(a => a.name).join(', ')}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <IconButton
                              onClick={() => handlePlayClick(track)}
                              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, color: 'black' }}
                              size="medium"
                              aria-label={currentTrack?.id === track.id && isPlaying ? 'Pause' : 'Play'}
                            >
                              {currentTrack?.id === track.id && isPlaying ? <Pause /> : <PlayArrow />}
                            </IconButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 1 && (
                <div>
                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <CircularProgress sx={{ color: 'primary.main' }} />
                    </div>
                  ) : albums.length === 0 ? (
                    <div className="text-gray-400 text-center py-12 bg-white/5 rounded-2xl border border-white/10">No albums found. Try another query.</div>
                  ) : (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {albums.map(album => (
                        <div key={album.id} className="cursor-pointer" onClick={() => navigate(`/album/${album.id}`)}>
                          <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                            <div className="aspect-square">
                              <img src={album.images?.[0]?.url} alt={album.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2">
                              <div className="text-sm text-white font-semibold truncate">{album.name}</div>
                              <div className="text-xs text-gray-400 truncate">{album.artists?.map((a:any) => a.name).join(', ')}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 2 && (
                <div>
                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <CircularProgress sx={{ color: 'primary.main' }} />
                    </div>
                  ) : artists.length === 0 ? (
                    <div className="text-gray-400 text-center py-12 bg-white/5 rounded-2xl border border-white/10">No artists found. Try another query.</div>
                  ) : (
                    <div className="space-y-2">
                      {artists.map(artist => (
                        <div key={artist.id} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg">
                          <img src={artist.images?.[0]?.url} alt={artist.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-semibold truncate">{artist.name}</div>
                            <div className="text-xs text-gray-400">{artist.type} • {artist.followers?.total ? `${artist.followers.total.toLocaleString()} followers` : ''}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <a href={artist.external_urls?.spotify} target="_blank" rel="noreferrer" className="text-xs text-green-300 underline">Open</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Box>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
