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
    <div>
      <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
      {user && (
        <div className="flex items-center space-x-4 mb-4">
          <img src={user.images?.[0]?.url} alt="profile" className="w-12 h-12 rounded-full" />
          <div>
            <div className="font-semibold">{user.display_name ?? user.id}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
        </div>
      )}
      <h3 className="font-semibold mt-4 mb-2">Featured Playlists</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {playlists.map(pl => (
          <div key={pl.id} className="p-3 bg-white rounded shadow hover:shadow-md transition">
            <img src={pl.images?.[0]?.url} alt="cover" className="w-full h-36 sm:h-32 object-cover rounded" />
            <div className="mt-2 font-semibold truncate">{pl.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
