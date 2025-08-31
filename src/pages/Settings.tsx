import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';

type PlaybackQuality = 'low' | 'normal' | 'high';

const STORAGE_KEYS = {
  DARK: 'settings_dark_mode',
  AUTOPLAY: 'settings_autoplay',
  QUALITY: 'settings_playback_quality',
  EXPLICIT: 'settings_allow_explicit'
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Load initial values from localStorage with sane defaults
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.DARK) === '1'; } catch { return true; }
  });

  const [autoplay, setAutoplay] = React.useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.AUTOPLAY) !== '0'; } catch { return true; }
  });

  const [playbackQuality, setPlaybackQuality] = React.useState<PlaybackQuality>(() => {
    try { return (localStorage.getItem(STORAGE_KEYS.QUALITY) as PlaybackQuality) || 'normal'; } catch { return 'normal'; }
  });

  const [allowExplicit, setAllowExplicit] = React.useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEYS.EXPLICIT) === '1'; } catch { return true; }
  });

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  // Token status state
  const [tokenExpiryTs, setTokenExpiryTs] = React.useState<number | null>(() => {
    try { const v = localStorage.getItem('spotify_token_expiry'); return v ? parseInt(v, 10) : null; } catch { return null; }
  });
  const [tokenValue, setTokenValue] = React.useState<string | null>(() => {
    try { return localStorage.getItem('spotify_token'); } catch { return null; }
  });
  const [showToken, setShowToken] = React.useState(false);
  const [hasRefreshToken, setHasRefreshToken] = React.useState<boolean>(() => {
    try { return !!localStorage.getItem('spotify_refresh_token'); } catch { return false; }
  });
  const [timeRemaining, setTimeRemaining] = React.useState<string>(() => {
    if (!tokenExpiryTs) return '—';
    const diff = tokenExpiryTs - Date.now();
    return diff > 0 ? msToTime(diff) : 'Expired';
  });
  const [refreshStatus, setRefreshStatus] = React.useState<'idle'|'loading'|'success'|'error'>('idle');

  // Persist changes to localStorage
  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.DARK, darkMode ? '1' : '0'); } catch {}
  }, [darkMode]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.AUTOPLAY, autoplay ? '1' : '0'); } catch {}
  }, [autoplay]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.QUALITY, playbackQuality); } catch {}
  }, [playbackQuality]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.EXPLICIT, allowExplicit ? '1' : '0'); } catch {}
  }, [allowExplicit]);

  // Update token status periodically
  React.useEffect(() => {
    const tick = () => {
      try {
        const v = localStorage.getItem('spotify_token_expiry');
        const rt = localStorage.getItem('spotify_refresh_token');
  const tv = localStorage.getItem('spotify_token');
        const ts = v ? parseInt(v, 10) : null;
        setTokenExpiryTs(ts);
  setTokenValue(tv);
        setHasRefreshToken(!!rt);
        if (!ts) return setTimeRemaining('—');
        const diff = ts - Date.now();
        setTimeRemaining(diff > 0 ? msToTime(diff) : 'Expired');
      } catch {
        setTimeRemaining('—');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Helper to format ms into H:MM:SS or MM:SS
  function msToTime(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const refreshNow = async () => {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      setSnackbarMessage('No refresh token available');
      setSnackbarOpen(true);
      return;
    }
    setRefreshStatus('loading');
    try {
      const server = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';
      const res = await fetch(`${server.replace(/\/$/, '')}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      let data: any = null;
      try { data = await res.json(); } catch (e) { /* ignore parse errors */ }

      if (!res.ok) {
        const bodyText = data && typeof data === 'object' ? JSON.stringify(data) : await res.text().catch(() => '');
        throw new Error(`refresh failed: ${res.status} ${bodyText}`);
      }

      if (!data || !data.access_token) {
        throw new Error('no access_token in response');
      }

      // update token immediately in UI and localStorage
      localStorage.setItem('spotify_token', data.access_token);
      setTokenValue(data.access_token);

      if (data.expires_in) {
        const expiryTs = Date.now() + data.expires_in * 1000;
        localStorage.setItem('spotify_token_expiry', String(expiryTs));
        setTokenExpiryTs(expiryTs);
        const diff = expiryTs - Date.now();
        setTimeRemaining(diff > 0 ? msToTime(diff) : 'Expired');
      } else {
        const prev = localStorage.getItem('spotify_token_expiry');
        if (prev) {
          const prevNum = parseInt(prev, 10);
          setTokenExpiryTs(prevNum);
          const diff = prevNum - Date.now();
          setTimeRemaining(diff > 0 ? msToTime(diff) : 'Expired');
        } else {
          setTokenExpiryTs(null);
          setTimeRemaining('—');
        }
      }

      setHasRefreshToken(!!localStorage.getItem('spotify_refresh_token'));
      // notify AuthProvider and other parts of the app about token update
      window.dispatchEvent(new Event('spotify_token_updated'));

      setRefreshStatus('success');
      setSnackbarMessage('Access token refreshed');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Refresh error', err);
      setRefreshStatus('error');
      setSnackbarMessage(String(err instanceof Error ? err.message : 'Refresh failed'));
      setSnackbarOpen(true);
    } finally {
      setTimeout(() => setRefreshStatus('idle'), 2000);
    }
  };

  const resetToDefaults = () => {
    setDarkMode(true);
    setAutoplay(true);
    setPlaybackQuality('normal');
    setAllowExplicit(true);
    try {
      localStorage.removeItem(STORAGE_KEYS.DARK);
      localStorage.removeItem(STORAGE_KEYS.AUTOPLAY);
      localStorage.removeItem(STORAGE_KEYS.QUALITY);
      localStorage.removeItem(STORAGE_KEYS.EXPLICIT);
    } catch {}
    setSnackbarMessage('Settings reset to defaults');
    setSnackbarOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-4xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Preferences</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => { setDarkMode(v => !v); setSnackbarMessage('Dark mode updated'); setSnackbarOpen(true); }} />}
                label={<Typography sx={{ color: 'white' }}>Dark mode (UI)</Typography>}
              />

              <FormControlLabel
                control={<Switch checked={autoplay} onChange={() => { setAutoplay(v => !v); setSnackbarMessage('Autoplay preference updated'); setSnackbarOpen(true); }} />}
                label={<Typography sx={{ color: 'white' }}>Autoplay next track</Typography>}
              />

              <FormControl fullWidth>
                <InputLabel id="playback-quality-label" sx={{ color: 'rgba(255,255,255,0.85)' }}>Playback quality</InputLabel>
                <Select
                  labelId="playback-quality-label"
                  value={playbackQuality}
                  label="Playback quality"
                  onChange={(e) => { setPlaybackQuality(e.target.value as PlaybackQuality); setSnackbarMessage('Playback quality updated'); setSnackbarOpen(true); }}
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="low">Low (conserve data)</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High (best quality)</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Switch checked={allowExplicit} onChange={() => { setAllowExplicit(v => !v); setSnackbarMessage('Explicit content preference updated'); setSnackbarOpen(true); }} />}
                label={<Typography sx={{ color: 'white' }}>Allow explicit content</Typography>}
              />

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => { setSnackbarMessage('Settings saved'); setSnackbarOpen(true); }}>Save</Button>
                <Button variant="outlined" color="inherit" onClick={resetToDefaults}>Reset to defaults</Button>
              </Box>
            </Box>

            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 3, fontSize: '0.8rem' }}>
              * These settings are stored in your browser (localStorage) and apply only to this client.
            </Typography>
          </Paper>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg mt-6">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Auth / Token</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>Access token expiry: <strong style={{ color: 'white' }}>{tokenExpiryTs ? new Date(tokenExpiryTs).toLocaleString() : '—'}</strong></Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Time remaining: <strong style={{ color: 'white' }}>{timeRemaining}</strong></Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Refresh token present: <strong style={{ color: 'white' }}>{hasRefreshToken ? 'Yes' : 'No'}</strong></Typography>

              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button variant="contained" color="primary" onClick={refreshNow} disabled={refreshStatus === 'loading' || !hasRefreshToken}>
                  {refreshStatus === 'loading' ? 'Refreshing…' : 'Refresh now'}
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => { localStorage.removeItem('spotify_token'); localStorage.removeItem('spotify_token_expiry'); setTokenExpiryTs(null); setSnackbarMessage('Access token cleared'); setSnackbarOpen(true); }}>Clear token</Button>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>Access token (id):</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography sx={{ color: 'white', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {tokenValue ? (showToken ? tokenValue : `${tokenValue.slice(0, 8)}...${tokenValue.slice(-8)}`) : '—'}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => { navigator.clipboard?.writeText(tokenValue || ''); setSnackbarMessage('Token copied'); setSnackbarOpen(true); }}>Copy</Button>
                  <Button size="small" variant="text" onClick={() => setShowToken(s => !s)}>{showToken ? 'Hide' : 'Show'}</Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
          </Snackbar>
        </div>
      </main>
    </div>
  );
};

export default Settings;
