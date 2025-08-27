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
  // Loading flags for a more intuitive skeleton UI
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
  const [loadingRecently, setLoadingRecently] = React.useState(false);
  const [loadingTop, setLoadingTop] = React.useState(false);
  const [loadingReleases, setLoadingReleases] = React.useState(false);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

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
    setLoadingProfile(true);
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
      })
      .finally(() => setLoadingProfile(false));

    // Fetch featured playlists
    setLoadingPlaylists(true);
    fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setPlaylists(data.playlists?.items ?? []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoadingPlaylists(false));

    // Fetch recently played tracks
    setLoadingRecently(true);
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setRecentlyPlayed(data.items ?? []))
      .catch(() => setRecentlyPlayed([]))
      .finally(() => setLoadingRecently(false));

    // Fetch user's top tracks
    setLoadingTop(true);
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=6&time_range=short_term', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTopTracks(data.items ?? []))
      .catch(() => setTopTracks([]))
      .finally(() => setLoadingTop(false));

    // Fetch new releases
    setLoadingReleases(true);
    fetch('https://api.spotify.com/v1/browse/new-releases?limit=6', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setNewReleases(data.albums?.items ?? []))
      .catch(() => setNewReleases([]))
      .finally(() => setLoadingReleases(false));

    // Fetch browse categories
    setLoadingCategories(true);
    fetch('https://api.spotify.com/v1/browse/categories?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCategories(data.categories?.items ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [token, navigate]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Dynamic Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          {greeting}
          {user?.display_name ? `, ${user.display_name} 👋` : ''}
        </h1>
        <p className="text-muted-dark text-lg">What do you want to listen to today?</p>
      </div>

      {/* Quick Search */}
      <div className="mb-8">
        <div
          role="button"
          aria-label="Open search"
          onClick={() => navigate('/search')}
          className="flex items-center gap-3 search-input-dark hover-lift cursor-text"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-dark">
            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            readOnly
            placeholder="Search for songs, artists, or podcasts"
            className="bg-transparent flex-1 outline-none placeholder:text-muted-dark"
          />
          <span className="hidden sm:block text-xs text-muted-dark">Tap to search</span>
        </div>
        {/* Quick-action chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => navigate('/search')} className="chip">Search</button>
          <a href="#playlists" className="chip">Playlists</a>
          <a href="#browse" className="chip">Browse</a>
          <a href="#top" className="chip">Top tracks</a>
        </div>
      </div>

      {/* User Profile Card */}
      {loadingProfile ? (
        <div className="flex items-center space-x-6 mb-8 music-card">
          <div className="shrink-0 rounded-full shimmer" style={{ width: 72, height: 72 }} />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 shimmer rounded" />
            <div className="h-4 w-72 shimmer rounded" />
          </div>
          <div className="w-16 h-8 shimmer rounded" />
        </div>
      ) : user ? (
        <div className="flex items-center space-x-6 mb-8 music-card">
          <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
            <img src={user.images?.[0]?.url} alt="Profile avatar" style={{ width: 72, height: 72 }} className="object-cover rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-spotify-green rounded-full border-2 border-dark-bg"></div>
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
            <div className="text-sm text-muted-dark">Followers</div>
            <div className="text-xl font-bold text-white">{user.followers?.total || 0}</div>
          </div>
        </div>
      ) : null}

      {/* Continue Listening (Recently Played) */}
      <div className="mb-8" id="continue">
        <div className="section-header mb-4">
          <h3 className="section-title">Continue listening</h3>
        </div>
        {loadingRecently ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-28 sm:w-32 md:w-36 music-card">
                <div className="w-full aspect-square rounded-lg shimmer mb-3" />
                <div className="h-4 w-24 shimmer rounded mb-2" />
                <div className="h-3 w-20 shimmer rounded" />
              </div>
            ))}
          </div>
        ) : recentlyPlayed.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recentlyPlayed.slice(0, 10).map((item, index) => (
              <div key={index} className="flex-shrink-0 w-28 sm:w-32 md:w-36 music-card group cursor-pointer">
                <div className="relative">
                  <img src={item.track.album?.images?.[0]?.url} alt={`${item.track.name} cover`} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <button 
                    onClick={() => play(item.track)}
                    aria-label={`Play ${item.track.name}`}
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
        ) : (
          <div className="music-card text-muted-dark">No recent plays yet. Try the search above to find something new.</div>
        )}
      </div>

      {/* Your Top Tracks */}
      {(
        <div className="mb-8" id="top">
          <div className="section-header mb-4">
            <h3 className="section-title">Your top tracks this month</h3>
          </div>
          {loadingTop ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="track-item-dark p-3 rounded-lg">
                  <div className="w-full flex items-center gap-4">
                    <div className="h-5 w-6 shimmer rounded" />
                    <div className="w-8 h-8 rounded shimmer" />
                    <div className="flex-1">
                      <div className="h-4 w-48 shimmer rounded mb-2" />
                      <div className="h-3 w-32 shimmer rounded" />
                    </div>
                    <div className="h-8 w-24 shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : topTracks.length > 0 ? (
            <div className="space-y-2">
              {topTracks.slice(0, 5).map((track, index) => (
                <div key={track.id} className="track-item-dark group flex items-center gap-4 p-3 rounded-lg">
                  <div className="track-ranking text-lg w-6">{index + 1}</div>
                  <img src={track.album?.images?.[0]?.url} alt={`${track.name} cover`} className="w-8 h-8 md:w-10 md:h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{track.name}</h4>
                    <p className="text-muted-dark text-sm truncate">{track.artists[0]?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost-dark p-2 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Like track">
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
          ) : (
            <div className="music-card text-muted-dark">No top tracks yet. Play more music to see your stats here.</div>
          )}
        </div>
      )}

      {/* Featured Playlists */}
      <div className="mb-8" id="playlists">
        <div className="section-header mb-4">
          <h3 className="section-title">Featured Playlists</h3>
        </div>
        {loadingPlaylists ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="playlist-card">
                <div className="cover-img shimmer" />
                <div className="p-4">
                  <div className="h-4 w-32 shimmer rounded mb-2" />
                  <div className="h-3 w-24 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {playlists.map(pl => (
              <Link key={pl.id} to={`/playlist/${pl.id}`} className="playlist-card group cursor-pointer">
                <div className="relative">
                  <img src={pl.images?.[0]?.url} alt={`${pl.name} cover`} className="cover-img" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Play playlist logic
                    }}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110"
                    aria-label={`Play ${pl.name}`}
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
        )}
      </div>

      {/* New Releases */}
      <div className="mb-8">
        <div className="section-header mb-4">
          <h3 className="section-title">New releases for you</h3>
        </div>
        {loadingReleases ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="playlist-card">
                <div className="cover-img shimmer" />
                <div className="p-3">
                  <div className="h-4 w-28 shimmer rounded mb-2" />
                  <div className="h-3 w-20 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : newReleases.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {newReleases.map(album => (
              <div key={album.id} className="playlist-card group cursor-pointer">
                <div className="relative">
                  <img src={album.images?.[0]?.url} alt={`${album.name} cover`} className="cover-img" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110" aria-label={`Play ${album.name}`}>
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
        ) : (
          <div className="music-card text-muted-dark">No new releases right now. Check back later.</div>
        )}
      </div>

      {/* Browse Categories */}
      <div className="mb-6" id="browse">
        <div className="section-header mb-4">
          <h3 className="section-title">Browse all</h3>
        </div>
        {loadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg shimmer" />
            ))}
          </div>
        ) : categories.length > 0 ? (
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
        ) : (
          <div className="music-card text-muted-dark">No categories to show.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
