import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlaylists } from '../context/playlists';
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
  FilterList
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
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { isGuest } = useAuth();
  
  // Use global playlists context instead of local state
  const { playlists, isLoadingPlaylists } = usePlaylists();
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filter playlists based on search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.owner?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
        height: '100vh',
        bgcolor: '#0a0a0a',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent main container from scrolling
        px: isMobile ? 3 : 4,
        py: isMobile ? 3 : 4.5,
        pb: isMobile ? 12 : 10 // Add bottom padding to prevent conflict with player
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
      <Box sx={{ mb: 3, flexShrink: 0 }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.id === 'home')}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 2,
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
                  minWidth: 44,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.2rem'
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
            My Playlists {playlists.length > 0 && `(${playlists.length})`}
          </Typography>
          {playlists.length > 5 && (
            <Tooltip title={showSearch ? 'Hide search' : 'Search playlists'}>
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
              placeholder="Search playlists..."
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
          pb: 2, // Additional bottom padding for playlist items
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
                  Sign in to access your playlists
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
                  Loading your playlists...
                </Typography>
              </Box>
            ) : filteredPlaylists.length === 0 ? (
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
                  {searchQuery ? 'No playlists match your search' : 'No playlists found'}
                </Typography>
              </Box>
            ) : (
              filteredPlaylists.slice(0, 15).map((playlist: any) => (
                <ListItem key={playlist.id} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={`${playlist.name} by ${playlist.owner?.display_name || 'Unknown'}`} placement="right">
                    <ListItemButton
                      onClick={() => {
                        navigate(`/playlist/${playlist.id}`);
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
                          '& .playlist-cover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar
                          src={playlist.images?.[0]?.url}
                          className="playlist-cover"
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
                          <PlaylistPlay sx={{ fontSize: '1rem' }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={playlist.name} 
                        secondary={`Playlist • ${playlist.owner?.display_name || 'Unknown'}`}
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
            
            {/* View All Playlists Link */}
            {!isGuest && !isLoadingPlaylists && filteredPlaylists.length > 15 && (
              <ListItem disablePadding sx={{ mt: 2 }}>
                <ListItemButton
                  onClick={() => {
                    navigate('/library', { state: { initialTab: 'playlists' } });
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
                    primary={`View all ${playlists.length} playlists`}
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
