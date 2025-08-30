import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import type { Track } from '../types/spotify';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  AccountCircle,
  Logout,
  Close,
  Settings
} from '@mui/icons-material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onMobileMenuToggle?: () => void;
  onTrackPlayed?: (track: Track) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  searchPlaceholder = "Search for songs, artists, or albums...",
  onMobileMenuToggle,
  onTrackPlayed
}) => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Track[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  // Search for tracks using Spotify API
  const searchTracks = async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tracks?.items || []);
        setShowSearchDropdown(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTracks(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchTracks(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleTrackPlay = async (track: Track) => {
    try {
      await play(track as any);
    } catch (err) {
      console.error('Play failed from header:', err);
    }

    if (onTrackPlayed) {
      onTrackPlayed(track);
    }
    setShowSearchDropdown(false);
    clearSearch();
  };

  // Close search dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    setShowLogoutNotification(true);
    setTimeout(() => setShowLogoutNotification(false), 3000);
  };

  return (
    <>
      {/* Logout Notification */}
      <Snackbar
        open={showLogoutNotification}
        autoHideDuration={3000}
        onClose={() => setShowLogoutNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowLogoutNotification(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Successfully logged out!
        </Alert>
      </Snackbar>

      <AppBar 
        position="fixed" 
        sx={{ 
          left: { xs: 0, lg: '288px' }, // 288px = 72*4 = w-72
          width: { xs: '100%', lg: 'calc(100% - 288px)' },
          bgcolor: '#000000',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          {/* Left Section - Mobile Menu */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Mobile Menu Button */}
            <IconButton
              onClick={onMobileMenuToggle}
              sx={{ 
                display: { xs: 'flex', lg: 'none' },
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2
              }}
              title="Open Menu"
            >
              <MenuIcon sx={{ color: 'white' }} />
            </IconButton>
          </Stack>

          {/* Search Bar */}
          <Box sx={{ flex: 1, maxWidth: 512, mx: { xs: 1.5, sm: 3 }, position: 'relative' }} className="search-container">
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {isSearching ? (
                        <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                      ) : (
                        <Search sx={{ color: 'text.secondary' }} />
                      )}
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={clearSearch}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(34, 197, 94, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    color: 'white',
                    '& input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }
                }}
              />
            </form>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  bgcolor: '#000000',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  maxHeight: 400,
                  overflow: 'auto',
                  zIndex: 50
                }}
              >
                <List sx={{ p: 0 }}>
                  {searchResults.map((track) => (
                    <ListItem
                      key={track.id}
                      component="div"
                      onClick={() => handleTrackPlay(track)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)'
                        },
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={track.album?.images?.[0]?.url} alt={track.name} variant="rounded" sx={{ width: 44, height: 44, mr: 1 }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                            {track.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {track.artists?.map(a => a.name).join(', ')} • {track.album?.name}
                          </Typography>
                        }
                      />
                      {/* Play/Pause button */}
                      <IconButton
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            if (currentTrack?.id === track.id && isPlaying) {
                              await pause();
                            } else {
                              await play(track as any);
                            }
                            if (onTrackPlayed) onTrackPlayed(track);
                            setShowSearchDropdown(false);
                            clearSearch();
                          } catch (err) {
                            console.error('Play button error in dropdown:', err);
                          }
                        }}
                        sx={{ ml: 1 }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Right Section - User Profile */}
          <Stack direction="row" spacing={1} alignItems="center">
            {user ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  id="profile-button"
                  onClick={handleProfileClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 3,
                    p: 0.5,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Avatar
                    src={user.images?.[0]?.url}
                    sx={{ width: 32, height: 32 }}
                  >
                    <AccountCircle />
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{ color: 'white', fontWeight: 500, ml: 1, userSelect: 'none' }}
                  >
                    {user.display_name || 'Profile'}
                  </Typography>
                </Box>

                <Menu
                  anchorEl={showProfileDropdown ? document.getElementById('profile-button') : null}
                  open={showProfileDropdown}
                  onClose={() => setShowProfileDropdown(false)}
                  PaperProps={{
                    sx: {
                      bgcolor: '#000000',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 3,
                      mt: 1
                    }
                  }}
                >
                  <MenuItem
                    onClick={() => {/* TODO: handle account click */}}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      mb: 0.5,
                      transition: 'background 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                        color: 'white',
                      }
                    }}
                  >
                    <AccountCircle sx={{ mr: 2, fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 600 }}>Account</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {/* TODO: handle settings click */}}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      mb: 0.5,
                      transition: 'background 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                        color: 'white',
                      }
                    }}
                  >
                    <Settings sx={{ mr: 2, fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 600 }}>Settings</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 2, fontSize: 18 }} />
                    <Typography>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="contained"
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.light' },
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
