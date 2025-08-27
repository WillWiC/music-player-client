import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = React.useState<any | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!token) return setProfile(null);
    fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProfile(data))
      .catch(() => setProfile(null));
  }, [token]);

  return (
    <header className="w-full py-4 px-4 sm:px-6 bg-transparent">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-bold text-lg text-slate-900">
            Spotify Lite
          </Link>
          <nav className="hidden sm:flex items-center space-x-4 text-sm text-slate-600">
            <Link to="/search" className="hover:text-slate-800">Search</Link>
            <Link to="/dashboard" className="hover:text-slate-800">Dashboard</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* mobile toggle */}
          <button className="sm:hidden btn-ghost" onClick={() => setOpen(o => !o)} aria-label="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {profile ? (
            <div className="flex items-center gap-3">
              <img src={profile.images?.[0]?.url} alt="avatar" className="w-9 h-9 rounded-full" />
              <div className="hidden sm:block text-sm">
                <div className="font-medium text-slate-900">{profile.display_name ?? profile.id}</div>
                <div className="text-xs muted">{profile.email}</div>
              </div>
              <button onClick={logout} className="btn-ghost">Logout</button>
            </div>
          ) : (
            <Link to="/" className="btn-primary">Login</Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-3 max-w-6xl mx-auto card">
          <nav className="flex flex-col">
            <Link to="/search" className="py-2">Search</Link>
            <Link to="/dashboard" className="py-2">Dashboard</Link>
            {profile ? <button onClick={logout} className="py-2 text-left">Logout</button> : <Link to="/" className="py-2">Login</Link>}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
