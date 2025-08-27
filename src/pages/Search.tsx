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
    <div>
      <h2 className="text-xl font-semibold mb-2">Search</h2>
      <div className="flex items-center">
        <input value={query} onChange={e => setQuery(e.target.value)} className="border p-2 mr-2" />
        <button onClick={handleSearch} className="px-3 py-2 bg-green-500 text-white rounded">
          Search
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
  {results.map((t: any) => (
          <div key={t.id} className="p-3 bg-white rounded shadow">
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-gray-600">{t.artists?.[0]?.name}</div>
            <button onClick={() => play(t)} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded">
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;

