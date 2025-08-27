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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <h2 className="text-3xl font-bold mb-8 text-white">Search for Music</h2>

      <div className="flex items-center gap-3 mb-8">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="search-input-dark flex-1"
          placeholder="What do you want to listen to?"
        />
        <button onClick={handleSearch} className="btn-spotify">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mr-2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Search
        </button>
      </div>

      {results.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
          {results.map((t: any) => (
            <div key={t.id} className="track-item-dark group">
              <div className="flex items-center">
                <div className="relative mr-4">
                  <img src={t.album?.images?.[0]?.url} alt="cover" className="w-12 h-12 object-cover rounded" />
                  <button 
                    onClick={() => play(t)} 
                    className="absolute inset-0 bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{t.name}</div>
                  <div className="text-sm text-muted-dark truncate">{t.artists?.[0]?.name}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="btn-ghost-dark p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <div className="text-sm text-muted-dark">
                    {Math.floor(t.duration_ms / 60000)}:{String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}
                  </div>
                  <button onClick={() => play(t)} className="btn-spotify text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Play
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query && (
        <div className="text-center py-12">
          <div className="text-muted-dark text-lg">No results found for "{query}"</div>
          <div className="text-sm text-muted-dark mt-2">Try searching for artists, songs, or albums</div>
        </div>
      )}
    </div>
  );
};

export default Search;

