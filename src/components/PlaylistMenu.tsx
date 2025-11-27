/**
 * PlaylistMenu Component
 * Context menu for playlist actions: follow/unfollow, open in Spotify
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
  LibraryAdd,
  LibraryAddCheck,
  OpenInNew,
  PlayArrow,
  Share
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import type { Playlist } from '../types/spotify';
import {
  checkFollowingPlaylists,
  followPlaylist,
  unfollowPlaylist
} from '../services/libraryService';

interface PlaylistMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  onPlaylistFollowChanged?: (isFollowing: boolean) => void;
  onPlay?: () => void;
}

const PlaylistMenu: React.FC<PlaylistMenuProps> = ({
  anchorEl,
  open,
  onClose,
  playlist,
  onPlaylistFollowChanged,
  onPlay
}) => {
  const { token, user } = useAuth();
  const toast = useToast();
  
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Check if user follows this playlist when menu opens
  React.useEffect(() => {
    const checkFollow = async () => {
      if (!open || !playlist || !token || !user?.id) return;
      
      // User's own playlist is always "followed"
      if (playlist.owner?.id === user.id) {
        setIsFollowing(true);
        return;
      }
      
      setIsCheckingFollow(true);
      try {
        const result = await checkFollowingPlaylists(token, playlist.id, user.id);
        setIsFollowing(result);
      } catch (error) {
        console.error('Error checking playlist follow status:', error);
      } finally {
        setIsCheckingFollow(false);
      }
    };
    
    checkFollow();
  }, [open, playlist, token, user?.id]);

  const handleToggleFollow = async () => {
    if (!playlist || !token || isProcessing) return;
    
    // Can't unfollow own playlist through this menu
    if (playlist.owner?.id === user?.id) {
      toast.showToast("You can't unfollow your own playlist", 'info');
      onClose();
      return;
    }
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        const success = await unfollowPlaylist(token, playlist.id);
        if (success) {
          setIsFollowing(false);
          toast.showToast(`Removed "${playlist.name}" from Your Library`, 'success');
          onPlaylistFollowChanged?.(false);
        } else {
          toast.showToast('Failed to remove from library', 'error');
        }
      } else {
        const success = await followPlaylist(token, playlist.id);
        if (success) {
          setIsFollowing(true);
          toast.showToast(`Added "${playlist.name}" to Your Library`, 'success');
          onPlaylistFollowChanged?.(true);
        } else {
          toast.showToast('Failed to add to library', 'error');
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
    if (playlist?.external_urls?.spotify) {
      window.open(playlist.external_urls.spotify, '_blank', 'noopener,noreferrer');
    } else if (playlist?.id) {
      window.open(`https://open.spotify.com/playlist/${playlist.id}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleShare = async () => {
    const url = playlist?.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist?.name,
          text: `Check out this playlist: ${playlist?.name}`,
          url
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.showToast('Link copied to clipboard', 'success');
      } catch (error) {
        toast.showToast('Failed to copy link', 'error');
      }
    }
    onClose();
  };

  if (!playlist) return null;

  const isOwnPlaylist = playlist.owner?.id === user?.id;

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
      {/* Playlist info header */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }} noWrap>
          {playlist.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }} noWrap>
          {playlist.owner?.display_name || 'Spotify'} • {playlist.tracks?.total || 0} songs
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

      {/* Add/Remove from Library */}
      <MenuItem 
        onClick={handleToggleFollow}
        disabled={isCheckingFollow || isProcessing}
        sx={{
          color: isFollowing ? 'rgb(139,92,246)' : 'white',
          py: 0.75, px: 1.5, minHeight: 32,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          {isCheckingFollow ? (
            <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
          ) : isFollowing ? (
            <LibraryAddCheck sx={{ color: 'rgb(139,92,246)', fontSize: 18 }} />
          ) : (
            <LibraryAdd sx={{ color: 'white', fontSize: 18 }} />
          )}
        </ListItemIcon>
        <ListItemText 
          primary={
            isOwnPlaylist 
              ? 'In Your Library' 
              : isFollowing 
                ? 'Remove from Library' 
                : 'Add to Library'
          } 
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

export default PlaylistMenu;
