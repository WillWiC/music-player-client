import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { Button, Avatar, Typography, Box, Paper } from '@mui/material';

const Account: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-4xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-4">Account</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Box className="flex items-center gap-4">
              <Avatar src={user?.images?.[0]?.url} sx={{ width: 64, height: 64 }}>
                {user?.display_name ? user.display_name[0] : 'U'}
              </Avatar>

              <div>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{user?.display_name || 'Your Name'}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{user?.email || ''}</Typography>
              </div>
            </Box>

            <div className="mt-6 flex gap-3">
              <Button variant="contained" color="primary" onClick={() => navigate('/settings')}>Settings</Button>
              <Button variant="outlined" color="inherit" onClick={() => { logout(); navigate('/login'); }}>Sign out</Button>
            </div>
          </Paper>
        </div>
      </main>
    </div>
  );
};

export default Account;
