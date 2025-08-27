import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Playlist from './pages/Playlist';
import { AuthProvider, useAuth } from './context/auth.tsx';
import { PlayerProvider } from './context/player.tsx';
import Header from './components/Header.tsx';
import Player from './components/Player.tsx';

const AppContent: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();
  
  // Don't show header/player on login or callback pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/callback';
  const showLayout = token && !isAuthPage;

  return (
    <div className="app-container">
      {showLayout && <Header />}
      <main className={`flex-1 w-full ${showLayout ? 'p-4 sm:p-6' : ''}`}>
        <div className={showLayout ? 'max-w-6xl mx-auto' : ''}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/playlist/:id" element={<Playlist />} />
          </Routes>
        </div>
      </main>
      {showLayout && <Player />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
};

export default App;

