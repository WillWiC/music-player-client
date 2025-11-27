import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/player';
import { useAuth } from '../context/auth';
import TrackMenu from './TrackMenu';
import { 
  Typography, 
  Tooltip
} from '@mui/material';
import { useToast } from '../context/toast';
import {
  PlayArrow,
  Pause,
  AccessTime,
  Shuffle,
  Repeat,
  RepeatOne,
  MusicNote,
  PlayCircleFilled,
  MoreVert
} from '@mui/icons-material';
import type { Album as AlbumType, Playlist as PlaylistType, Track } from '../types/spotify';

interface MediaViewProps {
  id: string;
  type: 'album' | 'playlist';
  onBack: () => void;
  onTrackPlay?: (track: Track, source?: string) => void;
}

const MediaView: React.FC<MediaViewProps> = ({ id, type, onBack, onTrackPlay }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { play, pause, currentTrack, isPlaying, toggleShuffle, isShuffled, repeatMode, setRepeat } = usePlayer();
  const [mediaData, setMediaData] = useState<AlbumType | PlaylistType | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Track menu state
  const [trackMenuAnchor, setTrackMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const handleTrackMenuOpen = (event: React.MouseEvent<HTMLElement>, track: Track) => {
    event.stopPropagation();
    setTrackMenuAnchor(event.currentTarget);
    setSelectedTrack(track);
  };

  const handleTrackMenuClose = () => {
    setTrackMenuAnchor(null);
    setSelectedTrack(null);
  };

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
      const contextUri = (mediaData as any)?.uri;
      
      if (contextUri) {
        // If we have a context URI (album/playlist), use it
        if (isShuffled) {
           // If shuffled, just play the context. Spotify usually picks a random song or respects the shuffle state.
           await play({ context_uri: contextUri });
        } else {
           // If not shuffled, start from the beginning
           await play({ context_uri: contextUri, offset: { position: 0 } });
        }
      } else {
        // Fallback if no context URI (shouldn't happen for standard albums/playlists)
        // Just play the first track
        const firstTrack = tracks[0];
        await play(type === 'album' ? firstTrack : firstTrack.track);
      }

      // Notify parent if needed (using the first track as a placeholder)
      if (onTrackPlay) {
        const firstItem = tracks[0];
        const trackToReport = type === 'album' ? firstItem : firstItem?.track;
        if (trackToReport) {
          onTrackPlay(trackToReport, type);
        }
      }
    } catch (error) {
      console.error(`Failed to play ${type}:`, error);
      toast.showToast(`Unable to play ${type}. Make sure you have Spotify Premium and the Spotify app is open.`, 'error');
    }
  };

  const toggleRepeatMode = () => {
    const nextMode = repeatMode === 'off' ? 'context' : repeatMode === 'context' ? 'track' : 'off';
    setRepeat(nextMode);
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

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const getTrackFromItem = (item: any) => {
    return type === 'album' ? item : item.track;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="flex flex-col md:flex-row items-end gap-8">
          <div className="w-52 h-52 bg-white/10 rounded-lg shadow-2xl" />
          <div className="flex-1 space-y-4 mb-2">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-12 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <Typography variant="h5" className="text-red-400 font-bold mb-2">
          Oops! Something went wrong
        </Typography>
        <Typography className="text-gray-400 mb-6">
          {error}
        </Typography>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }


  if (!mediaData) return null;

  const totalDuration = tracks.reduce((acc, track) => {
    const t = getTrackFromItem(track);
    return acc + (t?.duration_ms || 0);
  }, 0);
  const formattedDuration = formatDuration(totalDuration);

  return (
    <div className="relative min-h-full pb-24">
      {/* Header Section */}
      <div className="relative pt-32 pb-8 px-12">
        {/* Background Gradient */}
        <div 
          className="absolute top-0 left-0 w-full h-[50vh] opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${getImage() ? 'var(--dominant-color, #4c1d95)' : '#4c1d95'}, transparent)`,
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-end">
          {/* Cover Image */}
          <div className="relative group shrink-0">
            <div className="w-52 h-52 shadow-2xl rounded-lg overflow-hidden relative">
              {getImage() ? (
                <img 
                  src={getImage()} 
                  alt={getTitle()} 
                  className="w-full h-full object-cover shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <MusicNote sx={{ fontSize: 64, opacity: 0.2 }} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={playAllTracks}
                  className="transform scale-90 group-hover:scale-100 transition-transform duration-200"
                >
                  <PlayCircleFilled sx={{ fontSize: 64, color: 'white' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 w-full">
            <span className="uppercase text-xs font-bold tracking-wider text-white/80">
              {type}
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
              {getTitle()}
            </h1>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                {getDescription() && (
                  <span className="text-white/60 line-clamp-1 max-w-2xl">
                    {getDescription()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/70 mt-2">
                <span className="font-bold text-white">
                  {type === 'playlist' ? (
                    <span 
                      className="hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const ownerId = (mediaData as PlaylistType).owner?.id;
                        if (ownerId) navigate(`/user/${ownerId}`);
                      }}
                    >
                      {(mediaData as PlaylistType).owner?.display_name}
                    </span>
                  ) : (
                    (mediaData as AlbumType).artists?.map((a, i) => (
                      <React.Fragment key={a.id || i}>
                        <span 
                          className="hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/artist/${a.id}`);
                          }}
                        >
                          {a.name}
                        </span>
                        {i < ((mediaData as AlbumType).artists?.length || 0) - 1 && ', '}
                      </React.Fragment>
                    ))
                  )}
                </span>
                <span>•</span>
                <span>{tracks.length} songs,</span>
                <span className="text-white/50">{formattedDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-12 py-6 flex items-center gap-6 sticky top-0 z-10 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={playAllTracks}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white hover:scale-105 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
        >
          <PlayArrow sx={{ fontSize: 32 }} />
        </button>

        <div className="flex items-center gap-4">
          <Tooltip title={isShuffled ? "Disable Shuffle" : "Enable Shuffle"}>
            <button 
              onClick={() => toggleShuffle()}
              className={`transition-colors ${isShuffled ? 'text-green-500' : 'text-white/50 hover:text-white'}`}
            >
              <Shuffle sx={{ fontSize: 32 }} />
            </button>
          </Tooltip>
          
          <Tooltip title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'context' ? 'All' : 'One'}`}>
            <button 
              onClick={toggleRepeatMode}
              className={`transition-colors ${repeatMode !== 'off' ? 'text-green-500' : 'text-white/50 hover:text-white'}`}
            >
              {repeatMode === 'track' ? (
                <RepeatOne sx={{ fontSize: 32 }} />
              ) : (
                <Repeat sx={{ fontSize: 32 }} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tracks List */}
      <div className="px-8 mt-4">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 text-sm font-medium text-white/50 border-b border-white/10 mb-4 uppercase tracking-wider">
          <div className="w-8 text-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="w-12 flex justify-center"><AccessTime sx={{ fontSize: 16 }} /></div>
          <div className="w-10"></div>
        </div>

        <div className="flex flex-col">
          {tracks.map((item, index) => {
            const track = getTrackFromItem(item);
            if (!track) return null;
            
            const isCurrentTrack = currentTrack?.id === track.id;
            const isCurrentlyPlaying = isCurrentTrack && isPlaying;
            
            return (
              <div 
                key={track.id}
                className={`
                  group grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 rounded-md items-center
                  hover:bg-white/10 transition-colors cursor-pointer
                  ${isCurrentTrack ? 'bg-white/10' : ''}
                `}
                onClick={() => handleTrackPlay(track, index)}
              >
                <div className="w-8 text-center flex justify-center items-center text-white/50 font-medium">
                  <span className="group-hover:hidden">
                    {isCurrentlyPlaying ? (
                      <img 
                        src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" 
                        alt="playing" 
                        className="w-3 h-3"
                      />
                    ) : (
                      <span className={isCurrentTrack ? 'text-green-500' : ''}>{index + 1}</span>
                    )}
                  </span>
                  <button className="hidden group-hover:block text-white">
                    {isCurrentlyPlaying ? <Pause sx={{ fontSize: 16 }} /> : <PlayArrow sx={{ fontSize: 16 }} />}
                  </button>
                </div>

                <div className="flex items-center gap-4 min-w-0">
                  {track.album?.images?.[0]?.url && (
                    <img 
                      src={track.album.images[0].url} 
                      alt="" 
                      className="w-10 h-10 rounded shadow-sm object-cover"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className={`truncate font-medium ${isCurrentTrack ? 'text-green-500' : 'text-white'}`}>
                      {track.name}
                    </span>
                    <span className="text-sm text-white/50 truncate group-hover:text-white/70 transition-colors">
                      {track.artists?.map((a: any, i: number) => (
                        <React.Fragment key={a.id || i}>
                          <span 
                            className="hover:underline hover:text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/artist/${a.id}`);
                            }}
                          >
                            {a.name}
                          </span>
                          {i < (track.artists?.length || 0) - 1 && ', '}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                </div>

                <div 
                  className="hidden md:block text-sm text-white/50 truncate hover:text-white transition-colors cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (track.album?.id) navigate(`/album/${track.album.id}`);
                  }}
                >
                  {track.album?.name}
                </div>

                <div className="w-12 text-center text-sm text-white/50 font-variant-numeric tabular-nums">
                  {formatDuration(track.duration_ms)}
                </div>

                {/* More Options Button */}
                <div className="w-10 flex justify-center">
                  <button
                    onClick={(e) => handleTrackMenuOpen(e, track)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white transition-all"
                  >
                    <MoreVert sx={{ fontSize: 20 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Track Menu */}
      <TrackMenu
        anchorEl={trackMenuAnchor}
        open={Boolean(trackMenuAnchor)}
        onClose={handleTrackMenuClose}
        track={selectedTrack}
        currentPlaylistId={type === 'playlist' ? id : undefined}
      />
    </div>
  );
};

export default MediaView;
