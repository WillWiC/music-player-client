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
import type { Playlist as PlaylistType, Track } from '../types/spotify';

interface PlaylistProps {
  playlistId: string;
  onBack: () => void;
  onTrackPlay?: (track: Track, source?: string) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ playlistId, onBack, onTrackPlay }) => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!token || !playlistId) return;

      setLoading(true);
      try {
        // Fetch playlist details
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!playlistResponse.ok) throw new Error(`HTTP ${playlistResponse.status}`);
        
        const playlistData = await playlistResponse.json();
        setPlaylist(playlistData);

        // Fetch playlist tracks
        const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!tracksResponse.ok) throw new Error(`HTTP ${tracksResponse.status}`);
        
        const tracksData = await tracksResponse.json();
        setTracks(tracksData.items || []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
        setError('Failed to load playlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [token, playlistId]);

  const handleTrackPlay = async (track: Track) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        // Create a full track object with necessary properties
        const fullTrack = {
          ...track,
          // Ensure all required properties are present
          preview_url: track.preview_url || null,
          external_urls: track.external_urls || { spotify: '' }
        };

        await play(fullTrack);
        
        // Call the callback if provided
        if (onTrackPlay) {
          console.log('Calling onTrackPlay callback for playlist track');
          onTrackPlay(fullTrack, 'playlist');
        }
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      alert('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.');
    }
  };

  const playAllTracks = async () => {
    if (tracks.length === 0) return;
    
    try {
      const firstTrack = tracks[0].track;
      if (firstTrack) {
        await play(firstTrack);
        
        if (onTrackPlay && tracks.length > 0) {
          // Create a full track object
          const fullTrack = {
            ...firstTrack
          };
          onTrackPlay(fullTrack, 'playlist');
        }
      }
    } catch (error) {
      console.error('Failed to play playlist:', error);
      alert('Unable to play playlist. Make sure you have Spotify Premium and the Spotify app is open.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ padding: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Loading...
          </Typography>
        </Stack>
        
        <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
          <Skeleton variant="rectangular" width={250} height={250} sx={{ borderRadius: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" sx={{ fontSize: '3rem', mb: 2 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
            <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={onBack} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Error
          </Typography>
        </Stack>
        
        <Typography sx={{ color: 'red', textAlign: 'center', mt: 4 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!playlist) return null;

  return (
    <Box sx={{ padding: 4, color: 'white' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={onBack} sx={{ color: 'white' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Playlist
        </Typography>
      </Stack>

      {/* Playlist Info */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
        <CardMedia
          component="img"
          image={playlist.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}
          alt={playlist.name}
          sx={{ 
            width: 250, 
            height: 250, 
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            {playlist.name}
          </Typography>
          <Typography variant="body1" sx={{ color: 'gray', mb: 2 }}>
            {playlist.description || 'No description'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
            {playlist.tracks.total} tracks • By {playlist.owner.display_name}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton 
              onClick={playAllTracks}
              sx={{ 
                bgcolor: 'green', 
                color: 'white',
                width: 56,
                height: 56,
                '&:hover': { bgcolor: 'darkgreen', transform: 'scale(1.05)' }
              }}
            >
              <PlayArrow sx={{ fontSize: '2rem' }} />
            </IconButton>
            
            <IconButton sx={{ color: 'gray' }}>
              <MoreHoriz />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Tracks List */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
          Songs
        </Typography>
        
        {tracks.map((item, index) => {
          const track = item.track;
          if (!track) return null;
          
          return (
            <Box
              key={track.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                cursor: 'pointer'
              }}
              onClick={() => handleTrackPlay(track)}
            >
              <Typography 
                sx={{ 
                  width: 40, 
                  textAlign: 'center', 
                  color: 'gray',
                  fontSize: '0.9rem'
                }}
              >
                {index + 1}
              </Typography>
              
              <CardMedia
                component="img"
                image={track.album?.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn46B8J+OtTwvdGV4dD48L3N2Zz4='}
                alt={track.name}
                sx={{ width: 40, height: 40, borderRadius: 1, mr: 2 }}
              />
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  sx={{ 
                    color: currentTrack?.id === track.id ? 'green' : 'white',
                    fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal',
                    fontSize: '0.9rem'
                  }}
                  noWrap
                >
                  {track.name}
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'gray', 
                    fontSize: '0.8rem'
                  }}
                  noWrap
                >
                  {track.artists?.map((artist: any) => artist.name).join(', ')}
                </Typography>
              </Box>
              
              <Typography sx={{ color: 'gray', fontSize: '0.8rem', mr: 2 }}>
                {track.album?.name}
              </Typography>
              
              <Typography sx={{ color: 'gray', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
              </Typography>
              
              {currentTrack?.id === track.id && isPlaying && (
                <IconButton size="small" sx={{ ml: 1, color: 'green' }}>
                  <Pause />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Playlist;
