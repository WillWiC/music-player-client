import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Player from './components/Player';
import { AuthProvider, useAuth } from './context/auth';
import { PlayerProvider } from './context/player';

const AppContent: React.FC = () => {
  const { token } = useAuth();
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      {/* Show player only when user is authenticated */}
      {token && <Player />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <AppContent />
        </Router>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
