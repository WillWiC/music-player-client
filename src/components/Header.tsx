import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <header className="w-full py-4 px-6 bg-transparent">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="font-bold text-lg text-slate-900">
          Spotify Lite
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/search" className="text-sm text-slate-600 hover:text-slate-800">
            Search
          </Link>
          <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-800">
            Dashboard
          </Link>
          {token ? (
            <button onClick={logout} className="btn-ghost">
              Logout
            </button>
          ) : (
            <Link to="/" className="btn-primary">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
