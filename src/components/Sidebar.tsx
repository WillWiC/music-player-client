import React from 'react';
import { Link, useLocation } from 'react-router-dom';


const Sidebar: React.FC = () => {
  // const { token } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { to: '/search', label: 'Search', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    // Add more links as needed
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-black/90 border-r border-white/5 py-6 px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-spotify-green rounded-lg flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.18.295-.566.387-.86.205-2.36-1.442-5.328-1.769-8.828-.969a.75.75 0 01-.312-1.467c3.827-.876 7.082-.496 9.795 1.12.295.18.387.565.205.86zm1.232-2.74c-.226.367-.706.482-1.073.257-2.7-1.66-6.817-2.14-10.016-1.17a.958.958 0 11-.554-1.834c3.66-1.109 8.26-.573 11.386 1.34.366.225.482.706.257 1.072zm.106-2.856c-3.237-1.922-8.58-2.1-11.67-1.16a1.15 1.15 0 01-1.334-1.876c3.542-1.08 9.453-.872 13.243 1.34a1.15 1.15 0 01-1.24 1.936z" fill="currentColor"/></svg>
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">Spotify</span>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${location.pathname === link.to ? 'bg-spotify-green/10 text-spotify-green' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>
      {/* Add user/profile section here if needed */}
    </aside>
  );
};

export default Sidebar;
