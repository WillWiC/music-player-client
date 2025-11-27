/**
 * AlbumMenu Component
 * Context menu for album actions: save/unsave, open in Spotify
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
import type { Album } from '../types/spotify';
import {
  checkSavedAlbums,
  saveAlbum,
  removeAlbum
} from '../services/libraryService';

interface AlbumMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  album: Album | null;
  onAlbumSaveChanged?: (isSaved: boolean) => void;
  onPlay?: () => void;
}

const AlbumMenu: React.FC<AlbumMenuProps> = ({
  anchorEl,
  open,
  onClose,
  album,
  onAlbumSaveChanged,
  onPlay
}) => {
  const { token } = useAuth();
  const toast = useToast();
  
  const [isSaved, setIsSaved] = React.useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Check if album is saved when menu opens
  React.useEffect(() => {
    const checkSaved = async () => {
      if (!open || !album || !token) return;
      
      setIsCheckingSaved(true);
      try {
        const results = await checkSavedAlbums(token, [album.id]);
        setIsSaved(results[0] ?? false);
      } catch (error) {
        console.error('Error checking album save status:', error);
      } finally {
        setIsCheckingSaved(false);
      }
    };
    
    checkSaved();
  }, [open, album, token]);

  const handleToggleSave = async () => {
    if (!album || !token || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isSaved) {
        const success = await removeAlbum(token, album.id);
        if (success) {
          setIsSaved(false);
          toast.showToast(`Removed "${album.name}" from Your Library`, 'success');
          onAlbumSaveChanged?.(false);
        } else {
          toast.showToast('Failed to remove from library', 'error');
        }
      } else {
        const success = await saveAlbum(token, album.id);
        if (success) {
          setIsSaved(true);
          toast.showToast(`Added "${album.name}" to Your Library`, 'success');
          onAlbumSaveChanged?.(true);
        } else {
          toast.showToast('Failed to add to library', 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
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
    if (album?.external_urls?.spotify) {
      window.open(album.external_urls.spotify, '_blank', 'noopener,noreferrer');
    } else if (album?.id) {
      window.open(`https://open.spotify.com/album/${album.id}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleShare = async () => {
    const url = album?.external_urls?.spotify || `https://open.spotify.com/album/${album?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: album?.name,
          text: `Check out this album: ${album?.name}`,
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

  if (!album) return null;

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
      {/* Album info header */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }} noWrap>
          {album.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }} noWrap>
          {album.artists?.map(a => a.name).join(', ')} • {album.total_tracks || album.tracks?.total || 0} songs
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
        onClick={handleToggleSave}
        disabled={isCheckingSaved || isProcessing}
        sx={{
          color: isSaved ? 'rgb(34,197,94)' : 'white',
          py: 0.75, px: 1.5, minHeight: 32,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          {isCheckingSaved ? (
            <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
          ) : isSaved ? (
            <LibraryAddCheck sx={{ color: 'rgb(34,197,94)', fontSize: 18 }} />
          ) : (
            <LibraryAdd sx={{ color: 'white', fontSize: 18 }} />
          )}
        </ListItemIcon>
        <ListItemText 
          primary={isSaved ? 'Remove from Library' : 'Add to Library'} 
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

export default AlbumMenu;
