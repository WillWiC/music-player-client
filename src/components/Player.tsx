import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/player';
import { 
  Box, 
  CardMedia, 
  Typography, 
  IconButton, 
  Slider, 
  Stack,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  MusicNote,
  Shuffle,
  Repeat,
  RepeatOne,
  Devices,
  Computer,
  Smartphone,
  Speaker,
  Tv,
  Watch,
  
} from '@mui/icons-material';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    volume, 
    isShuffled,
    repeatMode,
    activeDeviceName,
    isRemotePlaying,
    availableDevices,
    togglePlay, 
    nextTrack, 
    previousTrack, 
    seek, 
    setVolume,
    toggleShuffle,
    setRepeat,
    getAvailableDevices,
    transferPlayback
  } = usePlayer();

  const [deviceMenuAnchor, setDeviceMenuAnchor] = React.useState<null | HTMLElement>(null);
  const deviceMenuOpen = Boolean(deviceMenuAnchor);

  // Handle device menu
  const handleDeviceMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDeviceMenuAnchor(event.currentTarget);
    getAvailableDevices(); // Refresh devices when opening menu
  };

  const handleDeviceMenuClose = () => {
    setDeviceMenuAnchor(null);
  };

  const handleDeviceSelect = async (deviceId: string) => {
    await transferPlayback(deviceId);
    handleDeviceMenuClose();
  };

  // Get device type icon
  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes('computer')) return <Computer sx={{ fontSize: 18 }} />;
    if (type.includes('smartphone')) return <Smartphone sx={{ fontSize: 18 }} />;
    if (type.includes('speaker')) return <Speaker sx={{ fontSize: 18 }} />;
    if (type.includes('tv')) return <Tv sx={{ fontSize: 18 }} />;
    if (type.includes('watch')) return <Watch sx={{ fontSize: 18 }} />;
    return <Devices sx={{ fontSize: 18 }} />;
  };

  // Handle clicking on the track to go to album
  const handleTrackClick = () => {
    if (currentTrack?.album?.id) {
      navigate(`/album/${currentTrack.album.id}`);
    }
  };

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle shuffle toggle
  const handleShuffleToggle = () => {
    toggleShuffle();
  };

  // Handle repeat mode cycling
  const handleRepeatToggle = () => {
    const modes: ('off' | 'context' | 'track')[] = ['off', 'context', 'track'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeat(nextMode);
  };

  // Get repeat icon based on current mode
  const getRepeatIcon = () => {
    if (repeatMode === 'track') return <RepeatOne />;
    return <Repeat />;
  };

  // Handle progress bar change
  const handleProgressChange = (_: Event, value: number | number[]) => {
    const newPosition = Array.isArray(value) ? value[0] : value;
    seek(newPosition);
  };

  // Handle volume change
  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const newVolume = (Array.isArray(value) ? value[0] : value) / 100;
    setVolume(newVolume);
  };

  // Get volume icon based on current volume
  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeOff />;
    if (volume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  if (!currentTrack) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(24, 24, 24, 0.72) 0%, rgba(18, 18, 18, 0.78) 100%)',
          backdropFilter: 'blur(32px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          p: { xs: 1.5, md: 2 },
          zIndex: (theme) => theme.zIndex.drawer + 10,
          isolation: 'isolate',
          transform: 'translateZ(0)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(0, 0, 0, 0.25)'
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Avatar sx={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)', 
              width: 40, 
              height: 40,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
            }}>
              <MusicNote sx={{ fontSize: 20, color: '#b3b3b3' }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ 
                color: '#ffffff', 
                fontWeight: 600,
                mb: 0.3,
                fontSize: '0.8rem',
                lineHeight: 1.2
              }}>
                No track playing
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#b3b3b3',
                fontSize: '0.7rem',
                opacity: 0.9
              }}>
                Connect to a device and play a song
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
  background: 'linear-gradient(180deg, rgba(24, 24, 24, 0.72) 0%, rgba(18, 18, 18, 0.78) 100%)',
  backdropFilter: 'blur(32px) saturate(180%)',
        borderTop: isRemotePlaying 
          ? '2px solid rgba(251, 146, 60, 0.35)' 
          : '1px solid rgba(255, 255, 255, 0.06)',
  p: { xs: 1.5, md: 2 },
  zIndex: (theme) => theme.zIndex.drawer + 10,
        isolation: 'isolate',
        transform: 'translateZ(0)',
        boxShadow: isRemotePlaying
          ? '0 -8px 32px rgba(251, 146, 60, 0.08), 0 -4px 16px rgba(0, 0, 0, 0.4)'
          : '0 -8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.95 },
          '100%': { opacity: 1 }
        },
        '@keyframes remoteGlow': {
          '0%': { 
            borderTopColor: 'rgba(251, 146, 60, 0.25)',
            boxShadow: '0 -8px 32px rgba(251, 146, 60, 0.06), 0 -4px 16px rgba(0, 0, 0, 0.4)'
          },
          '50%': { 
            borderTopColor: 'rgba(251, 146, 60, 0.4)',
            boxShadow: '0 -8px 32px rgba(251, 146, 60, 0.12), 0 -4px 16px rgba(0, 0, 0, 0.4)'
          },
          '100%': { 
            borderTopColor: 'rgba(251, 146, 60, 0.25)',
            boxShadow: '0 -8px 32px rgba(251, 146, 60, 0.06), 0 -4px 16px rgba(0, 0, 0, 0.4)'
          }
        },
        animation: isRemotePlaying ? 'remoteGlow 4s infinite ease-in-out' : 'none'
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }}>
          {/* Track Info */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ 
            minWidth: 0, 
            width: { xs: 180, md: 240, lg: 260 },
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 2,
            p: { xs: 1, md: 1.5 },
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <CardMedia
              component="img"
              image={currentTrack.album?.images?.[0]?.url || '/vite.svg'}
              alt={`${currentTrack.name} cover`}
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 1.5,
                boxShadow: isRemotePlaying 
                  ? '0 6px 24px rgba(251, 146, 60, 0.25), 0 3px 12px rgba(0, 0, 0, 0.5)'
                  : '0 6px 24px rgba(29, 185, 84, 0.2), 0 3px 12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                border: isRemotePlaying 
                  ? '2px solid rgba(251, 146, 60, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                cursor: 'pointer',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: isRemotePlaying 
                    ? '0 8px 32px rgba(251, 146, 60, 0.35), 0 4px 16px rgba(0, 0, 0, 0.6)'
                    : '0 8px 32px rgba(29, 185, 84, 0.3), 0 4px 16px rgba(0, 0, 0, 0.6)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -1,
                  borderRadius: 'inherit',
                  background: isRemotePlaying 
                    ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(251, 146, 60, 0.1))'
                    : 'linear-gradient(135deg, rgba(29, 185, 84, 0.2), rgba(29, 185, 84, 0.05))',
                  zIndex: -1,
                  opacity: isPlaying ? 1 : 0.6,
                  animation: isPlaying ? 'pulse 3s infinite ease-in-out' : 'none',
                  filter: 'blur(6px)'
                },
                '&::after': isRemotePlaying ? {
                  content: '"🎵"',
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  fontSize: 12,
                  backgroundColor: 'rgba(251, 146, 60, 0.95)',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(24, 24, 24, 0.8)',
                  animation: isPlaying ? 'pulse 2s infinite ease-in-out' : 'none',
                  boxShadow: '0 2px 8px rgba(251, 146, 60, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                } : {}
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                onClick={handleTrackClick}
                sx={{ 
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: { xs: '0.8rem', md: '0.85rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  '&:hover': { 
                    color: isRemotePlaying ? '#fb923c' : '#1db954',
                    textShadow: isRemotePlaying 
                      ? '0 0 8px rgba(251, 146, 60, 0.4)' 
                      : '0 0 8px rgba(29, 185, 84, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  mb: 0.5
                }}
              >
                {currentTrack.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#b3b3b3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: '#ffffff'
                  }
                }}
              >
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </Typography>
              {isRemotePlaying && activeDeviceName && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#fb923c',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                    backgroundColor: 'rgba(251, 146, 60, 0.12)',
                    borderRadius: 1.5,
                    px: 0.8,
                    py: 0.3,
                    fontWeight: 600,
                    boxShadow: 'inset 0 1px 2px rgba(251, 146, 60, 0.2), 0 2px 6px rgba(251, 146, 60, 0.15)',
                    border: '1px solid rgba(251, 146, 60, 0.25)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <Devices sx={{ fontSize: 10 }} />
                  Playing on {activeDeviceName}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Controls */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={0.8}
            sx={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 2.5,
              p: { xs: 1, md: 1.5 },
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Shuffle Button */}
            <IconButton 
              onClick={handleShuffleToggle}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffled}
              sx={{ 
                color: isShuffled 
                  ? (isRemotePlaying ? 'warning.main' : 'primary.main')
                  : 'text.secondary',
                background: isShuffled 
                  ? (isRemotePlaying 
                      ? 'rgba(251, 146, 60, 0.15)' 
                      : 'rgba(34, 197, 94, 0.15)')
                  : 'transparent',
                '&:hover': { 
                  color: isShuffled 
                    ? (isRemotePlaying ? 'warning.light' : 'primary.light')
                    : 'text.primary',
                  transform: 'scale(1.05)',
                  background: isShuffled 
                    ? (isRemotePlaying 
                        ? 'rgba(251, 146, 60, 0.25)' 
                        : 'rgba(34, 197, 94, 0.25)')
                    : 'rgba(255, 255, 255, 0.05)'
                },
                transition: 'all 0.2s ease',
                width: 30,
                height: 30
              }}
              title={`Toggle shuffle ${isRemotePlaying ? `(controlling ${activeDeviceName})` : ''}`}
            >
              <Shuffle sx={{ fontSize: 16 }} />
            </IconButton>

            <IconButton 
              onClick={previousTrack}
              aria-label="Previous track"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'text.primary',
                  transform: 'scale(1.05)',
                  background: 'rgba(255, 255, 255, 0.05)'
                },
                transition: 'all 0.2s ease',
                width: 34,
                height: 34
              }}
              title={`Previous track ${isRemotePlaying ? `(controlling ${activeDeviceName})` : ''}`}
            >
              <SkipPrevious sx={{ fontSize: 20 }} />
            </IconButton>

            <IconButton 
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              sx={{
                background: isRemotePlaying 
                  ? 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)'
                  : 'linear-gradient(135deg, #1db954 0%, #1ed760 50%, #169c46 100%)',
                color: '#ffffff',
                width: { xs: 38, md: 42 },
                height: { xs: 38, md: 42 },
                '&:hover': {
                  background: isRemotePlaying 
                    ? 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #169c46 0%, #15803d 50%, #14532d 100%)',
                  transform: 'scale(1.05)',
                  boxShadow: isRemotePlaying
                    ? '0 6px 24px rgba(251, 146, 60, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                    : '0 6px 24px rgba(29, 185, 84, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                },
                transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                boxShadow: isRemotePlaying
                  ? '0 3px 16px rgba(251, 146, 60, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15)'
                  : '0 3px 16px rgba(29, 185, 84, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
                mx: 0.8,
                '&:active': {
                  transform: 'scale(0.98)'
                },
                border: isRemotePlaying 
                  ? '1px solid rgba(251, 146, 60, 0.3)'
                  : '1px solid rgba(29, 185, 84, 0.3)'
              }}
              title={isRemotePlaying 
                ? `${isPlaying ? 'Pause' : 'Play'} (controlling ${activeDeviceName})`
                : `${isPlaying ? 'Pause' : 'Play'}`
              }
            >
              {isPlaying ? <Pause sx={{ fontSize: { xs: 20, md: 22 } }} /> : <PlayArrow sx={{ fontSize: { xs: 20, md: 22 } }} />}
            </IconButton>

            <IconButton 
              onClick={nextTrack}
              aria-label="Next track"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'text.primary',
                  transform: 'scale(1.05)',
                  background: 'rgba(255, 255, 255, 0.05)'
                },
                transition: 'all 0.2s ease',
                width: 34,
                height: 34
              }}
              title={`Next track ${isRemotePlaying ? `(controlling ${activeDeviceName})` : ''}`}
            >
              <SkipNext sx={{ fontSize: 20 }} />
            </IconButton>

            {/* Repeat Button */}
            <IconButton 
              onClick={handleRepeatToggle}
              aria-label={`Repeat mode: ${repeatMode}`}
              aria-pressed={repeatMode !== 'off'}
              sx={{ 
                color: repeatMode !== 'off' 
                  ? (isRemotePlaying ? 'warning.main' : 'primary.main')
                  : 'text.secondary',
                background: repeatMode !== 'off' 
                  ? (isRemotePlaying 
                      ? 'rgba(251, 146, 60, 0.15)' 
                      : 'rgba(34, 197, 94, 0.15)')
                  : 'transparent',
                '&:hover': { 
                  color: repeatMode !== 'off' 
                    ? (isRemotePlaying ? 'warning.light' : 'primary.light')
                    : 'text.primary',
                  transform: 'scale(1.05)',
                  background: repeatMode !== 'off' 
                    ? (isRemotePlaying 
                        ? 'rgba(251, 146, 60, 0.25)' 
                        : 'rgba(34, 197, 94, 0.25)')
                    : 'rgba(255, 255, 255, 0.05)'
                },
                transition: 'all 0.2s ease',
                width: 30,
                height: 30
              }}
              title={`Repeat: ${repeatMode} ${isRemotePlaying ? `(controlling ${activeDeviceName})` : ''}`}
            >
              {getRepeatIcon()}
            </IconButton>
          </Stack>

          {/* Progress Section */}
          <Box sx={{ 
            flex: 1, 
            mx: { xs: 1.5, md: 2 },
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 2,
            p: { xs: 1, md: 1.5 },
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)'
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ 
                color: '#b3b3b3', 
                fontFamily: 'monospace', 
                minWidth: { xs: 32, md: 36 },
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                {formatTime(position)}
              </Typography>
              <Slider
                value={duration > 0 ? position : 0}
                max={duration}
                onChange={handleProgressChange}
                sx={{
                  flex: 1,
                  height: 5,
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                    backgroundColor: isRemotePlaying ? '#fb923c' : '#1db954',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: isRemotePlaying 
                      ? '0 3px 16px rgba(251, 146, 60, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                      : '0 3px 16px rgba(29, 185, 84, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
                    '&:before': {
                      boxShadow: 'none'
                    },
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: isRemotePlaying
                        ? '0px 0px 0px 8px rgba(251, 146, 60, 0.12), 0 3px 16px rgba(251, 146, 60, 0.5)'
                        : '0px 0px 0px 8px rgba(29, 185, 84, 0.12), 0 3px 16px rgba(29, 185, 84, 0.5)',
                    },
                    '&.Mui-active': {
                      width: 16,
                      height: 16,
                    },
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.4,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '3px'
                  },
                  '& .MuiSlider-track': {
                    background: isRemotePlaying
                      ? 'linear-gradient(90deg, #fb923c 0%, #f97316 50%, #ea580c 100%)'
                      : 'linear-gradient(90deg, #1db954 0%, #1ed760 50%, #169c46 100%)',
                    border: 'none',
                    borderRadius: '3px',
                    boxShadow: isRemotePlaying
                      ? '0 2px 6px rgba(251, 146, 60, 0.3)'
                      : '0 2px 6px rgba(29, 185, 84, 0.3)'
                  },
                }}
                title={isRemotePlaying ? `Seek (controlling ${activeDeviceName})` : 'Seek'}
              />
              <Typography variant="body2" sx={{ 
                color: '#b3b3b3', 
                fontFamily: 'monospace', 
                minWidth: { xs: 32, md: 36 },
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                {formatTime(duration)}
              </Typography>
            </Stack>
          </Box>

          {/* Volume Control & Device Selection */}
          <Stack 
            direction="row" 
            spacing={0.8} 
            alignItems="center" 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              minWidth: { md: 140, lg: 160 },
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 2,
              p: { xs: 1, md: 1.5 },
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Device Selection */}
            <IconButton 
              onClick={handleDeviceMenuClick}
              sx={{ 
                color: isRemotePlaying ? 'warning.main' : 'text.secondary',
                background: isRemotePlaying ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
                '&:hover': { 
                  color: isRemotePlaying ? 'warning.light' : 'text.primary',
                  background: isRemotePlaying ? 'rgba(251, 146, 60, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  transform: 'scale(1.03)'
                },
                transition: 'all 0.2s ease',
                width: 30,
                height: 30
              }} 
              aria-label="Select device"
              title={activeDeviceName || 'Select device'}
            >
              <Devices sx={{ fontSize: 16 }} />
            </IconButton>

            <Menu
              anchorEl={deviceMenuAnchor}
              open={deviceMenuOpen}
              onClose={handleDeviceMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              disableScrollLock={true}
              disablePortal={true}
              PaperProps={{
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  mt: 0.5,
                  minWidth: 250,
                  p: 0.5,
                  ml: '6px'
                }
              }}
            >
              {availableDevices.length === 0 ? (
                <MenuItem disabled sx={{ py: 1.25, px: 1.5 }}>
                  <ListItemText
                    primary="No devices found"
                    secondary="Make sure your devices are online"
                    secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                  />
                </MenuItem>
              ) : (
                availableDevices.map((device) => (
                  <MenuItem
                    key={device.id}
                    onClick={() => handleDeviceSelect(device.id)}
                    sx={{ py: 1.25, px: 1.25, gap: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      {getDeviceIcon(device.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={device.name}
                      secondary={device.is_active ? 'Active' : device.type}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                    />
                  </MenuItem>
                ))
              )}
            </Menu>

            <IconButton 
              sx={{ 
                color: isRemotePlaying ? 'warning.main' : 'text.secondary',
                '&:hover': { 
                  color: isRemotePlaying ? 'warning.light' : 'text.primary',
                  background: 'rgba(255, 255, 255, 0.05)',
                  transform: 'scale(1.03)'
                },
                transition: 'all 0.2s ease',
                width: 30,
                height: 30
              }} 
              aria-label="Volume"
              title={isRemotePlaying ? `Volume (controlling ${activeDeviceName})` : 'Volume'}
            >
              {getVolumeIcon()}
            </IconButton>
            <Slider
              value={volume * 100}
              onChange={handleVolumeChange}
              aria-label="Volume"
              sx={{
                width: { md: 70, lg: 85 },
                height: 4,
                '& .MuiSlider-thumb': {
                  width: 10,
                  height: 10,
                  backgroundColor: isRemotePlaying ? '#f97316' : '#22c55e',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  '&:before': {
                    boxShadow: isRemotePlaying
                      ? '0 3px 12px rgba(249, 115, 22, 0.6)'
                      : '0 3px 12px rgba(34, 197, 94, 0.6)',
                  },
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: isRemotePlaying
                      ? '0px 0px 0px 6px rgba(249, 115, 22, 0.16), 0 3px 12px rgba(249, 115, 22, 0.4)'
                      : '0px 0px 0px 6px rgba(34, 197, 94, 0.16), 0 3px 12px rgba(34, 197, 94, 0.4)',
                  },
                },
                '& .MuiSlider-track': {
                  background: isRemotePlaying 
                    ? 'linear-gradient(90deg, #f97316, #ea580c)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                  border: 'none',
                  boxShadow: isRemotePlaying
                    ? '0 1px 4px rgba(249, 115, 22, 0.3)'
                    : '0 1px 4px rgba(34, 197, 94, 0.3)'
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity: 0.4
                }
              }}
              title={isRemotePlaying ? `Volume (controlling ${activeDeviceName})` : 'Volume'}
            />
            <Typography variant="caption" sx={{ 
              color: 'text.secondary', 
              fontFamily: 'monospace', 
              minWidth: 28,
              fontSize: '0.7rem',
              fontWeight: 600
            }}>
              {Math.round(volume * 100)}%
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Player;
