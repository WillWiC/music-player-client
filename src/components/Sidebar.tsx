import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlaylists } from '../context/playlists';
import { useLibrary } from '../context/library';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Home,
  Search,
  LibraryMusic,
  Explore,
  PlaylistPlay,
  Close,
  QueueMusic,
  FilterList,
  ArrowBack,
  ArrowForward,
  Album
} from '@mui/icons-material';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onHomeClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, onHomeClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // Use xl breakpoint (1280px) for permanent sidebar - below that it's temporary/overlay
  const isMobile = useMediaQuery(theme.breakpoints.down('xl'));
  const { isGuest, token } = useAuth();
  
  // Use global playlists context instead of local state
  const { playlists, isLoadingPlaylists } = usePlaylists();
  
  // Use global library context for albums (synced with Library page)
  const { albums: libraryAlbums, isLoadingAlbums } = useLibrary();
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Combine and filter items - use albums from library context
  const albums = libraryAlbums.map(a => ({ ...a, type: 'album' }));
  const libraryItems = [
    ...playlists.map(p => ({ ...p, type: 'playlist' })),
    ...albums
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredItems = libraryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner?.display_name || item.artists?.[0]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home />,
      path: '/dashboard',
      isActive: location.pathname === '/' || location.pathname === '/dashboard'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search />,
      path: '/search',
      isActive: location.pathname === '/search'
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: <Explore />,
      path: '/browse',
      isActive: location.pathname === '/browse'
    },
    {
      id: 'library',
      label: 'Your Library',
      icon: <LibraryMusic />,
      path: '/library',
      isActive: location.pathname === '/library'
    }
  ];

  const handleNavigation = (path: string, isHome: boolean = false) => {
    if (isHome && onHomeClick) {
      onHomeClick(); // Clear album view
    }
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const drawerContent = (
    <Box
      sx={{
        width: isMobile ? '85vw' : 320,
        maxWidth: isMobile ? 350 : 320,
        height: '100dvh',
        maxHeight: '-webkit-fill-available', // iOS Safari fix
        bgcolor: '#0a0a0a',
        backdropFilter: 'blur(20px)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent main container from scrolling
        px: isMobile ? 2 : 4,
        pt: isMobile ? 2 : 4.5,
        pb: 0 // No bottom padding on container - applied to scrollable area instead
      }}
    >
      {/* Header with title and close button */}
      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        pb: 2, 
        mb: 3,
        flexShrink: 0 // Prevent header from shrinking
      }}>
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 800,
            color: 'white',
            m: 0,
            fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
            lineHeight: 1
          }}
        >
          Flowbeats
        </Typography>
        
        {/* Desktop Navigation Buttons */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              size="small"
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                bgcolor: 'rgba(255,255,255,0.05)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' } 
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={() => navigate(1)}
              size="small"
              sx={{ 
                color: 'rgba(255,255,255,0.7)', 
                bgcolor: 'rgba(255,255,255,0.05)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' } 
              }}
            >
              <ArrowForward fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Close button only on mobile (overlay mode) */}
        {isMobile && onClose && (
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              },
              borderRadius: 2
            }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Main Navigation */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.id === 'home')}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: isMobile ? 1.25 : 2,
                  color: item.isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  bgcolor: item.isActive ? 'rgba(29, 185, 84, 0.15)' : 'transparent',
                  border: item.isActive ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: item.isActive ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    transform: 'translateX(4px)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <ListItemIcon sx={{ 
                  color: item.isActive ? '#1db954' : 'inherit', 
                  minWidth: 36,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem'
                  }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: item.isActive ? 600 : 500,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* My Playlists */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0 // Important for flex child to enable scrolling
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: 3, 
          mb: 2,
          flexShrink: 0 // Prevent this header from shrinking
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)', 
              fontWeight: 600, 
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Your Library {libraryItems.length > 0 && `(${libraryItems.length})`}
          </Typography>
          {libraryItems.length > 5 && (
            <Tooltip title={showSearch ? 'Hide search' : 'Search library'}>
              <IconButton
                onClick={() => setShowSearch(!showSearch)}
                size="small"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': { 
                    color: '#1db954',
                    bgcolor: 'rgba(29, 185, 84, 0.1)' 
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <FilterList sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Search Field */}
        {showSearch && (
          <Box sx={{ px: 3, mb: 2, flexShrink: 0 }}>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1rem' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #1db954'
                  },
                  color: 'white',
                  fontSize: '0.85rem'
                }
              }}
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.5)' }
              }}
            />
          </Box>
        )}

        {/* Scrollable Playlist Container */}
        <Box sx={{ 
          px: 3, 
          overflow: 'auto', 
          flexGrow: 1,
          minHeight: 0, // Important for flex child to enable scrolling
          pb: isMobile ? 12 : 8, // Bottom padding to clear player
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <List sx={{ p: 0 }}>
            {isGuest ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                px: 2,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}>
                <QueueMusic sx={{ 
                  fontSize: '3rem', 
                  color: 'rgba(255, 255, 255, 0.3)', 
                  mb: 2 
                }} />
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.85rem',
                    mb: 2
                  }}
                >
                  Sign in to access your library
                </Typography>
                <Chip 
                  label="Login" 
                  size="small"
                  sx={{
                    bgcolor: '#1db954',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                />
              </Box>
            ) : isLoadingPlaylists ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}
                >
                  Loading your library...
                </Typography>
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 3,
                px: 2,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.85rem'
                  }}
                >
                  {searchQuery ? 'No items match your search' : 'No items found'}
                </Typography>
              </Box>
            ) : (
              filteredItems.slice(0, 20).map((item: any) => (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={`${item.name} • ${item.type === 'album' ? 'Album' : 'Playlist'}`} placement="right">
                    <ListItemButton
                      onClick={() => {
                        navigate(item.type === 'album' ? `/album/${item.id}` : `/playlist/${item.id}`);
                        if (isMobile && onClose) onClose();
                      }}
                      sx={{
                        borderRadius: 2.5,
                        px: 2,
                        py: 1.5,
                        color: 'rgba(255, 255, 255, 0.8)',
                        bgcolor: 'transparent',
                        border: '1px solid transparent',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transform: 'translateX(4px)',
                          '& .cover-image': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar
                          src={item.images?.[0]?.url}
                          className="cover-image"
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'linear-gradient(45deg, #1db954, #1ed760)',
                            transition: 'all 0.3s ease',
                            '& .MuiSvgIcon-root': {
                              fontSize: '1rem',
                              color: 'white'
                            }
                          }}
                        >
                          {item.type === 'album' ? <Album sx={{ fontSize: '1rem' }} /> : <PlaylistPlay sx={{ fontSize: '1rem' }} />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name} 
                        secondary={`${item.type === 'album' ? 'Album' : 'Playlist'} • ${item.type === 'album' ? item.artists?.[0]?.name : item.owner?.display_name || 'Unknown'}`}
                        primaryTypographyProps={{ 
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          noWrap: true,
                          sx: { color: 'inherit' }
                        }}
                        secondaryTypographyProps={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.75rem',
                          noWrap: true
                        }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))
            )}
            
            {/* View All Link */}
            {!isGuest && !isLoadingPlaylists && filteredItems.length > 20 && (
              <ListItem disablePadding sx={{ mt: 2 }}>
                <ListItemButton
                  onClick={() => {
                    navigate('/library');
                    if (isMobile && onClose) onClose();
                  }}
                  sx={{
                    borderRadius: 2.5,
                    px: 2,
                    py: 1.5,
                    color: 'rgba(255, 255, 255, 0.6)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemText 
                    primary={`View all items`}
                    primaryTypographyProps={{ 
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      textAlign: 'center'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      anchor="left"
      open={isOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        zIndex: 1200, // Lower than player's 9999
        '& .MuiDrawer-paper': {
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isMobile 
            ? '8px 0 32px rgba(0,0,0,0.3)' 
            : '4px 0 24px rgba(0,0,0,0.15)',
          bgcolor: '#0a0a0a',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
          backdropFilter: 'blur(20px)',
          zIndex: 1200,
          width: isMobile ? '85vw' : 320,
          maxWidth: isMobile ? 350 : 320
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
