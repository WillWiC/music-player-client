/**
 * ArtistMenu Component
 * Context menu for artist actions: follow/unfollow, open in Spotify
 */

import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  OpenInNew,
  PlayArrow,
  Share
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { useLibrary } from '../context/library';
import type { Artist } from '../types/spotify';
import {
  checkFollowingArtists,
  followArtist,
  unfollowArtist
} from '../services/libraryService';

interface ArtistMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  artist: Artist | null;
  onArtistFollowChanged?: (isFollowing: boolean) => void;
  onPlay?: () => void;
}

const ArtistMenu: React.FC<ArtistMenuProps> = ({
  anchorEl,
  open,
  onClose,
  artist,
  onArtistFollowChanged,
  onPlay
}) => {
  const { token } = useAuth();
  const toast = useToast();
  const { addArtistOptimistic, removeArtistOptimistic, refreshArtists } = useLibrary();
  
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Check if following artist when menu opens
  React.useEffect(() => {
    const checkFollow = async () => {
      if (!open || !artist || !token) return;
      
      setIsCheckingFollow(true);
      try {
        const results = await checkFollowingArtists(token, [artist.id]);
        setIsFollowing(results[0] ?? false);
      } catch (error) {
        console.error('Error checking artist follow status:', error);
      } finally {
        setIsCheckingFollow(false);
      }
    };
    
    checkFollow();
  }, [open, artist, token]);

  const handleToggleFollow = async () => {
    if (!artist || !token || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        const success = await unfollowArtist(token, artist.id);
        if (success) {
          setIsFollowing(false);
          // Optimistically update library cache
          removeArtistOptimistic(artist.id);
          toast.showToast(`Unfollowed "${artist.name}"`, 'success');
          onArtistFollowChanged?.(false);
          // Delay refresh to allow Spotify API to propagate the change
          setTimeout(() => refreshArtists(), 1500);
        } else {
          toast.showToast('Failed to unfollow artist', 'error');
        }
      } else {
        const success = await followArtist(token, artist.id);
        if (success) {
          setIsFollowing(true);
          // Optimistically update library cache
          addArtistOptimistic(artist);
          toast.showToast(`Following "${artist.name}"`, 'success');
          onArtistFollowChanged?.(true);
          // Delay refresh to allow Spotify API to propagate the change
          setTimeout(() => refreshArtists(), 1500);
        } else {
          toast.showToast('Failed to follow artist', 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsProcessing(false);
    }
    onClose();
  };

  const handlePlay = () => {
    onPlay?.();
    onClose();
  };

  const handleOpenInSpotify = () => {
    if (artist?.external_urls?.spotify) {
      window.open(artist.external_urls.spotify, '_blank', 'noopener,noreferrer');
    } else if (artist?.id) {
      window.open(`https://open.spotify.com/artist/${artist.id}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleShare = async () => {
    const url = artist?.external_urls?.spotify || `https://open.spotify.com/artist/${artist?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: artist?.name,
          text: `Check out this artist: ${artist?.name}`,
          url
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.showToast('Link copied to clipboard', 'success');
      } catch (error) {
        toast.showToast('Failed to copy link', 'error');
      }
    }
    onClose();
  };

  // Format follower count
  const formatFollowers = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M followers`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K followers`;
    return `${count} followers`;
  };

  if (!artist) return null;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1.5,
          minWidth: 180,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          py: 0.5
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Artist info header */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }} noWrap>
          {artist.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }} noWrap>
          {formatFollowers(artist.followers?.total) || 'Artist'}
        </Typography>
      </Box>

      {/* Play */}
      {onPlay && (
        <MenuItem 
          onClick={handlePlay}
          sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PlayArrow sx={{ color: 'rgb(34,197,94)', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary="Play" primaryTypographyProps={{ fontSize: '0.8rem' }} />
        </MenuItem>
      )}

      {/* Follow/Unfollow */}
      <MenuItem 
        onClick={handleToggleFollow}
        disabled={isCheckingFollow || isProcessing}
        sx={{
          color: isFollowing ? 'rgb(34,197,94)' : 'white',
          py: 0.75, px: 1.5, minHeight: 32,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          {isCheckingFollow ? (
            <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
          ) : isFollowing ? (
            <PersonRemove sx={{ color: 'rgb(34,197,94)', fontSize: 18 }} />
          ) : (
            <PersonAdd sx={{ color: 'white', fontSize: 18 }} />
          )}
        </ListItemIcon>
        <ListItemText 
          primary={isFollowing ? 'Unfollow' : 'Follow'} 
          primaryTypographyProps={{ fontSize: '0.8rem' }}
        />
      </MenuItem>

      {/* Share */}
      <MenuItem 
        onClick={handleShare}
        sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          <Share sx={{ color: 'white', fontSize: 18 }} />
        </ListItemIcon>
        <ListItemText primary="Share" primaryTypographyProps={{ fontSize: '0.8rem' }} />
      </MenuItem>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.25 }} />

      {/* Open in Spotify */}
      <MenuItem 
        onClick={handleOpenInSpotify}
        sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          <OpenInNew sx={{ color: 'white', fontSize: 18 }} />
        </ListItemIcon>
        <ListItemText primary="Open in Spotify" primaryTypographyProps={{ fontSize: '0.8rem' }} />
      </MenuItem>
    </Menu>
  );
};

export default ArtistMenu;
