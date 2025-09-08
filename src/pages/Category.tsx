import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { CircularProgress, IconButton } from '@mui/material';
import { PlayArrow, ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material';
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
  followers?: { total: number };
  external_urls: { spotify: string };
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    release_date?: string;
  };
  duration_ms: number;
  external_urls: { spotify: string };
  uri: string;
  preview_url?: string;
  popularity?: number;
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
  const [artistStart, setArtistStart] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(5);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.8s ease-out forwards;
      }
      .animate-fade-in > * {
        animation: fade-in 0.6s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load category on mount
  React.useEffect(() => {
    if (categoryId) {
      const foundCategory = getCategoryById(categoryId);
      setCategory(foundCategory);
    }
  }, [categoryId]);

  // Update visibleCount based on viewport
  React.useEffect(() => {
    const onResize = () => {
      // Always show 5 artists per row as requested
      setVisibleCount(5);
      // Measure the visible viewport for pixel-perfect sliding
      const w = viewportRef.current?.clientWidth || 0;
      setContainerWidth(w);
      // Reset artist start if it's beyond valid range
      setArtistStart(prev => Math.min(prev, Math.max(0, artists.length - 5)));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [artists.length]);  // Compute per-item pixel width accounting for gap and padding when containerWidth is known
  const itemWidth = React.useMemo(() => {
    if (!containerWidth || visibleCount <= 0) return 0;
    const gapPx = 32; // Tailwind gap-8 => 2rem => 32px
    const paddingPx = 64; // px-8 container left+right => 4rem => 64px
    const available = Math.max(0, containerWidth - paddingPx);
    const raw = Math.floor(available / visibleCount);
    const cap = 220; // maximum per-item width to keep cards compact
    return Math.max(80, Math.min(raw, cap));
  }, [containerWidth, visibleCount]);  const maxArtistStart = React.useMemo(() => {
    return Math.max(0, artists.length - visibleCount);
  }, [artists.length, visibleCount]);

  // Fetch artists and playlists for the category
  const fetchCategoryContent = React.useCallback(async () => {
    if (!token || !category || loadingPlaylists) return;
    
    setLoadingPlaylists(true);
    setError('');
    
    try {
      // Search for artists and playlists for the category
      const genreSearches = category.spotifyGenres.slice(0, 3); // Limit to avoid too many requests
      let allArtists: Artist[] = [];
      let allPlaylists: Playlist[] = [];
      let allTracks: Track[] = [];
      
      for (const genre of genreSearches) {
        try {
          // For K-Pop and Asian Pop, Spotify's genre fields are inconsistent.
          // Use a keyword search (broad) instead of strict genre:"..." to improve results.
          const useGenreQualifier = !(categoryId === 'kpop' || categoryId === 'asian-pop');

          // Search for artists (use genre:"..." when reliable, otherwise keyword)
          const artistQuery = useGenreQualifier ? `genre:"${encodeURIComponent(genre)}"` : `${encodeURIComponent(genre)}`;
          const artistResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${artistQuery}&type=artist&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            const artists = artistData.artists?.items || [];
            allArtists = [...allArtists, ...artists];
          }

          // Playlists: keep broad keyword search (playlists are reliable)
          const playlistResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(genre)}&type=playlist&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (playlistResponse.ok) {
            const playlistData = await playlistResponse.json();
            const playlists = playlistData.playlists?.items || [];
            allPlaylists = [...allPlaylists, ...playlists];
          }

          // Tracks: try genre:"..." when allowed, otherwise keyword. If no result, we'll fallback later.
          let trackResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${useGenreQualifier ? `genre:"${encodeURIComponent(genre)}"` : encodeURIComponent(genre)}&type=track&limit=15`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // If the genre-qualified search failed or returned nothing and we used the qualifier, try keyword fallback
          if ((!trackResponse.ok || (await trackResponse.clone().json()).tracks?.items?.length === 0) && useGenreQualifier) {
            try {
              trackResponse = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(genre)}&type=track&limit=15`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (e) {
              // ignore; we'll handle below
            }
          }

          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            const tracks = trackData.tracks?.items || [];
            allTracks = [...allTracks, ...tracks];
          }
          
        } catch (err) {
          console.error(`Failed to search for genre: ${genre}`, err);
        }
      }
      
      // Deduplicate all artists returned by searches
      const uniqueArtistsRaw = allArtists.filter((artist, index, self) =>
        artist && artist.id && index === self.findIndex(a => a && a.id === artist.id)
      );

      // Filter by mapped genres when available
      const relevantArtists = uniqueArtistsRaw.filter(artist => {
        if (!artist || !artist.genres) return false;
        const artistGenres = artist.genres || [];
        return mapGenresToCategories(artistGenres).includes(categoryId!);
      });

      // If no artists matched by genre mapping for kpop/asian-pop, fall back to the deduped search results
      const candidateArtists = (categoryId === 'kpop' || categoryId === 'asian-pop') && relevantArtists.length === 0
        ? uniqueArtistsRaw
        : relevantArtists;

      // Prefer more modern/popular artists: sort by popularity desc, prefer those with images
      const sortedArtists = candidateArtists
        .filter(a => a && a.id)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .sort((a, b) => ((b.images?.length || 0) - (a.images?.length || 0)));

      // Helper to detect Hangul (Korean) and CJK characters
      const containsHangul = (s?: string) => !!s && /[\uAC00-\uD7AF]/.test(s);
      const containsCJK = (s?: string) => !!s && /[\u4E00-\u9FFF\u3040-\u30FF]/.test(s);

      // For kpop/asian-pop, try to prioritize artists whose name or genres indicate the region
      if (categoryId === 'kpop') {
        const prioritized = sortedArtists.filter(a => {
          const g = (a.genres || []).map(x => x.toLowerCase());
          return g.includes('k-pop') || g.some(x => x.includes('korean')) || containsHangul(a.name);
        });
        // If we found prioritized artists, use them; otherwise fall back to popularity-sorted list
        const kpopFinal = (prioritized.length ? prioritized.slice(0, 20) : sortedArtists.slice(0, 20));
        setArtists(kpopFinal);
      } else if (categoryId === 'asian-pop') {
        const prioritized = sortedArtists.filter(a => {
          const g = (a.genres || []).map(x => x.toLowerCase());
          return containsCJK(a.name) || g.some(x => x.includes('mandopop') || x.includes('cantopop') || x.includes('j-pop') || x.includes('japanese') || x.includes('chinese'));
        });
        const asianFinal = (prioritized.length ? prioritized.slice(0, 20) : sortedArtists.slice(0, 20));
        setArtists(asianFinal);
      } else {
        // For pop and others, be stricter: prefer artists with higher popularity (>=50) and images for pop
        let finalArtists: Artist[] = [];
        if (categoryId === 'pop') {
          const popular = sortedArtists.filter(a => (a.popularity || 0) >= 50 && (a.images?.length || 0) > 0);
          finalArtists = popular.length ? popular.slice(0, 20) : sortedArtists.slice(0, 20);
        } else {
          finalArtists = sortedArtists.slice(0, 20);
        }
        setArtists(finalArtists);
      }

      const uniquePlaylists = allPlaylists.filter((playlist, index, self) =>
        playlist && playlist.id && index === self.findIndex(p => p && p.id === playlist.id)
      ).slice(0, 20); // Limit results

      // Remove duplicate tracks and limit results
      let uniqueTracksRaw = allTracks.filter((track, index, self) =>
        track && track.id && index === self.findIndex(t => t && t.id === track.id)
      );

      // If no tracks found via search (common for kpop/asian-pop), try fetching first tracks from related playlists
      if (uniqueTracksRaw.length === 0 && uniquePlaylists.length > 0) {
        const fallbackTracks: Track[] = [];
        for (const pl of uniquePlaylists.slice(0, 6)) {
          try {
            const resp = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=6`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
              const data = await resp.json();
              const items = data.items || [];
              for (const it of items) {
                if (it && it.track) fallbackTracks.push(it.track);
              }
            }
          } catch (e) {
            // ignore individual playlist failures
          }
        }

        uniqueTracksRaw = fallbackTracks.filter((track, index, self) =>
          track && track.id && index === self.findIndex(t => t && t.id === track.id)
        );
      }

      // Sort tracks: for pop/kpop prefer recent release_date then popularity; otherwise prefer popularity
      const tracksWithMeta = uniqueTracksRaw.map(t => t as Track);
      tracksWithMeta.sort((a, b) => {
        const aDate = a.album?.release_date ? new Date(a.album.release_date).getTime() : 0;
        const bDate = b.album?.release_date ? new Date(b.album.release_date).getTime() : 0;

        if (categoryId === 'pop' || categoryId === 'kpop') {
          if (bDate !== aDate) return bDate - aDate; // recent first
          return ((b as any).popularity || 0) - ((a as any).popularity || 0);
        }

        return ((b as any).popularity || 0) - ((a as any).popularity || 0) || bDate - aDate;
      });

  const uniqueTracks = tracksWithMeta.slice(0, 30);

  setPlaylists(uniquePlaylists);
      setTracks(uniqueTracks);
      
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

  // Handle track play
  const handleTrackPlay = async (track: Track) => {
    try {
      await play(track as any);
    } catch (err) {
      console.error('Play track error:', err);
      toast.showToast('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
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
          <div className="mb-8">
            <IconButton 
              onClick={() => navigate('/browse')}
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'translateX(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                },
                transition: 'all 0.3s ease',
                width: 48,
                height: 48
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </div>

          {/* Category Header */}
          {category && (
            <div className="mb-12 flex items-center gap-8">
              <div 
                className="w-40 h-40 rounded-2xl flex items-center justify-center text-7xl shadow-2xl transition-transform duration-300 hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}, ${category.color}80)`,
                  boxShadow: `0 20px 40px ${category.color}20`
                }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <h1 className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {category.name}
                </h1>
                <p className="text-xl text-gray-300 mb-4">Discover the best music in this category</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>🎵 Artists</span>
                  <span>•</span>
                  <span>🎧 Songs</span>
                  <span>•</span>
                  <span>📱 Playlists</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingPlaylists && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <CircularProgress 
                  size={80} 
                  thickness={4}
                  sx={{ 
                    color: category?.color || '#22c55e',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }} 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl animate-pulse">
                    {category?.icon || '🎵'}
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mt-6 mb-2">Loading {category?.name}</h3>
              <p className="text-gray-400 text-center max-w-md">
                Discovering the best artists, songs, and playlists for you...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loadingPlaylists && (
            <div className="text-center py-24">
              <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-500/30 rounded-3xl p-10 max-w-lg mx-auto backdrop-blur-sm">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-red-300 font-bold text-xl mb-3">Something went wrong</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">{error}</p>
                <button 
                  onClick={() => {
                    fetchCategoryContent();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Content Sections - Always show all sections with content */}
          {!loadingPlaylists && !error && (
            <div className="space-y-16">
              
              {/* Popular Artists Section - carousel (no horizontal scroll) */}
              {artists.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div>
                        <h2 className="text-5xl font-black text-transparent bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text mb-2">
                          Popular Artists
                        </h2>
                        <p className="text-gray-300 text-lg">Top performers in {category?.name}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                        <div className="text-3xl opacity-60">{category?.icon}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-400 bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="text-green-400 font-semibold">{artists.length}</span> artists
                        {/* Debug info - remove in production */}
                        <span className="ml-2 text-xs opacity-60">
                          ({artistStart + 1}-{Math.min(artistStart + visibleCount, artists.length)} showing)
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                        <span>Use</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-white">←</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-white">→</kbd>
                        <span>to navigate</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="relative"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setArtistStart(s => Math.min(s + visibleCount, maxArtistStart));
                      if (e.key === 'ArrowLeft') setArtistStart(s => Math.max(0, s - visibleCount));
                    }}
                  >
                    <button
                      aria-label="Previous Artists"
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-gradient-to-r from-black/60 to-black/40 hover:from-black/80 hover:to-black/60 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl"
                      onClick={() => setArtistStart(s => Math.max(0, s - visibleCount))}
                      disabled={artistStart <= 0}
                    >
                      <ChevronLeft sx={{ 
                        color: artistStart <= 0 ? 'rgba(255,255,255,0.3)' : 'white',
                        fontSize: '24px'
                      }} />
                    </button>

                    <div className="overflow-hidden px-8 py-4 bg-gradient-to-r from-white/[0.02] to-white/[0.05] rounded-3xl border border-white/10 backdrop-blur-sm shadow-2xl" ref={viewportRef}>
                      <div className="grid grid-cols-5 gap-6">
                        {artists.slice(artistStart, artistStart + visibleCount).map((artist) => (
                          <div
                            key={artist.id}
                            className="group cursor-pointer flex flex-col items-center transition-all duration-500 hover:scale-105"
                            onClick={() => handleArtistPlay(artist)}
                          >
                            <div className="relative mb-4">
                              <div
                                className="relative overflow-hidden rounded-full bg-gradient-to-br from-white/20 via-white/10 to-white/5 border-2 border-white/20 transition-all duration-500 shadow-2xl group-hover:shadow-green-500/25 group-hover:border-green-400/50 group-hover:scale-110"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                }}
                              >
                                <img 
                                  src={artist.images?.[0]?.url || '/vite.svg'} 
                                  alt={artist.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                                  <div className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110">
                                    <PlayArrow sx={{ fontSize: '28px' }} />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Popularity indicator */}
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                {artist.popularity || 0}
                              </div>
                            </div>
                            
                            <div className="text-center max-w-full">
                              <h3 className="text-white font-bold text-base mb-1 truncate group-hover:text-green-300 transition-colors duration-300">
                                {artist.name}
                              </h3>
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <span>{artist.followers ? `${Math.floor(artist.followers.total / 1000)}K` : '0'} followers</span>
                                {artist.genres && artist.genres.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-20">{artist.genres[0]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      aria-label="Next Artists"
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-gradient-to-r from-black/60 to-black/40 hover:from-black/80 hover:to-black/60 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl"
                      onClick={() => setArtistStart(s => Math.min(s + visibleCount, maxArtistStart))}
                      disabled={artistStart >= maxArtistStart}
                    >
                      <ChevronRight sx={{ 
                        color: artistStart >= maxArtistStart ? 'rgba(255,255,255,0.3)' : 'white',
                        fontSize: '24px'
                      }} />
                    </button>
                    
                    {/* Page indicators */}
                    {Math.ceil(artists.length / visibleCount) > 1 && (
                      <div className="flex justify-center mt-6 gap-2">
                        {Array.from({ length: Math.ceil(artists.length / visibleCount) }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setArtistStart(i * visibleCount)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              Math.floor(artistStart / visibleCount) === i
                                ? 'bg-green-400 w-8 shadow-lg shadow-green-400/50'
                                : 'bg-white/30 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Popular Songs Section */}
              {tracks.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-4xl font-black text-white mb-2">Popular Songs</h2>
                      <p className="text-gray-400">Trending tracks in {category?.name}</p>
                    </div>
                    <div className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {tracks.length} songs
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-2xl">
                    <div className="space-y-2">
                      {tracks.map((track, index) => (
                        <div 
                          key={track.id}
                          className="group cursor-pointer flex items-center gap-6 p-4 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                          onClick={() => handleTrackPlay(track)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Track Number */}
                          <div className="w-10 text-center">
                            <span className="text-gray-400 font-semibold group-hover:hidden">
                              {index + 1}
                            </span>
                            <IconButton
                              size="small"
                              className="hidden group-hover:flex transform transition-transform hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackPlay(track);
                              }}
                              sx={{ 
                                color: '#22c55e',
                                '&:hover': {
                                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                                }
                              }}
                            >
                              <PlayArrow sx={{ fontSize: 22 }} />
                            </IconButton>
                          </div>

                          {/* Album Art */}
                          <div className="relative">
                            <img 
                              src={track.album?.images?.[0]?.url || '/vite.svg'} 
                              alt={track.name}
                              className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                          </div>

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base truncate group-hover:text-green-400 transition-colors duration-300 mb-1">
                              {track.name}
                            </h3>
                            <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">
                              {track.artists?.map(artist => artist.name).join(', ')}
                            </p>
                          </div>

                          {/* Album Name */}
                          <div className="hidden lg:block flex-1 min-w-0">
                            <p className="text-gray-500 text-sm truncate group-hover:text-gray-400 transition-colors">
                              {track.album?.name}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="text-gray-500 text-sm font-mono group-hover:text-green-400 transition-colors">
                            {Math.floor(track.duration_ms / 60000)}:
                            {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                          </div>

                          {/* Track Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <IconButton
                              size="small"
                              sx={{ 
                                color: 'rgba(255,255,255,0.6)',
                                '&:hover': { color: '#22c55e' }
                              }}
                            >
                              <span className="text-xs">♡</span>
                            </IconButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Related Playlists Section */}
              {playlists.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-4xl font-black text-white mb-2">Related Playlists</h2>
                      <p className="text-gray-400">Curated collections for {category?.name} lovers</p>
                    </div>
                    <div className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                      {playlists.length} playlists
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {playlists.map((playlist, index) => (
                      <div 
                        key={playlist.id}
                        className="group cursor-pointer relative transform transition-all duration-300 hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-green-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 backdrop-blur-sm">
                          
                          {/* Playlist Image */}
                          <div className="aspect-square relative">
                            <img 
                              src={playlist.images?.[0]?.url || '/vite.svg'} 
                              alt={playlist.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaylistPlay(playlist);
                              }}
                              sx={{
                                bgcolor: '#22c55e',
                                color: 'black',
                                '&:hover': { 
                                  bgcolor: '#16a34a', 
                                  transform: 'scale(1.2)',
                                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
                                },
                                width: 64,
                                height: 64,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <PlayArrow sx={{ fontSize: 32 }} />
                            </IconButton>
                          </div>

                          {/* Track Count Badge */}
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {playlist.tracks?.total} tracks
                          </div>
                        </div>
                        
                        {/* Playlist Info */}
                        <div className="mt-4 px-1">
                          <h3 className="text-white font-bold text-sm truncate group-hover:text-green-400 transition-colors duration-300 mb-2">
                            {playlist.name}
                          </h3>
                          <p className="text-gray-500 text-xs truncate leading-relaxed mb-1">
                            {playlist.description || `Curated by ${playlist.owner?.display_name}`}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 text-xs">
                              By {playlist.owner?.display_name}
                            </p>
                            {playlist.tracks?.total && playlist.tracks.total > 50 && (
                              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                MEGA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}

          {/* No Content State */}
          {!loadingPlaylists && !error && playlists.length === 0 && artists.length === 0 && tracks.length === 0 && category && (
            <div className="text-center py-32">
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 max-w-lg mx-auto backdrop-blur-sm border border-white/10 shadow-2xl">
                <div className="text-8xl mb-6 opacity-50">
                  {category.icon}
                </div>
                <h3 className="text-gray-300 font-bold text-xl mb-3">No content available</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  We couldn't find any artists, songs, or playlists for {category.name} right now.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={fetchCategoryContent}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => navigate('/browse')}
                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
                  >
                    Browse Other Categories
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Category;
