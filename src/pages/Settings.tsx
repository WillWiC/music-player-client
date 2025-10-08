import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { refreshSpotifyTokenDetailed, isAccessTokenExpired } from '../utils/tokenRefresh';
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh, Visibility, VisibilityOff, CheckCircle, Error } from '@mui/icons-material';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { refreshAccessTokenNow, isGuest } = useAuth();

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
    if (isGuest) {
      setSnackbarMessage('Cannot refresh token in guest mode');
      setSnackbarOpen(true);
      return;
    }

    setRefreshStatus('loading');
    try {
      console.log('Refreshing token using new system...');
      const result = await refreshAccessTokenNow();

      if (result.success) {
        // Update UI state with new token info
        if (result.newToken) {
          setTokenValue(result.newToken);
        }
        
        // Update expiry info
        const expiryStr = localStorage.getItem('spotify_token_expiry');
        if (expiryStr) {
          const expiryTs = parseInt(expiryStr, 10);
          setTokenExpiryTs(expiryTs);
          const diff = expiryTs - Date.now();
          setTimeRemaining(diff > 0 ? msToTime(diff) : 'Expired');
        }

        setHasRefreshToken(!!localStorage.getItem('spotify_refresh_token'));
        
        // Notify other parts of the app about token update
        window.dispatchEvent(new Event('spotify_token_updated'));

        setRefreshStatus('success');
        setSnackbarMessage('Access token refreshed successfully!');
        setSnackbarOpen(true);
      } else {
        setRefreshStatus('error');
        setSnackbarMessage(result.error || 'Token refresh failed');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setRefreshStatus('error');
      setSnackbarMessage('Unexpected error during token refresh');
      setSnackbarOpen(true);
    } finally {
      setTimeout(() => setRefreshStatus('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-4xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              Auth / Token Management
              {isGuest && <Chip label="Guest Mode" size="small" color="warning" />}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Token Status Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Access token expiry: 
                  <strong style={{ color: 'white' }}>
                    {tokenExpiryTs ? new Date(tokenExpiryTs).toLocaleString() : '—'}
                  </strong>
                  {tokenExpiryTs && isAccessTokenExpired() && <Chip label="Expired" size="small" color="error" />}
                </Typography>
                
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Time remaining: 
                  <strong style={{ color: timeRemaining === 'Expired' ? '#f44336' : 'white' }}>
                    {timeRemaining}
                  </strong>
                </Typography>
                
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Refresh token: 
                  <strong style={{ color: 'white' }}>
                    {hasRefreshToken ? 'Available' : 'Missing'}
                  </strong>
                  {hasRefreshToken ? 
                    <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : 
                    <Error sx={{ color: '#f44336', fontSize: 18 }} />
                  }
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={refreshNow} 
                  disabled={refreshStatus === 'loading' || !hasRefreshToken || isGuest}
                  startIcon={
                    refreshStatus === 'loading' ? <CircularProgress size={16} /> : <Refresh />
                  }
                  sx={{ 
                    bgcolor: refreshStatus === 'success' ? '#4caf50' : undefined,
                    '&:hover': {
                      bgcolor: refreshStatus === 'success' ? '#45a049' : undefined
                    }
                  }}
                >
                  {refreshStatus === 'loading' ? 'Refreshing...' : 
                   refreshStatus === 'success' ? 'Refreshed!' :
                   'Refresh Token'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={() => { 
                    localStorage.removeItem('spotify_token'); 
                    localStorage.removeItem('spotify_token_expiry'); 
                    setTokenExpiryTs(null); 
                    setTokenValue(null);
                    setSnackbarMessage('Access token cleared'); 
                    setSnackbarOpen(true); 
                  }}
                  disabled={!tokenValue}
                >
                  Clear Token
                </Button>
                
                {!isGuest && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={async () => {
                      const result = await refreshSpotifyTokenDetailed();
                      if (result.success) {
                        setSnackbarMessage('Token refreshed using utility function!');
                      } else {
                        setSnackbarMessage(`Utility refresh failed: ${result.error}`);
                      }
                      setSnackbarOpen(true);
                    }}
                  >
                    Test Utility Refresh
                  </Button>
                )}
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              {/* Token Display Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>Access Token:</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ 
                    color: 'white', 
                    fontFamily: 'monospace', 
                    wordBreak: 'break-all',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    p: 1,
                    borderRadius: 1,
                    flex: 1,
                    minWidth: 200
                  }}>
                    {tokenValue ? 
                      (showToken ? tokenValue : `${tokenValue.slice(0, 12)}...${tokenValue.slice(-12)}`) : 
                      'No token available'
                    }
                  </Typography>
                  
                  <Tooltip title={showToken ? "Hide token" : "Show full token"}>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowToken(s => !s)}
                      disabled={!tokenValue}
                      sx={{ color: 'white' }}
                    >
                      {showToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                  
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => { 
                      if (tokenValue) {
                        navigator.clipboard?.writeText(tokenValue); 
                        setSnackbarMessage('Token copied to clipboard'); 
                        setSnackbarOpen(true); 
                      }
                    }}
                    disabled={!tokenValue}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>

              {/* Help Text */}
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 1 }}>
                💡 The refresh token allows automatic renewal of your access token without re-login. 
                {isGuest && " Guest mode doesn't support token refresh."}
              </Typography>
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
