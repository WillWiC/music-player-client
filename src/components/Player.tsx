import React from 'react';
import { usePlayer } from '../context/player';
import { 
  Box, 
  CardMedia, 
  Typography, 
  IconButton, 
  Slider, 
  Stack,
  Avatar,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  MusicNote
} from '@mui/icons-material';

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    volume, 
    togglePlay, 
    nextTrack, 
    previousTrack, 
    seek, 
    setVolume 
  } = usePlayer();

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          p: 2,
          zIndex: 50
        }}
      >
        <Box sx={{ maxWidth: '1200px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Avatar sx={{ bgcolor: 'grey.800' }}>
              <MusicNote />
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
        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Slider
            value={duration > 0 ? position : 0}
            max={duration}
            onChange={handleProgressChange}
            sx={{
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
        </Box>

        <Stack direction="row" alignItems="center" spacing={3}>
          {/* Track Info */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <CardMedia
              component="img"
              image={currentTrack.album?.images?.[0]?.url}
              alt={`${currentTrack.name} cover`}
              sx={{
                width: 48,
                height: 48,
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
                  whiteSpace: 'nowrap'
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
                  display: 'block'
                }}
              >
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${formatTime(position)} / ${formatTime(duration)}`}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </Box>
          </Stack>

          {/* Controls */}
          <Stack direction="row" alignItems="center" spacing={1}>
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
              <SkipPrevious />
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
                boxShadow: 2
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
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
              <SkipNext />
            </IconButton>
          </Stack>

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
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', minWidth: 24 }}>
              {Math.round(volume * 100)}%
            </Typography>
          </Stack>

          {/* Mobile Time Display */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
            <Chip 
              label={`${formatTime(position)} / ${formatTime(duration)}`}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: 'text.secondary',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Player;
