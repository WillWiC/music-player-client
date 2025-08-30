import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Library from './pages/Library';
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
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      
      {/* Header */}
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-72 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto py-10 px-2 sm:px-8 lg:px-12">
          <MediaView 
            id={id} 
            type={type} 
            onBack={() => navigate('/dashboard')} 
          />
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { token } = useAuth();
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
  <Route path="/search" element={<Search />} />
  <Route path="/library" element={<Library />} />
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
