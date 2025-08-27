import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// ...existing code... (no type import needed here)
import { useAuth } from '../context/auth';
import { usePlayer } from '../context/player';

const PlaylistPage: React.FC = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any | null>(null);
  const { token } = useAuth();
  const { play } = usePlayer();

  useEffect(() => {
    if (!id || !token) return;
    fetch(`https://api.spotify.com/v1/playlists/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPlaylist(data))
      .catch(() => setPlaylist(null));
  }, [id, token]);

  if (!playlist) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center space-x-4 mb-4">
        <img src={playlist.images?.[0]?.url} alt="cover" className="w-24 h-24 object-cover rounded" />
        <div>
          <h2 className="text-xl font-semibold">{playlist.name}</h2>
          <p className="text-sm text-gray-600">{playlist.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {playlist.tracks?.items?.map((item: any) => (
          <div key={item.track.id} className="p-2 border rounded flex items-center justify-between">
            <div>
              <div className="font-semibold">{item.track.name}</div>
              <div className="text-sm text-gray-600">{item.track.artists[0].name}</div>
            </div>
            <div>
              <button onClick={() => play(item.track)} className="px-3 py-1 bg-blue-500 text-white rounded">
                Play Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPage;

