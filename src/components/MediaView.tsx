import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/player';
import { useAuth } from '../context/auth';
import { 
  Box, 
  Typography, 
  IconButton, 
  Stack,
  CardMedia,
  Skeleton,
  Fade,
  Grow
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
  const navigate = useNavigate();
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

  // Function to fetch all tracks from an album with pagination
  const fetchAllAlbumTracks = async (albumId: string) => {
    if (!token) return;

    let allTracks: any[] = [];
    let nextUrl = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

    while (nextUrl) {
      try {
        const response = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        allTracks = [...allTracks, ...(data.items || [])];
        nextUrl = data.next; // Spotify provides the next URL for pagination
      } catch (error) {
        console.error('Failed to fetch album tracks:', error);
        throw error;
      }
    }

    setTracks(allTracks);
  };

  useEffect(() => {
    const fetchMediaData = async () => {
      if (!token || !id) return;

      setLoading(true);
      try {
        if (type === 'album') {
          // Fetch album data with fields parameter to get all tracks in one request
          const mediaResponse = await fetch(
            `https://api.spotify.com/v1/albums/${id}?market=US`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!mediaResponse.ok) throw new Error(`HTTP ${mediaResponse.status}`);
          
          const mediaDataResult = await mediaResponse.json();
          setMediaData(mediaDataResult);

          // Most albums include all tracks in the initial response
          if (mediaDataResult.tracks?.items) {
            setTracks(mediaDataResult.tracks.items);
          } else {
            // Only fetch separately if tracks not included (rare)
            await fetchAllAlbumTracks(id);
          }
        } else {
          // For playlists, fetch metadata and tracks in PARALLEL for speed
          const [playlistResponse, tracksResponse] = await Promise.all([
            fetch(`https://api.spotify.com/v1/playlists/${id}?fields=id,name,description,images,owner,tracks(total),uri,type`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&market=US`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          ]);

          if (!playlistResponse.ok) throw new Error(`HTTP ${playlistResponse.status}`);
          if (!tracksResponse.ok) throw new Error(`HTTP ${tracksResponse.status}`);

          const [playlistData, tracksData] = await Promise.all([
            playlistResponse.json(),
            tracksResponse.json()
          ]);

          setMediaData(playlistData);
          
          // Set initial tracks immediately for fast display
          let allTracks = tracksData.items || [];
          setTracks(allTracks);

          // If there are more tracks, fetch remaining pages in background
          if (tracksData.next) {
            fetchRemainingPlaylistTracks(tracksData.next, allTracks);
          }
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

  // Background fetch for remaining playlist tracks (non-blocking)
  const fetchRemainingPlaylistTracks = async (nextUrl: string, initialTracks: any[]) => {
    let allTracks = [...initialTracks];
    let currentUrl = nextUrl;

    while (currentUrl) {
      try {
        const response = await fetch(currentUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) break; // Stop on error, but don't show error to user

        const data = await response.json();
        allTracks = [...allTracks, ...(data.items || [])];
        
        // Update tracks progressively as we fetch more
        setTracks([...allTracks]);
        
        currentUrl = data.next;
      } catch (error) {
        console.error('Failed to fetch additional tracks:', error);
        break; // Stop on error but keep what we have
      }
    }
  };

  const toast = useToast();

  const handleTrackPlay = async (track: Track, index?: number) => {
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

        // If this is a playlist, start playback with the playlist context and offset so Spotify continues tracks
        if (type === 'playlist' && mediaData && (mediaData as PlaylistType).uri && typeof index === 'number') {
          const playlist = mediaData as PlaylistType;
          await play({ context_uri: playlist.uri, offset: { position: index } });
          if (onTrackPlay) onTrackPlay(fullTrack, type);
        } else if (type === 'album' && mediaData && (mediaData as AlbumType).uri && typeof index === 'number') {
          const album = mediaData as AlbumType;
          await play({ context_uri: album.uri, offset: { position: index } });
          if (onTrackPlay) onTrackPlay(fullTrack, type);
        } else {
          await play(fullTrack);
          // Call the callback if provided
          if (onTrackPlay) {
            console.log(`Calling onTrackPlay callback for ${type} track`);
            onTrackPlay(fullTrack, type);
          }
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
        // For albums, play using the album context and offset
        const trackItem = tracks[0];
        firstTrack = trackItem;
        if (mediaData) {
          firstTrack = { ...firstTrack, album: mediaData as AlbumType };
        }
        // Use play with context_uri if available
        if ((mediaData as AlbumType)?.uri) {
          await play(firstTrack);
        } else if (firstTrack) {
          await play(firstTrack);
        }
      } else {
        // For playlists, use the playlist context_uri and offset so Spotify continues tracks
        const playlist = mediaData as PlaylistType;
        const firstItem = tracks[0];
        firstTrack = firstItem?.track;
        if (playlist?.uri) {
          // Play using the playlist context and offset via the player context's play function
          // The play function will prefer using URI playback when provided as a Track object
          await play(firstTrack);
        } else if (firstTrack) {
          await play(firstTrack);
        }

        if (onTrackPlay && firstTrack) {
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-purple-950/20 to-black">
        <Box sx={{ padding: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <IconButton onClick={onBack} sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Loading...
            </Typography>
          </Stack>
          
          <Box sx={{ 
            padding: '2rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(16, 185, 129, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
              <Skeleton 
                variant="rectangular" 
                width={250} 
                height={250} 
                sx={{ 
                  borderRadius: 2,
                  bgcolor: 'rgba(139, 92, 246, 0.1)'
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" sx={{ fontSize: '3rem', mb: 2, bgcolor: 'rgba(139, 92, 246, 0.1)' }} />
                <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1, bgcolor: 'rgba(139, 92, 246, 0.1)' }} />
                <Skeleton variant="text" sx={{ fontSize: '1rem', bgcolor: 'rgba(139, 92, 246, 0.1)' }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-purple-950/20 to-black">
        <Box sx={{ padding: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <IconButton onClick={onBack} sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Error
            </Typography>
          </Stack>
          
          <Typography sx={{ 
            color: '#ef4444', 
            textAlign: 'center', 
            mt: 4,
            padding: '2rem',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </Typography>
        </Box>
      </div>
    );
  }


  if (!mediaData) return null;

  return (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-purple-950/20 to-black">
      <Box sx={{
        color: 'white',
        flex: 1,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.5rem 1rem' ,
      }}>
      {/* Header with Fade Animation */}
      <Fade in={!loading} timeout={600}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2}}>
          <IconButton 
            onClick={onBack} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                transform: 'translateX(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #fff 0%, rgba(139, 92, 246, 1) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Typography>
        </Stack>
      </Fade>

      {/* Media Info with Grow Animation */}
      <Grow in={!loading} timeout={700}>
        <Box>
          {/* Gradient Header Background */}
          <Box sx={{
            position: 'relative',
            padding: '2rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(16, 185, 129, 0.15) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            mb: 2,
            boxShadow: '0 8px 32px rgba(88, 28, 135, 0.2)',
          }}>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Box sx={{
                width: 250,
                height: 250,
                borderRadius: 2,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 60%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3)',
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 16px 48px rgba(139, 92, 246, 0.4)',
                }
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
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                  {getDescription()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
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
                      '&:hover': { 
                        bgcolor: '#1ed760', 
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <PlayArrow sx={{ fontSize: '2rem' }} />
                  </IconButton>
                  
                  <IconButton sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}>
                    <MoreHoriz />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </Grow>

      {/* Tracks List with Grow Animation */}
      <Grow in={!loading} timeout={800}>
        <Box sx={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
        {/* Table Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 16px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          mb: 1
        }}>
          {/* # column */}
          <Typography sx={{
            width: 40,
            color: 'rgba(139, 92, 246, 0.8)',
            fontSize: '0.9rem',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            #
          </Typography>
          {/* Title column */}
          <Typography sx={{
            flex: 1,
            color: 'rgba(139, 92, 246, 0.8)',
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
              color: 'rgba(139, 92, 246, 0.8)',
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
            color: 'rgba(139, 92, 246, 0.8)',
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
                background: isCurrentTrack ? 'linear-gradient(90deg, rgba(29, 185, 84, 0.1) 0%, transparent 100%)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  '& .track-number': { display: 'none' },
                  '& .play-pause-btn': { display: 'flex' }
                },
                cursor: 'pointer',
                minHeight: '56px'
              }}
              onClick={() => handleTrackPlay(track, index)}
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
                  image={track.album?.images?.[0]?.url || getImage() || '/vite.svg'}
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
                    {track.artists?.map((artist: any, i: number) => (
                      <span key={artist.id || artist.name}>
                        {artist.id ? (
                          <Box
                            component="span"
                            onClick={(e) => { e.stopPropagation(); navigate(`/artist/${artist.id}`); }}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); navigate(`/artist/${artist.id}`); } }}
                            sx={{
                              cursor: 'pointer',
                              color: 'inherit',
                              textDecoration: 'none',
                              transition: 'color 120ms ease, transform 120ms ease',
                              '&:hover': {
                                color: '#1db954',
                                transform: 'translateY(-1px)'
                              },
                              '&:focus': {
                                outline: 'none',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {artist.name}
                          </Box>
                        ) : (
                          <span>{artist.name}</span>
                        )}
                        {i < (track.artists?.length || 0) - 1 ? ', ' : ''}
                      </span>
                    ))}
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
      </Grow>
    </Box>
    </div>
  );
};

export default MediaView;
