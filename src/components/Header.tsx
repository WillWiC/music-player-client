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
    <header className="w-full py-4 px-4 sm:px-6 bg-transparent sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.18.295-.566.387-.86.205-2.36-1.442-5.328-1.769-8.828-.969a.75.75 0 01-.312-1.467c3.827-.876 7.082-.496 9.795 1.12.295.18.387.565.205.86zm1.232-2.74c-.226.367-.706.482-1.073.257-2.7-1.66-6.817-2.14-10.016-1.17a.958.958 0 11-.554-1.834c3.66-1.109 8.26-.573 11.386 1.34.366.225.482.706.257 1.072zm.106-2.856c-3.237-1.922-8.58-2.1-11.67-1.16a1.15 1.15 0 01-1.334-1.876c3.542-1.08 9.453-.872 13.243 1.34a1.15 1.15 0 01-1.24 1.936z" fill="currentColor" className="text-black"/>
              </svg>
            </div>
            Spotify Lite
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <Link to="/search" className="text-muted-dark hover:text-white transition-colors font-medium">Search</Link>
            <Link to="/dashboard" className="text-muted-dark hover:text-white transition-colors font-medium">Home</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Navigation arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <button className="btn-ghost-dark p-2 rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-ghost-dark p-2 rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* mobile toggle */}
          <button className="md:hidden btn-ghost-dark p-2" onClick={() => setOpen(o => !o)} aria-label="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {profile ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={profile.images?.[0]?.url} alt="avatar" className="w-8 h-8 rounded-full border-2 border-spotify-green" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-spotify-green rounded-full border border-dark-bg"></div>
              </div>
              <div className="hidden lg:block text-sm">
                <div className="font-medium text-white">{profile.display_name ?? profile.id}</div>
                <div className="text-xs text-muted-dark">{profile.email}</div>
              </div>
              <button onClick={logout} className="btn-ghost-dark text-sm">Logout</button>
            </div>
          ) : (
            <Link to="/" className="btn-spotify">Login with Spotify</Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-4 max-w-7xl mx-auto music-card">
          <nav className="flex flex-col space-y-2">
            <Link to="/search" className="py-3 text-white hover:text-spotify-green transition-colors">Search</Link>
            <Link to="/dashboard" className="py-3 text-white hover:text-spotify-green transition-colors">Home</Link>
            {profile ? (
              <button onClick={logout} className="py-3 text-left text-muted-dark hover:text-white transition-colors">Logout</button>
            ) : (
              <Link to="/" className="py-3 text-spotify-green">Login</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
