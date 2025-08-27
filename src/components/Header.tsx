import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  const [profile, setProfile] = React.useState<any | null>(null);
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    if (!token) return setProfile(null);
    fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProfile(data))
      .catch(() => setProfile(null));
  }, [token]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full h-16 px-4 sm:px-6 lg:px-8 py-3 bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/dashboard" className="flex items-center gap-3 group py-1">
            <div className="w-7 h-7 bg-gradient-to-br from-spotify-green to-green-400 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-spotify-green/25 transition-all duration-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.18.295-.566.387-.86.205-2.36-1.442-5.328-1.769-8.828-.969a.75.75 0 01-.312-1.467c3.827-.876 7.082-.496 9.795 1.12.295.18.387.565.205.86zm1.232-2.74c-.226.367-.706.482-1.073.257-2.7-1.66-6.817-2.14-10.016-1.17a.958.958 0 11-.554-1.834c3.66-1.109 8.26-.573 11.386 1.34.366.225.482.706.257 1.072zm.106-2.856c-3.237-1.922-8.58-2.1-11.67-1.16a1.15 1.15 0 01-1.334-1.876c3.542-1.08 9.453-.872 13.243 1.34a1.15 1.15 0 01-1.24 1.936z" fill="currentColor" className="text-black"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-white group-hover:text-spotify-green transition-colors duration-300">
              Spotify Lite
            </span>
          </Link>
          
          {/* Modern Navigation */}
          <nav className="hidden md:flex items-center gap-1 px-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive('/dashboard') 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </Link>
            <Link 
              to="/search" 
              className={`flex items-center px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive('/search') 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Search
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center justify-center p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200" 
            onClick={() => setOpen(o => !o)} 
            aria-label="menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {profile ? (
            <div className="flex items-center gap-3 lg:gap-4">
              {/* User Profile */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 group">
                <div className="relative flex items-center justify-center">
                  <img
                    src={profile.images?.[0]?.url}
                    alt="Profile"
                    className="header-profile-img w-6 h-6 object-cover rounded-full ring-1 ring-spotify-green/50 group-hover:ring-spotify-green transition-all duration-200"
                  />
                  <div className="header-status-dot absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-spotify-green rounded-full border border-black" />
                </div>
                <div className="hidden lg:flex lg:flex-col lg:justify-center pl-1">
                  <div className="text-sm font-semibold text-white leading-tight">{profile.display_name ?? profile.id}</div>
                  <div className="text-xs text-white/70 leading-tight">{profile.followers?.total || 0} followers</div>
                </div>
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={logout} 
                className="flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/" 
              className="flex items-center justify-center px-6 py-2.5 bg-spotify-green hover:bg-green-400 text-black font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-spotify-green/25 transform hover:scale-105"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Login with Spotify
            </Link>
          )}
        </div>
      </div>

      {/* Modern Mobile Menu */}
      {open && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5 animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <nav className="flex flex-col gap-2">
              <Link 
                to="/dashboard" 
                className={`flex items-center px-4 py-3.5 rounded-lg text-left transition-all duration-200 ${
                  isActive('/dashboard') 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Home
              </Link>
              <Link 
                to="/search" 
                className={`flex items-center px-4 py-3.5 rounded-lg text-left transition-all duration-200 ${
                  isActive('/search') 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Search
              </Link>
              {profile ? (
                <button 
                  onClick={() => { logout(); setOpen(false); }} 
                  className="flex items-center px-4 py-3.5 rounded-lg text-left text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Logout
                </button>
              ) : (
                <Link 
                  to="/" 
                  className="flex items-center px-4 py-3.5 rounded-lg text-left text-spotify-green hover:text-green-400 hover:bg-white/5 transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-3">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Login with Spotify
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
