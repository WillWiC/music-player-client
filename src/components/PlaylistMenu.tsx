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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import {
  LibraryAdd,
  LibraryAddCheck,
  OpenInNew,
  PlayArrow,
  Share,
  Edit,
  Delete,
  ContentCopy
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import type { Playlist } from '../types/spotify';
import {
  checkFollowingPlaylists,
  followPlaylist,
  unfollowPlaylist,
  createPlaylist,
  addTracksToPlaylist
} from '../services/libraryService';

interface PlaylistMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  onPlaylistFollowChanged?: (isFollowing: boolean) => void;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PlaylistMenu: React.FC<PlaylistMenuProps> = ({
  anchorEl,
  open,
  onClose,
  playlist,
  onPlaylistFollowChanged,
  onPlay,
  onEdit,
  onDelete
}) => {
  const { token, user } = useAuth();
  const toast = useToast();
  
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  // Create playlist dialog state
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = React.useState(false);

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

  const handleOpenCreateDialog = () => {
    setShowCreateDialog(true);
    setNewPlaylistName(playlist?.name ? `${playlist.name} (Copy)` : '');
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setNewPlaylistName('');
  };

  const handleCopyToNewPlaylist = async () => {
    if (!playlist || !token || !user?.id || !newPlaylistName.trim() || isCreatingPlaylist) return;
    
    setIsCreatingPlaylist(true);
    try {
      // Create the new playlist
      const newPlaylist = await createPlaylist(
        token, 
        user.id, 
        newPlaylistName.trim(),
        `Copied from "${playlist.name}"`
      );
      
      if (newPlaylist) {
        // Fetch all tracks from the original playlist
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          const trackUris = tracksData.items
            .filter((item: any) => item.track && item.track.uri)
            .map((item: any) => item.track.uri);
          
          if (trackUris.length > 0) {
            const success = await addTracksToPlaylist(token, newPlaylist.id, trackUris);
            
            if (success) {
              toast.showToast(`Created "${newPlaylist.name}" with ${trackUris.length} tracks`, 'success');
            } else {
              toast.showToast(`Created "${newPlaylist.name}" but failed to add some tracks`, 'warning');
            }
          } else {
            toast.showToast(`Created empty playlist "${newPlaylist.name}"`, 'success');
          }
        } else {
          toast.showToast(`Created "${newPlaylist.name}" but couldn't copy tracks`, 'warning');
        }
      } else {
        toast.showToast('Failed to create playlist', 'error');
      }
    } catch (error) {
      console.error('Error copying playlist:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsCreatingPlaylist(false);
      setShowCreateDialog(false);
      setNewPlaylistName('');
      onClose();
    }
  };

  if (!playlist) return null;

  const isOwnPlaylist = playlist.owner?.id === user?.id;

  return (
    <>
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1.5,
          width: 220,
          maxWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          py: 0.5
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Playlist info header */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', maxWidth: '100%', overflow: 'hidden' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'white', 
            fontWeight: 600, 
            fontSize: '0.8rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {playlist.name}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary', 
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block'
          }}
        >
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

      {/* Copy to New Playlist */}
      <MenuItem 
        onClick={handleOpenCreateDialog}
        sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(34,197,94,0.1)' } }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          <ContentCopy sx={{ color: 'rgb(34,197,94)', fontSize: 18 }} />
        </ListItemIcon>
        <ListItemText 
          primary="Copy to New Playlist" 
          primaryTypographyProps={{ fontSize: '0.8rem', color: 'rgb(34,197,94)' }} 
        />
      </MenuItem>

      {/* Edit Details - only for own playlists */}
      {isOwnPlaylist && onEdit && (
        <MenuItem 
          onClick={() => { onEdit(); onClose(); }}
          sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Edit sx={{ color: 'white', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary="Edit Details" primaryTypographyProps={{ fontSize: '0.8rem' }} />
        </MenuItem>
      )}

      {/* Delete Playlist - only for own playlists */}
      {isOwnPlaylist && onDelete && (
        <MenuItem 
          onClick={() => { onDelete(); onClose(); }}
          sx={{ color: 'rgb(239,68,68)', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Delete sx={{ color: 'rgb(239,68,68)', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary="Delete Playlist" primaryTypographyProps={{ fontSize: '0.8rem' }} />
        </MenuItem>
      )}

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

    {/* Create Playlist Dialog */}
    <Dialog
      open={showCreateDialog}
      onClose={handleCloseCreateDialog}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          width: 300,
          maxWidth: '90vw'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', pb: 1, fontSize: '1rem' }}>
        Copy to New Playlist
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Playlist name"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newPlaylistName.trim()) {
              handleCopyToNewPlaylist();
            }
          }}
          size="small"
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused fieldset': { borderColor: 'rgb(34,197,94)' }
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.5)'
            }
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
          {playlist?.tracks?.total || 0} songs will be copied
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button 
          onClick={handleCloseCreateDialog}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCopyToNewPlaylist}
          disabled={!newPlaylistName.trim() || isCreatingPlaylist}
          variant="contained"
          size="small"
          sx={{
            bgcolor: 'rgb(34,197,94)',
            '&:hover': { bgcolor: 'rgb(22,163,74)' },
            '&.Mui-disabled': { bgcolor: 'rgba(34,197,94,0.3)' }
          }}
        >
          {isCreatingPlaylist ? (
            <CircularProgress size={18} sx={{ color: 'white' }} />
          ) : (
            'Copy'
          )}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default PlaylistMenu;
