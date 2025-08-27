import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Playlist = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const token = localStorage.getItem("spotify_token");

  useEffect(() => {
    if (!id || !token) return;
    fetch(`https://api.spotify.com/v1/playlists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setPlaylist(data));
  }, [id, token]);

  return (
    <div className="p-6">
      {playlist && (
        <>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <p className="text-gray-600">{playlist.description}</p>
          <div className="mt-4 space-y-2">
            {playlist.tracks.items.map((item: any) => (
              <div key={item.track.id} className="p-2 border rounded">
                {item.track.name} - {item.track.artists[0].name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default Playlist;
