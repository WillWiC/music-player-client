/**
 * TrackMenu Component
 * Context menu for track actions: like/unlike, add to playlist, remove from playlist
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
  Favorite,
  FavoriteBorder,
  PlaylistAdd,
  PlaylistRemove,
  QueueMusic,
  OpenInNew,
  Add
} from '@mui/icons-material';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { useLibrary } from '../context/library';
import type { Track, Playlist } from '../types/spotify';
import {
  checkSavedTracks,
  saveTrack,
  removeTrack,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getUserPlaylists,
  createPlaylist
} from '../services/libraryService';

interface TrackMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  track: Track | null;
  currentPlaylistId?: string; // If provided, shows "Remove from this playlist" option
  onTrackRemoved?: () => void; // Callback when track is removed from playlist
}

const TrackMenu: React.FC<TrackMenuProps> = ({
  anchorEl,
  open,
  onClose,
  track,
  currentPlaylistId,
  onTrackRemoved
}) => {
  const { token, user } = useAuth();
  const toast = useToast();
  const { addTrackOptimistic, removeTrackOptimistic, refreshTracks, refreshPlaylists } = useLibrary();
  
  const [isLiked, setIsLiked] = React.useState(false);
  const [isCheckingLiked, setIsCheckingLiked] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = React.useState(false);
  const [userPlaylists, setUserPlaylists] = React.useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [playlistAnchorEl, setPlaylistAnchorEl] = React.useState<HTMLElement | null>(null);
  
  // Create playlist dialog state
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = React.useState(false);

  // Check if track is liked when menu opens
  React.useEffect(() => {
    const checkLiked = async () => {
      if (!open || !track || !token) return;
      
      setIsCheckingLiked(true);
      try {
        const results = await checkSavedTracks(token, [track.id]);
        setIsLiked(results[0] ?? false);
      } catch (error) {
        console.error('Error checking if track is liked:', error);
      } finally {
        setIsCheckingLiked(false);
      }
    };
    
    checkLiked();
  }, [open, track, token]);

  // Load user playlists when submenu opens
  const handleShowPlaylists = async (event: React.MouseEvent<HTMLElement>) => {
    setPlaylistAnchorEl(event.currentTarget);
    setShowPlaylistSubmenu(true);
    
    if (userPlaylists.length === 0) {
      setLoadingPlaylists(true);
      try {
        const playlists = await getUserPlaylists(token || '');
        // Filter to only show user's own playlists (can add tracks to)
        const ownPlaylists = playlists.filter((p: any) => p.owner?.id === user?.id);
        setUserPlaylists(ownPlaylists);
      } catch (error) {
        console.error('Error loading playlists:', error);
        toast.showToast('Failed to load playlists', 'error');
      } finally {
        setLoadingPlaylists(false);
      }
    }
  };

  const handleToggleLike = async () => {
    if (!track || !token || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isLiked) {
        const success = await removeTrack(token, track.id);
        if (success) {
          setIsLiked(false);
          // Optimistically update library cache and sync
          removeTrackOptimistic(track.id);
          toast.showToast(`Removed "${track.name}" from Liked Songs`, 'success');
          // Refresh from API to ensure sync
          refreshTracks();
        } else {
          toast.showToast('Failed to remove from Liked Songs', 'error');
        }
      } else {
        const success = await saveTrack(token, track.id);
        if (success) {
          setIsLiked(true);
          // Optimistically update library cache and sync
          addTrackOptimistic(track);
          toast.showToast(`Added "${track.name}" to Liked Songs`, 'success');
          // Refresh from API to ensure sync
          refreshTracks();
        } else {
          toast.showToast('Failed to add to Liked Songs', 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsProcessing(false);
    }
    onClose();
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!track || !token || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await addTrackToPlaylist(token, playlistId, track.uri);
      if (success) {
        toast.showToast(`Added "${track.name}" to ${playlistName}`, 'success');
        // Refresh playlists to sync track counts
        refreshPlaylists();
      } else {
        toast.showToast('Failed to add to playlist', 'error');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsProcessing(false);
      setShowPlaylistSubmenu(false);
      onClose();
    }
  };

  const handleRemoveFromPlaylist = async () => {
    if (!track || !token || !currentPlaylistId || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await removeTrackFromPlaylist(token, currentPlaylistId, track.uri);
      if (success) {
        toast.showToast(`Removed "${track.name}" from playlist`, 'success');
        // Refresh playlists to sync track counts
        refreshPlaylists();
        onTrackRemoved?.();
      } else {
        toast.showToast('Failed to remove from playlist', 'error');
      }
    } catch (error) {
      console.error('Error removing from playlist:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleOpenInSpotify = () => {
    if (track?.external_urls?.spotify) {
      window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer');
    } else if (track?.id) {
      window.open(`https://open.spotify.com/track/${track.id}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleClosePlaylistSubmenu = () => {
    setShowPlaylistSubmenu(false);
    setPlaylistAnchorEl(null);
  };

  const handleOpenCreateDialog = () => {
    setShowPlaylistSubmenu(false);
    setShowCreateDialog(true);
    setNewPlaylistName('');
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setNewPlaylistName('');
  };

  const handleCreatePlaylistAndAdd = async () => {
    if (!track || !token || !user?.id || !newPlaylistName.trim() || isCreatingPlaylist) return;
    
    setIsCreatingPlaylist(true);
    try {
      // Create the new playlist
      const newPlaylist = await createPlaylist(token, user.id, newPlaylistName.trim());
      
      if (newPlaylist) {
        // Add the track to the new playlist
        const success = await addTrackToPlaylist(token, newPlaylist.id, track.uri);
        
        if (success) {
          toast.showToast(`Created "${newPlaylist.name}" and added "${track.name}"`, 'success');
          // Refresh playlists list locally and in global cache
          const playlists = await getUserPlaylists(token);
          const ownPlaylists = playlists.filter((p: any) => p.owner?.id === user.id);
          setUserPlaylists(ownPlaylists);
          // Sync global library cache
          refreshPlaylists();
        } else {
          toast.showToast(`Created "${newPlaylist.name}" but failed to add track`, 'warning');
          // Still refresh playlists since one was created
          refreshPlaylists();
        }
      } else {
        toast.showToast('Failed to create playlist', 'error');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.showToast('An error occurred', 'error');
    } finally {
      setIsCreatingPlaylist(false);
      setShowCreateDialog(false);
      setNewPlaylistName('');
      onClose();
    }
  };

  if (!track) return null;

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
        {/* Track info header */}
        <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', maxWidth: '100%', overflow: 'hidden' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white', 
              fontWeight: 600, 
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
          >
            {track.name}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              maxWidth: '100%'
            }}
          >
            {track.artists?.map(a => a.name).join(', ')}
          </Typography>
        </Box>

        {/* Like/Unlike */}
        <MenuItem 
          onClick={handleToggleLike}
          disabled={isCheckingLiked || isProcessing}
          sx={{
            color: isLiked ? 'rgb(239,68,68)' : 'white',
            py: 0.75, px: 1.5, minHeight: 32,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            {isCheckingLiked ? (
              <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
            ) : isLiked ? (
              <Favorite sx={{ color: 'rgb(239,68,68)', fontSize: 18 }} />
            ) : (
              <FavoriteBorder sx={{ color: 'white', fontSize: 18 }} />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={isLiked ? 'Remove from Liked' : 'Save to Liked'} 
            primaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>

        {/* Add to playlist */}
        <MenuItem 
          onClick={handleShowPlaylists}
          sx={{ color: 'white', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PlaylistAdd sx={{ color: 'white', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary="Add to Playlist" primaryTypographyProps={{ fontSize: '0.8rem' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>▶</Typography>
        </MenuItem>

        {/* Remove from current playlist (only if in a playlist context) */}
        {currentPlaylistId && (
          <MenuItem 
            onClick={handleRemoveFromPlaylist}
            disabled={isProcessing}
            sx={{ color: 'rgb(239,68,68)', py: 0.75, px: 1.5, minHeight: 32, '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <PlaylistRemove sx={{ color: 'rgb(239,68,68)', fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText primary="Remove from Playlist" primaryTypographyProps={{ fontSize: '0.8rem' }} />
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

      {/* Playlist submenu */}
      <Menu
        anchorEl={playlistAnchorEl}
        open={showPlaylistSubmenu}
        onClose={handleClosePlaylistSubmenu}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 1.5,
            width: 200,
            maxWidth: 200,
            maxHeight: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            py: 0.5
          }
        }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
            Add to Playlist
          </Typography>
        </Box>

        {/* Create new playlist option */}
        <MenuItem
          onClick={handleOpenCreateDialog}
          sx={{ 
            color: 'white', 
            py: 0.75, px: 1.5, minHeight: 32,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(34,197,94,0.1)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <Add sx={{ color: 'rgb(34,197,94)', fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Create New Playlist" 
            primaryTypographyProps={{ 
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'rgb(34,197,94)'
            }} 
          />
        </MenuItem>
        
        {loadingPlaylists ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
          </Box>
        ) : userPlaylists.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              No playlists available
            </Typography>
          </Box>
        ) : (
          userPlaylists.map((playlist) => (
            <MenuItem
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
              disabled={isProcessing}
              sx={{ 
                color: 'white', 
                py: 0.5, px: 1.5, minHeight: 28,
                '&:hover': { bgcolor: 'rgba(139,92,246,0.1)' }
              }}
            >
              <ListItemIcon sx={{ minWidth: 24 }}>
                <QueueMusic sx={{ color: 'rgb(139,92,246)', fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText 
                primary={playlist.name} 
                primaryTypographyProps={{ 
                  fontSize: '0.75rem', 
                  noWrap: true,
                  sx: { maxWidth: 140 }
                }} 
              />
            </MenuItem>
          ))
        )}
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
          Create New Playlist
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
                handleCreatePlaylistAndAdd();
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
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              mt: 1, 
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            "{track?.name?.length > 30 ? track.name.slice(0, 30) + '...' : track?.name}" will be added
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
            onClick={handleCreatePlaylistAndAdd}
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
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TrackMenu;
