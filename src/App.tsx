import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Browse from './pages/Browse';
import Category from './pages/Category';
import Library from './pages/Library';
import Account from './pages/Account';
import Settings from './pages/Settings';
import About from './pages/About';
import Artist from './pages/Artist';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import MediaView from './components/MediaView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Player from './components/Player';
import { AuthProvider, useAuth } from './context/auth';
import { PlayerProvider } from './context/player';
import { ToastProvider } from './context/toast';
import { PlaylistsProvider } from './context/playlists';
import { SearchProvider } from './context/search';

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
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onHomeClick={() => navigate('/dashboard')}
      />
      
      {/* Header */}
      <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-72 relative">
        <MediaView 
          id={id} 
          type={type} 
          onBack={() => navigate(-1)} 
        />
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { token } = useAuth();
  
  return (
    <div className="App" style={{ minHeight: '100dvh' }}>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/category/:categoryId" element={<Category />} />
        <Route path="/library" element={<Library />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/album/:id" element={<MediaPage />} />
        <Route path="/playlist/:id" element={<MediaPage />} />
        <Route path="/artist/:id" element={<Artist />} />
        <Route path="/user/:id" element={<Profile />} />
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
          <PlaylistsProvider>
            <SearchProvider>
              <ToastProvider>
                <Router>
                  <AppContent />
                </Router>
              </ToastProvider>
            </SearchProvider>
          </PlaylistsProvider>
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
