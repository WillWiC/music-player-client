import React from 'react';
import { usePlayer } from '../context/player';
import { 
  Box, 
  CardMedia, 
  Typography, 
  IconButton, 
  Slider, 
  Stack,
  Avatar
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
  RepeatOne
} from '@mui/icons-material';

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    volume, 
    isShuffled,
    repeatMode,
    togglePlay, 
    nextTrack, 
    previousTrack, 
    seek, 
    setVolume,
    toggleShuffle,
    setRepeat
  } = usePlayer();

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
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          p: 1.5,
          zIndex: 50
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Avatar sx={{ bgcolor: 'grey.800', width: 48, height: 48 }}>
              <MusicNote sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.primary' }}>No track playing</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Play a song to see controls here</Typography>
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
        bgcolor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        p: 2,
        zIndex: 50
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          {/* Track Info */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, width: 280 }}>
            <CardMedia
              component="img"
              image={currentTrack.album?.images?.[0]?.url}
              alt={`${currentTrack.name} cover`}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1,
                boxShadow: 2
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block'
                }}
              >
                {currentTrack.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  fontSize: '0.75rem'
                }}
              >
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </Typography>
            </Box>
          </Stack>

          {/* Controls */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Shuffle Button */}
            <IconButton 
              onClick={handleShuffleToggle}
              sx={{ 
                color: isShuffled ? 'primary.main' : 'text.secondary',
                '&:hover': { 
                  color: isShuffled ? 'primary.light' : 'text.primary',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
              title="Toggle shuffle"
            >
              <Shuffle sx={{ fontSize: 20 }} />
            </IconButton>

            <IconButton 
              onClick={previousTrack}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'text.primary',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <SkipPrevious sx={{ fontSize: 28 }} />
            </IconButton>

            <IconButton 
              onClick={togglePlay}
              sx={{
                bgcolor: 'primary.main',
                color: 'black',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: 'primary.light',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease',
                boxShadow: 2,
                mx: 1
              }}
            >
              {isPlaying ? <Pause sx={{ fontSize: 24 }} /> : <PlayArrow sx={{ fontSize: 24 }} />}
            </IconButton>

            <IconButton 
              onClick={nextTrack}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'text.primary',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <SkipNext sx={{ fontSize: 28 }} />
            </IconButton>

            {/* Repeat Button */}
            <IconButton 
              onClick={handleRepeatToggle}
              sx={{ 
                color: repeatMode !== 'off' ? 'primary.main' : 'text.secondary',
                '&:hover': { 
                  color: repeatMode !== 'off' ? 'primary.light' : 'text.primary',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
              title={`Repeat: ${repeatMode}`}
            >
              {getRepeatIcon()}
            </IconButton>
          </Stack>

          {/* Progress Section */}
          <Box sx={{ flex: 1, mx: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace', minWidth: 40 }}>
                {formatTime(position)}
              </Typography>
              <Slider
                value={duration > 0 ? position : 0}
                max={duration}
                onChange={handleProgressChange}
                sx={{
                  flex: 1,
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                    '&:before': {
                      boxShadow: '0 2px 12px 0 rgba(34,197,94,0.4)',
                    },
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(34,197,94,0.16)',
                    },
                    '&.Mui-active': {
                      width: 16,
                      height: 16,
                    },
                  },
                  '& .MuiSlider-rail': {
                    opacity: 0.28,
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace', minWidth: 40 }}>
                {formatTime(duration)}
              </Typography>
            </Stack>
          </Box>

          {/* Volume Control */}
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center" 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              minWidth: 120
            }}
          >
            <IconButton sx={{ color: 'text.secondary' }}>
              {getVolumeIcon()}
            </IconButton>
            <Slider
              value={volume * 100}
              onChange={handleVolumeChange}
              sx={{
                width: 80,
                '& .MuiSlider-thumb': {
                  width: 8,
                  height: 8,
                  '&:before': {
                    boxShadow: '0 2px 12px 0 rgba(34,197,94,0.4)',
                  },
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0px 0px 0px 8px rgba(34,197,94,0.16)',
                  },
                },
                '& .MuiSlider-track': {
                  bgcolor: 'primary.main',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', minWidth: 28 }}>
              {Math.round(volume * 100)}%
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Player;
