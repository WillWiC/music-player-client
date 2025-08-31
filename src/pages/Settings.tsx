import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/auth';
import { Paper, Typography, Switch, FormControlLabel, Box } from '@mui/material';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const [darkMode, setDarkMode] = React.useState(true);
  const [autoplay, setAutoplay] = React.useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex">
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-4xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Preferences</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => setDarkMode(v => !v)} />}
                label={<Typography sx={{ color: 'white' }}>Dark mode (UI)</Typography>}
              />

              <FormControlLabel
                control={<Switch checked={autoplay} onChange={() => setAutoplay(v => !v)} />}
                label={<Typography sx={{ color: 'white' }}>Autoplay next track</Typography>}
              />
            </Box>

            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 3, fontSize: '0.9rem' }}>
              Note: These settings are stored only in your local session for now.
            </Typography>
          </Paper>
        </div>
      </main>
    </div>
  );
};

export default Settings;
