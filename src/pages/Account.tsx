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
  Avatar, 
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Email, 
  Public, 
  Star, 
  ContentCopy, 
  OpenInNew, 
  Logout,
  Settings as SettingsIcon
} from '@mui/icons-material';

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id || '');
      setSnackbarMessage('User ID copied to clipboard');
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Failed to copy ID');
      setSnackbarOpen(true);
    }
  };

  return (
    <div className="min-h-[100dvh] app-background flex safe-area-bottom">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col xl:ml-80 relative">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-28 pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8">
          <Container maxWidth="lg">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 sm:gap-8 mb-8 sm:mb-12 md:flex-row md:items-center">
              <Avatar 
                src={user?.images?.[0]?.url} 
                sx={{ width: { xs: 120, sm: 150, md: 180 }, height: { xs: 120, sm: 150, md: 180 } }}
                className="border-4 border-white/10 shadow-2xl"
              >
                {user?.display_name?.[0] || 'U'}
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <Typography variant="overline" className="text-green-500 font-bold tracking-wider text-xs sm:text-sm">
                  Profile
                </Typography>
                <Typography variant="h2" className="text-white font-bold mb-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                  {user?.display_name || 'User'}
                </Typography>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 text-gray-400 mb-4 sm:mb-6 text-sm">
                  <Typography className="text-xs sm:text-sm">{user?.email}</Typography>
                  <span className="hidden sm:inline">•</span>
                  <Typography className="text-xs sm:text-sm">{user?.followers?.total?.toLocaleString() || 0} Followers</Typography>
                  <span className="hidden sm:inline">•</span>
                  <Typography className="capitalize text-xs sm:text-sm">{user?.product || 'Free'} Plan</Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                  <Button 
                    variant="outlined" 
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/settings')}
                    className="border-white/30 text-white hover:border-white hover:bg-white/10 rounded-full px-4 sm:px-6 text-xs sm:text-sm"
                    size="small"
                  >
                    Edit Settings
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<Logout />}
                    onClick={() => { logout(); navigate('/login'); }}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-full px-4 sm:px-6 shadow-none text-xs sm:text-sm"
                    size="small"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Details List */}
            <Card className="bg-white/5 border border-white/10">
              <CardContent className="p-0">
                <div className="p-6 border-b border-white/10">
                  <Typography variant="h6" className="text-white font-bold">
                    Account Information
                  </Typography>
                </div>
                
                <div className="divide-y divide-white/5">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-white/5 rounded-full text-gray-400">
                        <Star fontSize="small" />
                      </div>
                      <div>
                        <Typography className="text-white font-medium text-sm sm:text-base">Spotify ID</Typography>
                        <Typography className="text-gray-500 text-xs sm:text-sm">Unique identifier for your account</Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-black/20 px-3 sm:px-4 py-2 rounded-full border border-white/5 self-start sm:self-auto">
                      <Typography className="text-white font-mono text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                        {user?.id}
                      </Typography>
                      <Tooltip title="Copy ID">
                        <IconButton size="small" onClick={handleCopyId} className="text-gray-400 hover:text-white">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-white/5 rounded-full text-gray-400">
                        <Public fontSize="small" />
                      </div>
                      <div>
                        <Typography className="text-white font-medium text-sm sm:text-base">Country / Region</Typography>
                        <Typography className="text-gray-500 text-xs sm:text-sm">Account registration location</Typography>
                      </div>
                    </div>
                    <Typography className="text-white font-medium text-sm sm:text-base self-start sm:self-auto pl-12 sm:pl-0">
                      {user?.country || 'Unknown'}
                    </Typography>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-white/5 rounded-full text-gray-400">
                        <Email fontSize="small" />
                      </div>
                      <div>
                        <Typography className="text-white font-medium text-sm sm:text-base">Email Address</Typography>
                        <Typography className="text-gray-500 text-xs sm:text-sm">Associated Spotify email</Typography>
                      </div>
                    </div>
                    <Typography className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none self-start sm:self-auto pl-12 sm:pl-0">
                      {user?.email}
                    </Typography>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-white/5 rounded-full text-gray-400">
                        <OpenInNew fontSize="small" />
                      </div>
                      <div>
                        <Typography className="text-white font-medium text-sm sm:text-base">Spotify Profile</Typography>
                        <Typography className="text-gray-500 text-xs sm:text-sm">View your public profile on Spotify</Typography>
                      </div>
                    </div>
                    <div className="self-start sm:self-auto pl-12 sm:pl-0">
                    {user?.external_urls?.spotify ? (
                      <Button
                        variant="text"
                        endIcon={<OpenInNew />}
                        href={user.external_urls.spotify}
                        target="_blank"
                        className="text-green-500 hover:text-green-400"
                        size="small"
                      >
                        Open Spotify
                      </Button>
                    ) : (
                      <Button
                        variant="text"
                        endIcon={<OpenInNew />}
                        disabled
                        className="text-green-500/50"
                        size="small"
                      >
                        Open Spotify
                      </Button>
                    )}
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
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Account;
