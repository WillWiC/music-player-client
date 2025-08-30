import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  useMediaQuery
} from '@mui/material';
import {
  Home,
  Search,
  LibraryMusic,
  Favorite,
  PlaylistPlay,
  Close
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
      id: 'library',
      label: 'Your Library',
      icon: <LibraryMusic />,
      path: '/library',
      isActive: location.pathname === '/library'
    }
  ];

  const quickLinks = [
    {
      id: 'myplaylists',
      label: 'My Playlists',
      icon: <PlaylistPlay />,
      path: '/library',
      color: '#f59e0b' // Amber
    },
    {
      id: 'liked',
      label: 'Liked Songs',
      icon: <Favorite />,
      path: '/library',
      color: '#8b5cf6' // Purple
    },
    // Removed 'Recently Played' quick link per request.
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
        width: 288, // Same as the original w-72 (72 * 4 = 288px)
        height: '100vh',
        bgcolor: '#000000',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Mobile close button */}
      {isMobile && onClose && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': { color: 'white' }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      )}

      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'white' }}>
          Spotify Lite
        </Typography>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ p: 2 }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.id === 'home')}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  color: item.isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  bgcolor: item.isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'inherit', 
                  minWidth: 40 
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

      {/* Quick Links */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontWeight: 600, 
            mb: 2, 
            px: 2,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Quick Access
        </Typography>
        <List sx={{ p: 0 }}>
              {quickLinks.map((link) => (
            <ListItem key={link.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  // Support quick links that target specific Library tabs
                  if (link.id === 'liked') {
                    navigate('/library', { state: { initialTab: 'liked' } });
                    if (isMobile && onClose) onClose();
                    return;
                  }
                  if (link.id === 'myplaylists') {
                    navigate('/library', { state: { initialTab: 'playlists' } });
                    if (isMobile && onClose) onClose();
                    return;
                  }
                  handleNavigation(link.path);
                }}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: link.color,
                      '& .MuiSvgIcon-root': {
                        fontSize: '1rem',
                        color: 'white'
                      }
                    }}
                  >
                    {link.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={link.label} 
                  primaryTypographyProps={{ 
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
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
          boxShadow: 'none',
          zIndex: 1200
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
