import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Discovery: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const sampleCards = [
    { title: 'New Releases', subtitle: 'Latest albums from artists you love' },
    { title: 'Recommended for you', subtitle: 'Based on your listening' },
    { title: 'Popular Podcasts', subtitle: 'Top trending shows' },
    { title: 'Genres & Moods', subtitle: 'Find the right vibe' },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onHomeClick={() => navigate('/dashboard')} />
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />

      <main className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          <h1 className="text-3xl font-bold text-white mb-6">Discover</h1>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg mb-6">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Discover new music</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>Fresh picks, curated playlists and personalised recommendations.</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {sampleCards.map((c) => (
                <Box key={c.title} sx={{ p: 2, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', borderRadius: 2 }}>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>{c.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mb: 2 }}>{c.subtitle}</Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate('/search')}>Explore</Button>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper className="p-6 bg-white/5 border border-white/10 rounded-lg">
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Browse by mood</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {['Chill', 'Workout', 'Focus', 'Party', 'Romantic'].map(m => (
                <Button key={m} variant="contained" color="primary" size="small" sx={{ borderRadius: 2 }}>{m}</Button>
              ))}
            </Box>
          </Paper>
        </div>
      </main>
    </div>
  );
};

export default Discovery;
