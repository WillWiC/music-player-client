import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [albums, setAlbums] = React.useState<any[]>([]);
  const [artists, setArtists] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Don't auto-redirect to login; allow guest access to search UI but disable playback/searching when unauthenticated
    if (!token) {
      console.log('Search page loaded without token - guest mode');
    }
  }, [token]);

  const runSearch = React.useCallback(async (q: string) => {
    if (!q.trim()) {
      setTracks([]);
      return;
    }

    // Save query locally (even if unauthenticated) for quick access later
    try {
      const key = 'recentSearches';
      const raw = localStorage.getItem(key);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const normalized = q.trim();
      const lower = normalized.toLowerCase();
      const deduped = [normalized, ...parsed.filter(s => s.toLowerCase() !== lower)].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(deduped));
      setRecentSearches(deduped);
    } catch (e) {
      console.warn('Failed to save recent search', e);
    }

    if (!token) {
      // When unauthenticated, we still store the query but cannot call Spotify API
      setTracks([]);
      setAlbums([]);
      setArtists([]);
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

  // Load recent searches from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('recentSearches');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 10));
      }
    } catch (e) {
      console.warn('Failed to load recent searches', e);
    }
  }, []);

  // If the page is opened with a ?q=... param, populate the input and run the search immediately
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q.trim()) {
      setQuery(q);
      // run without waiting for debounce
      void runSearch(q);
    }
  }, [location.search, runSearch]);

  const handleRunRecent = (q: string) => {
    setQuery(q);
    // run immediately without waiting for debounce
    void runSearch(q);
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem('recentSearches');
      setRecentSearches([]);
    } catch (e) {
      console.warn('Failed to clear recent searches', e);
    }
  };

  const removeRecentSearch = (q: string) => {
    try {
      const raw = localStorage.getItem('recentSearches');
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const filtered = parsed.filter(s => s.toLowerCase() !== q.toLowerCase()).slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(filtered));
      setRecentSearches(filtered);
    } catch (e) {
      console.warn('Failed to remove recent search', e);
    }
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
            {/* Recent searches quick access */}
            {recentSearches.length > 0 && !query.trim() && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {recentSearches.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunRecent(s)}
                      className="px-3 py-1 text-sm bg-white/5 rounded-full hover:bg-white/10"
                    >
                      {s}
                    </button>
                    <button onClick={() => removeRecentSearch(s)} className="text-xs text-gray-500 hover:text-gray-300 ml-1">✕</button>
                  </div>
                ))}
                <button onClick={clearRecentSearches} className="ml-2 text-xs text-gray-400 hover:text-gray-200">Clear</button>
              </div>
            )}
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
                            src={track.album?.images?.[0]?.url || '/vite.svg'}
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
                              <img src={album.images?.[0]?.url || '/vite.svg'} alt={album.name} className="w-full h-full object-cover" />
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
          <img src={artist.images?.[0]?.url || '/vite.svg'} alt={artist.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
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
