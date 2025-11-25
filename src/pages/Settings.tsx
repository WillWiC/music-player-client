import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh, 
  Visibility, 
  VisibilityOff, 
  CheckCircle, 
  Error,
  Security,
  Settings as SettingsIcon,
  Timer,
  CloudSync,
  Key,
  ContentCopy
} from '@mui/icons-material';

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
      const result = await refreshAccessTokenNow();

      if (result.success) {
        if (result.newToken) setTokenValue(result.newToken);
        
        const expiryStr = localStorage.getItem('spotify_token_expiry');
        if (expiryStr) {
          const expiryTs = parseInt(expiryStr, 10);
          setTokenExpiryTs(expiryTs);
          const diff = expiryTs - Date.now();
          setTimeRemaining(diff > 0 ? msToTime(diff) : 'Expired');
        }

        setHasRefreshToken(!!localStorage.getItem('spotify_refresh_token'));
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
      setRefreshStatus('error');
      setSnackbarMessage('Unexpected error during token refresh');
      setSnackbarOpen(true);
    } finally {
      setTimeout(() => setRefreshStatus('idle'), 2000);
    }
  };

  const copyToken = () => {
    if (tokenValue) {
      navigator.clipboard.writeText(tokenValue);
      setSnackbarMessage('Token copied to clipboard');
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="h-screen app-background flex overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col lg:ml-72 relative h-full">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 flex flex-col justify-center p-6 overflow-y-auto">
          <Container maxWidth="md">
            {/* Header Section - Compact */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-2 border-white/10 shrink-0">
                <SettingsIcon sx={{ fontSize: 28, color: 'white' }} />
              </div>
              
              <div>
                <Typography variant="h5" className="text-white font-bold leading-tight">
                  Settings
                </Typography>
                <Typography className="text-gray-400 text-xs">
                  Authentication & Security
                </Typography>
              </div>
            </div>

            <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
              <CardContent className="p-0">
                <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-black/20">
                  <Security className="text-green-500" fontSize="small" />
                  <Typography variant="subtitle2" className="text-white font-bold">
                    System Status
                  </Typography>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    
                    {/* Session Status Box */}
                    <div className="relative overflow-hidden bg-black/20 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Timer sx={{ fontSize: 60 }} />
                      </div>
                      
                      <div className="relative z-10">
                        <Typography className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                          Session Status
                        </Typography>
                        
                        <div className="flex items-center gap-3 mb-3">
                           <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${timeRemaining !== 'Expired' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${timeRemaining !== 'Expired' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                              <span className="font-bold text-xs">{timeRemaining !== 'Expired' ? 'Active' : 'Expired'}</span>
                           </div>
                        </div>

                        <div className="flex flex-col">
                            <Typography className="text-gray-500 text-[10px] mb-0.5">Time Remaining</Typography>
                            <Typography className="text-white font-mono font-bold text-xl tracking-tight">
                              {timeRemaining}
                            </Typography>
                        </div>
                      </div>
                    </div>

                    {/* Refresh Token Box */}
                    <div className="relative overflow-hidden bg-black/20 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-all duration-300 flex flex-col justify-between">
                       <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CloudSync sx={{ fontSize: 60 }} />
                      </div>

                      <div className="relative z-10">
                        <Typography className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                          Refresh Token
                        </Typography>
                        <div className="flex items-center gap-2 mb-3">
                          {hasRefreshToken ? (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle fontSize="small" />
                              <div>
                                <span className="font-bold text-xs block">Available</span>
                                <span className="text-[10px] text-green-400/60">Auto-renewal enabled</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-400">
                              <Error fontSize="small" />
                              <div>
                                <span className="font-bold text-xs block">Missing</span>
                                <span className="text-[10px] text-red-400/60">Manual login required</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        onClick={refreshNow}
                        disabled={refreshStatus === 'loading' || isGuest}
                        startIcon={refreshStatus === 'loading' ? <Refresh className="animate-spin" fontSize="small" /> : <Refresh fontSize="small" />}
                        className={`relative z-10 py-1.5 font-bold rounded-lg shadow-lg normal-case text-xs transition-all ${
                          refreshStatus === 'loading' 
                            ? 'bg-gray-700 text-gray-400' 
                            : 'bg-green-500 hover:bg-green-400 text-black hover:scale-[1.02]'
                        }`}
                      >
                        {refreshStatus === 'loading' ? 'Refreshing...' : 'Refresh Session'}
                      </Button>
                    </div>
                  </div>

                  {/* Token Inspector */}
                  <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                    <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-white/5 text-gray-400">
                          <Key style={{ fontSize: 14 }} />
                        </div>
                        <Typography className="text-gray-300 text-[10px] font-medium uppercase tracking-wider">Access Token</Typography>
                      </div>
                      <div className="flex gap-1">
                        <Tooltip title="Copy Token">
                          <IconButton size="small" onClick={copyToken} className="text-gray-400 hover:text-white">
                            <ContentCopy style={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={showToken ? "Hide Token" : "Show Token"}>
                          <IconButton 
                            size="small" 
                            onClick={() => setShowToken(!showToken)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showToken ? <VisibilityOff style={{ fontSize: 14 }} /> : <Visibility style={{ fontSize: 14 }} />}
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 z-10 ${showToken ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                          <Security className="text-gray-600 mb-1" style={{ fontSize: 20 }} />
                          <Typography className="text-gray-500 font-mono text-[10px]">
                              Hidden
                          </Typography>
                      </div>
                      <div className="p-3 font-mono text-[10px] text-gray-300 break-all leading-relaxed h-[60px] overflow-y-auto bg-black/20 custom-scrollbar">
                        {tokenValue || 'No token available'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Container>
        </main>
      </div>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={refreshStatus === 'error' ? 'error' : 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Settings;
