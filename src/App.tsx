import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MediaView from './components/MediaView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import { AuthProvider, useAuth } from './context/auth';
import { PlayerProvider } from './context/player';

// Create a dark theme for the music player
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22c55e', // Spotify green
      light: '#4ade80',
      dark: '#16a34a',
    },
    secondary: {
      main: '#3b82f6', // Blue accent
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#22c55e',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
  },
});

// Generic MediaPage component that determines type from route
const MediaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  if (!id) return null;
  
  // Determine type from the current route path
  const type = location.pathname.startsWith('/album/') ? 'album' : 'playlist';
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#000000' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
        <Box sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
          <MediaView 
            id={id} 
            type={type} 
            onBack={() => navigate('/dashboard')} 
          />
        </Box>
      </Box>
    </Box>
  );
};

const AppContent: React.FC = () => {
  const { token } = useAuth();
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/album/:id" element={<MediaPage />} />
        <Route path="/playlist/:id" element={<MediaPage />} />
      </Routes>
      {/* Show player only when user is authenticated */}
      {token && <Player />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <PlayerProvider>
          <Router>
            <AppContent />
          </Router>
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
