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
    <div className="min-h-screen app-background flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onHomeClick={() => navigate('/dashboard')}
      />
      
      <div className="flex-1 flex flex-col lg:ml-72 relative">
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 pb-24 pt-24 px-8">
          <Container maxWidth="lg">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <Avatar 
                src={user?.images?.[0]?.url} 
                sx={{ width: 180, height: 180 }}
                className="border-4 border-white/10 shadow-2xl"
              >
                {user?.display_name?.[0] || 'U'}
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <Typography variant="overline" className="text-green-500 font-bold tracking-wider">
                  Profile
                </Typography>
                <Typography variant="h2" className="text-white font-bold mb-2">
                  {user?.display_name || 'User'}
                </Typography>
                <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 mb-6">
                  <Typography>{user?.email}</Typography>
                  <span>•</span>
                  <Typography>{user?.followers?.total?.toLocaleString() || 0} Followers</Typography>
                  <span>•</span>
                  <Typography className="capitalize">{user?.product || 'Free'} Plan</Typography>
                </div>
                
                <div className="flex gap-4 justify-center md:justify-start">
                  <Button 
                    variant="outlined" 
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/settings')}
                    className="border-white/30 text-white hover:border-white hover:bg-white/10 rounded-full px-6"
                  >
                    Edit Settings
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<Logout />}
                    onClick={() => { logout(); navigate('/login'); }}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-full px-6 shadow-none"
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
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-full text-gray-400">
                        <Star />
                      </div>
                      <div>
                        <Typography className="text-white font-medium">Spotify ID</Typography>
                        <Typography className="text-gray-500 text-sm">Unique identifier for your account</Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                      <Typography className="text-white font-mono text-sm">
                        {user?.id}
                      </Typography>
                      <Tooltip title="Copy ID">
                        <IconButton size="small" onClick={handleCopyId} className="text-gray-400 hover:text-white">
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-full text-gray-400">
                        <Public />
                      </div>
                      <div>
                        <Typography className="text-white font-medium">Country / Region</Typography>
                        <Typography className="text-gray-500 text-sm">Account registration location</Typography>
                      </div>
                    </div>
                    <Typography className="text-white font-medium">
                      {user?.country || 'Unknown'}
                    </Typography>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-full text-gray-400">
                        <Email />
                      </div>
                      <div>
                        <Typography className="text-white font-medium">Email Address</Typography>
                        <Typography className="text-gray-500 text-sm">Associated Spotify email</Typography>
                      </div>
                    </div>
                    <Typography className="text-white font-medium">
                      {user?.email}
                    </Typography>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-full text-gray-400">
                        <OpenInNew />
                      </div>
                      <div>
                        <Typography className="text-white font-medium">Spotify Profile</Typography>
                        <Typography className="text-gray-500 text-sm">View your public profile on Spotify</Typography>
                      </div>
                    </div>
                    {user?.external_urls?.spotify ? (
                      <Button
                        variant="text"
                        endIcon={<OpenInNew />}
                        href={user.external_urls.spotify}
                        target="_blank"
                        className="text-green-500 hover:text-green-400"
                      >
                        Open Spotify
                      </Button>
                    ) : (
                      <Button
                        variant="text"
                        endIcon={<OpenInNew />}
                        disabled
                        className="text-green-500/50"
                      >
                        Open Spotify
                      </Button>
                    )}
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
