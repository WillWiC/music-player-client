import React from 'react';
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { play } = usePlayer();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any | null>(null);
  const [playlists, setPlaylists] = React.useState<any[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<any[]>([]);
  const [topTracks, setTopTracks] = React.useState<any[]>([]);
  const [newReleases, setNewReleases] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [greeting, setGreeting] = React.useState('Good evening');

  React.useEffect(() => {
    console.log('Dashboard loaded, token:', !!token);
    
    // Redirect to login if no token
    if (!token) {
      console.log('No token found, redirecting to login...');
      navigate('/');
      return;
    }

    // Set dynamic greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Fetch user profile
    fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('User profile loaded:', data.display_name);
        setUser(data);
      })
      .catch((error) => {
        console.error('Failed to load user profile:', error);
        setUser(null);
      });

    // Fetch featured playlists
    fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setPlaylists(data.playlists?.items ?? []))
      .catch(() => setPlaylists([]));

    // Fetch recently played tracks
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setRecentlyPlayed(data.items ?? []))
      .catch(() => setRecentlyPlayed([]));

    // Fetch user's top tracks
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=6&time_range=short_term', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTopTracks(data.items ?? []))
      .catch(() => setTopTracks([]));

    // Fetch new releases
    fetch('https://api.spotify.com/v1/browse/new-releases?limit=6', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setNewReleases(data.albums?.items ?? []))
      .catch(() => setNewReleases([]));

    // Fetch browse categories
    fetch('https://api.spotify.com/v1/browse/categories?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCategories(data.categories?.items ?? []))
      .catch(() => setCategories([]));
  }, [token, navigate]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Dynamic Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{greeting}</h1>
        <p className="text-muted-dark text-lg">Welcome back to your music</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="flex items-center space-x-6 mb-8 music-card">
          <div className="relative">
            <img src={user.images?.[0]?.url} alt="profile" className="w-20 h-20 rounded-full" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-spotify-green rounded-full border-2 border-dark-bg"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{user.display_name ?? user.id}</h2>
            <p className="text-muted-dark">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-spotify-green rounded-full"></div>
              <span className="text-sm text-spotify-green">Premium User</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-dark">Following</div>
            <div className="text-xl font-bold text-white">{user.followers?.total || 0}</div>
          </div>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Jump back in</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.slice(0, 6).map(pl => (
            <Link key={pl.id + '-quick'} to={`/playlist/${pl.id}`} className="music-card group cursor-pointer hover:bg-opacity-80 transition-all">
              <div className="flex items-center gap-4">
                <img src={pl.images?.[0]?.url} alt="cover" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{pl.name}</h4>
                  <p className="text-muted-dark text-sm">Playlist</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Play first track logic can go here
                  }}
                  className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Recently played</h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recentlyPlayed.slice(0, 6).map((item, index) => (
              <div key={index} className="flex-shrink-0 w-48 music-card group cursor-pointer">
                <div className="relative">
                  <img src={item.track.album?.images?.[0]?.url} alt="cover" className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <button 
                    onClick={() => play(item.track)}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                    </svg>
                  </button>
                </div>
                <h4 className="font-semibold text-white truncate">{item.track.name}</h4>
                <p className="text-muted-dark text-sm truncate">{item.track.artists[0]?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Top Tracks */}
      {topTracks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Your top tracks this month</h3>
          <div className="space-y-2">
            {topTracks.slice(0, 5).map((track, index) => (
              <div key={track.id} className="track-item-dark group flex items-center gap-4 p-3 rounded-lg">
                <div className="text-muted-dark text-lg font-bold w-6">{index + 1}</div>
                <img src={track.album?.images?.[0]?.url} alt="cover" className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{track.name}</h4>
                  <p className="text-muted-dark text-sm truncate">{track.artists[0]?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost-dark p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <div className="text-sm text-muted-dark">
                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => play(track)}
                    className="btn-spotify text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Play
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Playlists */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Featured Playlists</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map(pl => (
            <Link key={pl.id} to={`/playlist/${pl.id}`} className="playlist-card group cursor-pointer">
              <div className="relative">
                <img src={pl.images?.[0]?.url} alt="cover" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Play playlist logic
                  }}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-white truncate">{pl.name}</h4>
                <p className="text-muted-dark text-sm truncate mt-1">{pl.description || 'Playlist'}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* New Releases */}
      {newReleases.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">New releases for you</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {newReleases.map(album => (
              <div key={album.id} className="playlist-card group cursor-pointer">
                <div className="relative">
                  <img src={album.images?.[0]?.url} alt="cover" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-white truncate text-sm">{album.name}</h4>
                  <p className="text-muted-dark text-xs truncate mt-1">{album.artists[0]?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse Categories */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Browse all</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="relative h-32 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${
                    ['#1e3a8a', '#dc2626', '#059669', '#7c2d12', '#5b21b6', '#be185d', '#0369a1', '#ea580c'][
                      Math.floor(Math.random() * 8)
                    ]
                  }, ${
                    ['#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#0ea5e9', '#f59e0b'][
                      Math.floor(Math.random() * 8)
                    ]
                  })`
                }}
              >
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <h4 className="font-bold text-white text-lg">{category.name}</h4>
                  {category.icons?.[0] && (
                    <img 
                      src={category.icons[0].url} 
                      alt={category.name}
                      className="absolute bottom-2 right-2 w-16 h-16 object-cover rounded-lg transform rotate-12 opacity-80"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Played Section (Old) */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4">Made for you</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.slice(0, 6).map(pl => (
            <Link key={pl.id + '-recent'} to={`/playlist/${pl.id}`} className="music-card group cursor-pointer">
              <div className="flex items-center gap-4">
                <img src={pl.images?.[0]?.url} alt="cover" className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{pl.name}</h4>
                  <p className="text-muted-dark text-sm">Playlist</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="currentColor" className="text-black"/>
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
