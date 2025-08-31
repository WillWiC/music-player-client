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
  searchPlaceholder = 'Search for songs, artists, or albums...',
  onMobileMenuToggle,
  onTrackPlayed
}) => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Track[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showLogoutNotification, setShowLogoutNotification] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const searchTracks = React.useCallback(
    async (query: string) => {
      if (!token || !query.trim()) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tracks?.items || []);
          setShowSearchDropdown(true);
          setActiveIndex(-1);
        } else {
          setSearchResults([]);
          setShowSearchDropdown(false);
        }
      } catch (err) {
        console.error('Header search error', err);
        setSearchResults([]);
        setShowSearchDropdown(false);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // debounce search
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTracks(searchQuery);
        if (onSearch) onSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
        setActiveIndex(-1);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, searchTracks, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((p) => Math.min(p + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        void handlePlay(searchResults[activeIndex]);
      } else if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        setShowSearchDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handlePlay = async (track: Track) => {
    try {
      await play(track as any);
      if (onTrackPlayed) onTrackPlayed(track);
    } catch (err) {
      console.error('Play from header failed', err);
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  // click outside to close
  React.useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(ev.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleProfileOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleProfileClose();
    setShowLogoutNotification(true);
    setTimeout(() => setShowLogoutNotification(false), 2500);
  };

  return (
    <>
      <Snackbar
        open={showLogoutNotification}
        autoHideDuration={2500}
        onClose={() => setShowLogoutNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowLogoutNotification(false)} severity="success" sx={{ width: '100%' }}>
          Successfully logged out
        </Alert>
      </Snackbar>

      <AppBar
        position="fixed"
        sx={{
          left: { xs: 0, lg: '288px' },
          width: { xs: '100%', lg: 'calc(100% - 288px)' },
          bgcolor: '#000000',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              onClick={onMobileMenuToggle}
              sx={{ display: { xs: 'flex', lg: 'none' }, bgcolor: 'rgba(255,255,255,0.03)' }}
              title="Open menu"
            >
              <MenuIcon sx={{ color: 'white' }} />
            </IconButton>
          </Stack>

          <Box sx={{ flex: 1, maxWidth: 560, mx: { xs: 1.5, sm: 3 }, position: 'relative' }} ref={containerRef} className="search-container">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              }}
            >
              <TextField
                fullWidth
                value={searchQuery}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                variant="outlined"
                size="small"
                InputProps={{
                  inputProps: {
                    'aria-label': 'Search',
                    role: 'combobox',
                    'aria-expanded': showSearchDropdown,
                    'aria-controls': 'search-results',
                    'aria-activedescendant': activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      {isSearching ? <CircularProgress size={18} sx={{ color: 'primary.main' }} /> : <Search sx={{ color: 'text.secondary' }} />}
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }} sx={{ color: 'text.secondary' }}>
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                  sx: {
                    bgcolor: 'rgba(255,255,255,0.04)',
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    color: 'white'
                  }
                }}
              />
            </form>

            {showSearchDropdown && (
              <Paper
                sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 1, bgcolor: '#000000', borderRadius: 2, zIndex: 50, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 420, overflow: 'auto' }}
              >
                <List id="search-results" role="listbox" sx={{ p: 0 }}>
                  {searchResults.length === 0 && !isSearching && (
                    <ListItem>
                      <ListItemText primary={<Typography sx={{ color: 'text.secondary' }}>No results</Typography>} />
                    </ListItem>
                  )}

                  {searchResults.map((track, idx) => (
                    <ListItem
                      key={track.id}
                      id={`search-result-${idx}`}
                      role="option"
                      aria-selected={activeIndex === idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => void handlePlay(track)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, cursor: 'pointer', bgcolor: activeIndex === idx ? 'rgba(34,197,94,0.06)' : 'transparent' }}
                    >
                      <ListItemAvatar>
                        <Avatar src={track.album?.images?.[0]?.url} alt={track.name} variant="rounded" sx={{ width: 44, height: 44 }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>{track.name}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{track.artists?.map(a => a.name).join(', ')} • {track.album?.name}</Typography>}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          void (async () => {
                            try {
                              if (currentTrack?.id === track.id && isPlaying) {
                                await pause();
                              } else {
                                await play(track as any);
                              }
                              if (onTrackPlayed) onTrackPlayed(track);
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            } catch (err) {
                              console.error('Play/pause error', err);
                            }
                          })();
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? <Pause /> : <PlayArrow />}
                      </IconButton>
                    </ListItem>
                  ))}

                  {/* See all results */}
                  {searchQuery.trim() && (
                    <ListItem
                      component="div"
                      onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSearchDropdown(false); }}
                      sx={{ cursor: 'pointer', px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <ListItemText primary={<Typography sx={{ color: 'primary.main', fontWeight: 600 }}>See all results for "{searchQuery}"</Typography>} />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {user ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Button id="profile-button" onClick={handleProfileOpen} sx={{ textTransform: 'none', color: 'white' }}>
                  <Avatar src={user.images?.[0]?.url} sx={{ width: 32, height: 32, mr: 1 }}>
                    <AccountCircle />
                  </Avatar>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{user.display_name || 'Profile'}</Typography>
                </Button>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileClose} PaperProps={{ sx: { bgcolor: '#000', border: '1px solid rgba(255,255,255,0.06)', mt: 1 } }}>
                    <MenuItem onClick={() => { handleProfileClose(); navigate('/account'); }} sx={{ fontWeight: 600 }}>
                      <AccountCircle sx={{ mr: 1 }} /> Account
                    </MenuItem>
                    <MenuItem onClick={() => { handleProfileClose(); navigate('/settings'); }} sx={{ fontWeight: 600 }}>
                      <Settings sx={{ mr: 1 }} /> Settings
                    </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button onClick={() => navigate('/login')} variant="contained" sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.light' }, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>Login</Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
