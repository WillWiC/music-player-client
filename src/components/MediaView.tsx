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
import { useToast } from '../context/toast';
import {
  PlayArrow,
  ArrowBack,
  MoreHoriz,
  Pause,
  AccessTime
} from '@mui/icons-material';
import type { Album as AlbumType, Playlist as PlaylistType, Track } from '../types/spotify';

interface MediaViewProps {
  id: string;
  type: 'album' | 'playlist';
  onBack: () => void;
  onTrackPlay?: (track: Track, source?: string) => void;
}

const MediaView: React.FC<MediaViewProps> = ({ id, type, onBack, onTrackPlay }) => {
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const [mediaData, setMediaData] = useState<AlbumType | PlaylistType | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  useEffect(() => {
    const fetchMediaData = async () => {
      if (!token || !id) return;

      setLoading(true);
      try {
        let mediaResponse, tracksResponse;
        
        if (type === 'album') {
          // Fetch album data
          mediaResponse = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          // Fetch playlist data
          mediaResponse = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (!mediaResponse.ok) throw new Error(`HTTP ${mediaResponse.status}`);
        
        const mediaDataResult = await mediaResponse.json();
        setMediaData(mediaDataResult);

        // Fetch tracks
        if (type === 'album') {
          // For albums, tracks are already included in the album response
          setTracks(mediaDataResult.tracks?.items || []);
        } else {
          // For playlists, fetch tracks separately
          tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!tracksResponse.ok) throw new Error(`HTTP ${tracksResponse.status}`);
          
          const tracksData = await tracksResponse.json();
          setTracks(tracksData.items || []);
        }
        
        setError('');
      } catch (err) {
        console.error(`Failed to fetch ${type}:`, err);
        setError(`Failed to load ${type}. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchMediaData();
  }, [token, id, type]);

  const toast = useToast();

  const handleTrackPlay = async (track: Track) => {
    try {
      if (currentTrack?.id === track.id && isPlaying) {
        await pause();
      } else {
        // For albums, tracks might not have full album info, so add it
        let fullTrack = track;
        if (type === 'album' && mediaData) {
          fullTrack = {
            ...track,
            album: mediaData as AlbumType
          };
        }

        await play(fullTrack);
        
        // Call the callback if provided
        if (onTrackPlay) {
          console.log(`Calling onTrackPlay callback for ${type} track`);
          onTrackPlay(fullTrack, type);
        }
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      toast.showToast('Unable to play track. Make sure you have Spotify Premium and the Spotify app is open.', 'error');
    }
  };

  const playAllTracks = async () => {
    if (tracks.length === 0) return;
    
    try {
      let firstTrack;
      if (type === 'album') {
        firstTrack = tracks[0];
        // Add album info to the track
        if (mediaData) {
          firstTrack = {
            ...firstTrack,
            album: mediaData as AlbumType
          };
        }
      } else {
        firstTrack = tracks[0].track;
      }
      
      if (firstTrack) {
        await play(firstTrack);
        
        if (onTrackPlay) {
          onTrackPlay(firstTrack, type);
        }
      }
    } catch (error) {
      console.error(`Failed to play ${type}:`, error);
      toast.showToast(`Unable to play ${type}. Make sure you have Spotify Premium and the Spotify app is open.`, 'error');
    }
  };

  // Helper functions to get data based on type
  const getTitle = () => {
    if (!mediaData) return '';
    return mediaData.name;
  };

  const getImage = () => {
    if (!mediaData) return '';
    return mediaData.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  };

  const getDescription = () => {
    if (!mediaData) return '';
    if (type === 'album') {
      const album = mediaData as AlbumType;
      const releaseYear = new Date(album.release_date).getFullYear();
      return `${album.album_type?.charAt(0).toUpperCase()}${album.album_type?.slice(1)} • ${releaseYear}`;
    } else {
      const playlist = mediaData as PlaylistType;
      const description = playlist.description;
      return description ? decodeHtmlEntities(description) : 'No description';
    }
  };

  const getSubtitle = () => {
    if (!mediaData) return '';
    if (type === 'album') {
      const album = mediaData as AlbumType;
      return `${album.total_tracks} tracks • ${album.artists?.map((artist: any) => artist.name).join(', ')}`;
    } else {
      const playlist = mediaData as PlaylistType;
      return `${playlist.tracks.total} tracks • By ${playlist.owner.display_name}`;
    }
  };

  const getTrackFromItem = (item: any) => {
    return type === 'album' ? item : item.track;
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


  if (!mediaData) return null;

  return (
  <div className="min-h-screen flex flex-col" style={{ background: '#000000' }}>
      <Box sx={{
        color: 'white',
        flex: 1,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={onBack} sx={{ color: 'white' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Typography>
      </Stack>

      {/* Media Info */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
        <Box sx={{
          width: 250,
          height: 250,
          borderRadius: 2,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,58,138,0.6) 60%, rgba(0,0,0,0.6) 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)'
        }}>
          <CardMedia
            component="img"
            image={getImage()}
            alt={getTitle()}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            {getTitle()}
          </Typography>
          <Typography variant="body1" sx={{ color: 'gray', mb: 2 }}>
            {getDescription()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'gray', mb: 3 }}>
            {getSubtitle()}
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton 
              onClick={playAllTracks}
              sx={{ 
                bgcolor: '#1db954', 
                color: 'white',
                width: 56,
                height: 56,
                '&:hover': { bgcolor: '#1ed760', transform: 'scale(1.05)' }
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
        {/* Table Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          mb: 1
        }}>
          {/* # column */}
          <Typography sx={{
            width: 40,
            color: 'gray',
            fontSize: '0.9rem',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            #
          </Typography>
          {/* Title column */}
          <Typography sx={{
            flex: 1,
            color: 'gray',
            fontSize: '0.9rem',
            fontWeight: 500,
            ml: 2
          }}>
            Title
          </Typography>
          {/* Album column (only for playlists) */}
          {type === 'playlist' && (
            <Typography sx={{
              width: 200,
              color: 'gray',
              fontSize: '0.9rem',
              fontWeight: 500,
              textAlign: 'left',
              mr: 2
            }}>
              Album
            </Typography>
          )}
          {/* Duration icon column */}
          <Box sx={{
            width: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'gray',
          }}>
            <AccessTime fontSize="small" aria-label="duration" />
          </Box>
        </Box>
        
        {tracks.map((item, index) => {
          const track = getTrackFromItem(item);
          if (!track) return null;
          
          const isCurrentTrack = currentTrack?.id === track.id;
          const isCurrentlyPlaying = isCurrentTrack && isPlaying;
          
          return (
            <Box
              key={track.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 1,
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .track-number': { display: 'none' },
                  '& .play-pause-btn': { display: 'flex' }
                },
                cursor: 'pointer',
                minHeight: '56px'
              }}
              onClick={() => handleTrackPlay(track)}
            >
              <Box sx={{ 
                width: 40, 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* Track Number - always visible unless we're hovering */}
                <Typography 
                  className="track-number"
                  sx={{ 
                    color: isCurrentTrack ? '#1db954' : 'gray',
                    fontSize: '0.9rem',
                    fontWeight: isCurrentTrack ? 'bold' : 'normal'
                  }}
                >
                  {index + 1}
                </Typography>
                
                {/* Play/Pause Button - only visible on hover */}
                <Box 
                  className="play-pause-btn"
                  sx={{ 
                    display: 'none',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isCurrentTrack ? '#1db954' : 'white',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.3)'
                    }
                  }}
                >
                  {isCurrentlyPlaying ? (
                    <Pause sx={{ fontSize: 16 }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 16 }} />
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, ml: 2 }}>
                <CardMedia
                  component="img"
                  image={track.album?.images?.[0]?.url || getImage()}
                  alt={track.name}
                  sx={{ width: 40, height: 40, borderRadius: 1, mr: 2 }}
                />
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    sx={{ 
                      color: currentTrack?.id === track.id ? '#1db954' : 'white',
                      fontWeight: currentTrack?.id === track.id ? 'bold' : 'normal',
                      fontSize: '1rem',
                      lineHeight: 1.3
                    }}
                    noWrap
                  >
                    {track.name}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: 'gray', 
                      fontSize: '0.875rem',
                      lineHeight: 1.3
                    }}
                    noWrap
                  >
                    {track.artists?.map((artist: any) => artist.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
              
              {type === 'playlist' && (
                <Typography sx={{ 
                  width: 200,
                  color: 'gray', 
                  fontSize: '0.875rem',
                  mr: 2,
                  textAlign: 'left'
                }} noWrap>
                  {track.album?.name}
                </Typography>
              )}
              
              
              <Box sx={{ 
                width: 60, 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Typography sx={{ 
                  color: 'gray', 
                  fontSize: '0.875rem', 
                  fontFamily: 'monospace'
                }}>
                  {track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
    </div>
  );
};

export default MediaView;
