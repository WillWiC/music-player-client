import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { formatCount } from '../utils/numberFormat';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import {
  Tabs,
  Tab,
  IconButton,
  Fade,
  Grow,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { useToast } from '../context/toast';

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
  React.useEffect(() => {
    // If no token, show guest prompt and skip loading library data
    if (!token) {
      console.log('Library loaded without token - guest mode');
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      setLoading(true);
      try {
        // Load ALL data in PARALLEL for maximum speed
        const [pRes, aRes, tRes, arRes] = await Promise.all([
          fetch('https://api.spotify.com/v1/me/playlists?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('https://api.spotify.com/v1/me/albums?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('https://api.spotify.com/v1/me/tracks?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('https://api.spotify.com/v1/me/following?type=artist&limit=50', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Parse all responses in parallel
        const [pData, aData, tData, arData] = await Promise.all([
          pRes.ok ? pRes.json() : null,
          aRes.ok ? aRes.json() : null,
          tRes.ok ? tRes.json() : null,
          arRes.ok ? arRes.json() : null
        ]);

        // Update all state at once
        setPlaylists(pData?.items || []);
        setAlbums((aData?.items || []).map((i: any) => i.album));
        setTracks((tData?.items || []).map((i: any) => i.track));
        setArtists(arData?.artists?.items || []);
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} onTrackPlayed={() => {}} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12">
          <Fade in timeout={600}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">Your Library</h1>
              <p className="text-gray-400 text-sm">Saved playlists, albums, tracks and top artists</p>
            </div>
          </Fade>

          <Fade in timeout={700}>
            <div className="mb-6">
              <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="primary">
                <Tab label={`Your Playlists (${playlists.length})`} />
                <Tab label={`Liked Songs (${tracks.length})`} />
                <Tab label={`Saved Albums (${albums.length})`} />
                <Tab label={`Liked / Following Artists (${artists.length})`} />
              </Tabs>
            </div>
          </Fade>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grow in key={i} timeout={200 + i * 30}>
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
          ) : (
            <div className={tabHighlight ? 'tab-open-highlight' : ''}>
              {tab === 0 && (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {playlists.map((pl, index) => (
                    <Grow in timeout={250 + index * 30} key={pl.id}>
                      <div className="cursor-pointer" onClick={() => navigate(`/playlist/${pl.id}`)}>
                        <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                          <div className="aspect-square">
                            <img src={pl.images?.[0]?.url || '/vite.svg'} alt={pl.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2">
                            <div className="text-sm text-white font-semibold truncate">{pl.name}</div>
                            <div className="text-xs text-gray-400 truncate">{pl.owner?.display_name}</div>
                          </div>
                        </div>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}

              {tab === 1 && (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <Grow in timeout={200 + index * 20} key={track.id}>
                      <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
                        <img src={track.album?.images?.[0]?.url || '/vite.svg'} alt={track.name} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-semibold truncate">{track.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            <span className="truncate block">{track.album?.name}</span>
                            <span className="truncate">{track.artists?.map((a:any) => a.name).join(', ')}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <IconButton onClick={() => handlePlay(track)} sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' }, color: 'black' }}>
                            {currentTrack?.id === track.id && isPlaying ? <Pause /> : <PlayArrow />}
                          </IconButton>
                        </div>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}

              {tab === 2 && (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {albums.map((al, index) => (
                    <Grow in timeout={250 + index * 30} key={al.id}>
                      <div className="cursor-pointer" onClick={() => navigate(`/album/${al.id}`)}>
                        <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                          <div className="aspect-square">
                            <img src={al.images?.[0]?.url || '/vite.svg'} alt={al.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2">
                            <div className="text-sm text-white font-semibold truncate">{al.name}</div>
                            <div className="text-xs text-gray-400 truncate">{al.artists?.map((a:any) => a.name).join(', ')}</div>
                          </div>
                        </div>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}

              {tab === 3 && (
                <div className="space-y-2">
                  {artists.map((artist, index) => (
                    <Grow in timeout={200 + index * 20} key={artist.id}>
                      <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
                        <img src={artist.images?.[0]?.url} alt={artist.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm text-white font-semibold truncate cursor-pointer hover:text-green-300 transition-colors"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate(`/artist/${artist.id}`)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/artist/${artist.id}`); }}
                          >
                            {artist.name}
                          </div>
                          <div className="text-xs text-gray-400">{artist.followers?.total ? `${formatCount(artist.followers.total)} followers` : ''}</div>
                        </div>
                        <div className="flex-shrink-0">
                          <a href={artist.external_urls?.spotify} target="_blank" rel="noreferrer" className="text-xs text-green-300 underline">Open</a>
                        </div>
                      </div>
                    </Grow>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Library;
