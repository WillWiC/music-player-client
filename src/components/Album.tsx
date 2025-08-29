import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/player';
import { useAuth } from '../context/auth';
import { 
  Box, 
  Typography, 
  IconButton, 
  Stack,
  CardMedia,
  Skeleton
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  ArrowBack,
  MoreHoriz
} from '@mui/icons-material';
import type { Album as AlbumType, Track } from '../types/spotify';

interface AlbumProps {
  albumId: string;
  onBack: () => void;
}

const Album: React.FC<AlbumProps> = ({ albumId, onBack }) => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!token || !albumId) return;

      setLoading(true);
      try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const albumData = await response.json();
        setAlbum(albumData);
        setError('');
      } catch (err) {
        console.error('Failed to fetch album:', err);
        setError('Failed to load album. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, token]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  const getTotalDuration = () => {
    if (!album?.tracks?.items) return '';
    const totalMs = album.tracks.items.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const handleTrackPlay = async (track: Track, trackIndex?: number) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        // Play the entire album starting from the selected track
        if (!album?.uri || !album?.tracks?.items) {
          console.error('Album URI or tracks not available');
          return;
        }

        await playAlbumFromTrack(album.uri, trackIndex || 0);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      alert('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.');
    }
  };

  const playAlbumFromTrack = async (albumUri: string, startIndex: number) => {
    if (!token || !play) return;

    try {
      // Use Spotify Web API to play album starting from specific track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: albumUri,
          offset: {
            position: startIndex
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error playing album:', error);
      // Fallback to individual track play
      const track = album?.tracks?.items?.[startIndex];
      if (track) {
        const fullTrack = {
          ...track,
          album: album || undefined
        };
        await play(fullTrack);
      }
    }
  };

  const playAllTracks = async () => {
    if (!album?.tracks?.items?.[0] || !album?.uri) return;
    
    try {
      await playAlbumFromTrack(album.uri, 0);
    } catch (error) {
      console.error('Error playing album:', error);
      alert('Unable to play album. Make sure you have Spotify Premium and the Spotify app is open.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={200} height={32} />
        </Stack>
        
        <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" width={300} height={300} sx={{ borderRadius: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={400} height={48} />
            <Skeleton variant="text" width={300} height={24} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={200} height={20} />
            <Skeleton variant="rectangular" width={120} height={48} sx={{ mt: 3, borderRadius: 6 }} />
          </Box>
        </Stack>
        
        <Box>
          {Array.from({ length: 8 }).map((_, i) => (
            <Stack key={i} direction="row" spacing={2} sx={{ py: 1 }}>
              <Skeleton variant="text" width={30} />
              <Skeleton variant="text" width={300} />
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={50} />
            </Stack>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <IconButton onClick={onBack} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!album) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header with back button */}
      <Box sx={{ 
        background: `linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%)`,
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        p: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton 
            onClick={onBack}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            Album
          </Typography>
        </Stack>
      </Box>

      {/* Album header */}
      <Box sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'center', md: 'flex-end' }}>
          <CardMedia
            component="img"
            image={album.images?.[0]?.url}
            alt={`${album.name} cover`}
            sx={{
              width: { xs: 250, md: 300 },
              height: { xs: 250, md: 300 },
              borderRadius: 2,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          />
          
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Album
            </Typography>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                mb: 2, 
                fontSize: { xs: '2.5rem', md: '4rem' },
                lineHeight: 1.1
              }}
            >
              {album.name}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {album.artists[0]?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                • {formatReleaseDate(album.release_date)} • {album.total_tracks} songs, {getTotalDuration()}
              </Typography>
            </Stack>
            
            {/* Play button */}
            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <IconButton
                onClick={playAllTracks}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'black',
                  width: 56,
                  height: 56,
                  '&:hover': {
                    bgcolor: 'primary.light',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease',
                  boxShadow: 3
                }}
              >
                <PlayArrow sx={{ fontSize: 32 }} />
              </IconButton>
              
              <IconButton
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                <MoreHoriz sx={{ fontSize: 32 }} />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Track list */}
      <Box sx={{ px: 4, pb: 8 }}>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, px: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 40 }}>#</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1, ml: 2 }}>TITLE</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 60, textAlign: 'center' }}>DURATION</Typography>
          </Stack>
        </Box>

        {album.tracks?.items?.map((track, index) => (
          <Box
            key={track.id}
            onClick={() => handleTrackPlay(track, index)}
            className="track-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              },
              transition: 'background-color 0.2s ease'
            }}
          >
            <Box 
              sx={{ 
                minWidth: 40, 
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40
              }}
            >
              {currentTrack?.id === track.id && isPlaying ? (
                <IconButton size="small" sx={{ color: 'primary.main' }}>
                  <Pause sx={{ fontSize: 16 }} />
                </IconButton>
              ) : currentTrack?.id === track.id ? (
                <IconButton size="small" sx={{ color: 'primary.main' }}>
                  <PlayArrow sx={{ fontSize: 16 }} />
                </IconButton>
              ) : (
                <>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontFamily: 'monospace',
                      opacity: 1,
                      transition: 'opacity 0.2s ease',
                      '.track-row:hover &': {
                        opacity: 0
                      }
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      '.track-row:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 16 }} />
                  </IconButton>
                </>
              )}
            </Box>
            
            <Box sx={{ flex: 1, ml: 2, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: currentTrack?.id === track.id ? 'primary.main' : 'text.primary',
                  fontWeight: currentTrack?.id === track.id ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {track.name}
              </Typography>
              {track.explicit && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  E
                </Typography>
              )}
            </Box>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontFamily: 'monospace',
                minWidth: 60,
                textAlign: 'center'
              }}
            >
              {formatDuration(track.duration_ms)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Album;
