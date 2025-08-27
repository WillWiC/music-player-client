import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Playlist from './pages/Playlist';
import { AuthProvider } from './context/auth.tsx';
import { PlayerProvider } from './context/player.tsx';
import Header from './components/Header.tsx';
import Player from './components/Player.tsx';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <div className="app-container">
            <Header />
            <main className="flex-1 p-4 sm:p-6 w-full">
              <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/playlist/:id" element={<Playlist />} />
              </Routes>
              </div>
            </main>
            <Player />
          </div>
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
};

export default App;

