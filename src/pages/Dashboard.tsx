import React from 'react';
import { useAuth } from '../context/auth';

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [user, setUser] = React.useState<any | null>(null);
  const [playlists, setPlaylists] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!token) return;
    fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => setUser(null));

    fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=8', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setPlaylists(data.playlists?.items ?? []))
      .catch(() => setPlaylists([]));
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto py-6">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      {user && (
        <div className="flex items-center space-x-4 mb-6 card">
          <img src={user.images?.[0]?.url} alt="profile" className="w-14 h-14 rounded-full" />
          <div>
            <div className="font-semibold text-slate-900">{user.display_name ?? user.id}</div>
            <div className="text-sm muted">{user.email}</div>
          </div>
        </div>
      )}

      <h3 className="font-semibold mt-4 mb-3">Featured Playlists</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {playlists.map(pl => (
          <div key={pl.id} className="card">
            <img src={pl.images?.[0]?.url} alt="cover" className="w-full h-36 sm:h-36 object-cover rounded" />
            <div className="mt-3 font-semibold truncate">{pl.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
