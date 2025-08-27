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

  if (!playlist) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center space-x-6 mb-6 card">
        <img src={playlist.images?.[0]?.url} alt="cover" className="w-28 h-28 object-cover rounded" />
        <div>
          <h2 className="text-2xl font-semibold">{playlist.name}</h2>
          <p className="text-sm muted">{playlist.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {playlist.tracks?.items?.map((item: any) => (
          <div key={item.track.id} className="card flex items-center justify-between track-item">
            <div className="flex items-center gap-4">
              <img src={item.track.album?.images?.[0]?.url} alt="t" className="w-12 h-12 object-cover rounded" />
              <div>
                <div className="font-semibold">{item.track.name}</div>
                <div className="text-sm muted">{item.track.artists[0].name}</div>
              </div>
            </div>
            <div>
              <button onClick={() => play(item.track)} className="btn-primary">
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistPage;

