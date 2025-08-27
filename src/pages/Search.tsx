import React, { useState } from 'react';
import type { Track } from '../types/spotify';
import { usePlayer } from '../context/player';
import { useAuth } from '../context/auth';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const { play } = usePlayer();
  const { token } = useAuth();

  const handleSearch = async () => {
    if (!query || !token) return;
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setResults(data.tracks?.items ?? []);
    } catch (e) {
      setResults([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <h2 className="text-2xl font-semibold mb-4">Search</h2>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="search-input"
          placeholder="Search for songs, artists or albums"
        />
        <button onClick={handleSearch} className="btn-primary">
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((t: any) => (
          <div key={t.id} className="card track-item">
            <img src={t.album?.images?.[0]?.url} alt="cover" className="w-16 h-16 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{t.name}</div>
              <div className="text-sm muted truncate">{t.artists?.[0]?.name}</div>
            </div>
            <div>
              <button onClick={() => play(t)} className="btn-primary">
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;

