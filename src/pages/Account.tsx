import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { Button, Avatar, Typography, Box, Paper, IconButton, Link, Tooltip, Snackbar, Alert } from '@mui/material';
import { ContentCopy, OpenInNew, Refresh } from '@mui/icons-material';

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-4xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-4">Account</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Box className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left: avatar, name, actions */}
              <Box sx={{ width: { xs: '100%', lg: 280 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={user?.images?.[0]?.url} sx={{ width: 88, height: 88 }}>
                    {user?.display_name ? user.display_name[0] : 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{user?.display_name || 'Your Name'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.email || ''}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" color="primary" onClick={() => navigate('/settings')}>Settings</Button>
                  <Button variant="outlined" color="inherit" onClick={() => { logout(); navigate('/login'); }}>Sign out</Button>
                  <Tooltip title="Refresh profile">
                    <IconButton onClick={() => window.location.reload()}>
                      <Refresh sx={{ color: 'rgba(255,255,255,0.8)' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Right: details rows */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Row helper */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>ID</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.id || '—'}</Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Copy user id">
                        <IconButton size="small" onClick={async () => { try { await navigator.clipboard.writeText(user?.id || ''); setSnackbarMessage('User id copied'); setSnackbarOpen(true);} catch { setSnackbarMessage('Copy failed'); setSnackbarOpen(true);} }}>
                          <ContentCopy fontSize="small" sx={{ color: 'rgba(255,255,255,0.85)' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>Followers</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.followers?.total?.toLocaleString() ?? '—'}</Typography>
                    </Box>
                    <Box />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>Country</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.country || '—'}</Typography>
                    </Box>
                    <Box />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>Account type</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.product || '—'}</Typography>
                    </Box>
                    <Box />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>Profile</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.external_urls?.spotify ? 'View on Spotify' : '—'}</Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Open on Spotify">
                        <IconButton size="small" component={Link} href={user?.external_urls?.spotify || '#'} target="_blank" rel="noreferrer">
                          <OpenInNew fontSize="small" sx={{ color: 'rgba(255,255,255,0.85)' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
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

export default Account;
