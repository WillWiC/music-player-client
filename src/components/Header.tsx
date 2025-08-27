import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow">
      <Link to="/dashboard" className="font-bold text-lg text-gray-800">
        Spotify Lite
      </Link>
      <nav className="flex items-center space-x-3">
        <Link to="/search" className="text-sm text-gray-600 hover:text-gray-800">
          Search
        </Link>
        <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-800">
          Dashboard
        </Link>
        {token ? (
          <button onClick={logout} className="ml-4 px-3 py-1 bg-red-500 text-white rounded">
            Logout
          </button>
        ) : (
          <Link to="/" className="ml-4 px-3 py-1 bg-green-500 text-white rounded">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
